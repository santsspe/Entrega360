export { supabase, supabaseConfigured } from "./supabase";
import { supabase, supabaseConfigured } from "./supabase";
import type { Vehicle } from "./entrega360";

const columns = `id, cliente, modelo, cor, chassi, vendedor, telefone, minuta_recebida, data_minuta, cliente_comunicado, nf, data_nf, acessorio, acessorio_pago, insulfilm, insulfilm_done, emplacamento, placa, carregado, lavacao, contato, agendado, data_agendada, horario, wallbox, feedback, data_entrega, responsavel, obs, created_at, updated_at`;

export interface VehicleRecord extends Vehicle { id: string; createdAt?: string; updatedAt?: string }

function fromRow(row: any): VehicleRecord {
  return {
    id: row.id,
    cliente: row.cliente ?? "", modelo: row.modelo ?? "", cor: row.cor ?? "", chassi: row.chassi ?? "", vendedor: row.vendedor ?? "", telefone: row.telefone ?? "",
    minutaRecebida: !!row.minuta_recebida, dataMinuta: row.data_minuta ?? "", clienteComunicado: !!row.cliente_comunicado,
    nf: !!row.nf, dataNF: row.data_nf ?? "", acessorio: !!row.acessorio, acessorioPago: !!row.acessorio_pago,
    insulfilm: row.insulfilm ?? "", insulfilmDone: !!row.insulfilm_done, emplacamento: !!row.emplacamento, placa: !!row.placa,
    carregado: !!row.carregado, lavacao: !!row.lavacao, contato: !!row.contato, agendado: !!row.agendado, data: row.data_agendada ?? "", horario: row.horario ?? "", wallbox: row.wallbox ?? "", feedback: !!row.feedback,
    dataEntrega: row.data_entrega ?? "", responsavel: row.responsavel ?? "", obs: row.obs ?? "", createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function toRow(v: Vehicle) {
  return {
    cliente: v.cliente, modelo: v.modelo, cor: v.cor, chassi: v.chassi, vendedor: v.vendedor, telefone: v.telefone,
    minuta_recebida: v.minutaRecebida, data_minuta: v.dataMinuta || null, cliente_comunicado: v.clienteComunicado,
    nf: v.nf, data_nf: v.dataNF || null, acessorio: v.acessorio, acessorio_pago: v.acessorioPago, insulfilm: v.insulfilm || "",
    insulfilm_done: v.insulfilmDone, emplacamento: v.emplacamento, placa: v.placa, carregado: v.carregado, lavacao: v.lavacao,
    contato: v.contato, agendado: v.agendado, data_agendada: v.data || null, horario: v.horario || null, wallbox: v.wallbox || "",
    feedback: v.feedback, data_entrega: v.dataEntrega || null, responsavel: v.responsavel || "", obs: v.obs || "",
  };
}

export async function getSession() {
  if (!supabaseConfigured || !supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signIn(email: string, password: string) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase não configurado.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() { if (supabase) await supabase.auth.signOut(); }

export async function listVehicles(): Promise<VehicleRecord[]> {
  if (!supabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from("vehicles").select(columns).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function createVehicle(v: Vehicle): Promise<VehicleRecord> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.from("vehicles").insert(toRow(v)).select(columns).single();
  if (error) throw error;
  return fromRow(data);
}

export async function updateVehicle(id: string, v: Vehicle): Promise<VehicleRecord> {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase não configurado.");
  const { data, error } = await supabase.from("vehicles").update(toRow(v)).eq("id", id).select(columns).single();
  if (error) throw error;
  return fromRow(data);
}


export interface ProfileRecord { id: string; nome: string; perfil: "admin" | "gestor" | "operador"; ativo: boolean }

export async function getMyProfile(): Promise<ProfileRecord | null> {
  if (!supabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("profiles").select("id,nome,perfil,ativo").single();
  if (error) throw error;
  return data as ProfileRecord;
}

export function subscribeToVehicles(onChange: () => void) {
  if (!supabaseConfigured || !supabase) return () => {};
  const channel = supabase
    .channel("entrega360-vehicles")
    .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export async function deleteVehicle(id: string) {
  if (!supabaseConfigured || !supabase) throw new Error("Supabase não configurado.");
  const { error } = await supabase.from("vehicles").delete().eq("id", id);
  if (error) throw error;
}
