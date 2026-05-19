"use client";

import { OrcamentoPDF } from "@/components/OrcamentoPdf/OrcamentoPdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calcularOrcamento,
  formatBRL,
  formatPct,
} from "@/helpers/calculo-orcamento";
import {
  useDeleteOrcamento,
  useGetOrcamento,
  useUpdateOrcamentoStatus,
} from "@/hooks/use-orcamentos";
import { OrcamentoStatus, OrcamentoTipo } from "@/types/orcamentos-types";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CalculatorIcon,
  DownloadIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

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
  descricao_detalhada: string | null;
  valor_manual: number | null;
  orcamento_item_funcionarios: ItemFuncionario[];
};
type ClienteData = {
  id: string;
  nome: string;
  email: string | null;
  cpf_cnpj: string | null;
  telefone: string | null;
  logradouro: string | null;
  numero: string | null;
  cidade: string | null;
  estado: string | null;
};
type OrcamentoDetalhe = {
  id: string;
  numero: number | null;
  titulo: string;
  status: OrcamentoStatus;
  tipo: OrcamentoTipo;
  margem_lucro: number;
  aliquota_imposto: number;
  buffer_atraso: number;
  validade_dias: number;
  observacoes: string | null;
  created_at: string;
  cliente: ClienteData | null;
  orcamento_itens: OrcamentoItem[];
};

function pickFunc(f: ItemFuncionario): FuncionarioData | null {
  if (!f.funcionario_data) return null;
  return Array.isArray(f.funcionario_data)
    ? (f.funcionario_data[0] ?? null)
    : f.funcionario_data;
}

export default function OrcamentoPage() {
  const { id } = useParams<{ id: string }>();
  const { data: orcamento, isLoading } = useGetOrcamento(id);

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

  if (!orcamento) return null;
  return (
    <OrcamentoDetail orcamento={orcamento as unknown as OrcamentoDetalhe} />
  );
}

function OrcamentoDetail({ orcamento }: { orcamento: OrcamentoDetalhe }) {
  const router = useRouter();
  const { mutate: updateStatus, isPending: updatingStatus } =
    useUpdateOrcamentoStatus(orcamento.id);
  const { mutate: deleteOrcamento, isPending: deleting } = useDeleteOrcamento();

  // ─── estado do dialog de exclusão ───
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // exige que o usuário digite o título (case-insensitive, trim) pra liberar o botão
  const canDelete =
    confirmText.trim().toLowerCase() === orcamento.titulo.trim().toLowerCase();

  function handleDelete() {
    if (!canDelete) return;
    deleteOrcamento(orcamento.id, {
      onSuccess: () => {
        setConfirmOpen(false);
        router.push("/orcamentos");
      },
    });
  }

  // ─── cálculo ───
  const todasAlocacoes = (orcamento.orcamento_itens ?? []).flatMap(
    (item) => item.orcamento_item_funcionarios ?? [],
  );

  const funcionariosCalc = todasAlocacoes.map((f) => ({
    salario: f.salario_snapshot,
    meses: f.meses_alocados,
  }));

  const itensCalc =
    orcamento.tipo === "por_modulo"
      ? (orcamento.orcamento_itens ?? []).map((i) => ({
          valor: i.valor_manual,
        }))
      : undefined;

  const calculo = calcularOrcamento({
    funcionarios: funcionariosCalc,
    bufferAtraso: orcamento.buffer_atraso,
    margemLucro: orcamento.margem_lucro,
    aliquotaImposto: orcamento.aliquota_imposto,
    itens: itensCalc,
  });

  const equipeConsolidada = Object.values(
    todasAlocacoes.reduce<
      Record<
        number,
        {
          id: number;
          name: string;
          salario: number;
          meses: number;
          total: number;
        }
      >
    >((acc, f) => {
      const func = pickFunc(f);
      if (!func) return acc;
      const key = func.id;
      const valor = f.salario_snapshot * f.meses_alocados;
      if (acc[key]) {
        acc[key].meses += f.meses_alocados;
        acc[key].total += valor;
      } else {
        acc[key] = {
          id: func.id,
          name: func.name,
          salario: f.salario_snapshot,
          meses: f.meses_alocados,
          total: valor,
        };
      }
      return acc;
    }, {}),
  );

  const cliente = orcamento.cliente;
  const validade = new Date(orcamento.created_at);
  validade.setDate(validade.getDate() + orcamento.validade_dias);
  const st = statusConfig[orcamento.status];

  async function handleExportPDF() {
    const { pdf } = await import("@react-pdf/renderer");
    const doc = (
      <OrcamentoPDF
        numero={orcamento.numero ?? null}
        titulo={orcamento.titulo}
        status={orcamento.status}
        tipo={orcamento.tipo}
        cliente={orcamento.cliente}
        margem_lucro={orcamento.margem_lucro}
        aliquota_imposto={orcamento.aliquota_imposto}
        buffer_atraso={orcamento.buffer_atraso}
        validade_dias={orcamento.validade_dias}
        observacoes={orcamento.observacoes}
        created_at={orcamento.created_at}
        orcamento_itens={orcamento.orcamento_itens}
        equipeConsolidada={equipeConsolidada}
        calculo={calculo}
      />
    );
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orcamento-${orcamento.titulo.toLowerCase().replace(/\s+/g, "-")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sectionStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    overflow: "hidden" as const,
  };

  const breakdownLines = [
    {
      label: "Custo da equipe",
      value: formatBRL(calculo.custoEquipe),
      muted: false,
      operator: "",
    },
    {
      label: `Buffer de atraso (${formatPct(orcamento.buffer_atraso)})`,
      value: formatBRL(calculo.valorBuffer),
      muted: true,
      operator: "+",
    },
    {
      label: "Custo protegido",
      value: formatBRL(calculo.custoProtegido),
      muted: false,
      operator: "",
    },
    {
      label: `Margem de lucro (${formatPct(orcamento.margem_lucro)})`,
      value: formatBRL(calculo.valorMargem),
      muted: true,
      operator: "+",
    },
    {
      label: "Subtotal",
      value: formatBRL(calculo.subtotal),
      muted: false,
      operator: "",
    },
    {
      label: `Imposto (${formatPct(orcamento.aliquota_imposto)})`,
      value: formatBRL(calculo.valorImposto),
      muted: true,
      operator: "+",
    },
  ];

  return (
    <div className="p-8 w-full flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-2">
              <h1
                className="text-xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {orcamento.titulo}
              </h1>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--bg-card-alt)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                {TIPO_LABELS[orcamento.tipo]}
              </span>
            </div>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {cliente?.nome ?? "—"} · Válido até{" "}
              {validade.toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={orcamento.status}
            onValueChange={(v) => v && updateStatus(v as OrcamentoStatus)}
            disabled={updatingStatus}
          >
            <SelectTrigger
              className="w-36 text-xs"
              style={{
                color: st.color,
                background: st.bg,
                border: `1px solid ${st.border}`,
              }}
            >
              <SelectValue>{st.label}</SelectValue>
            </SelectTrigger>
            <SelectContent
              sideOffset={4}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              {Object.entries(statusConfig).map(([key, s]) => (
                <SelectItem key={key} value={key} style={{ color: s.color }}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {[
            {
              label: "Editar",
              icon: PencilIcon,
              onClick: () => router.push(`/orcamentos/${orcamento.id}/editar`),
            },
            {
              label: "Distribuição",
              icon: CalculatorIcon,
              onClick: () =>
                router.push(`/orcamentos/${orcamento.id}/distribuicao`),
            },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
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
              <btn.icon className="w-4 h-4" />
              {btn.label}
            </button>
          ))}

          {/* botão de excluir — visualmente perigoso, separado dos outros */}
          <button
            onClick={() => setConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              border: "1px solid var(--error-border, rgba(185,28,28,0.30))",
              color: "var(--error, #b91c1c)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--error-bg, rgba(185,28,28,0.10))")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
            title="Excluir orçamento"
          >
            <Trash2Icon className="w-4 h-4" />
            Excluir
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              background: "var(--primary)",
              color: "#ffffff",
              border: "1px solid var(--primary)",
            }}
          >
            <DownloadIcon className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      {/* CARD DE CÁLCULO */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--primary-border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{
            background: "var(--primary-bg)",
            borderBottom: "1px solid var(--primary-border)",
          }}
        >
          <p
            className="text-xs uppercase tracking-wider font-medium"
            style={{ color: "var(--primary)" }}
          >
            Cálculo do orçamento
          </p>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            Salário × meses → buffer → margem → imposto
          </span>
        </div>

        <div className="px-5 py-3 flex flex-col gap-2">
          {breakdownLines.map((line, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <span
                style={{
                  color: line.muted
                    ? "var(--text-muted)"
                    : "var(--text-secondary)",
                }}
              >
                {line.label}
              </span>
              <span
                style={{
                  color: line.muted
                    ? "var(--text-muted)"
                    : "var(--text-primary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {line.operator && (
                  <span style={{ marginRight: 4 }}>{line.operator}</span>
                )}
                {line.value}
              </span>
            </div>
          ))}
        </div>

        <div
          className="px-5 py-4 flex justify-between items-center"
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--bg-card-alt)",
          }}
        >
          <div className="flex flex-col">
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {orcamento.tipo === "por_modulo"
                ? "Valor cobrado (soma dos módulos)"
                : "Valor do projeto"}
            </span>
            {orcamento.tipo === "por_modulo" && calculo.somaItens != null && (
              <span
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Calculado: {formatBRL(calculo.valorCalculado)}
              </span>
            )}
          </div>
          <span
            className="text-2xl font-semibold"
            style={{
              color: "var(--primary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatBRL(calculo.valorCobrado)}
          </span>
        </div>

        {orcamento.tipo === "por_modulo" && calculo.temDivergencia && (
          <div
            className="px-5 py-3 flex items-start gap-2 text-xs"
            style={{
              borderTop: "1px solid var(--warning-border)",
              background: "var(--warning-bg)",
              color: "var(--warning)",
            }}
          >
            <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                Soma dos módulos {calculo.divergencia > 0 ? "acima" : "abaixo"}{" "}
                do calculado em {formatBRL(Math.abs(calculo.divergencia))}
              </p>
              <p className="mt-0.5 opacity-80">
                {calculo.divergencia > 0
                  ? "Cobrança maior que o necessário."
                  : "Cobrança menor que o necessário pra cobrir custo + buffer + margem."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* EQUIPE ALOCADA — consolidada */}
      {equipeConsolidada.length > 0 && (
        <div style={sectionStyle}>
          <div
            className="px-5 py-3"
            style={{
              background: "var(--bg-card-alt)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Equipe alocada
            </p>
          </div>

          <div
            className="grid items-center gap-2 px-5 py-2 text-xs uppercase tracking-wider"
            style={{
              color: "var(--text-muted)",
              borderBottom: "1px solid var(--border)",
              gridTemplateColumns: "1fr 140px 100px 130px",
            }}
          >
            <span>Funcionário</span>
            <span className="text-right">Salário</span>
            <span className="text-right">Meses</span>
            <span className="text-right">Custo total</span>
          </div>

          {equipeConsolidada.map((m, i) => (
            <div
              key={m.id}
              className="grid items-center gap-2 px-5 py-3 text-sm"
              style={{
                borderBottom:
                  i < equipeConsolidada.length - 1
                    ? "1px solid var(--border)"
                    : "none",
                gridTemplateColumns: "1fr 140px 100px 130px",
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
                  {(m.name ?? "?").charAt(0).toUpperCase()}
                </div>
                <span style={{ color: "var(--text-primary)" }}>{m.name}</span>
              </div>
              <span
                className="text-right"
                style={{
                  color: "var(--text-muted)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatBRL(m.salario)}/mês
              </span>
              <span
                className="text-right"
                style={{
                  color: "var(--text-secondary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {m.meses}
              </span>
              <span
                className="text-right font-medium"
                style={{
                  color: "var(--primary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatBRL(m.total)}
              </span>
            </div>
          ))}

          <div
            className="grid items-center gap-2 px-5 py-3"
            style={{
              background: "var(--bg-card-alt)",
              borderTop: "1px solid var(--border)",
              gridTemplateColumns: "1fr 140px 100px 130px",
            }}
          >
            <span
              className="text-xs uppercase tracking-wider font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              Total
            </span>
            <span />
            <span />
            <span
              className="text-right text-sm font-semibold"
              style={{
                color: "var(--primary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatBRL(calculo.custoEquipe)}
            </span>
          </div>
        </div>
      )}

      {/* ITENS / MÓDULOS */}
      {(orcamento.orcamento_itens ?? []).length > 0 && (
        <div style={sectionStyle}>
          <div
            className="px-5 py-3"
            style={{
              background: "var(--bg-card-alt)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {orcamento.tipo === "por_modulo"
                ? "Módulos"
                : "Escopo do projeto"}
            </p>
          </div>

          <div className="flex flex-col">
            {(orcamento.orcamento_itens ?? []).map((item, idx) => (
              <div
                key={item.id}
                className="px-5 py-4 flex items-start justify-between"
                style={{
                  borderBottom:
                    idx < orcamento.orcamento_itens.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                }}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5"
                    style={{
                      background: "var(--primary-bg)",
                      color: "var(--primary)",
                      border: "1px solid var(--primary-border)",
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {item.descricao || "(sem descrição)"}
                    </p>
                    {item.descricao_detalhada && (
                      <p
                        className="text-xs mt-1 leading-relaxed"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {item.descricao_detalhada}
                      </p>
                    )}
                  </div>
                </div>
                {orcamento.tipo === "por_modulo" && (
                  <span
                    className="text-sm font-semibold shrink-0 ml-4"
                    style={{
                      color:
                        item.valor_manual != null
                          ? "var(--primary)"
                          : "var(--text-faint)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {item.valor_manual != null
                      ? formatBRL(item.valor_manual)
                      : "—"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* observações */}
      {orcamento.observacoes && (
        <div style={sectionStyle} className="px-5 py-4">
          <p
            className="text-xs uppercase tracking-wider mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Observações
          </p>
          <p
            className="text-sm whitespace-pre-wrap"
            style={{ color: "var(--text-secondary)" }}
          >
            {orcamento.observacoes}
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────── */}
      {/* DIALOG DE CONFIRMAÇÃO — exige digitar o título */}
      {/* ─────────────────────────────────────────────────── */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmText("");
        }}
      >
        <DialogContent
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "var(--error-bg, rgba(185,28,28,0.10))",
                  border: "1px solid var(--error-border, rgba(185,28,28,0.30))",
                }}
              >
                <AlertTriangleIcon
                  className="w-5 h-5"
                  style={{ color: "var(--error, #b91c1c)" }}
                />
              </div>
              <DialogTitle style={{ color: "var(--text-primary)" }}>
                Excluir orçamento
              </DialogTitle>
            </div>
            <DialogDescription
              className="text-sm leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              Essa ação <strong>não pode ser desfeita</strong>. O orçamento, os
              itens/módulos e todas as alocações de equipe serão removidos
              permanentemente do banco de dados.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2 my-2">
            <label
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Pra confirmar, digite o título do orçamento abaixo:
            </label>
            <p
              className="text-sm font-mono px-3 py-2 rounded"
              style={{
                background: "var(--bg-card-alt)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              {orcamento.titulo}
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite o título exatamente"
              autoFocus
              className="px-3 py-2 rounded text-sm outline-none transition-all"
              style={{
                background: "var(--bg-card)",
                border: `1px solid ${canDelete ? "var(--success, #15803d)" : "var(--border)"}`,
                color: "var(--text-primary)",
              }}
            />
          </div>

          <DialogFooter className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
              className="px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || deleting}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "var(--error, #b91c1c)",
                color: "#ffffff",
                border: "1px solid var(--error, #b91c1c)",
              }}
            >
              {deleting ? "Excluindo..." : "Excluir permanentemente"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
