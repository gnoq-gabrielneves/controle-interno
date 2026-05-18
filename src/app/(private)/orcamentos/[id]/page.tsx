"use client";

import { OrcamentoPDF } from "@/components/OrcamentoPdf/OrcamentoPdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListFuncionarios } from "@/hooks/use-funcionarios";
import { useListGastos } from "@/hooks/use-gastos";
import {
  useGetOrcamento,
  useUpdateOrcamentoStatus,
} from "@/hooks/use-orcamentos";
import { OrcamentoStatus } from "@/types/orcamentos-types";
import {
  ArrowLeftIcon,
  CalculatorIcon,
  DownloadIcon,
  PencilIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useRef } from "react";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

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

type FuncionarioData = { id: number; name: string; salario: number };
type ItemFuncionario = {
  id: string;
  horas: number;
  funcionario: number;
  funcionario_data: FuncionarioData | FuncionarioData[] | null;
};
type OrcamentoItem = {
  id: string;
  descricao: string;
  descricao_detalhada?: string | null;
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
  margem_lucro: number;
  aliquota_imposto: number;
  validade_dias: number;
  observacoes: string | null;
  created_at: string;
  cliente: ClienteData | null;
  orcamento_itens: OrcamentoItem[];
};
type Gasto = { recorrencia: "mensal" | "anual"; valor: number };

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
  const pdfRef = useRef<HTMLDivElement>(null);
  const { mutate: updateStatus, isPending: updatingStatus } =
    useUpdateOrcamentoStatus(orcamento.id);
  const { data: funcionarios } = useListFuncionarios();
  const { data: gastos } = useListGastos();

  const overheadPorHora = useMemo(() => {
    const totalMensal =
      (gastos as Gasto[] | undefined)?.reduce(
        (acc, g) => acc + (g.recorrencia === "mensal" ? g.valor : g.valor / 12),
        0,
      ) ?? 0;
    return totalMensal / ((funcionarios?.length ?? 1) * 220);
  }, [gastos, funcionarios]);

  function calcularItem(item: OrcamentoItem) {
    const custoBase = (item.orcamento_item_funcionarios ?? []).reduce(
      (acc, f) => {
        const func = Array.isArray(f.funcionario_data)
          ? f.funcionario_data[0]
          : f.funcionario_data;
        if (!func) return acc;
        return acc + f.horas * ((func.salario ?? 0) / 220 + overheadPorHora);
      },
      0,
    );
    const comMargem = custoBase * (1 + orcamento.margem_lucro);
    const comImposto = comMargem * (1 + orcamento.aliquota_imposto);
    return { custoBase, comMargem, comImposto };
  }

  const totalOrcamento = (orcamento.orcamento_itens ?? []).reduce(
    (acc, item) => acc + calcularItem(item).comImposto,
    0,
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
        cliente={orcamento.cliente}
        margem_lucro={orcamento.margem_lucro}
        aliquota_imposto={orcamento.aliquota_imposto}
        validade_dias={orcamento.validade_dias}
        observacoes={orcamento.observacoes}
        created_at={orcamento.created_at}
        orcamento_itens={orcamento.orcamento_itens}
        overheadPorHora={overheadPorHora}
        totalOrcamento={totalOrcamento}
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
    padding: 24,
  };

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
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {orcamento.titulo}
            </h1>
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent
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

          <button
            onClick={handleExportPDF}
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
            <DownloadIcon className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      <div ref={pdfRef} className="flex flex-col gap-6">
        {/* cliente + detalhes */}
        <div style={sectionStyle} className="grid grid-cols-2 gap-6">
          <div>
            <p
              className="text-xs uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Cliente
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {cliente?.nome ?? "—"}
            </p>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--text-secondary)" }}
            >
              {cliente?.email ?? "—"}
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {cliente?.cpf_cnpj ?? "—"}
            </p>
            {cliente?.logradouro && (
              <p
                className="text-sm mt-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {cliente.logradouro}, {cliente.numero} — {cliente.cidade}/
                {cliente.estado}
              </p>
            )}
          </div>
          <div>
            <p
              className="text-xs uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Detalhes
            </p>
            <div className="flex flex-col gap-2">
              {[
                {
                  label: "Margem de lucro",
                  value: `${(orcamento.margem_lucro * 100).toFixed(1)}%`,
                },
                {
                  label: "Alíquota imposto",
                  value: `${(orcamento.aliquota_imposto * 100).toFixed(1)}%`,
                },
                { label: "Overhead/hora", value: formatBRL(overheadPorHora) },
                {
                  label: "Validade",
                  value: validade.toLocaleDateString("pt-BR"),
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>
                    {row.label}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* itens */}
        <div className="flex flex-col gap-3">
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Itens
          </p>

          {(orcamento.orcamento_itens ?? []).map((item, index) => {
            const calc = calcularItem(item);
            return (
              <div
                key={item.id}
                style={sectionStyle}
                className="flex flex-col gap-3"
              >
                {/* header do item */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className="text-xs mt-0.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {index + 1}.
                    </span>
                    <div>
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {item.descricao}
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
                  <span
                    className="text-sm font-semibold shrink-0 ml-4"
                    style={{ color: "var(--primary)" }}
                  >
                    {formatBRL(calc.comImposto)}
                  </span>
                </div>

                {/* funcionários */}
                {(item.orcamento_item_funcionarios ?? []).length > 0 && (
                  <div
                    className="ml-6 flex flex-col gap-1.5 pt-2"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    {(item.orcamento_item_funcionarios ?? []).map((f) => {
                      const func = Array.isArray(f.funcionario_data)
                        ? f.funcionario_data[0]
                        : f.funcionario_data;
                      const salarioPorHora = (func?.salario ?? 0) / 220;
                      const custoFunc =
                        f.horas * (salarioPorHora + overheadPorHora);
                      return (
                        <div
                          key={f.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium"
                              style={{
                                background: "var(--primary-bg)",
                                border: "1px solid var(--primary-border)",
                                color: "var(--primary)",
                              }}
                            >
                              {(func?.name ?? "?").charAt(0).toUpperCase()}
                            </div>
                            <span style={{ color: "var(--text-secondary)" }}>
                              {func?.name ?? "—"}
                            </span>
                            <span style={{ color: "var(--text-muted)" }}>
                              ·
                            </span>
                            <span style={{ color: "var(--text-muted)" }}>
                              {f.horas}h ×{" "}
                              {formatBRL(salarioPorHora + overheadPorHora)}/h
                            </span>
                          </div>
                          <span style={{ color: "var(--text-secondary)" }}>
                            {formatBRL(custoFunc)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* breakdown de cálculo */}
                <div
                  className="ml-6 flex items-center gap-6 pt-2 text-xs"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  {[
                    {
                      label: "Custo base",
                      value: formatBRL(calc.custoBase),
                      highlight: false,
                    },
                    {
                      label: "Com margem",
                      value: formatBRL(calc.comMargem),
                      highlight: false,
                    },
                    {
                      label: "Com imposto",
                      value: formatBRL(calc.comImposto),
                      highlight: true,
                    },
                  ].map((b) => (
                    <span key={b.label} style={{ color: "var(--text-muted)" }}>
                      {b.label}:{" "}
                      <span
                        style={{
                          color: b.highlight
                            ? "var(--primary)"
                            : "var(--text-secondary)",
                        }}
                      >
                        {b.value}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* observações */}
        {orcamento.observacoes && (
          <div style={sectionStyle}>
            <p
              className="text-xs uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Observações
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {orcamento.observacoes}
            </p>
          </div>
        )}

        {/* total */}
        <div
          className="p-5 rounded-xl flex items-center justify-between"
          style={{
            background: "var(--primary-bg)",
            border: "1px solid var(--primary-border)",
          }}
        >
          <div>
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Total do orçamento
            </p>
            <p
              className="text-2xl font-semibold mt-1"
              style={{ color: "var(--primary)" }}
            >
              {formatBRL(totalOrcamento)}
            </p>
          </div>
          <div
            className="text-right text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <p>
              Criado em{" "}
              {new Date(orcamento.created_at).toLocaleDateString("pt-BR")}
            </p>
            <p>Válido até {validade.toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
