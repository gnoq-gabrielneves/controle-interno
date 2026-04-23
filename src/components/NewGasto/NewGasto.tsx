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
    valor: "",
    recorrencia: "mensal" as "mensal" | "anual",
    categoria: "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createGasto(
      {
        nome: form.nome,
        descricao: form.descricao || undefined,
        valor: parseFloat(form.valor),
        recorrencia: form.recorrencia,
        categoria: form.categoria || undefined,
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({
            nome: "",
            descricao: "",
            valor: "",
            recorrencia: "mensal",
            categoria: "",
          });
        },
      },
    );
  }

  return (
    <>
      {/* botão que abre o dialog */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 text-sm hover:bg-sky-500/20 transition-all"
      >
        <PlusIcon className="w-4 h-4" />
        Novo gasto
      </button>

      {/* dialog controlado pelo estado open */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0d0d1a] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Novo gasto</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">
                Nome
              </Label>
              <Input
                placeholder="Ex: Servidor AWS"
                value={form.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                required
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-sky-500/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">
                Descrição
              </Label>
              <Input
                placeholder="Opcional"
                value={form.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-sky-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">
                  Valor
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.valor}
                  onChange={(e) => handleChange("valor", e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-sky-500/50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-white/60 text-xs uppercase tracking-wider">
                  Recorrência
                </Label>
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
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider">
                Categoria
              </Label>
              <Input
                placeholder="Ex: Infraestrutura"
                value={form.categoria}
                onChange={(e) => handleChange("categoria", e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-sky-500/50"
              />
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
