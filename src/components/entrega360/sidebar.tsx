import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewId =
  | "dashboard"
  | "vehicles"
  | "checklist"
  | "pending"
  | "agenda"
  | "reports";

const navItems: Array<{ id: ViewId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "vehicles", label: "Veículos", icon: Truck },
  { id: "checklist", label: "Fluxo & Checklist", icon: ListChecks },
  { id: "pending", label: "Pendências", icon: AlertTriangle },
  { id: "agenda", label: "Agenda", icon: CalendarDays },
  { id: "reports", label: "Indicadores", icon: BarChart3 },
];

export function Sidebar({
  view,
  onNavigate,
  total,
}: {
  view: ViewId;
  onNavigate: (id: ViewId) => void;
  total: number;
}) {
  return (
    <aside className="flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-4 pb-6 pt-6 lg:px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground shadow-glow">
          E
        </span>
        <span className="hidden font-display text-xl font-bold tracking-tight text-white lg:block">
          Entrega360
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 lg:px-3">
        {navItems.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex items-center justify-center gap-3 rounded-lg px-2 py-2.5 text-sm font-medium transition-colors lg:justify-start lg:px-3",
                active
                  ? "bg-sidebar-accent text-white"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span className="hidden lg:block">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 hidden rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3 lg:block">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground">
          Veículos ativos
        </p>
        <p className="mt-1 font-display text-2xl font-bold text-white">{total}</p>
      </div>
    </aside>
  );
}
