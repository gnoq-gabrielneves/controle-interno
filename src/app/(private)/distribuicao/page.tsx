"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useListGastos } from "@/hooks/use-gastos";
import {
  useAtualizarStatusPagamento,
  useListPagamentos,
  useUpsertPagamento,
} from "@/hooks/use-pagamentos";
import {
  useCreateReceita,
  useDeleteReceita,
  useListReceitas,
} from "@/hooks/use-receitas";
import { useListSocietarios } from "@/hooks/use-societarios";
import { PagamentoStatus } from "@/types/pagamentos-types";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const statusConfig: Record<
  PagamentoStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pendente: {
    label: "Pendente",
    color: "#b45309",
    bg: "rgba(180,83,9,0.10)",
    border: "rgba(180,83,9,0.30)",
  },
  pago: {
    label: "Pago",
    color: "#15803d",
    bg: "rgba(21,128,61,0.10)",
    border: "rgba(21,128,61,0.30)",
  },
  adiado: {
    label: "Adiado",
    color: "#b91c1c",
    bg: "rgba(185,28,28,0.10)",
    border: "rgba(185,28,28,0.30)",
  },
};

export default function DistribuicaoPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [openReceita, setOpenReceita] = useState(false);
  const [formReceita, setFormReceita] = useState({
    descricao: "",
    valor: "",
    mes: String(hoje.getMonth() + 1),
    ano: String(hoje.getFullYear()),
  });

  const { data: receitas } = useListReceitas();
  const { data: gastos } = useListGastos();
  const { data: pagamentos } = useListPagamentos(mes, ano);
  const { data: societarios } = useListSocietarios();
  const { mutate: createReceita, isPending: criandoReceita } =
    useCreateReceita();
  const { mutate: deleteReceita } = useDeleteReceita();
  const { mutate: upsertPagamento } = useUpsertPagamento();
  const { mutate: atualizarStatus } = useAtualizarStatusPagamento();

  const receitasMes = useMemo(
    () => receitas?.filter((r) => r.mes === mes && r.ano === ano) ?? [],
    [receitas, mes, ano],
  );

  const totalReceitas = receitasMes.reduce((acc, r) => acc + r.valor, 0);
  const totalGastos = useMemo(
    () =>
      gastos?.reduce(
        (acc, g) => acc + (g.recorrencia === "mensal" ? g.valor : g.valor / 12),
        0,
      ) ?? 0,
    [gastos],
  );

  const saldo = totalReceitas - totalGastos;
  const totalSocios = societarios?.length ?? 0;
  const valorPorSocio = totalSocios > 0 ? saldo / totalSocios : 0;

  function mesAnterior() {
    if (mes === 1) {
      setMes(12);
      setAno(ano - 1);
    } else setMes(mes - 1);
  }
  function proximoMes() {
    if (mes === 12) {
      setMes(1);
      setAno(ano + 1);
    } else setMes(mes + 1);
  }

  async function gerarPagamentos() {
    if (!societarios?.length) return;
    for (const s of societarios) {
      const func = (
        s.funcionario_data as
          | { id: number; name: string; cargo: string }[]
          | null
      )?.[0];
      if (!func) continue;
      const mesAnt = mes === 1 ? 12 : mes - 1;
      const anoAnt = mes === 1 ? ano - 1 : ano;
      const pagAdiado = pagamentos?.find(
        (p) =>
          p.societario === func.id &&
          p.mes === mesAnt &&
          p.ano === anoAnt &&
          p.status === "adiado",
      );
      upsertPagamento({
        societario: func.id,
        mes,
        ano,
        valor_base: valorPorSocio,
        valor_total: valorPorSocio + (pagAdiado ? pagAdiado.valor_total : 0),
        status: "pendente",
      });
    }
  }

  function handleAddReceita(e: React.FormEvent) {
    e.preventDefault();
    createReceita(
      {
        descricao: formReceita.descricao,
        valor: parseFloat(formReceita.valor),
        mes: parseInt(formReceita.mes),
        ano: parseInt(formReceita.ano),
      },
      {
        onSuccess: () => {
          setOpenReceita(false);
          setFormReceita({
            descricao: "",
            valor: "",
            mes: String(mes),
            ano: String(ano),
          });
        },
      },
    );
  }

  const dadosGrafico = useMemo(() => {
    const resultado = [];
    for (let i = 5; i >= 0; i--) {
      let m = mes - i;
      let a = ano;
      if (m <= 0) {
        m += 12;
        a -= 1;
      }
      const recMes =
        receitas
          ?.filter((r) => r.mes === m && r.ano === a)
          .reduce((acc, r) => acc + r.valor, 0) ?? 0;
      resultado.push({
        name: MESES[m - 1].slice(0, 3),
        receitas: recMes,
        gastos: totalGastos,
        saldo: recMes - totalGastos,
      });
    }
    return resultado;
  }, [receitas, totalGastos, mes, ano]);

  const tooltipStyle = {
    contentStyle: {
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      fontSize: 12,
    },
    labelStyle: { color: "var(--text-primary)" },
    itemStyle: { color: "var(--primary)" },
  };

  const sectionStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 20,
  };
  const inputStyle = {
    background: "var(--bg-base)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };
  const labelClass = "text-xs uppercase tracking-wider font-medium";

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Distribuição
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Controle de pagamentos dos sócios
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={mesAnterior}
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
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span
            className="text-sm font-medium min-w-32 text-center"
            style={{ color: "var(--text-primary)" }}
          >
            {MESES[mes - 1]} {ano}
          </span>
          <button
            onClick={proximoMes}
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
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Total receitas",
            value: formatBRL(totalReceitas),
            color: "var(--success)",
          },
          {
            label: "Total gastos",
            value: formatBRL(totalGastos),
            color: "var(--error)",
          },
          {
            label: "Saldo",
            value: formatBRL(saldo),
            color: saldo >= 0 ? "var(--primary)" : "var(--error)",
          },
          {
            label: "Por sócio",
            value: formatBRL(valorPorSocio),
            color: "var(--secondary)",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-5 flex flex-col gap-1"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {card.label}
            </p>
            <p className="text-2xl font-semibold" style={{ color: card.color }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* gráfico + receitas */}
      <div className="grid grid-cols-2 gap-4">
        <div style={sectionStyle} className="flex flex-col gap-4">
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Últimos 6 meses
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dadosGrafico} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [formatBRL(Number(value)), ""]}
              />
              <Bar
                dataKey="receitas"
                name="Receitas"
                fill="#15803d"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="gastos"
                name="Gastos"
                fill="#b91c1c"
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="saldo" name="Saldo" radius={[4, 4, 0, 0]}>
                {dadosGrafico.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.saldo >= 0 ? "#0F4C81" : "#b45309"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4">
            {[
              { color: "#15803d", label: "Receitas" },
              { color: "#b91c1c", label: "Gastos" },
              { color: "#0F4C81", label: "Saldo" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: l.color }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {l.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div style={sectionStyle} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Receitas de {MESES[mes - 1]}
            </p>
            <button
              onClick={() => setOpenReceita(true)}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: "var(--primary)" }}
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {receitasMes.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                Nenhuma receita neste mês.
              </p>
            )}
            {receitasMes.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  {r.descricao}
                </p>
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--success)" }}
                  >
                    {formatBRL(r.valor)}
                  </span>
                  <button
                    onClick={() => deleteReceita(r.id)}
                    className="p-1 transition-colors"
                    style={{ color: "var(--text-faint)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--error)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-faint)")
                    }
                  >
                    <Trash2Icon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* pagamentos */}
      <div style={sectionStyle} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Pagamentos — {MESES[mes - 1]} {ano}
          </p>
          <button
            onClick={gerarPagamentos}
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: "var(--primary)" }}
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Gerar pagamentos do mês
          </button>
        </div>

        {!pagamentos?.length ? (
          <p className="text-sm" style={{ color: "var(--text-faint)" }}>
            Clique em - Gerar pagamentos do mês - para calcular.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pagamentos.map((p) => {
              const func = p.funcionario as
                | { id: number; name: string; cargo: string }
                | undefined;
              const st = statusConfig[p.status];
              const temAcumulado = p.valor_total > p.valor_base;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 rounded-lg"
                  style={{
                    border: "1px solid var(--border)",
                    background: "var(--bg-base)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
                      style={{
                        background: "var(--primary-bg)",
                        border: "1px solid var(--primary-border)",
                        color: "var(--primary)",
                      }}
                    >
                      {(func?.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {func?.name ?? "—"}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {func?.cargo ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Base
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {formatBRL(p.valor_base)}
                      </p>
                    </div>
                    {temAcumulado && (
                      <div className="text-right">
                        <p
                          className="text-xs"
                          style={{ color: "var(--warning)" }}
                        >
                          Acumulado
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--warning)" }}
                        >
                          {formatBRL(p.valor_total - p.valor_base)}
                        </p>
                      </div>
                    )}
                    <div className="text-right">
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Total
                      </p>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--primary)" }}
                      >
                        {formatBRL(p.valor_total)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        color: st.color,
                        background: st.bg,
                        border: `1px solid ${st.border}`,
                      }}
                    >
                      {st.label}
                    </span>
                    {p.status !== "pago" && (
                      <button
                        onClick={() =>
                          atualizarStatus({ id: p.id, status: "pago" })
                        }
                        className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          color: "var(--success)",
                          background: "var(--success-bg)",
                          border: "1px solid var(--success-border)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.opacity = "0.8")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = "1")
                        }
                      >
                        Marcar pago
                      </button>
                    )}
                    {p.status === "pendente" && (
                      <button
                        onClick={() =>
                          atualizarStatus({ id: p.id, status: "adiado" })
                        }
                        className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          color: "var(--error)",
                          background: "var(--error-bg)",
                          border: "1px solid var(--error-border)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.opacity = "0.8")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = "1")
                        }
                      >
                        Adiar
                      </button>
                    )}
                    {p.status === "pago" && (
                      <button
                        onClick={() =>
                          atualizarStatus({ id: p.id, status: "pendente" })
                        }
                        className="text-xs px-3 py-1.5 rounded-lg transition-all"
                        style={{
                          border: "1px solid var(--border)",
                          color: "var(--text-muted)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "var(--bg-hover)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        Desfazer
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* dialog receita */}
      <Dialog open={openReceita} onOpenChange={setOpenReceita}>
        <DialogContent
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "var(--text-primary)" }}>
              Nova receita
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleAddReceita}
            className="flex flex-col gap-4 mt-2"
          >
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Descrição
              </Label>
              <Input
                placeholder="Ex: Projeto website"
                value={formReceita.descricao}
                onChange={(e) =>
                  setFormReceita((p) => ({ ...p, descricao: e.target.value }))
                }
                required
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Valor
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formReceita.valor}
                onChange={(e) =>
                  setFormReceita((p) => ({ ...p, valor: e.target.value }))
                }
                required
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label
                  className={labelClass}
                  style={{ color: "var(--text-muted)" }}
                >
                  Mês
                </Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={formReceita.mes}
                  onChange={(e) =>
                    setFormReceita((p) => ({ ...p, mes: e.target.value }))
                  }
                  required
                  style={inputStyle}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  className={labelClass}
                  style={{ color: "var(--text-muted)" }}
                >
                  Ano
                </Label>
                <Input
                  type="number"
                  value={formReceita.ano}
                  onChange={(e) =>
                    setFormReceita((p) => ({ ...p, ano: e.target.value }))
                  }
                  required
                  style={inputStyle}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={criandoReceita}
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
              {criandoReceita ? "Adicionando..." : "Adicionar receita"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
