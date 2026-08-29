import { useMemo, useState } from "react";
import { ListChecks, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  currentStage,
  deadlineOf,
  formatDate,
  preparationPct,
  statusOf,
  statusTone,
} from "@/lib/entrega360";
import { EmptyState, StatusBadge, ViewHeader } from "./status";
import type { ViewProps } from "./types";

export function ChecklistView({ vehicles, onOpen }: ViewProps) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles
      .map((v, i) => ({ v, i }))
      .filter(
        ({ v }) =>
          !q ||
          [v.cliente, v.modelo, v.chassi].join(" ").toLowerCase().includes(q),
      );
  }, [vehicles, query]);

  return (
    <div>
      <ViewHeader
        title="Fluxo & Checklist"
        subtitle="Itens condicionais entram somente quando aplicáveis."
      />

      <Card>
        <CardContent>
          <div className="py-4">
            <div className="relative max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar veículo..."
                className="pl-9"
              />
            </div>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={ListChecks}
              title={vehicles.length === 0 ? "Nenhum veículo no fluxo" : "Nenhum resultado"}
              description="Os veículos recebidos por minuta aparecem aqui para acompanhamento do checklist."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Preparação</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ v, i }) => (
                  <TableRow key={i}>
                    <TableCell>
                      <p className="font-semibold">{v.cliente}</p>
                      <p className="text-xs text-muted-foreground">{v.modelo}</p>
                    </TableCell>
                    <TableCell className="text-sm">{currentStage(v)}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${preparationPct(v)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold tabular-nums">
                          {preparationPct(v)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {deadlineOf(v) ? formatDate(deadlineOf(v)) : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge tone={statusTone(statusOf(v))}>
                        {statusOf(v)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => onOpen(i)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
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
