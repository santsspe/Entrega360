import { ArrowUpRight, CalendarDays } from "lucide-react";
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
import { formatDate, statusOf, statusTone } from "@/lib/entrega360";
import { EmptyState, StatusBadge, ViewHeader } from "./status";
import type { ViewProps } from "./types";

export function AgendaView({ vehicles, onOpen }: ViewProps) {
  const rows = vehicles
    .map((v, i) => ({ v, i }))
    .filter((x) => x.v.data)
    .sort((a, b) => a.v.data.localeCompare(b.v.data));

  return (
    <div>
      <ViewHeader
        title="Agenda"
        subtitle="O D+5 é o limite; a meta é entregar o quanto antes."
      />

      <Card>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhuma entrega agendada"
              description="Quando uma entrega for agendada, ela aparecerá aqui na ordem da data."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ v, i }) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {formatDate(v.data)}
                    </TableCell>
                    <TableCell className="text-sm">{v.horario || "—"}</TableCell>
                    <TableCell className="text-sm">{v.cliente}</TableCell>
                    <TableCell className="text-sm">{v.modelo}</TableCell>
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
