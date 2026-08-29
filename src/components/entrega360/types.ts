import type { Vehicle } from "@/lib/entrega360";

export interface ViewProps {
  vehicles: Vehicle[];
  onOpen: (index: number) => void;
  onNew: () => void;
}
