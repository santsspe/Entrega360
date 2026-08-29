import { useMemo, useState } from "react";
import { ArrowUpRight, Plus, Search, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  formatDate,
  preparationPct,
  statusOf,
  statusTone,
} from "@/lib/entrega360";
import { EmptyState, StatusBadge, ViewHeader } from "./status";
import type { ViewProps } from "./types";

const STATUS_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "Aguardando NF", label: "Aguardando NF" },
  { value: "Em preparação", label: "Em preparação" },
  { value: "Pronto para entrega", label: "Pronto para entrega" },
  { value: "Entrega agendada", label: "Entrega agendada" },
  { value: "Entregue", label: "Entregue" },
  { value: "Fora do prazo", label: "Fora do prazo" },
];

export function VehiclesView({ vehicles, onOpen, onNew }: ViewProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vehicles
      .map((v, i) => ({ v, i }))
      .filter(
        ({ v }) =>
          (!q ||
            [v.cliente, v.modelo, v.chassi, v.cor]
              .join(" ")
              .toLowerCase()
              .includes(q)) &&
          (!status || statusOf(v) === status),
      );
  }, [vehicles, query, status]);

  return (
    <div>
      <ViewHeader
        title="Veículos"
        subtitle="A entrada operacional é a minuta."
        action={
          <Button onClick={onNew}>
            <Plus className="h-4 w-4" />
            Receber minuta
          </Button>
        }
      />

      <Card>
        <CardContent>
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar cliente, modelo, chassi..."
                className="pl-9"
              />
            </div>
            <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {rows.length === 0 ? (
            <EmptyState
              icon={Truck}
              title={vehicles.length === 0 ? "Nenhum veículo cadastrado" : "Nenhum resultado"}
              description={
                vehicles.length === 0
                  ? "Comece recebendo uma minuta para acompanhar o fluxo de entrega."
                  : "Ajuste a busca ou o filtro de status."
              }
              action={
                vehicles.length === 0 ? (
                  <Button onClick={onNew} className="mt-2">
                    <Plus className="h-4 w-4" />
                    Receber minuta
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente / veículo</TableHead>
                  <TableHead>Minuta</TableHead>
                  <TableHead>NF</TableHead>
                  <TableHead>D+5</TableHead>
                  <TableHead>Preparação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ v, i }) => (
                  <TableRow key={i}>
                    <TableCell>
                      <p className="font-semibold">{v.cliente}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.modelo}
                        {v.cor ? ` · ${v.cor}` : ""}
                        {v.chassi ? ` · ${v.chassi}` : ""}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(v.dataMinuta)}</TableCell>
                    <TableCell className="text-sm">{formatDate(v.dataNF)}</TableCell>
                    <TableCell className="text-sm">
                      {deadlineOf(v) ? formatDate(deadlineOf(v)) : "—"}
                    </TableCell>
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
