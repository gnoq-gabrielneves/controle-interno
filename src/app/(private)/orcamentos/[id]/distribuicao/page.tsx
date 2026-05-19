"use client";

import {
  calcularOrcamento,
  formatBRL,
  formatPct,
} from "@/helpers/calculo-orcamento";
import { useGetConfiguracoes } from "@/hooks/use-configuracoes";
import { useGetOrcamento } from "@/hooks/use-orcamentos";
import { useListSocietarios } from "@/hooks/use-societarios";
import { OrcamentoTipo } from "@/types/orcamentos-types";
import { ArrowLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

// ─── tipos vindos do banco ───
type FuncionarioData = { id: number; name: string; salario: number };

type ItemFuncionario = {
  id: string;
  funcionario: number;
  meses_alocados: number;
  salario_snapshot: number;
  funcionario_data: FuncionarioData | FuncionarioData[] | null;
};

type OrcamentoItem = {
  id: string;
  descricao: string;
  valor_manual: number | null;
  orcamento_item_funcionarios: ItemFuncionario[];
};

type OrcamentoRaw = {
  id: string;
  titulo: string;
  tipo: OrcamentoTipo;
  margem_lucro: number;
  aliquota_imposto: number;
  buffer_atraso: number;
  orcamento_itens: OrcamentoItem[];
};

type SocietarioRaw = {
  funcionario: number;
  percent: number | null;
  funcionario_data: FuncionarioData | FuncionarioData[] | null;
};

// resolve o funcionario_data que vem como obj ou array do supabase
function pickFunc(f: {
  funcionario_data: FuncionarioData | FuncionarioData[] | null;
}): FuncionarioData | null {
  if (!f.funcionario_data) return null;
  return Array.isArray(f.funcionario_data)
    ? (f.funcionario_data[0] ?? null)
    : f.funcionario_data;
}

export default function DistribuicaoOrcamentoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: orcamento, isLoading: loadingOrc } = useGetOrcamento(id);
  const { data: societarios, isLoading: loadingSoc } = useListSocietarios();
  const { data: config, isLoading: loadingConfig } = useGetConfiguracoes();

  const isLoading = loadingOrc || loadingSoc || loadingConfig;

  const calculo = useMemo(() => {
    if (!orcamento || !societarios || !config) return null;

    const orc = orcamento as unknown as OrcamentoRaw;

    // 1. Calcular o valor cobrado usando o helper único.
    //    Funciona pra projeto_fechado E por_modulo (com valor_manual).
    const todasAlocacoes = (orc.orcamento_itens ?? []).flatMap(
      (item) => item.orcamento_item_funcionarios ?? [],
    );

    const funcionariosCalc = todasAlocacoes.map((f) => ({
      salario: f.salario_snapshot,
      meses: f.meses_alocados,
    }));

    const itensCalc =
      orc.tipo === "por_modulo"
        ? (orc.orcamento_itens ?? []).map((i) => ({ valor: i.valor_manual }))
        : undefined;

    const calc = calcularOrcamento({
      funcionarios: funcionariosCalc,
      bufferAtraso: orc.buffer_atraso,
      margemLucro: orc.margem_lucro,
      aliquotaImposto: orc.aliquota_imposto,
      itens: itensCalc,
    });

    const valorProjeto = calc.valorCobrado;

    // 2. Imposto sobre o valor cobrado (gross-up: o imposto está embutido no valor final)
    const imposto =
      (valorProjeto * orc.aliquota_imposto) / (1 + orc.aliquota_imposto);
    const valorLiquido = valorProjeto - imposto;

    // 3. Consolidar pagamento por funcionário:
    //    cada pessoa = soma(salario_snapshot × meses_alocados) em todas as alocações dela
    const pagamentosPorFuncionario: Record<
      number,
      {
        id: number;
        name: string;
        salario: number;
        meses: number;
        valor: number;
      }
    > = {};

    todasAlocacoes.forEach((f) => {
      const func = pickFunc(f);
      if (!func) return;
      const valor = f.salario_snapshot * f.meses_alocados;
      if (pagamentosPorFuncionario[func.id]) {
        pagamentosPorFuncionario[func.id].meses += f.meses_alocados;
        pagamentosPorFuncionario[func.id].valor += valor;
      } else {
        pagamentosPorFuncionario[func.id] = {
          id: func.id,
          name: func.name,
          salario: f.salario_snapshot,
          meses: f.meses_alocados,
          valor,
        };
      }
    });

    // 4. Separar sócios de não-sócios.
    //    Set de IDs dos sócios pra checagem rápida.
    const socs = societarios as unknown as SocietarioRaw[];
    const idsDeSocios = new Set(
      socs.map((s) => pickFunc(s)?.id).filter((x): x is number => x != null),
    );

    const pagamentosNaoSocios = Object.values(pagamentosPorFuncionario).filter(
      (p) => !idsDeSocios.has(p.id),
    );

    const custoNaoSocios = pagamentosNaoSocios.reduce(
      (acc, p) => acc + p.valor,
      0,
    );

    // 5. Custo total da equipe = todos os pagamentos (sócios + não-sócios)
    //    porque sócios também recebem salário pelo trabalho no projeto
    const custoTotalEquipe = Object.values(pagamentosPorFuncionario).reduce(
      (acc, p) => acc + p.valor,
      0,
    );

    const lucroBruto = valorLiquido - custoTotalEquipe;
    const valorReserva = lucroBruto * config.reserva_empresa;
    const lucroDistribuivel = lucroBruto - valorReserva;

    // 6. Distribuição entre sócios: lucro + pagamento como funcionário (se aplicável)
    const distribuicao = socs.map((s, index) => {
      const func = pickFunc(s);
      const percent = s.percent ?? 0;
      const lucroSocio = lucroDistribuivel * percent;
      const pagamentoComoFunc = func
        ? (pagamentosPorFuncionario[func.id]?.valor ?? 0)
        : 0;
      const mesesNoProjeto = func
        ? (pagamentosPorFuncionario[func.id]?.meses ?? 0)
        : 0;
      return {
        id: func?.id ?? -index,
        name: func?.name ?? "—",
        percent,
        lucro: lucroSocio,
        pagamentoFunc: pagamentoComoFunc,
        meses: mesesNoProjeto,
        total: lucroSocio + pagamentoComoFunc,
      };
    });

    return {
      valorProjeto,
      imposto,
      aliquotaImposto: orc.aliquota_imposto,
      valorLiquido,
      pagamentosNaoSocios,
      custoNaoSocios,
      custoTotalEquipe,
      lucroBruto,
      reservaEmpresa: config.reserva_empresa,
      valorReserva,
      lucroDistribuivel,
      distribuicao,
    };
  }, [orcamento, societarios, config]);

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

  // ─── estilos compartilhados ───
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

  // ─── linhas do resumo financeiro ───
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
      label: "Custo total da equipe (salário × meses)",
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
                fontVariantNumeric: "tabular-nums",
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
            style={{
              color: "var(--warning)",
              fontVariantNumeric: "tabular-nums",
            }}
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

      {/* pagamento da equipe (apenas NÃO-sócios) */}
      {calculo.pagamentosNaoSocios.length > 0 && (
        <div style={sectionStyle}>
          <div
            style={sectionHeaderStyle}
            className="flex justify-between items-center"
          >
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Pagamento da equipe
            </p>
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
              Não-sócios apenas. Sócios aparecem abaixo com lucro incluso.
            </span>
          </div>

          {calculo.pagamentosNaoSocios.map((f, i) => (
            <div
              key={f.id}
              className="flex justify-between items-center px-5 py-3"
              style={{
                borderBottom:
                  i < calculo.pagamentosNaoSocios.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
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
                    {formatBRL(f.salario)}/mês · {f.meses} meses no projeto
                  </p>
                </div>
              </div>
              <span
                className="text-sm font-medium"
                style={{
                  color: "var(--text-secondary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatBRL(f.valor)}
              </span>
            </div>
          ))}

          {/* footer com total dos não-sócios */}
          <div
            className="flex justify-between items-center px-5 py-3"
            style={{
              background: "var(--bg-card-alt)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <span
              className="text-xs uppercase tracking-wider font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              Total a pagar (não-sócios)
            </span>
            <span
              className="text-sm font-semibold"
              style={{
                color: "var(--primary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatBRL(calculo.custoNaoSocios)}
            </span>
          </div>
        </div>
      )}

      {/* distribuição dos sócios */}
      {calculo.distribuicao.length > 0 && (
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Distribuição dos sócios
            </p>
          </div>
          {calculo.distribuicao.map((d, i) => (
            <div
              key={d.id}
              style={{
                borderBottom:
                  i < calculo.distribuicao.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
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
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
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
                    style={{
                      color: "var(--primary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
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
                    style={{
                      color: "var(--text-secondary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatBRL(d.lucro)}
                  </p>
                </div>
                {d.pagamentoFunc > 0 && (
                  <div>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Pagamento pelo projeto ({d.meses} meses)
                    </p>
                    <p
                      className="text-sm"
                      style={{
                        color: "var(--text-secondary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatBRL(d.pagamentoFunc)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
