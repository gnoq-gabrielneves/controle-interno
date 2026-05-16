"use client";

import { useGetConfiguracoes } from "@/hooks/use-configuracoes";
import { useListFuncionarios } from "@/hooks/use-funcionarios";
import { useListGastos } from "@/hooks/use-gastos";
import { useGetOrcamento } from "@/hooks/use-orcamentos";
import { useListSocietarios } from "@/hooks/use-societarios";
import { ArrowLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
function formatPct(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

type FuncionarioData = { id: number; name: string; salario: number };
type ItemFuncionario = {
  id: string;
  horas: number;
  funcionario_data: FuncionarioData | FuncionarioData[] | null;
};
type OrcamentoItem = {
  id: string;
  descricao: string;
  orcamento_item_funcionarios: ItemFuncionario[];
};
type OrcamentoRaw = {
  id: string;
  titulo: string;
  margem_lucro: number;
  aliquota_imposto: number;
  orcamento_itens: OrcamentoItem[];
};
type Gasto = { recorrencia: "mensal" | "anual"; valor: number };

export default function DistribuicaoOrcamentoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: orcamento, isLoading: loadingOrc } = useGetOrcamento(id);
  const { data: societarios, isLoading: loadingSoc } = useListSocietarios();
  const { data: config, isLoading: loadingConfig } = useGetConfiguracoes();
  const { data: gastos } = useListGastos();
  const { data: funcionarios } = useListFuncionarios();

  const isLoading = loadingOrc || loadingSoc || loadingConfig;

  const calculo = useMemo(() => {
    if (!orcamento || !societarios || !config) return null;

    const orc = orcamento as unknown as OrcamentoRaw;

    const totalGastos =
      (gastos as Gasto[] | undefined)?.reduce(
        (acc, g) => acc + (g.recorrencia === "mensal" ? g.valor : g.valor / 12),
        0,
      ) ?? 0;
    const totalFunc = funcionarios?.length ?? 1;
    const overheadPorHora = totalGastos / (totalFunc * 220);

    const valorProjeto = (orc.orcamento_itens ?? []).reduce((acc, item) => {
      const custoBaseItem = (item.orcamento_item_funcionarios ?? []).reduce(
        (a, f) => {
          const func = Array.isArray(f.funcionario_data)
            ? (f.funcionario_data as unknown as FuncionarioData[])[0]
            : (f.funcionario_data as unknown as FuncionarioData | null);
          if (!func) return a;
          return a + f.horas * (func.salario / 220 + overheadPorHora);
        },
        0,
      );
      const comMargem = custoBaseItem * (1 + orc.margem_lucro);
      const comImposto = comMargem * (1 + orc.aliquota_imposto);
      return acc + comImposto;
    }, 0);

    const imposto =
      (valorProjeto * orc.aliquota_imposto) / (1 + orc.aliquota_imposto);
    const valorLiquido = valorProjeto - imposto;

    const pagamentosPorFuncionario: Record<
      number,
      { name: string; valor: number; horas: number }
    > = {};
    (orc.orcamento_itens ?? []).forEach((item) => {
      (item.orcamento_item_funcionarios ?? []).forEach((f) => {
        const func = Array.isArray(f.funcionario_data)
          ? f.funcionario_data[0]
          : (f.funcionario_data as FuncionarioData | null);
        if (!func) return;
        const valor = f.horas * (func.salario / 220);
        if (pagamentosPorFuncionario[func.id]) {
          pagamentosPorFuncionario[func.id].valor += valor;
          pagamentosPorFuncionario[func.id].horas += f.horas;
        } else {
          pagamentosPorFuncionario[func.id] = {
            name: func.name,
            valor,
            horas: f.horas,
          };
        }
      });
    });

    const custoTotalEquipe = Object.values(pagamentosPorFuncionario).reduce(
      (acc, f) => acc + f.valor,
      0,
    );
    const lucroBruto = valorLiquido - custoTotalEquipe;
    const valorReserva = lucroBruto * config.reserva_empresa;
    const lucroDistribuivel = lucroBruto - valorReserva;

    const distribuicao = societarios.map((s, index) => {
      const func = Array.isArray(s.funcionario_data)
        ? (s.funcionario_data as unknown as FuncionarioData[])[0]
        : (s.funcionario_data as unknown as FuncionarioData | null);
      const percent = s.percent ?? 0;
      const lucroSocio = lucroDistribuivel * percent;
      const pagamentoComoFunc =
        pagamentosPorFuncionario[func?.id ?? 0]?.valor ?? 0;
      return {
        id: func?.id ?? index,
        name: func?.name ?? "—",
        percent,
        lucro: lucroSocio,
        pagamentoFunc: pagamentoComoFunc,
        horas: pagamentosPorFuncionario[func?.id ?? 0]?.horas ?? 0,
        total: lucroSocio + pagamentoComoFunc,
      };
    });

    return {
      valorProjeto,
      imposto,
      aliquotaImposto: orc.aliquota_imposto,
      valorLiquido,
      pagamentosPorFuncionario,
      custoTotalEquipe,
      totalGastos,
      lucroBruto,
      reservaEmpresa: config.reserva_empresa,
      valorReserva,
      lucroDistribuivel,
      distribuicao,
    };
  }, [orcamento, societarios, config, gastos, funcionarios]);

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

  if (!calculo) return null;

  const orc = orcamento as unknown as { titulo: string };

  const sectionStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    overflow: "hidden" as const,
  };

  const sectionHeaderStyle = {
    background: "var(--bg-card-alt)",
    borderBottom: "1px solid var(--border)",
    padding: "12px 20px",
  };

  const resumoRows = [
    {
      label: "Valor do projeto",
      value: formatBRL(calculo.valorProjeto),
      highlight: false,
      muted: false,
    },
    {
      label: `Imposto Simples Nacional (${formatPct(calculo.aliquotaImposto)})`,
      value: `- ${formatBRL(calculo.imposto)}`,
      highlight: false,
      muted: true,
    },
    {
      label: "Valor líquido após imposto",
      value: formatBRL(calculo.valorLiquido),
      highlight: false,
      muted: false,
    },
    {
      label: "Custo total da equipe",
      value: `- ${formatBRL(calculo.custoTotalEquipe)}`,
      highlight: false,
      muted: true,
    },
    {
      label: "Lucro bruto do projeto",
      value: formatBRL(calculo.lucroBruto),
      highlight: false,
      muted: false,
    },
    {
      label: `Reserva empresa (${formatPct(calculo.reservaEmpresa)})`,
      value: `- ${formatBRL(calculo.valorReserva)}`,
      highlight: false,
      muted: true,
    },
    {
      label: "Lucro distribuível",
      value: formatBRL(calculo.lucroDistribuivel),
      highlight: true,
      muted: false,
    },
  ];

  return (
    <div className="p-8 w-full flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg transition-all"
          style={{
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Distribuição do projeto
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {orc.titulo}
          </p>
        </div>
      </div>

      {/* resumo financeiro */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Resumo financeiro
          </p>
        </div>
        {resumoRows.map((row, i) => (
          <div
            key={`row-${i}`}
            className="flex justify-between items-center px-5 py-3"
            style={{
              borderBottom:
                i < resumoRows.length - 1 ? "1px solid var(--border)" : "none",
              background: row.highlight ? "var(--primary-bg)" : "transparent",
            }}
          >
            <span
              className="text-sm"
              style={{
                color: row.muted
                  ? "var(--text-muted)"
                  : "var(--text-secondary)",
              }}
            >
              {row.label}
            </span>
            <span
              className="text-sm font-medium"
              style={{
                color: row.highlight
                  ? "var(--primary)"
                  : row.muted
                    ? "var(--error)"
                    : "var(--text-primary)",
              }}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* card de reserva */}
      <div
        className="p-5 rounded-xl flex items-center justify-between"
        style={{
          border: "1px solid var(--warning-border)",
          background: "var(--warning-bg)",
        }}
      >
        <div>
          <p
            className="text-xs uppercase tracking-wider mb-1"
            style={{ color: "var(--warning)" }}
          >
            Valor para reserva da empresa
          </p>
          <p
            className="text-2xl font-semibold"
            style={{ color: "var(--warning)" }}
          >
            {formatBRL(calculo.valorReserva)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            {formatPct(calculo.reservaEmpresa)} do lucro bruto de{" "}
            {formatBRL(calculo.lucroBruto)}
          </p>
        </div>
        <div
          className="text-right text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <p>Configurado em</p>
          <p className="font-medium" style={{ color: "var(--warning)" }}>
            Configurações → Reserva empresa
          </p>
        </div>
      </div>

      {/* pagamentos da equipe */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Pagamento da equipe
          </p>
        </div>
        {Object.entries(calculo.pagamentosPorFuncionario).map(([funcId, f]) => (
          <div
            key={funcId}
            className="flex justify-between items-center px-5 py-3"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                style={{
                  background: "var(--primary-bg)",
                  border: "1px solid var(--primary-border)",
                  color: "var(--primary)",
                }}
              >
                {f.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--text-primary)" }}
                >
                  {f.name}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {f.horas}h trabalhadas
                </p>
              </div>
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              {formatBRL(f.valor)}
            </span>
          </div>
        ))}
      </div>

      {/* distribuição dos sócios */}
      <div style={sectionStyle}>
        <div style={sectionHeaderStyle}>
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Distribuição dos sócios
          </p>
        </div>
        {calculo.distribuicao.map((d) => (
          <div key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center px-5 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                  style={{
                    background: "var(--secondary-bg)",
                    border: "1px solid var(--secondary-border)",
                    color: "var(--secondary)",
                  }}
                >
                  {d.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {d.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Participação: {formatPct(d.percent)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Total a receber
                </p>
                <p
                  className="text-base font-semibold"
                  style={{ color: "var(--primary)" }}
                >
                  {formatBRL(d.total)}
                </p>
              </div>
            </div>
            <div className="px-5 pb-3 flex gap-6">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Lucro ({formatPct(d.percent)})
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {formatBRL(d.lucro)}
                </p>
              </div>
              {d.pagamentoFunc > 0 && (
                <div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Pagamento pelo projeto
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {formatBRL(d.pagamentoFunc)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
