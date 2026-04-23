"use client";
import { useListFuncionarios } from "@/hooks/use-funcionarios";
import { useCountSocietarios, useListGastos } from "@/hooks/use-gastos";
import { useListOrcamentos } from "@/hooks/use-orcamentos";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

const COLORS = ["#0284c7", "#7dd3fc", "#38bdf8", "#0ea5e9", "#bae6fd"];

const statusConfig = {
  rascunho: { label: "Rascunho", color: "#6b7280" },
  enviado: { label: "Enviado", color: "#0284c7" },
  aprovado: { label: "Aprovado", color: "#16a34a" },
  recusado: { label: "Recusado", color: "#dc2626" },
};

const HOJE = new Date();
HOJE.setHours(0, 0, 0, 0);

export default function HomePage() {
  const router = useRouter();
  const { data: funcionarios } = useListFuncionarios();
  const { data: gastos } = useListGastos();
  const { data: totalSocios = 0 } = useCountSocietarios();
  const { data: orcamentos } = useListOrcamentos();

  // total mensal de gastos
  const totalMensal = useMemo(() => {
    return (
      gastos?.reduce((acc, g) => {
        return acc + (g.recorrencia === "mensal" ? g.valor : g.valor / 12);
      }, 0) ?? 0
    );
  }, [gastos]);

  // custo por socio
  const custoPorSocio = totalSocios > 0 ? totalMensal / totalSocios : 0;

  // orcamentos aprovados
  const orcamentosAprovados =
    orcamentos?.filter((o) => o.status === "aprovado").length ?? 0;
  const orcamentosAguardando =
    orcamentos?.filter((o) => o.status === "enviado").length ?? 0;
  const orcamentosVencendo =
    orcamentos?.filter((o) => {
      const validade = new Date(o.created_at);
      validade.setDate(validade.getDate() + o.validade_dias);
      const diasRestantes = Math.ceil(
        (validade.getTime() - HOJE.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diasRestantes <= 7 && diasRestantes >= 0 && o.status === "enviado";
    }).length ?? 0;

  // dados pro gráfico de status
  const statusData = Object.entries(statusConfig).map(([key, config]) => ({
    name: config.label,
    value: orcamentos?.filter((o) => o.status === key).length ?? 0,
    color: config.color,
  }));

  // dados pro gráfico de gastos por categoria
  const gastosCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    gastos?.forEach((g) => {
      const cat = g.categoria ?? "Sem categoria";
      const mensal = g.recorrencia === "mensal" ? g.valor : g.valor / 12;
      map[cat] = (map[cat] ?? 0) + mensal;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [gastos]);

  // dados pro gráfico de orcamentos por mes
  const orcamentosPorMes = useMemo(() => {
    const map: Record<string, number> = {};
    orcamentos?.forEach((o) => {
      const mes = new Date(o.created_at).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      map[mes] = (map[mes] ?? 0) + 1;
    });
    return Object.entries(map)
      .slice(-6)
      .map(([name, value]) => ({ name, value }));
  }, [orcamentos]);

  // ultimos orcamentos
  const ultimosOrcamentos = orcamentos?.slice(0, 5) ?? [];

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* saudação */}
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visão geral da GNOQ
        </p>
      </div>

      {/* cards de resumo */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Funcionários",
            value: funcionarios?.length ?? 0,
            suffix: "ativos",
            color: "text-sky-300",
          },
          {
            label: "Gasto mensal",
            value: formatBRL(totalMensal),
            suffix: "fixo",
            color: "text-sky-300",
          },
          {
            label: "Custo por sócio",
            value: formatBRL(custoPorSocio),
            suffix: "por mês",
            color: "text-sky-300",
          },
          {
            label: "Orçamentos aprovados",
            value: orcamentosAprovados,
            suffix: "no total",
            color: "text-green-400",
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
            <p className="text-xs text-white/20">{card.suffix}</p>
          </div>
        ))}
      </div>

      {/* alertas */}
      {(orcamentosAguardando > 0 || orcamentosVencendo > 0) && (
        <div className="flex gap-3">
          {orcamentosAguardando > 0 && (
            <div className="flex-1 rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <p className="text-sm text-sky-300">
                {orcamentosAguardando} orçamento
                {orcamentosAguardando > 1 ? "s" : ""} aguardando resposta
              </p>
            </div>
          )}
          {orcamentosVencendo > 0 && (
            <div className="flex-1 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <p className="text-sm text-amber-300">
                {orcamentosVencendo} orçamento
                {orcamentosVencendo > 1 ? "s" : ""} vencendo em até 7 dias
              </p>
            </div>
          )}
        </div>
      )}

      {/* gráficos linha 1 */}
      <div className="grid grid-cols-3 gap-4">
        {/* orcamentos por status */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Orçamentos por status
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0d0d1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#7dd3fc" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: s.color }}
                />
                <span className="text-xs text-white/40">
                  {s.name} ({s.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* gastos por categoria */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Gastos mensais por categoria
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={gastosCategoria}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {gastosCategoria.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatBRL(Number(value)), ""]}
                contentStyle={{
                  background: "#0d0d1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#7dd3fc" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2">
            {gastosCategoria.map((g, i) => (
              <div key={g.name} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-white/40">{g.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* orcamentos por mes */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Orçamentos criados (últimos 6 meses)
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={orcamentosPorMes}>
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
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "#0d0d1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#7dd3fc" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0284c7"
                strokeWidth={2}
                dot={{ fill: "#0284c7", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* gráfico de gastos + tabela de orcamentos */}
      <div className="grid grid-cols-2 gap-4">
        {/* barras de gastos */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Valor mensal por categoria
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gastosCategoria} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                formatter={(value) => [formatBRL(Number(value)), ""]}
                contentStyle={{
                  background: "#0d0d1a",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#fff" }}
                itemStyle={{ color: "#7dd3fc" }}
              />
              <Bar dataKey="value" fill="#0284c7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ultimos orcamentos */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Últimos orçamentos
          </p>
          <div className="flex flex-col gap-2">
            {ultimosOrcamentos.length === 0 && (
              <p className="text-sm text-white/20">Nenhum orçamento ainda.</p>
            )}
            {ultimosOrcamentos.map((o) => {
              const st = statusConfig[o.status as keyof typeof statusConfig];
              const cliente = o.cliente as { nome: string } | null;
              return (
                <div
                  key={o.id}
                  onClick={() => router.push(`/orcamentos/${o.id}`)}
                  className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <div>
                    <p className="text-sm text-white/80">{o.titulo}</p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {cliente?.nome ?? "—"}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full border"
                    style={{
                      color: st?.color,
                      borderColor: st?.color + "50",
                      background: st?.color + "15",
                    }}
                  >
                    {st?.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
