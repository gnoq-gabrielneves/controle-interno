"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calcularOrcamento, formatBRL } from "@/helpers/calculo-orcamento";
import { useOrcamentosStats } from "@/hooks/use-orcamentos";
import { OrcamentoStatus, OrcamentoTipo } from "@/types/orcamentos-types";
import { AlertTriangleIcon, FileTextIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

const statusConfig: Record<
  OrcamentoStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  rascunho: {
    label: "Rascunho",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.10)",
    border: "rgba(107,114,128,0.30)",
  },
  enviado: {
    label: "Enviado",
    color: "#00719C",
    bg: "rgba(0,113,156,0.10)",
    border: "rgba(0,113,156,0.30)",
  },
  aprovado: {
    label: "Aprovado",
    color: "#15803d",
    bg: "rgba(21,128,61,0.10)",
    border: "rgba(21,128,61,0.30)",
  },
  recusado: {
    label: "Recusado",
    color: "#b91c1c",
    bg: "rgba(185,28,28,0.10)",
    border: "rgba(185,28,28,0.30)",
  },
};

const TIPO_LABELS: Record<OrcamentoTipo, string> = {
  projeto_fechado: "Projeto fechado",
  por_modulo: "Por módulo",
};

// ─── tipos vindos do banco (mesma shape do GetOrcamentosStats) ───
type ItemFuncionarioRaw = {
  funcionario: number;
  meses_alocados: number;
  salario_snapshot: number;
};
type OrcamentoItemRaw = {
  id: string;
  valor_manual: number | null;
  orcamento_item_funcionarios: ItemFuncionarioRaw[];
};
type ClienteRaw = { id: string; nome: string } | null;
type OrcamentoStatsRaw = {
  id: string;
  titulo: string;
  status: OrcamentoStatus;
  tipo: OrcamentoTipo;
  created_at: string;
  margem_lucro: number;
  aliquota_imposto: number;
  buffer_atraso: number;
  validade_dias: number;
  cliente: ClienteRaw | ClienteRaw[];
  orcamento_itens: OrcamentoItemRaw[];
};

// resolve cliente que pode vir como obj ou array do supabase
function pickCliente(c: ClienteRaw | ClienteRaw[]): { nome: string } | null {
  if (!c) return null;
  return Array.isArray(c) ? (c[0] ?? null) : c;
}

// ─── enriquece cada orçamento com os números derivados ───
type OrcamentoEnriquecido = {
  id: string;
  titulo: string;
  status: OrcamentoStatus;
  tipo: OrcamentoTipo;
  clienteNome: string;
  created_at: string;
  validadeDate: Date;
  diasAteVencer: number;
  valorCobrado: number;
  numPessoas: number;
  duracaoMeses: number;
};

function enriquecer(orc: OrcamentoStatsRaw, hoje: Date): OrcamentoEnriquecido {
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

  // pessoas únicas: dedupe por id
  const pessoasUnicas = new Set(todasAlocacoes.map((a) => a.funcionario));

  // duração: maior número de meses alocados a uma pessoa (proxy para duração do projeto)
  const duracao = todasAlocacoes.reduce(
    (max, a) => (a.meses_alocados > max ? a.meses_alocados : max),
    0,
  );

  const validadeDate = new Date(orc.created_at);
  validadeDate.setDate(validadeDate.getDate() + orc.validade_dias);

  const diasAteVencer = Math.ceil(
    (validadeDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    id: orc.id,
    titulo: orc.titulo,
    status: orc.status,
    tipo: orc.tipo,
    clienteNome: pickCliente(orc.cliente)?.nome ?? "—",
    created_at: orc.created_at,
    validadeDate,
    diasAteVencer,
    valorCobrado: calc.valorCobrado,
    numPessoas: pessoasUnicas.size,
    duracaoMeses: duracao,
  };
}

export default function OrcamentosPage() {
  const { data: rawData, isLoading } = useOrcamentosStats();
  const router = useRouter();

  // hoje fixado uma vez por render (evita recalcular toda hora)
  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const orcamentos = useMemo<OrcamentoEnriquecido[]>(() => {
    if (!rawData) return [];
    return (rawData as unknown as OrcamentoStatsRaw[]).map((o) =>
      enriquecer(o, hoje),
    );
  }, [rawData, hoje]);

  // ─── métricas dos cards ───
  const totalOrcado = orcamentos.reduce((acc, o) => acc + o.valorCobrado, 0);
  const totalAprovado = orcamentos
    .filter((o) => o.status === "aprovado")
    .reduce((acc, o) => acc + o.valorCobrado, 0);

  const contagemPorStatus = orcamentos.reduce<Record<OrcamentoStatus, number>>(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    { rascunho: 0, enviado: 0, aprovado: 0, recusado: 0 },
  );

  // vencendo: enviados com 0–7 dias até vencer
  const vencendoEm7Dias = orcamentos.filter(
    (o) =>
      o.status === "enviado" && o.diasAteVencer >= 0 && o.diasAteVencer <= 7,
  ).length;

  // ─── estilos ───
  const cardStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 16,
  } as const;

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Orçamentos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {orcamentos.length} orçamentos cadastrados
          </p>
        </div>
        <button
          onClick={() => router.push("/orcamentos/novo")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
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
          <PlusIcon className="w-4 h-4" />
          Novo orçamento
        </button>
      </div>

      {/* CARDS DE RESUMO — 4 colunas */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total orçado */}
        <div style={cardStyle} className="flex flex-col gap-1">
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Total orçado
          </span>
          <span
            className="text-2xl font-semibold"
            style={{
              color: "var(--text-primary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatBRL(totalOrcado)}
          </span>
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            soma de todos os status
          </span>
        </div>

        {/* Total aprovado */}
        <div style={cardStyle} className="flex flex-col gap-1">
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Total aprovado
          </span>
          <span
            className="text-2xl font-semibold"
            style={{
              color: "var(--success, #15803d)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatBRL(totalAprovado)}
          </span>
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            {contagemPorStatus.aprovado} orçamento
            {contagemPorStatus.aprovado === 1 ? "" : "s"}
          </span>
        </div>

        {/* Quantidade por status */}
        <div style={cardStyle} className="flex flex-col gap-2">
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Por status
          </span>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(statusConfig) as OrcamentoStatus[]).map((key) => {
              const s = statusConfig[key];
              const count = contagemPorStatus[key];
              return (
                <span
                  key={key}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    color: s.color,
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    opacity: count === 0 ? 0.4 : 1,
                  }}
                >
                  {count} {s.label.toLowerCase()}
                </span>
              );
            })}
          </div>
        </div>

        {/* Vencendo em 7 dias */}
        <div
          style={{
            ...cardStyle,
            ...(vencendoEm7Dias > 0
              ? {
                  background: "var(--warning-bg, rgba(180,83,9,0.10))",
                  border:
                    "1px solid var(--warning-border, rgba(180,83,9,0.30))",
                }
              : {}),
          }}
          className="flex flex-col gap-1"
        >
          <span
            className="text-xs uppercase tracking-wider flex items-center gap-1.5"
            style={{
              color:
                vencendoEm7Dias > 0
                  ? "var(--warning, #b45309)"
                  : "var(--text-muted)",
            }}
          >
            {vencendoEm7Dias > 0 && (
              <AlertTriangleIcon className="w-3.5 h-3.5" />
            )}
            Vencendo em 7 dias
          </span>
          <span
            className="text-2xl font-semibold"
            style={{
              color:
                vencendoEm7Dias > 0
                  ? "var(--warning, #b45309)"
                  : "var(--text-primary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {vencendoEm7Dias}
          </span>
          <span className="text-xs" style={{ color: "var(--text-faint)" }}>
            {vencendoEm7Dias === 0
              ? "nenhum risco imediato"
              : "enviados próximos do vencimento"}
          </span>
        </div>
      </div>

      {/* TABELA */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <Table>
          <TableHeader>
            <TableRow
              className="hover:bg-transparent"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-card-alt)",
              }}
            >
              {[
                { label: "Título", align: "left" },
                { label: "Cliente", align: "left" },
                { label: "Tipo", align: "left" },
                { label: "Equipe", align: "right" },
                { label: "Duração", align: "right" },
                { label: "Valor", align: "right" },
                { label: "Validade", align: "left" },
                { label: "Status", align: "left" },
              ].map((h) => (
                <TableHead
                  key={h.label}
                  className={`text-xs uppercase tracking-wider ${
                    h.align === "right" ? "text-right" : ""
                  }`}
                  style={{ color: "var(--text-muted)" }}
                >
                  {h.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="flex justify-center">
                    <div
                      className="w-5 h-5 rounded-full border-2 animate-spin"
                      style={{
                        borderColor: "var(--primary-border)",
                        borderTopColor: "var(--primary)",
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              orcamentos.map((o) => {
                const status = statusConfig[o.status];
                const vencido = o.diasAteVencer < 0;
                const vencendo = o.diasAteVencer >= 0 && o.diasAteVencer <= 7;

                return (
                  <TableRow
                    key={o.id}
                    onClick={() => router.push(`/orcamentos/${o.id}`)}
                    className="cursor-pointer transition-colors"
                    style={{ borderColor: "var(--border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {/* Título */}
                    <TableCell
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {o.titulo}
                    </TableCell>

                    {/* Cliente */}
                    <TableCell
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {o.clienteNome}
                    </TableCell>

                    {/* Tipo (badge sutil) */}
                    <TableCell>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--bg-card-alt)",
                          color: "var(--text-muted)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {TIPO_LABELS[o.tipo]}
                      </span>
                    </TableCell>

                    {/* Equipe (número de pessoas) */}
                    <TableCell
                      className="text-sm text-right"
                      style={{
                        color: "var(--text-secondary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {o.numPessoas > 0
                        ? `${o.numPessoas} ${
                            o.numPessoas === 1 ? "pessoa" : "pessoas"
                          }`
                        : "—"}
                    </TableCell>

                    {/* Duração (meses) */}
                    <TableCell
                      className="text-sm text-right"
                      style={{
                        color: "var(--text-secondary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {o.duracaoMeses > 0
                        ? `${o.duracaoMeses} ${
                            o.duracaoMeses === 1 ? "mês" : "meses"
                          }`
                        : "—"}
                    </TableCell>

                    {/* Valor */}
                    <TableCell
                      className="text-sm font-medium text-right"
                      style={{
                        color: "var(--primary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatBRL(o.valorCobrado)}
                    </TableCell>

                    {/* Validade (com indicador visual de vencimento) */}
                    <TableCell
                      className="text-sm"
                      style={{
                        color: vencido
                          ? "var(--error, #b91c1c)"
                          : vencendo
                            ? "var(--warning, #b45309)"
                            : "var(--text-secondary)",
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        {(vencido || vencendo) && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              background: vencido
                                ? "var(--error, #b91c1c)"
                                : "var(--warning, #b45309)",
                            }}
                          />
                        )}
                        {o.validadeDate.toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>

                    {/* Status (badge colorido) */}
                    <TableCell>
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          color: status.color,
                          background: status.bg,
                          border: `1px solid ${status.border}`,
                        }}
                      >
                        {status.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}

            {/* vazio */}
            {!isLoading && orcamentos.length === 0 && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileTextIcon
                      className="w-8 h-8"
                      style={{ color: "var(--text-faint)" }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Nenhum orçamento cadastrado
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
