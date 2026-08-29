import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createEmptyVehicle, todayISO, type Vehicle } from "@/lib/entrega360";

export function NewVehicleDialog({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (vehicle: Vehicle) => void;
}) {
  const [form, setForm] = useState({
    cliente: "",
    modelo: "",
    cor: "",
    chassi: "",
    vendedor: "",
    telefone: "",
    dataMinuta: todayISO(),
    dataNF: "",
    obs: "",
  });

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () =>
    setForm({
      cliente: "",
      modelo: "",
      cor: "",
      chassi: "",
      vendedor: "",
      telefone: "",
      dataMinuta: todayISO(),
      dataNF: "",
      obs: "",
    });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      reset();
      onClose();
    }
  };

  const handleSubmit = () => {
    if (!form.cliente.trim() || !form.modelo.trim() || !form.dataMinuta) return;
    const vehicle = createEmptyVehicle();
    vehicle.cliente = form.cliente.trim();
    vehicle.modelo = form.modelo.trim();
    vehicle.cor = form.cor.trim();
    vehicle.chassi = form.chassi.trim();
    vehicle.vendedor = form.vendedor.trim();
    vehicle.telefone = form.telefone.trim();
    vehicle.dataMinuta = form.dataMinuta;
    if (form.dataNF) {
      vehicle.dataNF = form.dataNF;
      vehicle.nf = true;
    }
    vehicle.obs = form.obs.trim();
    onAdd(vehicle);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Receber minuta</DialogTitle>
          <DialogDescription>
            A contagem de 5 dias úteis começa somente com a NF.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Cliente</Label>
            <Input value={form.cliente} onChange={(e) => set("cliente", e.target.value)} placeholder="Nome do cliente" />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Modelo</Label>
            <Input value={form.modelo} onChange={(e) => set("modelo", e.target.value)} placeholder="Ex.: B10" />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Cor</Label>
            <Input value={form.cor} onChange={(e) => set("cor", e.target.value)} placeholder="Ex.: tundra" />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Chassi</Label>
            <Input value={form.chassi} onChange={(e) => set("chassi", e.target.value)} placeholder="Nº do chassi" />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Vendedor</Label>
            <Input value={form.vendedor} onChange={(e) => set("vendedor", e.target.value)} placeholder="Responsável comercial" />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Telefone</Label>
            <Input value={form.telefone} onChange={(e) => set("telefone", e.target.value)} placeholder="Contato do cliente" />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Data da minuta</Label>
            <Input type="date" value={form.dataMinuta} onChange={(e) => set("dataMinuta", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">NF já recebida?</Label>
            <Input type="date" value={form.dataNF} onChange={(e) => set("dataNF", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1 block text-xs text-muted-foreground">Observações</Label>
            <Textarea rows={3} value={form.obs} onChange={(e) => set("obs", e.target.value)} placeholder="Anotações iniciais" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleOpenChange.bind(null, false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!form.cliente.trim() || !form.modelo.trim() || !form.dataMinuta}>Receber minuta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
