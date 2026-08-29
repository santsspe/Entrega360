import { AlertCircle, ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  daysLeft,
  deadlineOf,
  diffBusinessDays,
  formatDate,
  isReady,
  pendingIssues,
  statusOf,
  statusTone,
  type Vehicle,
  type VehicleStatus,
} from "@/lib/entrega360";
import { EmptyState, KpiCard, StatusBadge, ViewHeader } from "./status";
import type { ViewProps } from "./types";

const STATUS_LIST: VehicleStatus[] = [
  "Aguardando NF",
  "Em preparação",
  "Pronto para entrega",
  "Entrega agendada",
  "Entregue",
  "Fora do prazo",
];

function Restante({ vehicle }: { vehicle: Vehicle }) {
  const left = daysLeft(vehicle);
  if (left === null) return <span className="text-muted-foreground">—</span>;
  if (left < 0)
    return (
      <span className="font-semibold text-danger">
        {Math.abs(left)} d.u. atraso
      </span>
    );
  return <span>{left} d.u.</span>;
}

export function DashboardView({ vehicles, onOpen, onNew }: ViewProps) {
  const counts = STATUS_LIST.map(
    (s) => vehicles.filter((v) => statusOf(v) === s).length,
  );

  const kpis = [
    { label: "Total", value: vehicles.length },
    { label: "Aguardando NF", value: counts[0] },
    { label: "Em preparação", value: counts[1] },
    { label: "Prontos", value: counts[2] },
    { label: "Agendados", value: counts[3] },
    { label: "Entregues", value: counts[4] },
  ];

  const flow = [
    { label: "Minuta", value: vehicles.length },
    { label: "NF recebida", value: vehicles.filter((v) => v.dataNF).length },
    {
      label: "Preparação",
      value: vehicles.filter((v) => v.dataNF && statusOf(v) !== "Aguardando NF")
        .length,
    },
    { label: "Prontos", value: vehicles.filter(isReady).length },
    { label: "Agendados", value: counts[3] },
    { label: "Entregues", value: counts[4] },
  ];

  const open = vehicles.filter((v) => v.dataNF && !v.feedback);
  const out = open.filter((v) => (daysLeft(v) ?? 0) < 0).length;
  const avg =
    open.length > 0
      ? Math.round(
          (open.reduce(
            (sum, v) =>
              sum +
              Math.max(0, diffBusinessDays(new Date(v.dataNF + "T12:00:00"), new Date())),
            0,
          ) /
            open.length) *
            10,
        ) / 10
      : 0;

  const sla = [
    { label: "No prazo", value: open.filter((v) => (daysLeft(v) ?? -1) >= 0).length },
    { label: "Estourados", value: out },
    { label: "Tempo médio aberto", value: `${avg} d.u.` },
  ];

  const attention = vehicles
    .map((v, i) => ({ v, i }))
    .filter((x) => pendingIssues(x.v).length > 0)
    .sort((a, b) => (daysLeft(a.v) ?? 99) - (daysLeft(b.v) ?? 99))
    .slice(0, 15);

  return (
    <div>
      <ViewHeader
        title="Painel de Entregas"
        subtitle="O SLA de 5 dias úteis começa somente no recebimento da NF."
        action={
          <Button onClick={onNew}>
            <Plus className="h-4 w-4" />
            Receber minuta
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} label={k.label} value={k.value} delay={i * 40} />
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <CardHeader>
            <CardTitle>Fluxo operacional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {flow.map((s, i) => (
                <div
                  key={s.label}
                  className={
                    s.value > 0
                      ? "rounded-lg border border-success/25 bg-success-soft px-2 py-3 text-center"
                      : "rounded-lg border border-border bg-muted/40 px-2 py-3 text-center"
                  }
                >
                  <p
                    className={
                      s.value > 0
                        ? "font-display text-2xl font-bold leading-none text-success"
                        : "font-display text-2xl font-bold leading-none text-muted-foreground/60"
                    }
                  >
                    {s.value}
                  </p>
                  <p
                    className={
                      s.value > 0
                        ? "mt-1 text-[10px] font-semibold uppercase tracking-wide text-success"
                        : "mt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70"
                    }
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-up" style={{ animationDelay: "180ms" }}>
          <CardHeader>
            <CardTitle>SLA de 5 dias úteis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {sla.map((s) => (
                <div key={s.label} className="rounded-lg bg-muted/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {s.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold leading-none">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-5 animate-fade-up" style={{ animationDelay: "240ms" }}>
        <CardHeader>
          <CardTitle>Fila de ação prioritária</CardTitle>
          <p className="text-sm text-muted-foreground">
            O sistema ordena primeiro os veículos com prazo mais próximo ou
            estourado.
          </p>
        </CardHeader>
        <CardContent>
          {attention.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="Nenhuma ação prioritária"
              description="Quando houver veículos com pendências ou prazos apertados, eles aparecerão aqui."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Marco</TableHead>
                  <TableHead>Prazo D+5</TableHead>
                  <TableHead>Restante</TableHead>
                  <TableHead>Principal pendência</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attention.map(({ v, i }) => (
                  <TableRow key={i}>
                    <TableCell>
                      <p className="font-semibold">{v.cliente}</p>
                      <p className="text-xs text-muted-foreground">{v.modelo}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {v.dataNF
                        ? `NF recebida ${formatDate(v.dataNF)}`
                        : `Minuta ${formatDate(v.dataMinuta)}`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {deadlineOf(v) ? formatDate(deadlineOf(v)) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      <Restante vehicle={v} />
                    </TableCell>
                    <TableCell className="text-sm">
                      {pendingIssues(v)[0].label}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={statusTone(statusOf(v))}>
                        {statusOf(v)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => onOpen(i)}>
                        Abrir
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
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
