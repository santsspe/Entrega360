// Regras de negócio do Entrega360 — portadas do sistema original
// (dias úteis, SLA de 5 dias úteis a partir da NF, status, preparação, pendências).

export interface Vehicle {
  cliente: string;
  modelo: string;
  cor: string;
  chassi: string;
  vendedor: string;
  telefone: string;
  minutaRecebida: boolean;
  dataMinuta: string; // yyyy-mm-dd
  clienteComunicado: boolean;
  nf: boolean;
  dataNF: string; // "" ou yyyy-mm-dd
  acessorio: boolean;
  acessorioPago: boolean;
  insulfilm: "" | "sim";
  insulfilmDone: boolean;
  emplacamento: boolean;
  placa: boolean;
  carregado: boolean;
  lavacao: boolean;
  contato: boolean;
  agendado: boolean;
  data: string; // data agendada "" ou yyyy-mm-dd
  horario: string;
  wallbox: string;
  feedback: boolean;
  dataEntrega: string;
  responsavel: string;
  obs: string;
}

export type BooleanKeys =
  | "minutaRecebida"
  | "clienteComunicado"
  | "nf"
  | "carregado"
  | "lavacao"
  | "contato"
  | "agendado"
  | "feedback"
  | "acessorio"
  | "acessorioPago"
  | "insulfilmDone"
  | "emplacamento"
  | "placa";

export type StringKeys = Exclude<keyof Vehicle, BooleanKeys>;

/* ------------------------- dias úteis ------------------------- */

function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

export function addBusinessDays(date: Date, n: number): Date {
  const result = new Date(date);
  let remaining = n;
  while (remaining > 0) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result)) remaining -= 1;
  }
  return result;
}

export function diffBusinessDays(a: Date, b: Date): number {
  const s = new Date(a);
  s.setHours(0, 0, 0, 0);
  const e = new Date(b);
  e.setHours(0, 0, 0, 0);
  if (e < s) return -diffBusinessDays(b, a);
  let count = 0;
  const cursor = new Date(s);
  while (cursor < e) {
    cursor.setDate(cursor.getDate() + 1);
    if (isBusinessDay(cursor)) count += 1;
  }
  return count;
}

/* ------------------------- datas ------------------------- */

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function formatDate(value: string): string {
  if (!value) return "—";
  const parts = value.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return value;
}

/* ------------------------- SLA / prazo ------------------------- */

// Prazo D+5 (dias úteis) a partir da NF.
export function deadlineOf(v: Vehicle): string {
  if (!v.dataNF) return "";
  return toISODate(addBusinessDays(new Date(v.dataNF + "T12:00:00"), 5));
}

// Dias úteis restantes até o prazo (negativo = atraso).
export function daysLeft(v: Vehicle): number | null {
  if (!v.dataNF) return null;
  return diffBusinessDays(new Date(), new Date(deadlineOf(v) + "T12:00:00"));
}

/* ------------------------- preparação ------------------------- */

export function applicableSteps(v: Vehicle): Array<[string, boolean]> {
  // "Agendado" não faz parte da preparação: é a etapa seguinte ao
  // veículo estar pronto. Incluir agendado aqui criaria uma dependência
  // circular (só agenda se estiver pronto / só fica pronto se agendado).
  const steps: Array<[string, boolean]> = [
    ["nf", v.nf],
    ["carregado", v.carregado],
    ["lavacao", v.lavacao],
    ["contato", v.contato],
  ];
  if (v.acessorio) steps.push(["acessorioPago", v.acessorioPago]);
  if (v.insulfilm === "sim") steps.push(["insulfilm", v.insulfilmDone]);
  if (v.emplacamento) steps.push(["placa", v.placa]);
  return steps;
}

export function preparationPct(v: Vehicle): number {
  const steps = applicableSteps(v);
  if (steps.length === 0) return 0;
  return Math.round(
    (steps.filter(([, done]) => done).length / steps.length) * 100,
  );
}

export function isReady(v: Vehicle): boolean {
  return preparationPct(v) >= 100;
}

/* ------------------------- pendências ------------------------- */

export interface PendingIssue {
  label: string;
  criticality: "Crítica" | "Alta" | "Média";
  impact: string;
}

export function pendingIssues(v: Vehicle): PendingIssue[] {
  const p: PendingIssue[] = [];
  const left = daysLeft(v);
  if (!v.dataNF)
    p.push({ label: "Aguardando NF do financeiro", criticality: "Alta", impact: "Não inicia SLA" });
  if (v.dataNF && !v.nf)
    p.push({ label: "NF não conferida", criticality: "Crítica", impact: "Bloqueia" });
  if (v.acessorio && !v.acessorioPago)
    p.push({ label: "Acessórios pendentes", criticality: "Alta", impact: "Bloqueia" });
  if (v.insulfilm === "sim" && !v.insulfilmDone)
    p.push({ label: "Insulfilm pendente", criticality: "Alta", impact: "Bloqueia" });
  if (v.emplacamento && !v.placa)
    p.push({ label: "Emplacamento pendente", criticality: "Alta", impact: "Bloqueia" });
  if (v.dataNF && !v.carregado)
    p.push({ label: "Preparação/carregamento pendente", criticality: "Alta", impact: "Bloqueia" });
  if (v.dataNF && !v.lavacao)
    p.push({ label: "Lavação pendente", criticality: "Média", impact: "Bloqueia" });
  if (v.dataNF && !v.contato)
    p.push({ label: "Comunicação com cliente pendente", criticality: "Alta", impact: "Bloqueia" });
  if (v.dataNF && !v.agendado && preparationPct(v) >= 100)
    p.push({ label: "Agendamento da entrega", criticality: "Alta", impact: "Ação necessária" });
  if (v.dataNF && left !== null && left < 0 && !v.feedback)
    p.push({ label: "SLA de 5 dias úteis estourado", criticality: "Crítica", impact: "Bloqueia" });
  return p;
}

/* ------------------------- status ------------------------- */

export type VehicleStatus =
  | "Aguardando NF"
  | "Em preparação"
  | "Pronto para entrega"
  | "Entrega agendada"
  | "Entregue"
  | "Fora do prazo";

export type StatusTone = "green" | "blue" | "amber" | "gray" | "red";

export function statusOf(v: Vehicle): VehicleStatus {
  if (v.feedback) return "Entregue";
  const left = v.dataNF ? daysLeft(v) : null;
  if (v.dataNF && left !== null && left < 0) return "Fora do prazo";
  if (isReady(v) && v.agendado) return "Entrega agendada";
  if (isReady(v)) return "Pronto para entrega";
  if (v.dataNF) return "Em preparação";
  return "Aguardando NF";
}

export function statusTone(status: VehicleStatus): StatusTone {
  switch (status) {
    case "Entregue":
      return "green";
    case "Pronto para entrega":
      return "blue";
    case "Entrega agendada":
      return "amber";
    case "Em preparação":
      return "gray";
    default:
      return "red";
  }
}

export function currentStage(v: Vehicle): string {
  if (v.feedback) return "Entrega concluída";
  if (v.agendado) return "Entrega agendada";
  if (isReady(v)) return "Pronto para entrega";
  if (!v.dataNF) return "Aguardando NF";
  return "Preparação";
}

/* ------------------------- fábrica ------------------------- */

export function createEmptyVehicle(): Vehicle {
  const today = todayISO();
  return {
    cliente: "",
    modelo: "",
    cor: "",
    chassi: "",
    vendedor: "",
    telefone: "",
    minutaRecebida: true,
    dataMinuta: today,
    clienteComunicado: false,
    nf: false,
    dataNF: "",
    acessorio: false,
    acessorioPago: false,
    insulfilm: "",
    insulfilmDone: false,
    emplacamento: false,
    placa: false,
    carregado: false,
    lavacao: false,
    contato: false,
    agendado: false,
    data: "",
    horario: "",
    wallbox: "",
    feedback: false,
    dataEntrega: "",
    responsavel: "",
    obs: "",
  };
}

/* ------------------------- exportação CSV ------------------------- */

export function exportCSV(vehicles: Vehicle[]): void {
  const header = [
    "Cliente",
    "Modelo",
    "Chassi",
    "Minuta",
    "NF",
    "Prazo D+5",
    "Status",
    "Preparação",
    "Pendências",
  ];
  const rows = vehicles.map((v) =>
    [
      v.cliente,
      v.modelo,
      v.chassi,
      v.dataMinuta,
      v.dataNF,
      deadlineOf(v),
      statusOf(v),
      `${preparationPct(v)}%`,
      pendingIssues(v)
        .map((p) => p.label)
        .join(" | "),
    ]
      .map((x) => `"${String(x).replaceAll('"', '""')}"`)
      .join(";"),
  );
  const csv = "\ufeff" + [header.join(";"), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Entrega360.csv";
  link.click();
  URL.revokeObjectURL(url);
}
