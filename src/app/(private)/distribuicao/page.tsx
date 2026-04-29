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
  { label: string; class: string; bg: string }
> = {
  pendente: {
    label: "Pendente",
    class: "text-amber-300 border-amber-500/30",
    bg: "bg-amber-500/10",
  },
  pago: {
    label: "Pago",
    class: "text-green-300 border-green-500/30",
    bg: "bg-green-500/10",
  },
  adiado: {
    label: "Adiado",
    class: "text-red-300 border-red-500/30",
    bg: "bg-red-500/10",
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

      const valorAcumulado = pagAdiado ? pagAdiado.valor_total : 0;

      upsertPagamento({
        societario: func.id,
        mes,
        ano,
        valor_base: valorPorSocio,
        valor_total: valorPorSocio + valorAcumulado,
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

  const inputClass =
    "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-sky-500/50";
  const labelClass = "text-white/60 text-xs uppercase tracking-wider";

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Distribuição</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Controle de pagamentos dos sócios
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={mesAnterior}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-white/50 hover:text-white/80 transition-all"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-white/80 min-w-32 text-center">
            {MESES[mes - 1]} {ano}
          </span>
          <button
            onClick={proximoMes}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-white/50 hover:text-white/80 transition-all"
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
            color: "text-green-400",
          },
          {
            label: "Total gastos",
            value: formatBRL(totalGastos),
            color: "text-red-400",
          },
          {
            label: "Saldo",
            value: formatBRL(saldo),
            color: saldo >= 0 ? "text-sky-300" : "text-red-400",
          },
          {
            label: "Por sócio",
            value: formatBRL(valorPorSocio),
            color: "text-sky-300",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-1"
          >
            <p className="text-xs text-white/30 uppercase tracking-wider">
              {card.label}
            </p>
            <p className={`text-2xl font-semibold ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* gráfico + receitas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Últimos 6 meses
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dadosGrafico} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: "#0d0d1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value) => [formatBRL(Number(value)), ""]}
              />
              <Bar
                dataKey="receitas"
                name="Receitas"
                fill="#16a34a"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="gastos"
                name="Gastos"
                fill="#dc2626"
                radius={[4, 4, 0, 0]}
              />
              <Bar dataKey="saldo" name="Saldo" radius={[4, 4, 0, 0]}>
                {dadosGrafico.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.saldo >= 0 ? "#0284c7" : "#f59e0b"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4">
            {[
              { color: "#16a34a", label: "Receitas" },
              { color: "#dc2626", label: "Gastos" },
              { color: "#0284c7", label: "Saldo" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: l.color }}
                />
                <span className="text-xs text-white/40">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30 uppercase tracking-wider">
              Receitas de {MESES[mes - 1]}
            </p>
            <button
              onClick={() => setOpenReceita(true)}
              className="flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-200 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {receitasMes.length === 0 && (
              <p className="text-sm text-white/20">
                Nenhuma receita neste mês.
              </p>
            )}
            {receitasMes.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <p className="text-sm text-white/80">{r.descricao}</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-green-400">
                    {formatBRL(r.valor)}
                  </span>
                  <button
                    onClick={() => deleteReceita(r.id)}
                    className="p-1 text-white/20 hover:text-red-400 transition-colors"
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
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Pagamentos — {MESES[mes - 1]} {ano}
          </p>
          <button
            onClick={gerarPagamentos}
            className="flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-200 transition-colors"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            Gerar pagamentos do mês
          </button>
        </div>

        {!pagamentos?.length ? (
          <p className="text-sm text-white/20">
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
                  className="flex items-center justify-between p-4 rounded-lg border border-white/5 bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 text-xs font-medium">
                      {(func?.name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">
                        {func?.name ?? "—"}
                      </p>
                      <p className="text-xs text-white/30">
                        {func?.cargo ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-white/30">Base</p>
                      <p className="text-sm text-white/60">
                        {formatBRL(p.valor_base)}
                      </p>
                    </div>
                    {temAcumulado && (
                      <div className="text-right">
                        <p className="text-xs text-amber-300/60">Acumulado</p>
                        <p className="text-sm text-amber-300">
                          {formatBRL(p.valor_total - p.valor_base)}
                        </p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-white/30">Total</p>
                      <p className="text-sm font-semibold text-sky-300">
                        {formatBRL(p.valor_total)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full border ${st.class} ${st.bg}`}
                    >
                      {st.label}
                    </span>
                    {p.status !== "pago" && (
                      <button
                        onClick={() =>
                          atualizarStatus({ id: p.id, status: "pago" })
                        }
                        className="text-xs px-3 py-1.5 rounded-lg border border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20 transition-all"
                      >
                        Marcar pago
                      </button>
                    )}
                    {p.status === "pendente" && (
                      <button
                        onClick={() =>
                          atualizarStatus({ id: p.id, status: "adiado" })
                        }
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all"
                      >
                        Adiar
                      </button>
                    )}
                    {p.status === "pago" && (
                      <button
                        onClick={() =>
                          atualizarStatus({ id: p.id, status: "pendente" })
                        }
                        className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/30 hover:bg-white/5 transition-all"
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
        <DialogContent className="bg-[#0d0d1a] border border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Nova receita</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleAddReceita}
            className="flex flex-col gap-4 mt-2"
          >
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Descrição</Label>
              <Input
                placeholder="Ex: Projeto website"
                value={formReceita.descricao}
                onChange={(e) =>
                  setFormReceita((p) => ({ ...p, descricao: e.target.value }))
                }
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Valor</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formReceita.valor}
                onChange={(e) =>
                  setFormReceita((p) => ({ ...p, valor: e.target.value }))
                }
                required
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className={labelClass}>Mês</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={formReceita.mes}
                  onChange={(e) =>
                    setFormReceita((p) => ({ ...p, mes: e.target.value }))
                  }
                  required
                  className={inputClass}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className={labelClass}>Ano</Label>
                <Input
                  type="number"
                  value={formReceita.ano}
                  onChange={(e) =>
                    setFormReceita((p) => ({ ...p, ano: e.target.value }))
                  }
                  required
                  className={inputClass}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={criandoReceita}
              className="w-full py-2 rounded-lg border border-sky-500/30 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-sm transition-all disabled:opacity-50"
            >
              {criandoReceita ? "Adicionando..." : "Adicionar receita"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
