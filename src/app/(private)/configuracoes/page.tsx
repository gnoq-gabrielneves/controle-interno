"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGetConfiguracoes,
  useUpdateConfiguracoes,
} from "@/hooks/use-configuracoes";
import { SettingsIcon } from "lucide-react";
import { useState } from "react";

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    value,
  );

export default function ConfiguracoesPage() {
  const { data: config, isLoading } = useGetConfiguracoes();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{
            borderColor: "var(--primary-border)",
            borderTopColor: "var(--primary)",
          }}
        />
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

  const inputStyle = {
    background: "var(--bg-card)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };
  const labelClass = "text-xs uppercase tracking-wider font-medium";

  return (
    <div className="p-8 max-w-xl flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center gap-3">
        <SettingsIcon
          className="w-5 h-5"
          style={{ color: "var(--text-muted)" }}
        />
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Configurações
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Parâmetros globais do sistema
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* distribuição de lucros */}
        <div
          className="rounded-xl p-6 flex flex-col gap-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Distribuição de lucros
          </p>

          <div className="flex flex-col gap-1.5">
            <Label
              className={labelClass}
              style={{ color: "var(--text-muted)" }}
            >
              Reserva da empresa (%)
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={reserva}
                onChange={(e) => setReserva(Number(e.target.value))}
                required
                className="max-w-32"
                style={inputStyle}
              />
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                % do lucro bruto fica retido na empresa
              </span>
            </div>
          </div>

          {/* preview do cálculo */}
          <div
            className="rounded-lg p-4 flex flex-col gap-2"
            style={{
              background: "var(--bg-card-alt)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-xs uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Exemplo com R$ 1.000 de lucro bruto
            </p>
            <div className="flex justify-between text-sm">
              <span style={{ color: "var(--text-muted)" }}>
                Reserva empresa ({reserva}%)
              </span>
              <span style={{ color: "var(--error)" }}>
                - {formatBRL((1000 * reserva) / 100)}
              </span>
            </div>
            <div
              className="flex justify-between text-sm pt-2"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <span style={{ color: "var(--text-muted)" }}>
                Lucro distribuível
              </span>
              <span className="font-medium" style={{ color: "var(--primary)" }}>
                {formatBRL(1000 * (1 - reserva / 100))}
              </span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
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
          {isPending ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>
    </div>
  );
}
