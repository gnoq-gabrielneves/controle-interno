"use client";

import { formatBRL } from "@/helpers/calculo-orcamento";
import { useListGastos } from "@/hooks/use-gastos";
import { useListOrcamentos } from "@/hooks/use-orcamentos";
import { useListRodadas } from "@/hooks/use-rodadas";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#0F4C81",
  "#00719C",
  "#1a6db5",
  "#0090c4",
  "#5a9fd4",
  "#7c3aed",
];

const statusConfig = {
  rascunho: { label: "Rascunho", color: "#6b7280" },
  enviado: { label: "Enviado", color: "#00719C" },
  aprovado: { label: "Aprovado", color: "#15803d" },
  recusado: { label: "Recusado", color: "#b91c1c" },
};

const MESES_CURTOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const HOJE = new Date();
HOJE.setHours(0, 0, 0, 0);

const MES_ATUAL = HOJE.getMonth() + 1;
const ANO_ATUAL = HOJE.getFullYear();

export default function HomePage() {
  const router = useRouter();
  const { data: gastos } = useListGastos();
  const { data: orcamentos } = useListOrcamentos();
  const { data: rodadas } = useListRodadas();

  // ─── gastos fixos mensais ───
  const gastosMensais = useMemo(
    () =>
      gastos?.reduce(
        (acc, g) => acc + (g.recorrencia === "mensal" ? g.valor : g.valor / 12),
        0,
      ) ?? 0,
    [gastos],
  );

  // ─── rodadas do mês atual ───
  const { rodadasMes, distribuicoesMes } = useMemo(() => {
    const rm = (rodadas ?? []).filter((r) => {
      const d = new Date(r.data_recebimento);
      return d.getMonth() + 1 === MES_ATUAL && d.getFullYear() === ANO_ATUAL;
    });
    const dm = rm.flatMap((r) => r.rodada_distribuicoes ?? []);
    return { rodadasMes: rm, distribuicoesMes: dm };
  }, [rodadas]);

  const recebidoMes = rodadasMes.reduce((acc, r) => acc + r.valor_recebido, 0);

  const totalPagoMes = distribuicoesMes
    .filter((d) => d.status === "pago")
    .reduce((acc, d) => acc + d.valor, 0);
  const totalPendenteMes = distribuicoesMes
    .filter((d) => d.status === "pendente")
    .reduce((acc, d) => acc + d.valor, 0);

  // ─── saldo do mês: entrou - gastos fixos - pagamentos pagos ───
  // (gastos fixos saem sempre, então conta sempre; distribuições só contam quando pagas)
  const saldoMes = recebidoMes - gastosMensais - totalPagoMes;

  // ─── reserva acumulada (todas as distribuições do tipo reserva, status pago) ───
  const reservaAcumulada = useMemo(() => {
    return (rodadas ?? [])
      .flatMap((r) => r.rodada_distribuicoes ?? [])
      .filter((d) => d.tipo === "reserva" && d.status === "pago")
      .reduce((acc, d) => acc + d.valor, 0);
  }, [rodadas]);

  // ─── orçamentos: pipeline e métricas ───
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

  // ─── pagamentos atrasados (pendentes em rodadas de mais de 30 dias atrás) ───
  const pagamentosAtrasados = useMemo(() => {
    const limite = new Date(HOJE);
    limite.setDate(limite.getDate() - 30);
    return (rodadas ?? [])
      .filter((r) => new Date(r.data_recebimento) < limite)
      .flatMap((r) => r.rodada_distribuicoes ?? [])
      .filter((d) => d.status === "pendente").length;
  }, [rodadas]);

  // ─── tempo médio até receber (orçamento aprovado → primeira rodada) ───
  const tempoMedioReceber = useMemo(() => {
    if (!orcamentos || !rodadas) return null;
    const aprovados = orcamentos.filter((o) => o.status === "aprovado");
    const dias: number[] = [];
    aprovados.forEach((o) => {
      const primeiraRodada = (rodadas ?? [])
        .filter((r) => r.orcamento === o.id)
        .sort(
          (a, b) =>
            new Date(a.data_recebimento).getTime() -
            new Date(b.data_recebimento).getTime(),
        )[0];
      if (primeiraRodada) {
        const diff =
          (new Date(primeiraRodada.data_recebimento).getTime() -
            new Date(o.created_at).getTime()) /
          (1000 * 60 * 60 * 24);
        if (diff >= 0) dias.push(diff);
      }
    });
    if (dias.length === 0) return null;
    return Math.round(dias.reduce((a, b) => a + b, 0) / dias.length);
  }, [orcamentos, rodadas]);

  // ─── pipeline: total potencial dos aprovados que ainda não terminaram de receber ───
  // (somar valor cobrado - já recebido em rodadas)
  const pipelinePrevisto = useMemo(() => {
    if (!orcamentos || !rodadas) return 0;
    return orcamentos
      .filter((o) => o.status === "aprovado")
      .reduce((acc, o) => {
        // soma rodadas vinculadas a esse orçamento (já recebido)
        const jaRecebido = (rodadas ?? [])
          .filter((r) => r.orcamento === o.id)
          .reduce((a, r) => a + r.valor_recebido, 0);
        // valor estimado do orçamento (sem cálculo refinado, usa o que tem)
        // como não temos esse campo direto, usamos 0 se não tiver rodadas — não ideal mas seguro
        return acc + Math.max(0, -jaRecebido); // placeholder
      }, 0);
  }, [orcamentos, rodadas]);

  // ─── gráficos ───
  const statusData = Object.entries(statusConfig).map(([key, cfg]) => ({
    name: cfg.label,
    value: orcamentos?.filter((o) => o.status === key).length ?? 0,
    color: cfg.color,
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

  // entradas (valor recebido) dos últimos 6 meses
  const entradasPorMes = useMemo(() => {
    const meses: { name: string; recebido: number; gastos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const data = new Date(ANO_ATUAL, MES_ATUAL - 1 - i, 1);
      const m = data.getMonth();
      const a = data.getFullYear();
      const recebido =
        (rodadas ?? [])
          .filter((r) => {
            const d = new Date(r.data_recebimento);
            return d.getMonth() === m && d.getFullYear() === a;
          })
          .reduce((acc, r) => acc + r.valor_recebido, 0) || 0;
      meses.push({
        name: `${MESES_CURTOS[m]}/${String(a).slice(2)}`,
        recebido,
        gastos: gastosMensais,
      });
    }
    return meses;
  }, [rodadas, gastosMensais]);

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
          {MESES_CURTOS[MES_ATUAL - 1]}/{ANO_ATUAL} · visão geral da GNOQ
        </p>
      </div>

      {/* cards principais — dinheiro do mês */}
      <div className="grid grid-cols-4 gap-4">
        <Card
          label="Recebido no mês"
          value={formatBRL(recebidoMes)}
          suffix={`${rodadasMes.length} rodada${rodadasMes.length === 1 ? "" : "s"}`}
          color="var(--primary)"
        />
        <Card
          label="Saldo do mês"
          value={formatBRL(saldoMes)}
          suffix={
            saldoMes >= 0 ? "entrou mais que saiu" : "déficit (cobrir do bolso)"
          }
          color={
            saldoMes >= 0 ? "var(--success, #15803d)" : "var(--error, #b91c1c)"
          }
        />
        <Card
          label="Pendente a pagar"
          value={formatBRL(totalPendenteMes)}
          suffix={`${distribuicoesMes.filter((d) => d.status === "pendente").length} distribuiç${distribuicoesMes.filter((d) => d.status === "pendente").length === 1 ? "ão" : "ões"}`}
          color="var(--warning, #b45309)"
        />
        <Card
          label="Reserva acumulada"
          value={formatBRL(reservaAcumulada)}
          suffix="histórico total"
          color="var(--secondary, #7c3aed)"
        />
      </div>

      {/* alertas */}
      {(orcamentosAguardando > 0 ||
        orcamentosVencendo > 0 ||
        pagamentosAtrasados > 0) && (
        <div className="flex gap-3">
          {orcamentosVencendo > 0 && (
            <Alert
              color="var(--warning)"
              border="var(--warning-border)"
              bg="var(--warning-bg)"
              text={`${orcamentosVencendo} orçamento${orcamentosVencendo > 1 ? "s" : ""} vencendo em até 7 dias`}
              onClick={() => router.push("/orcamentos")}
            />
          )}
          {pagamentosAtrasados > 0 && (
            <Alert
              color="var(--error, #b91c1c)"
              border="var(--error-border, rgba(185,28,28,0.30))"
              bg="var(--error-bg, rgba(185,28,28,0.10))"
              text={`${pagamentosAtrasados} pagamento${pagamentosAtrasados > 1 ? "s" : ""} pendente${pagamentosAtrasados > 1 ? "s" : ""} há mais de 30 dias`}
              onClick={() => router.push("/distribuicao")}
            />
          )}
          {orcamentosAguardando > 0 && (
            <Alert
              color="var(--secondary)"
              border="var(--secondary-border)"
              bg="var(--secondary-bg)"
              text={`${orcamentosAguardando} orçamento${orcamentosAguardando > 1 ? "s" : ""} aguardando resposta`}
              onClick={() => router.push("/orcamentos")}
            />
          )}
        </div>
      )}

      {/* segunda linha de cards — secundários */}
      <div className="grid grid-cols-4 gap-4">
        <Card
          label="Gastos fixos"
          value={formatBRL(gastosMensais)}
          suffix="mensais"
          color="var(--text-secondary)"
        />
        <Card
          label="Orçamentos aprovados"
          value={String(orcamentosAprovados)}
          suffix="no total"
          color="var(--success, #15803d)"
        />
        <Card
          label="Pago no mês"
          value={formatBRL(totalPagoMes)}
          suffix={`${distribuicoesMes.filter((d) => d.status === "pago").length} distribuiç${distribuicoesMes.filter((d) => d.status === "pago").length === 1 ? "ão" : "ões"}`}
          color="var(--success, #15803d)"
        />
        <Card
          label="Tempo médio até receber"
          value={
            tempoMedioReceber != null
              ? `${tempoMedioReceber} dia${tempoMedioReceber === 1 ? "" : "s"}`
              : "—"
          }
          suffix="aprovação → 1ª rodada"
          color="var(--text-secondary)"
        />
      </div>

      {/* gráfico de entradas vs gastos */}
      <div className="grid grid-cols-3 gap-4">
        <div
          className="rounded-xl p-5 flex flex-col gap-4 col-span-2"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Entradas vs gastos fixos (últimos 6 meses)
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={entradasPorMes} barGap={4}>
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
                dataKey="recebido"
                name="Recebido"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="gastos"
                name="Gastos fixos"
                fill="#b91c1c"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4">
            {[
              { color: "var(--primary)", label: "Recebido" },
              { color: "#b91c1c", label: "Gastos fixos" },
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
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
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
      </div>

      {/* gastos por categoria + últimos orçamentos */}
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
            Gastos fixos por categoria
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

// ──────────────────────────────────────────────────────────────────
function Card({
  label,
  value,
  suffix,
  color,
}: {
  label: string;
  value: string;
  suffix?: string;
  color: string;
}) {
  return (
    <div
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
        {label}
      </p>
      <p
        className="text-2xl font-semibold"
        style={{ color, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
      {suffix && (
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          {suffix}
        </p>
      )}
    </div>
  );
}

function Alert({
  color,
  border,
  bg,
  text,
  onClick,
}: {
  color: string;
  border: string;
  bg: string;
  text: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="flex-1 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80"
      style={{
        border: `1px solid ${border}`,
        background: bg,
      }}
    >
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: color }}
      />
      <p className="text-sm" style={{ color }}>
        {text}
      </p>
    </div>
  );
}
