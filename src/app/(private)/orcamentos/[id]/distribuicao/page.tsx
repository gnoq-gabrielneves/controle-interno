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
    const imposto =
      (valorProjeto * orc.aliquota_imposto) / (1 + orc.aliquota_imposto);
    const valorLiquido = valorProjeto - imposto;

    // consolida pagamento por pessoa (soma alocações se a pessoa aparece em mais de um item)
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

    const custoTotalEquipe = Object.values(pagamentosPorFuncionario).reduce(
      (acc, p) => acc + p.valor,
      0,
    );

    const lucroBruto = valorLiquido - custoTotalEquipe;
    const valorReserva = lucroBruto * config.reserva_empresa;
    const lucroDistribuivel = lucroBruto - valorReserva;

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

    // ─── CRONOGRAMA MENSAL ───
    // duração do projeto = maior número de meses entre todas as pessoas
    const todosPagamentos = Object.values(pagamentosPorFuncionario);
    const duracaoProjeto = todosPagamentos.reduce(
      (max, p) => (p.meses > max ? p.meses : max),
      0,
    );

    // pra cada mês, calcula quem está ativo e quanto paga.
    // Lógica: pessoa começa no mês 1 e fica até completar seus `meses` alocados.
    //         se ela tem 3 meses, é ativa nos meses 1, 2 e 3.
    // Reserva mensal: rateamos o valor total da reserva ao longo da duração do projeto.
    //                 isso te dá "quanto guardar por mês" — útil pra planejar caixa.
    const reservaPorMes =
      duracaoProjeto > 0 ? valorReserva / duracaoProjeto : 0;

    const meses = Array.from({ length: duracaoProjeto }, (_, i) => {
      const numMes = i + 1; // 1-indexed pra UI
      const ativosNoMes = todosPagamentos.filter((p) => p.meses >= numMes);
      const salariosNoMes = ativosNoMes.reduce((acc, p) => acc + p.salario, 0);
      return {
        numMes,
        ativosIds: new Set(ativosNoMes.map((p) => p.id)),
        salariosNoMes,
        reservaNoMes: reservaPorMes,
        totalNoMes: salariosNoMes + reservaPorMes,
      };
    });

    // total geral do cronograma (deve bater com custoTotalEquipe + valorReserva)
    const totalCronograma = meses.reduce((acc, m) => acc + m.totalNoMes, 0);

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
      // novo:
      duracaoProjeto,
      meses,
      totalCronograma,
      todosPagamentos,
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

  // colunas do cronograma: 1 (pessoa) + N (meses) + 1 (total da linha)
  // grid template column: nome fixo + repeat de colunas dos meses + total fixo
  const cronogramaGridCols = `200px repeat(${calculo.duracaoProjeto}, minmax(110px, 1fr)) 130px`;

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

      {/* ─── CRONOGRAMA MENSAL ─── */}
      {calculo.duracaoProjeto > 0 && (
        <div style={sectionStyle}>
          <div
            style={sectionHeaderStyle}
            className="flex items-center justify-between"
          >
            <div>
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Cronograma mensal de pagamento
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-faint)" }}
              >
                Projeto com duração de {calculo.duracaoProjeto}{" "}
                {calculo.duracaoProjeto === 1 ? "mês" : "meses"}. Reserva
                rateada igualmente.
              </p>
            </div>
            <div className="text-right">
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Total a desembolsar
              </p>
              <p
                className="text-base font-semibold"
                style={{
                  color: "var(--primary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatBRL(calculo.totalCronograma)}
              </p>
            </div>
          </div>

          {/* tabela horizontal com scroll caso muitos meses */}
          <div className="overflow-x-auto">
            {/* HEADER: cabeçalho das colunas */}
            <div
              className="grid items-center gap-2 px-5 py-3"
              style={{
                gridTemplateColumns: cronogramaGridCols,
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-card-alt)",
                minWidth: "fit-content",
              }}
            >
              <span
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Pessoa
              </span>
              {calculo.meses.map((m) => (
                <span
                  key={m.numMes}
                  className="text-xs uppercase tracking-wider text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  Mês {m.numMes}
                </span>
              ))}
              <span
                className="text-xs uppercase tracking-wider text-right"
                style={{ color: "var(--text-muted)" }}
              >
                Total
              </span>
            </div>

            {/* uma linha por pessoa */}
            {calculo.todosPagamentos.map((pessoa, idx) => (
              <div
                key={pessoa.id}
                className="grid items-center gap-2 px-5 py-3 text-sm"
                style={{
                  gridTemplateColumns: cronogramaGridCols,
                  borderBottom:
                    idx < calculo.todosPagamentos.length - 1
                      ? "1px solid var(--border)"
                      : "1px solid var(--border)",
                  minWidth: "fit-content",
                }}
              >
                {/* coluna fixa: nome + salário */}
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                    style={{
                      background: "var(--primary-bg)",
                      border: "1px solid var(--primary-border)",
                      color: "var(--primary)",
                    }}
                  >
                    {pessoa.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p
                      className="truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {pessoa.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{
                        color: "var(--text-muted)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatBRL(pessoa.salario)}/mês
                    </p>
                  </div>
                </div>

                {/* uma célula por mês: paga ou vazio */}
                {calculo.meses.map((m) => {
                  const ativo = m.ativosIds.has(pessoa.id);
                  return (
                    <span
                      key={m.numMes}
                      className="text-center"
                      style={{
                        color: ativo
                          ? "var(--text-secondary)"
                          : "var(--text-faint)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {ativo ? formatBRL(pessoa.salario) : "—"}
                    </span>
                  );
                })}

                {/* total da linha */}
                <span
                  className="text-right font-medium"
                  style={{
                    color: "var(--primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatBRL(pessoa.valor)}
                </span>
              </div>
            ))}

            {/* linha da reserva */}
            <div
              className="grid items-center gap-2 px-5 py-3 text-sm"
              style={{
                gridTemplateColumns: cronogramaGridCols,
                borderBottom: "1px solid var(--border)",
                background: "var(--warning-bg, rgba(180,83,9,0.05))",
                minWidth: "fit-content",
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
                  style={{
                    background: "var(--warning-bg-strong, rgba(180,83,9,0.15))",
                    border:
                      "1px solid var(--warning-border, rgba(180,83,9,0.30))",
                    color: "var(--warning, #b45309)",
                  }}
                >
                  R
                </div>
                <div>
                  <p style={{ color: "var(--text-primary)" }}>Reserva</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    rateada
                  </p>
                </div>
              </div>
              {calculo.meses.map((m) => (
                <span
                  key={m.numMes}
                  className="text-center"
                  style={{
                    color: "var(--warning, #b45309)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatBRL(m.reservaNoMes)}
                </span>
              ))}
              <span
                className="text-right font-medium"
                style={{
                  color: "var(--warning, #b45309)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatBRL(calculo.valorReserva)}
              </span>
            </div>

            {/* linha de TOTAL por mês */}
            <div
              className="grid items-center gap-2 px-5 py-3 text-sm"
              style={{
                gridTemplateColumns: cronogramaGridCols,
                background: "var(--bg-card-alt)",
                borderTop: "2px solid var(--border)",
                minWidth: "fit-content",
              }}
            >
              <span
                className="text-xs uppercase tracking-wider font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Total por mês
              </span>
              {calculo.meses.map((m) => (
                <span
                  key={m.numMes}
                  className="text-center font-semibold"
                  style={{
                    color: "var(--primary)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatBRL(m.totalNoMes)}
                </span>
              ))}
              <span
                className="text-right font-semibold"
                style={{
                  color: "var(--primary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatBRL(calculo.totalCronograma)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* card de reserva (resumo) */}
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
            {calculo.duracaoProjeto > 0 && (
              <>
                {" · "}
                guardar{" "}
                {formatBRL(calculo.valorReserva / calculo.duracaoProjeto)}
                /mês
              </>
            )}
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
