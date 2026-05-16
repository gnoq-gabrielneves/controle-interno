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

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

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

  const inputStyle = {
    background: "var(--bg-base)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };
  const labelClass = "text-xs uppercase tracking-wider font-medium";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text-primary)" }}>
            Editar gasto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label
              className={labelClass}
              style={{ color: "var(--text-muted)" }}
            >
              Nome
            </Label>
            <Input
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              className={labelClass}
              style={{ color: "var(--text-muted)" }}
            >
              Descrição
            </Label>
            <Input
              value={form.descricao}
              onChange={(e) => handleChange("descricao", e.target.value)}
              style={inputStyle}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Valor unitário
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.valor_unitario}
                onChange={(e) => handleChange("valor_unitario", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Quantidade
              </Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.quantidade}
                onChange={(e) => handleChange("quantidade", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          {parseFloat(form.valor_unitario) > 0 && (
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{
                background: "var(--primary-bg)",
                border: "1px solid var(--primary-border)",
              }}
            >
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {form.quantidade}x{" "}
                {formatBRL(parseFloat(form.valor_unitario || "0"))}
              </span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--primary)" }}
              >
                = {formatBRL(valorTotal)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Recorrência
              </Label>
              <Select
                value={form.recorrencia}
                onValueChange={(v) => v && handleChange("recorrencia", v)}
              >
                <SelectTrigger
                  className="w-full"
                  style={{ ...inputStyle, height: 36 }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <SelectItem
                    value="mensal"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Mensal
                  </SelectItem>
                  <SelectItem
                    value="anual"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Anual
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Categoria
              </Label>
              <Input
                value={form.categoria}
                onChange={(e) => handleChange("categoria", e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: "var(--primary)",
              color: "#ffffff",
              border: "1px solid var(--primary)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "var(--primary-light)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "var(--primary)")
            }
          >
            {isPending ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
