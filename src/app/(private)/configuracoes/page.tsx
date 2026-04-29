"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetConfiguracoes,
  useUpdateConfiguracoes,
} from "@/hooks/use-configuracoes";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";

export default function ConfiguracoesPage() {
  const { data: config, isLoading } = useGetConfiguracoes();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
      </div>
    );
  }

  if (!config) return null;

  return <ConfiguracoesForm config={config} />;
}

function ConfiguracoesForm({
  config,
}: {
  config: { id: string; reserva_empresa: number };
}) {
  const { mutate: updateConfig, isPending } = useUpdateConfiguracoes();
  const [reserva, setReserva] = useState(config.reserva_empresa * 100);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateConfig({ id: config.id, reserva_empresa: reserva / 100 });
  }

  const inputClass =
    "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-sky-500/50";
  const labelClass = "text-white/60 text-xs uppercase tracking-wider";

  return (
    <div className="p-8 max-w-xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-5 h-5 text-white/40" />
        <div>
          <h1 className="text-xl font-semibold">Configurações</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Parâmetros globais do sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 flex flex-col gap-4">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Distribuição de lucros
          </p>

          <div className="flex flex-col gap-1.5">
            <Label className={labelClass}>Reserva da empresa (%)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={reserva}
                onChange={(e) => setReserva(Number(e.target.value))}
                required
                className={`max-w-32 ${inputClass}`}
              />
              <span className="text-sm text-white/30">
                % do lucro bruto fica retido na empresa
              </span>
            </div>
          </div>

          {/* preview do cálculo */}
          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4 flex flex-col gap-2">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">
              Exemplo com R$ 1.000 de lucro bruto
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">
                Reserva empresa ({reserva}%)
              </span>
              <span className="text-white/60">
                -{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format((1000 * reserva) / 100)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-2">
              <span className="text-white/40">Lucro distribuível</span>
              <span className="text-sky-300 font-medium">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(1000 * (1 - reserva / 100))}
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 rounded-lg border border-sky-500/30 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-sm transition-all disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>
    </div>
  );
}
