// src/components/NewGasto/NewGasto.tsx
"use client";

import { useCreateGasto } from "@/hooks/use-gastos";
import { PlusIcon } from "lucide-react";
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

export function NewGasto() {
  const { mutate: createGasto, isPending } = useCreateGasto();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    valor_unitario: "",
    quantidade: "1",
    recorrencia: "mensal" as "mensal" | "anual",
    categoria: "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // calcula o valor total automaticamente
  const valorTotal =
    parseFloat(form.valor_unitario || "0") * parseInt(form.quantidade || "1");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createGasto(
      {
        nome: form.nome,
        descricao: form.descricao || undefined,
        valor: valorTotal,
        valor_unitario: parseFloat(form.valor_unitario),
        quantidade: parseInt(form.quantidade),
        recorrencia: form.recorrencia,
        categoria: form.categoria || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({
            nome: "",
            descricao: "",
            valor_unitario: "",
            quantidade: "1",
            recorrencia: "mensal",
            categoria: "",
          });
        },
      },
    );
  }

  const inputClass =
    "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-sky-500/50";
  const labelClass = "text-white/60 text-xs uppercase tracking-wider";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 text-sm hover:bg-sky-500/20 transition-all"
      >
        <PlusIcon className="w-4 h-4" />
        Novo gasto
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0d0d1a] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Novo gasto</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Nome</Label>
              <Input
                placeholder="Ex: Email corporativo"
                value={form.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Descrição</Label>
              <Input
                placeholder="Opcional"
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
                  placeholder="0,00"
                  value={form.valor_unitario}
                  onChange={(e) =>
                    handleChange("valor_unitario", e.target.value)
                  }
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
                  placeholder="1"
                  value={form.quantidade}
                  onChange={(e) => handleChange("quantidade", e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>

            {/* preview do total calculado */}
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
                  placeholder="Ex: Infraestrutura"
                  value={form.categoria}
                  onChange={(e) => handleChange("categoria", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-2 rounded-lg border border-sky-500/30 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-sm transition-all disabled:opacity-50"
            >
              {isPending ? "Criando..." : "Criar gasto"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
