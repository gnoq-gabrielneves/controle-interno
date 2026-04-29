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

const statusConfig: Record<OrcamentoStatus, { label: string; class: string }> =
  {
    rascunho: {
      label: "Rascunho",
      class: "bg-white/10 border-white/20 text-white/50",
    },
    enviado: {
      label: "Enviado",
      class: "bg-sky-500/10 border-sky-500/30 text-sky-300",
    },
    aprovado: {
      label: "Aprovado",
      class: "bg-green-500/10 border-green-500/30 text-green-300",
    },
    recusado: {
      label: "Recusado",
      class: "bg-red-500/10 border-red-500/30 text-red-300",
    },
  };

type FuncionarioData = {
  id: number;
  name: string;
  salario: number;
};

type ItemFuncionario = {
  id: string;
  horas: number;
  funcionario: number;
  funcionario_data: FuncionarioData | FuncionarioData[] | null;
};

type OrcamentoItem = {
  id: string;
  descricao: string;
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

type Gasto = {
  recorrencia: "mensal" | "anual";
  valor: number;
};

export default function OrcamentoPage() {
  const { id } = useParams<{ id: string }>();
  const { data: orcamento, isLoading } = useGetOrcamento(id);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
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
      (gastos as Gasto[] | undefined)?.reduce((acc, g) => {
        return acc + (g.recorrencia === "mensal" ? g.valor : g.valor / 12);
      }, 0) ?? 0;
    const totalFunc = funcionarios?.length ?? 1;
    return totalMensal / (totalFunc * 220);
  }, [gastos, funcionarios]);

  function calcularItem(item: OrcamentoItem) {
    const custoBase = (item.orcamento_item_funcionarios ?? []).reduce(
      (acc, f) => {
        const func = Array.isArray(f.funcionario_data)
          ? f.funcionario_data[0]
          : f.funcionario_data;
        if (!func) return acc;
        const salarioPorHora = (func.salario ?? 0) / 220;
        return acc + f.horas * (salarioPorHora + overheadPorHora);
      },
      0,
    );

    const comMargem = custoBase * (1 + orcamento.margem_lucro);
    const comImposto = comMargem * (1 + orcamento.aliquota_imposto);
    return { custoBase, comMargem, comImposto };
  }

  const totalOrcamento = (orcamento.orcamento_itens ?? []).reduce(
    (acc, item) => {
      return acc + calcularItem(item).comImposto;
    },
    0,
  );

  const cliente = orcamento.cliente;
  const validade = new Date(orcamento.created_at);
  validade.setDate(validade.getDate() + orcamento.validade_dias);

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

  return (
    <div className="p-8 w-full flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-white/50 hover:text-white/80"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">{orcamento.titulo}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
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
              className={`w-36 border text-xs ${statusConfig[orcamento.status].class}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0d0d1a] border-white/10 text-white">
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="aprovado">Aprovado</SelectItem>
              <SelectItem value="recusado">Recusado</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={() => router.push(`/orcamentos/${orcamento.id}/editar`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5 hover:text-white/80 transition-all"
          >
            <PencilIcon className="w-4 h-4" />
            Editar
          </button>

          <button
            onClick={() =>
              router.push(`/orcamentos/${orcamento.id}/distribuicao`)
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-white/50 text-sm hover:bg-white/5 hover:text-white/80 transition-all"
          >
            <CalculatorIcon className="w-4 h-4" />
            Distribuição
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 text-sm hover:bg-sky-500/20 transition-all"
          >
            <DownloadIcon className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* conteúdo que vai pro PDF */}
      <div ref={pdfRef} className="flex flex-col gap-6 p-2">
        {/* info do cliente */}
        <div className="rounded-xl border border-white/10 bg-white/2 p-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
              Cliente
            </p>
            <p className="text-sm font-medium text-white/80">
              {cliente?.nome ?? "—"}
            </p>
            <p className="text-sm text-white/50 mt-1">
              {cliente?.email ?? "—"}
            </p>
            <p className="text-sm text-white/50">{cliente?.cpf_cnpj ?? "—"}</p>
            {cliente?.logradouro && (
              <p className="text-sm text-white/50 mt-1">
                {cliente.logradouro}, {cliente.numero} — {cliente.cidade}/
                {cliente.estado}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
              Detalhes
            </p>
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Margem de lucro</span>
                <span className="text-white/60">
                  {(orcamento.margem_lucro * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Alíquota imposto</span>
                <span className="text-white/60">
                  {(orcamento.aliquota_imposto * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Overhead/hora</span>
                <span className="text-white/60">
                  {formatBRL(overheadPorHora)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/30">Validade</span>
                <span className="text-white/60">
                  {validade.toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* itens */}
        <div className="flex flex-col gap-3">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Itens
          </p>

          {(orcamento.orcamento_itens ?? []).map((item, index) => {
            const calc = calcularItem(item);

            return (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white/30">{index + 1}.</span>
                    <span className="text-sm font-medium text-white/80">
                      {item.descricao}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-sky-300">
                    {formatBRL(calc.comImposto)}
                  </span>
                </div>

                {(item.orcamento_item_funcionarios ?? []).length > 0 && (
                  <div className="ml-6 flex flex-col gap-1.5 pt-2 border-t border-white/5">
                    {(item.orcamento_item_funcionarios ?? []).map((f) => {
                      const func = Array.isArray(f.funcionario_data)
                        ? f.funcionario_data[0]
                        : f.funcionario_data;

                      const salarioPorHora = (func?.salario ?? 0) / 220;
                      const custoFuncionario =
                        f.horas * (salarioPorHora + overheadPorHora);

                      return (
                        <div
                          key={f.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 text-[10px] font-medium">
                              {(func?.name ?? "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white/60">
                              {func?.name ?? "—"}
                            </span>
                            <span className="text-white/30">·</span>
                            <span className="text-white/30">
                              {f.horas}h ×{" "}
                              {formatBRL(salarioPorHora + overheadPorHora)}/h
                            </span>
                          </div>
                          <span className="text-white/50">
                            {formatBRL(custoFuncionario)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="ml-6 flex items-center gap-6 pt-2 border-t border-white/5 text-xs">
                  <span className="text-white/30">
                    Custo base:{" "}
                    <span className="text-white/50">
                      {formatBRL(calc.custoBase)}
                    </span>
                  </span>
                  <span className="text-white/30">
                    Com margem:{" "}
                    <span className="text-white/50">
                      {formatBRL(calc.comMargem)}
                    </span>
                  </span>
                  <span className="text-white/30">
                    Com imposto:{" "}
                    <span className="text-sky-300">
                      {formatBRL(calc.comImposto)}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* observações */}
        {orcamento.observacoes && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <p className="text-xs text-white/30 uppercase tracking-wider mb-2">
              Observações
            </p>
            <p className="text-sm text-white/50">{orcamento.observacoes}</p>
          </div>
        )}

        {/* total */}
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/30 uppercase tracking-wider">
              Total do orçamento
            </p>
            <p className="text-2xl font-semibold text-sky-300 mt-1">
              {formatBRL(totalOrcamento)}
            </p>
          </div>
          <div className="text-right text-sm text-white/30">
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
