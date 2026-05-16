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

const COLORS = ["#0F4C81", "#00719C", "#1a6db5", "#0090c4", "#5a9fd4"];

const statusConfig = {
  rascunho: { label: "Rascunho", color: "#6b7280" },
  enviado: { label: "Enviado", color: "#00719C" },
  aprovado: { label: "Aprovado", color: "#15803d" },
  recusado: { label: "Recusado", color: "#b91c1c" },
};

const HOJE = new Date();
HOJE.setHours(0, 0, 0, 0);

export default function HomePage() {
  const router = useRouter();
  const { data: funcionarios } = useListFuncionarios();
  const { data: gastos } = useListGastos();
  const { data: totalSocios = 0 } = useCountSocietarios();
  const { data: orcamentos } = useListOrcamentos();

  const totalMensal = useMemo(
    () =>
      gastos?.reduce(
        (acc, g) => acc + (g.recorrencia === "mensal" ? g.valor : g.valor / 12),
        0,
      ) ?? 0,
    [gastos],
  );

  const custoPorSocio = totalSocios > 0 ? totalMensal / totalSocios : 0;

  const orcamentosAprovados =
    orcamentos?.filter((o) => o.status === "aprovado").length ?? 0;
  const orcamentosAguardando =
    orcamentos?.filter((o) => o.status === "enviado").length ?? 0;
  const orcamentosVencendo =
    orcamentos?.filter((o) => {
      const validade = new Date(o.created_at);
      validade.setDate(validade.getDate() + o.validade_dias);
      const dias = Math.ceil(
        (validade.getTime() - HOJE.getTime()) / (1000 * 60 * 60 * 24),
      );
      return dias <= 7 && dias >= 0 && o.status === "enviado";
    }).length ?? 0;

  const statusData = Object.entries(statusConfig).map(([key, config]) => ({
    name: config.label,
    value: orcamentos?.filter((o) => o.status === key).length ?? 0,
    color: config.color,
  }));

  const gastosCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    gastos?.forEach((g) => {
      const cat = g.categoria ?? "Sem categoria";
      const mensal = g.recorrencia === "mensal" ? g.valor : g.valor / 12;
      map[cat] = (map[cat] ?? 0) + mensal;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [gastos]);

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

  const ultimosOrcamentos = orcamentos?.slice(0, 5) ?? [];

  const tooltipStyle = {
    contentStyle: {
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      fontSize: 12,
      color: "var(--text-primary)",
    },
    labelStyle: { color: "var(--text-primary)" },
    itemStyle: { color: "var(--primary)" },
  };

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* saudação */}
      <div>
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Dashboard
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
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
            color: "var(--primary)",
          },
          {
            label: "Gasto mensal",
            value: formatBRL(totalMensal),
            suffix: "fixo",
            color: "var(--primary)",
          },
          {
            label: "Custo por sócio",
            value: formatBRL(custoPorSocio),
            suffix: "por mês",
            color: "var(--secondary)",
          },
          {
            label: "Orçamentos aprovados",
            value: orcamentosAprovados,
            suffix: "no total",
            color: "var(--success)",
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
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              {card.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* alertas */}
      {(orcamentosAguardando > 0 || orcamentosVencendo > 0) && (
        <div className="flex gap-3">
          {orcamentosAguardando > 0 && (
            <div
              className="flex-1 rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                border: "1px solid var(--secondary-border)",
                background: "var(--secondary-bg)",
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--secondary)" }}
              />
              <p className="text-sm" style={{ color: "var(--secondary)" }}>
                {orcamentosAguardando} orçamento
                {orcamentosAguardando > 1 ? "s" : ""} aguardando resposta
              </p>
            </div>
          )}
          {orcamentosVencendo > 0 && (
            <div
              className="flex-1 rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                border: "1px solid var(--warning-border)",
                background: "var(--warning-bg)",
              }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: "var(--warning)" }}
              />
              <p className="text-sm" style={{ color: "var(--warning)" }}>
                {orcamentosVencendo} orçamento
                {orcamentosVencendo > 1 ? "s" : ""} vencendo em até 7 dias
              </p>
            </div>
          )}
        </div>
      )}

      {/* gráficos linha 1 */}
      <div className="grid grid-cols-3 gap-4">
        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
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
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: s.color }}
                />
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.name} ({s.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
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
                {...tooltipStyle}
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
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {g.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Orçamentos criados (últimos 6 meses)
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={orcamentosPorMes}>
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
                allowDecimals={false}
              />
              <Tooltip {...tooltipStyle} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: "var(--primary)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* gráfico de gastos + tabela de orcamentos */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Valor mensal por categoria
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gastosCategoria} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                formatter={(value) => [formatBRL(Number(value)), ""]}
                {...tooltipStyle}
              />
              <Bar
                dataKey="value"
                fill="var(--primary)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Últimos orçamentos
          </p>
          <div className="flex flex-col gap-2">
            {ultimosOrcamentos.length === 0 && (
              <p className="text-sm" style={{ color: "var(--text-faint)" }}>
                Nenhum orçamento ainda.
              </p>
            )}
            {ultimosOrcamentos.map((o) => {
              const st = statusConfig[o.status as keyof typeof statusConfig];
              const cliente = o.cliente as { nome: string } | null;
              return (
                <div
                  key={o.id}
                  onClick={() => router.push(`/orcamentos/${o.id}`)}
                  className="flex items-center justify-between py-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {o.titulo}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
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
