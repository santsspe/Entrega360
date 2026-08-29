import { BarChart3, Download, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deadlineOf,
  diffBusinessDays,
  exportCSV,
  isReady,
  statusOf,
} from "@/lib/entrega360";
import { EmptyState, KpiCard, ViewHeader } from "./status";
import type { ViewProps } from "./types";

export function ReportsView({ vehicles }: ViewProps) {
  const delivered = vehicles.filter((v) => v.feedback && v.dataNF && v.data);
  const ahead = delivered.filter(
    (v) =>
      deadlineOf(v) && new Date(v.data + "T12:00:00") < new Date(deadlineOf(v) + "T12:00:00"),
  ).length;

  const kpis = [
    {
      label: "Taxa entregue",
      value: vehicles.length
        ? `${Math.round((vehicles.filter((v) => v.feedback).length / vehicles.length) * 100)}%`
        : "0%",
    },
    { label: "Entregas antecipadas", value: ahead },
    { label: "Fora do prazo", value: vehicles.filter((v) => statusOf(v) === "Fora do prazo").length },
    { label: "Prontos", value: vehicles.filter(isReady).length },
    { label: "Aguardando NF", value: vehicles.filter((v) => !v.dataNF).length },
    { label: "Com NF", value: vehicles.filter((v) => v.dataNF).length },
  ];

  const sellers: Record<
    string,
    { n: number; p: number; e: number; o: number; d: number[] }
  > = {};

  vehicles.forEach((v) => {
    const key = v.vendedor || "Sem vendedor";
    const s = (sellers[key] ??= { n: 0, p: 0, e: 0, o: 0, d: [] });
    s.n += 1;
    if (isReady(v)) s.p += 1;
    if (v.feedback) s.e += 1;
    if (statusOf(v) === "Fora do prazo") s.o += 1;
    if (v.feedback && v.dataNF && v.data) {
      s.d.push(
        diffBusinessDays(
          new Date(v.dataNF + "T12:00:00"),
          new Date(v.data + "T12:00:00"),
        ),
      );
    }
  });

  const rows = Object.entries(sellers).sort((a, b) => b[1].n - a[1].n);

  return (
    <div>
      <ViewHeader
        title="Indicadores"
        subtitle="Performance medida a partir da NF."
        action={
          <Button
            variant="outline"
            onClick={() => exportCSV(vehicles)}
            disabled={vehicles.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} label={k.label} value={k.value} delay={i * 40} />
        ))}
      </div>

      <Card className="mt-5 animate-fade-up" style={{ animationDelay: "200ms" }}>
        <CardHeader>
          <CardTitle>Por vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Sem dados ainda"
              description="Cadastre veículos com vendedor para ver o desempenho por vendedor."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead>Veículos</TableHead>
                  <TableHead>Prontos</TableHead>
                  <TableHead>Entregues</TableHead>
                  <TableHead>Fora do prazo</TableHead>
                  <TableHead className="text-right">Média NF → entrega</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(([key, s]) => (
                  <TableRow key={key}>
                    <TableCell>
                      <span className="flex items-center gap-2 font-medium">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                        </span>
                        {key}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{s.n}</TableCell>
                    <TableCell className="text-sm tabular-nums">{s.p}</TableCell>
                    <TableCell className="text-sm tabular-nums">{s.e}</TableCell>
                    <TableCell className="text-sm tabular-nums">
                      {s.o > 0 ? (
                        <span className="font-semibold text-danger">{s.o}</span>
                      ) : (
                        s.o
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {s.d.length
                        ? (Math.round((s.d.reduce((a, b) => a + b, 0) / s.d.length) * 10) / 10).toLocaleString("pt-BR")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
