"use client";
import { useUpdateGasto } from "@/hooks/use-gastos";
import { Gasto } from "@/types/gastos-types";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function EditGastoDialog({
  gasto,
  open,
  onClose,
}: {
  gasto: Gasto;
  open: boolean;
  onClose: () => void;
}) {
  const { mutate: updateGasto, isPending } = useUpdateGasto(gasto.id);
  const [form, setForm] = useState({
    nome: gasto.nome,
    descricao: gasto.descricao ?? "",
    valor_unitario: gasto.valor_unitario?.toString() ?? gasto.valor.toString(),
    quantidade: gasto.quantidade?.toString() ?? "1",
    recorrencia: gasto.recorrencia,
    categoria: gasto.categoria ?? "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const valorTotal =
    parseFloat(form.valor_unitario || "0") * parseInt(form.quantidade || "1");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateGasto(
      {
        nome: form.nome,
        descricao: form.descricao || undefined,
        valor: valorTotal,
        valor_unitario: parseFloat(form.valor_unitario),
        quantidade: parseInt(form.quantidade),
        recorrencia: form.recorrencia as "mensal" | "anual",
        categoria: form.categoria || undefined,
      },
      { onSuccess: onClose },
    );
  }

  const inputClass =
    "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-sky-500/50";
  const labelClass = "text-white/60 text-xs uppercase tracking-wider";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0d0d1a] border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Editar gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Nome</Label>
            <Input
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Descrição</Label>
            <Input
              value={form.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              className={inputClass}
            />
          </div>

          {/* valor unitário + quantidade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Valor unitário</Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor_unitario}
                onChange={(e) => handleChange("valor_unitario", e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Quantidade</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.quantidade}
                onChange={(e) => handleChange("quantidade", e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* preview do total */}
          {parseFloat(form.valor_unitario) > 0 && (
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-sky-500/5 border border-sky-500/20">
              <span className="text-xs text-white/40">
                {form.quantidade}x{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(parseFloat(form.valor_unitario || "0"))}
              </span>
              <span className="text-sm font-medium text-sky-300">
                ={" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(valorTotal)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Recorrência</Label>
              <Select
                value={form.recorrencia}
                onValueChange={(v) => v && handleChange("recorrencia", v)}
              >
                <SelectTrigger className="bg-white/5 w-full border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d1a] border-white/10 text-white">
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Categoria</Label>
              <Input
                value={form.categoria}
                onChange={(e) => handleChange("categoria", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 rounded-lg border border-sky-500/30 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-sm transition-all disabled:opacity-50"
          >
            {isPending ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
