import { AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pendingIssues } from "@/lib/entrega360";
import { cn } from "@/lib/utils";
import { EmptyState, ViewHeader } from "./status";
import type { ViewProps } from "./types";

const criticalityClasses: Record<string, string> = {
  Crítica: "border-danger/25 bg-danger-soft text-danger",
  Alta: "border-warning/30 bg-warning-soft text-warning",
  Média: "border-neutral/25 bg-neutral-soft text-neutral",
};

export function PendingView({ vehicles, onOpen }: ViewProps) {
  const rows = vehicles.flatMap((v, i) =>
    pendingIssues(v).map((p) => ({ v, i, p })),
  );

  return (
    <div>
      <ViewHeader
        title="Pendências"
        subtitle="Tudo que impede ou atrasa a liberação."
      />

      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nenhuma pendência"
              description="Todas as etapas estão em dia. Bom trabalho!"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Pendência</TableHead>
                  <TableHead>Criticidade</TableHead>
                  <TableHead>Impacto</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ v, i, p }, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{v.cliente}</TableCell>
                    <TableCell className="text-sm">{v.modelo}</TableCell>
                    <TableCell className="text-sm">
                      <span className="flex items-center gap-2">
                        <AlertTriangle
                          className={cn(
                            "h-4 w-4",
                            p.criticality === "Crítica"
                              ? "text-danger"
                              : "text-warning",
                          )}
                        />
                        {p.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                          criticalityClasses[p.criticality],
                        )}
                      >
                        {p.criticality}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{p.impact}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => onOpen(i)}>
                        <Wrench className="h-3.5 w-3.5" />
                        Resolver
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
