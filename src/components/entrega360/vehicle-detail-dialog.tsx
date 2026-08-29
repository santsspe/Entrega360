import type { ReactNode } from "react";
import { CheckCircle2, TimerOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  daysLeft,
  deadlineOf,
  formatDate,
  isReady,
  statusOf,
  statusTone,
  type BooleanKeys,
  type StringKeys,
  type Vehicle,
} from "@/lib/entrega360";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./status";

interface CheckItem {
  key: BooleanKeys;
  label: string;
  enabled: boolean;
}

function buildChecks(v: Vehicle): CheckItem[] {
  const checks: CheckItem[] = [
    { key: "minutaRecebida", label: "Minuta recebida", enabled: true },
    {
      key: "clienteComunicado",
      label: "Cliente comunicado que o carro está em preparo",
      enabled: true,
    },
    { key: "nf", label: "NF recebida/conferida", enabled: true },
    { key: "carregado", label: "Preparação/carregamento concluído", enabled: !!v.dataNF },
    { key: "lavacao", label: "Lavação concluída", enabled: !!v.dataNF },
    { key: "contato", label: "Cliente comunicado para entrega", enabled: !!v.dataNF },
    { key: "agendado", label: "Entrega agendada", enabled: isReady(v) },
    { key: "feedback", label: "Entrega realizada", enabled: isReady(v) && v.agendado },
  ];
  if (v.acessorio)
    checks.splice(3, 0, { key: "acessorioPago", label: "Acessórios preparados/pagos", enabled: true });
  if (v.insulfilm === "sim")
    checks.splice(4, 0, { key: "insulfilmDone", label: "Insulfilm concluído", enabled: true });
  if (v.emplacamento)
    checks.splice(5, 0, { key: "placa", label: "Emplacamento concluído", enabled: true });
  return checks;
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-muted/60 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

export function VehicleDetailDialog({
  vehicle,
  index,
  onClose,
  onToggle,
  onUpdate,
}: {
  vehicle: Vehicle | null;
  index: number;
  onClose: () => void;
  onToggle: (index: number, key: BooleanKeys, value: boolean) => void;
  onUpdate: (index: number, key: StringKeys, value: string) => void;
}) {
  if (!vehicle) return null;
  const v = vehicle;
  const left = daysLeft(v);
  const checks = buildChecks(v);
  const stages = ["Minuta recebida", "Cliente comunicado", "NF recebida", "Preparação", "Pronto", "Entrega"];
  const stageDone = [
    v.minutaRecebida,
    v.clienteComunicado,
    !!v.dataNF,
    !!v.dataNF && isReady(v),
    isReady(v),
    v.feedback,
  ];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {v.cliente || "Veículo sem nome"}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {[v.modelo, v.cor].filter(Boolean).join(" · ")}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <Detail label="Status" value={<StatusBadge tone={statusTone(statusOf(v))}>{statusOf(v)}</StatusBadge>} />
          <Detail label="Minuta" value={formatDate(v.dataMinuta)} />
          <Detail label="NF" value={formatDate(v.dataNF)} />
          <Detail label="D+5" value={deadlineOf(v) ? formatDate(deadlineOf(v)) : "—"} />
          <Detail
            label="Restante"
            value={
              left === null ? (
                "—"
              ) : left < 0 ? (
                <span className="text-danger">{Math.abs(left)} d.u. atraso</span>
              ) : (
                `${left} d.u.`
              )
            }
          />
        </div>

        {v.dataNF ? (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
              left !== null && left < 0
                ? "border-danger/25 bg-danger-soft text-danger"
                : "border-info/25 bg-info-soft text-info",
            )}
          >
            {left !== null && left < 0 ? (
              <TimerOff className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span>
              {left !== null && left < 0 ? "SLA estourado" : "SLA ativo"} — prazo máximo:{" "}
              <b>{formatDate(deadlineOf(v))}</b>. A contagem começa na NF.
            </span>
          </div>
        ) : null}

        {/* Fluxo */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Fluxo
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {stages.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "rounded-lg border px-1 py-2 text-center text-[11px] font-semibold",
                  stageDone[i]
                    ? "border-success/25 bg-success-soft text-success"
                    : "border-info/25 bg-info-soft text-info",
                )}
              >
                {stageDone[i] ? "✓ " : ""}
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Checklist
          </p>
          <div className="divide-y rounded-xl border border-border">
            {checks.map((item) => {
              const done = v[item.key] as boolean;
              return (
                <label
                  key={item.key}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm",
                    !item.enabled && "opacity-55",
                  )}
                >
                  <Checkbox
                    checked={done}
                    disabled={!item.enabled}
                    onCheckedChange={(checked) =>
                      onToggle(index, item.key, checked === true)
                    }
                  />
                  <span className="flex-1">{item.label}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-medium",
                      !item.enabled
                        ? "text-muted-foreground"
                        : done
                          ? "border-success/25 bg-success-soft text-success"
                          : "text-muted-foreground",
                    )}
                  >
                    {!item.enabled
                      ? "Aguardando NF"
                      : done
                        ? "Concluído"
                        : "Pendente"}
                  </Badge>
                </label>
              );
            })}
          </div>
        </div>

        {/* Configurações do veículo */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Configurações do veículo
          </p>
          <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-3">
            <label className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={v.acessorio}
                onCheckedChange={(checked) =>
                  onToggle(index, "acessorio", checked === true)
                }
              />
              Veículo possui acessórios
            </label>
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">
                Insulfilm
              </Label>
              <Select
                value={v.insulfilm === "sim" ? "sim" : "sem"}
                onValueChange={(val) =>
                  onUpdate(index, "insulfilm", val === "sim" ? "sim" : "")
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem">Sem</SelectItem>
                  <SelectItem value="sim">Sim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <Checkbox
                checked={v.emplacamento}
                onCheckedChange={(checked) =>
                  onToggle(index, "emplacamento", checked === true)
                }
              />
              Vai emplacar
            </label>
          </div>
        </div>

        {/* Dados da entrega */}
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Dados da entrega
          </p>
          <div className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs text-muted-foreground">Data</Label>
                <Input
                  type="date"
                  value={v.data}
                  onChange={(e) => onUpdate(index, "data", e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-muted-foreground">Horário</Label>
                <Input
                  type="time"
                  value={v.horario}
                  onChange={(e) => onUpdate(index, "horario", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs text-muted-foreground">
                  Responsável
                </Label>
                <Input
                  value={v.responsavel}
                  onChange={(e) => onUpdate(index, "responsavel", e.target.value)}
                  placeholder="Quem entrega"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-muted-foreground">Wallbox</Label>
                <Select value={v.wallbox} onValueChange={(val) => onUpdate(index, "wallbox", val)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sem">Sem</SelectItem>
                    <SelectItem value="Com">Com</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1 block text-xs text-muted-foreground">
                Observações
              </Label>
              <Textarea
                rows={2}
                value={v.obs}
                onChange={(e) => onUpdate(index, "obs", e.target.value)}
                placeholder="Anotações da preparação ou entrega"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
