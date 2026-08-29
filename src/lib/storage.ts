import type { Vehicle } from "./entrega360";

const STORAGE_KEY = "entrega360.vehicles.v1";

export function loadVehicles(): Vehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Vehicle[]) : [];
  } catch {
    return [];
  }
}

export function saveVehicles(vehicles: Vehicle[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  } catch {
    // armazenamento indisponível — mantém apenas em memória
  }
}
