import { useEffect, useState } from "react";
import { AgendaView } from "@/components/entrega360/agenda-view";
import { ChecklistView } from "@/components/entrega360/checklist-view";
import { DashboardView } from "@/components/entrega360/dashboard-view";
import { NewVehicleDialog } from "@/components/entrega360/new-vehicle-dialog";
import { PendingView } from "@/components/entrega360/pending-view";
import { ReportsView } from "@/components/entrega360/reports-view";
import { Sidebar, type ViewId } from "@/components/entrega360/sidebar";
import type { ViewProps } from "@/components/entrega360/types";
import { VehicleDetailDialog } from "@/components/entrega360/vehicle-detail-dialog";
import { VehiclesView } from "@/components/entrega360/vehicles-view";
import { todayISO, type BooleanKeys, type StringKeys, type Vehicle } from "@/lib/entrega360";
import { createVehicle, getSession, listVehicles, subscribeToVehicles, supabase, supabaseConfigured, updateVehicle, type VehicleRecord } from "@/lib/api";
import { loadVehicles, saveVehicles } from "@/lib/storage";
import { Loader2, LogIn, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function Index() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(() => loadVehicles().map((v, i) => ({ ...v, id: `local-${i}` })));
  const [view, setView] = useState<ViewId>("dashboard");
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [user, setUser] = useState<any>(null);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const refresh = async () => {
    if (!supabaseConfigured) return;
    setLoading(true);
    try {
      const session = await getSession();
      setUser(session?.user ?? null);
      if (session) setVehicles(await listVehicles());
      else setVehicles([]);
    } catch (e: any) {
      toast.error(e?.message || "Não foi possível carregar os veículos.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    if (!supabaseConfigured) saveVehicles(vehicles);
  }, [vehicles]);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session) void refresh();
      else setVehicles([]);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabaseConfigured || !user) return;
    const unsubscribe = subscribeToVehicles(() => void refresh());
    return unsubscribe;
  }, [user]);

  const toggleField = async (index: number, key: BooleanKeys, value: boolean) => {
    const current = vehicles[index]; if (!current) return;
    const next = { ...current, [key]: value } as Vehicle;
    // A confirmação da NF inicia o SLA imediatamente e sempre mantém
    // dataNF sincronizada com o campo booleano.
    if (key === "nf" && value) {
      next.dataNF = next.dataNF || todayISO();
    }
    if (key === "nf" && !value) {
      next.dataNF = "";
    }
    if (key === "agendado" && value && !next.dataNF) {
      toast.error("Receba a NF antes de agendar a entrega.");
      return;
    }
    if (key === "feedback" && value && !next.agendado) {
      toast.error("Agende a entrega antes de finalizar.");
      return;
    }
    if (key === "feedback" && value && !next.dataEntrega) {
      next.dataEntrega = todayISO();
      next.data = next.data || todayISO();
    }
    await persist(index, next);
  };

  const updateField = async (index: number, key: StringKeys, value: string) => {
    const current = vehicles[index]; if (!current) return;
    await persist(index, { ...current, [key]: value } as Vehicle);
  };

  const persist = async (index: number, next: Vehicle) => {
    setVehicles(prev => prev.map((v, i) => i === index ? ({ ...v, ...next } as VehicleRecord) : v));
    if (!supabaseConfigured) return;
    try {
      const saved = await updateVehicle(vehicles[index].id, next);
      setVehicles(prev => prev.map((v, i) => i === index ? saved : v));
      toast.success("Alteração salva.");
    } catch (e: any) {
      setVehicles(prev => prev.map((v, i) => i === index ? vehicles[index] : v));
      toast.error(e?.message || "Não foi possível salvar.");
    }
  };

  const addVehicle = async (vehicle: Vehicle) => {
    try {
      if (supabaseConfigured) {
        const saved = await createVehicle(vehicle);
        setVehicles(prev => [saved, ...prev]);
      } else setVehicles(prev => [{ ...vehicle, id: crypto.randomUUID() }, ...prev]);
      setShowNew(false); setView("vehicles"); toast.success("Minuta recebida e veículo criado.");
    } catch (e: any) { toast.error(e?.message || "Não foi possível cadastrar o veículo."); }
  };

  if (supabaseConfigured && !user && !loading) return <Login form={authForm} setForm={setAuthForm} error={authError} setError={setAuthError} />;
  if (loading) return <div className="flex h-full min-h-screen items-center justify-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Carregando Entrega360...</div>;

  const viewProps: ViewProps = { vehicles, onOpen: setDetailIndex, onNew: () => setShowNew(true) };
  return <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
    <Sidebar view={view} onNavigate={setView} total={vehicles.length} />
    <main className="dot-grid relative flex-1 overflow-y-auto"><div className="relative min-h-full p-5 sm:p-7 lg:p-8">
      <div className="mb-3 flex justify-end gap-2">{supabaseConfigured && <Button size="sm" variant="outline" onClick={() => void refresh()}><RefreshCw className="h-3.5 w-3.5" /> Atualizar</Button>}{supabaseConfigured && <Button size="sm" variant="ghost" onClick={async()=>{await supabase?.auth.signOut();}}><LogOut className="h-3.5 w-3.5" /> Sair</Button>}</div>
      {view === "dashboard" && <DashboardView {...viewProps} />}{view === "vehicles" && <VehiclesView {...viewProps} />}{view === "checklist" && <ChecklistView {...viewProps} />}{view === "pending" && <PendingView {...viewProps} />}{view === "agenda" && <AgendaView {...viewProps} />}{view === "reports" && <ReportsView {...viewProps} />}
    </div></main>
    <VehicleDetailDialog vehicle={detailIndex !== null ? vehicles[detailIndex] : null} index={detailIndex ?? -1} onClose={() => setDetailIndex(null)} onToggle={toggleField} onUpdate={updateField} />
    <NewVehicleDialog open={showNew} onClose={() => setShowNew(false)} onAdd={addVehicle} />
  </div>;
}

function Login({ form, setForm, error, setError }: any) {
  const [busy, setBusy] = useState(false);
  const submit = async () => { setBusy(true); setError(""); try { const { signIn } = await import("@/lib/api"); await signIn(form.email, form.password); } catch(e:any) { setError(e?.message || "E-mail ou senha inválidos."); } finally { setBusy(false); } };
  return <div className="flex min-h-screen items-center justify-center bg-muted/30 p-5"><Card className="w-full max-w-md"><CardContent className="p-8"><div className="mb-6"><div className="text-xl font-black">🚗 Entrega360</div><p className="mt-1 text-sm text-muted-foreground">Entre para acessar o painel de entregas.</p></div><div className="grid gap-4"><Input type="email" placeholder="E-mail" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><Input type="password" placeholder="Senha" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} onKeyDown={e=>e.key==="Enter"&&void submit()}/>{error&&<p className="text-sm text-danger">{error}</p>}<Button onClick={()=>void submit()} disabled={busy}>{busy?<Loader2 className="animate-spin"/>:<LogIn/>} Entrar</Button></div></CardContent></Card></div>;
}
