"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListClientes } from "@/hooks/use-clientes";
import { useListFuncionarios } from "@/hooks/use-funcionarios";
import { useCountSocietarios, useListGastos } from "@/hooks/use-gastos";
import { useGetOrcamento, useUpdateOrcamento } from "@/hooks/use-orcamentos";
import {
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type ItemFuncionario = { funcionario_id: number; horas: number };
type Item = {
  id: string;
  descricao: string;
  descricao_detalhada: string;
  funcionarios: ItemFuncionario[];
};
type FuncionarioExistente = { funcionario: number; horas: number };
type OrcamentoItemExistente = {
  id: string;
  descricao: string;
  descricao_detalhada?: string;
  orcamento_item_funcionarios: FuncionarioExistente[];
};
type ClienteExistente = { id: string; nome: string };
type OrcamentoExistente = {
  id: string;
  titulo: string;
  margem_lucro: number;
  aliquota_imposto: number;
  validade_dias: number;
  observacoes: string | null;
  cliente: ClienteExistente | null;
  orcamento_itens: OrcamentoItemExistente[];
};
type Gasto = { recorrencia: "mensal" | "anual"; valor: number };

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function EditarOrcamentoPage() {
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
    <EditarOrcamentoForm
      orcamento={orcamento as unknown as OrcamentoExistente}
    />
  );
}

function EditarOrcamentoForm({ orcamento }: { orcamento: OrcamentoExistente }) {
  const router = useRouter();
  const { mutate: updateOrcamento, isPending } = useUpdateOrcamento(
    orcamento.id,
  );
  const { data: clientes } = useListClientes();
  const { data: funcionarios } = useListFuncionarios();
  const { data: gastos } = useListGastos();
  useCountSocietarios();

  const [titulo, setTitulo] = useState(orcamento.titulo ?? "");
  const [clienteId, setClienteId] = useState(orcamento.cliente?.id ?? "");
  const [margemLucro, setMargemLucro] = useState(
    (orcamento.margem_lucro ?? 0.1) * 100,
  );
  const [aliquotaImposto, setAliquotaImposto] = useState(
    (orcamento.aliquota_imposto ?? 0.06) * 100,
  );
  const [validadeDias, setValidadeDias] = useState(
    orcamento.validade_dias ?? 30,
  );
  const [observacoes, setObservacoes] = useState(orcamento.observacoes ?? "");

  const [itens, setItens] = useState<Item[]>(() => {
    if (!orcamento.orcamento_itens?.length) {
      return [
        {
          id: crypto.randomUUID(),
          descricao: "",
          descricao_detalhada: "",
          funcionarios: [],
        },
      ];
    }
    return orcamento.orcamento_itens.map((item) => ({
      id: item.id,
      descricao: item.descricao,
      descricao_detalhada: item.descricao_detalhada ?? "",
      funcionarios: (item.orcamento_item_funcionarios ?? []).map((f) => ({
        funcionario_id: f.funcionario,
        horas: f.horas,
      })),
    }));
  });

  const overheadPorHora = useMemo(() => {
    const totalMensal =
      (gastos as Gasto[] | undefined)?.reduce(
        (acc, g) => acc + (g.recorrencia === "mensal" ? g.valor : g.valor / 12),
        0,
      ) ?? 0;
    return totalMensal / ((funcionarios?.length ?? 1) * 220);
  }, [gastos, funcionarios]);

  function calcularItem(item: Item) {
    const custoBase = item.funcionarios.reduce((acc, f) => {
      const func = funcionarios?.find((fn) => fn.id === f.funcionario_id);
      if (!func) return acc;
      return acc + f.horas * ((func.salario ?? 0) / 220 + overheadPorHora);
    }, 0);
    const comMargem = custoBase * (1 + margemLucro / 100);
    const comImposto = comMargem * (1 + aliquotaImposto / 100);
    return { custoBase, comMargem, comImposto };
  }

  const totalOrcamento = useMemo(
    () => itens.reduce((acc, item) => acc + calcularItem(item).comImposto, 0),
    [itens, margemLucro, aliquotaImposto, funcionarios, overheadPorHora],
  );

  function addItem() {
    setItens((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        descricao: "",
        descricao_detalhada: "",
        funcionarios: [],
      },
    ]);
  }
  function removeItem(itemId: string) {
    setItens((prev) => prev.filter((item) => item.id !== itemId));
  }
  function updateItemDescricao(itemId: string, descricao: string) {
    setItens((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, descricao } : item)),
    );
  }
  function updateItemDescricaoDetalhada(
    itemId: string,
    descricao_detalhada: string,
  ) {
    setItens((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, descricao_detalhada } : item,
      ),
    );
  }
  function addFuncionarioToItem(itemId: string) {
    setItens((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              funcionarios: [
                ...item.funcionarios,
                { funcionario_id: 0, horas: 1 },
              ],
            }
          : item,
      ),
    );
  }
  function removeFuncionarioFromItem(itemId: string, index: number) {
    setItens((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              funcionarios: item.funcionarios.filter((_, i) => i !== index),
            }
          : item,
      ),
    );
  }
  function updateFuncionarioInItem(
    itemId: string,
    index: number,
    field: keyof ItemFuncionario,
    value: number,
  ) {
    setItens((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              funcionarios: item.funcionarios.map((f, i) =>
                i === index ? { ...f, [field]: value } : f,
              ),
            }
          : item,
      ),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateOrcamento(
      {
        titulo,
        cliente: clienteId,
        margem_lucro: margemLucro / 100,
        aliquota_imposto: aliquotaImposto / 100,
        validade_dias: validadeDias,
        observacoes: observacoes || undefined,
        itens: itens.map((item) => ({
          descricao: item.descricao,
          descricao_detalhada: item.descricao_detalhada || null, // ← undefined → null
          funcionarios: item.funcionarios
            .filter((f) => f.funcionario_id !== 0)
            .map((f) => ({ funcionario: f.funcionario_id, horas: f.horas })),
        })),
      },
      { onSuccess: () => router.push(`/orcamentos/${orcamento.id}`) },
    );
  }

  const inputStyle = {
    background: "var(--bg-card)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };
  const labelClass = "text-xs uppercase tracking-wider font-medium";
  const sectionStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 24,
  };

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
            Editar orçamento
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Overhead/hora:{" "}
            <span style={{ color: "var(--primary)", fontWeight: 500 }}>
              {formatBRL(overheadPorHora)}
            </span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* dados do orçamento */}
        <div style={sectionStyle} className="flex flex-col gap-4">
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Dados do orçamento
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Título
              </Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Cliente
              </Label>
              <Select
                value={clienteId}
                onValueChange={(v) => v && setClienteId(v)}
              >
                <SelectTrigger
                  className="w-full"
                  style={{ ...inputStyle, height: 36 }}
                >
                  <SelectValue placeholder="Selecione um cliente">
                    {clientes?.find((c) => c.id === clienteId)?.nome ??
                      "Selecione um cliente"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {clientes?.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      style={{ color: "var(--text-primary)" }}
                    >
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Validade (dias)
              </Label>
              <Input
                type="number"
                value={validadeDias}
                onChange={(e) => setValidadeDias(Number(e.target.value))}
                required
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Margem de lucro (%)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={margemLucro}
                onChange={(e) => setMargemLucro(Number(e.target.value))}
                required
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Alíquota imposto (%)
              </Label>
              <Input
                type="number"
                step="0.1"
                value={aliquotaImposto}
                onChange={(e) => setAliquotaImposto(Number(e.target.value))}
                required
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Observações
              </Label>
              <Input
                placeholder="Opcional"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* itens */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Itens do orçamento
            </p>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: "var(--primary)" }}
            >
              <PlusIcon className="w-3.5 h-3.5" />
              Adicionar item
            </button>
          </div>

          {itens.map((item, itemIndex) => {
            const calc = calcularItem(item);
            return (
              <div
                key={item.id}
                style={sectionStyle}
                className="flex flex-col gap-4"
              >
                {/* título do item */}
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs w-5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {itemIndex + 1}.
                  </span>
                  <Input
                    placeholder="Título do item"
                    value={item.descricao}
                    onChange={(e) =>
                      updateItemDescricao(item.id, e.target.value)
                    }
                    required
                    className="flex-1"
                    style={inputStyle}
                  />
                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 transition-colors"
                      style={{ color: "var(--text-faint)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "var(--error)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--text-faint)")
                      }
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* descrição detalhada */}
                <div className="ml-6">
                  <textarea
                    placeholder="Descrição detalhada do item (opcional)"
                    value={item.descricao_detalhada}
                    onChange={(e) =>
                      updateItemDescricaoDetalhada(item.id, e.target.value)
                    }
                    rows={2}
                    className="flex w-full rounded-md border px-3 py-2 text-sm resize-none"
                    style={{ ...inputStyle, outline: "none" }}
                  />
                </div>

                {/* funcionários */}
                <div className="flex flex-col gap-2 ml-6">
                  {item.funcionarios.map((f, fIndex) => (
                    <div key={fIndex} className="flex items-center gap-3">
                      <Select
                        value={f.funcionario_id ? String(f.funcionario_id) : ""}
                        onValueChange={(v) =>
                          v &&
                          updateFuncionarioInItem(
                            item.id,
                            fIndex,
                            "funcionario_id",
                            Number(v),
                          )
                        }
                      >
                        <SelectTrigger
                          className="flex-1"
                          style={{ ...inputStyle, height: 36 }}
                        >
                          <SelectValue placeholder="Selecione um funcionário">
                            {funcionarios?.find(
                              (fn) => fn.id === f.funcionario_id,
                            )?.name ?? "Selecione um funcionário"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          style={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {funcionarios?.map((fn) => (
                            <SelectItem
                              key={fn.id}
                              value={String(fn.id)}
                              style={{ color: "var(--text-primary)" }}
                            >
                              {fn.name} — {formatBRL((fn.salario ?? 0) / 220)}/h
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2 w-32">
                        <Input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={f.horas}
                          onChange={(e) =>
                            updateFuncionarioInItem(
                              item.id,
                              fIndex,
                              "horas",
                              Number(e.target.value),
                            )
                          }
                          className="w-20"
                          style={inputStyle}
                        />
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          h
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeFuncionarioFromItem(item.id, fIndex)
                        }
                        className="p-1.5 transition-colors"
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
                  ))}

                  <button
                    type="button"
                    onClick={() => addFuncionarioToItem(item.id)}
                    className="flex items-center gap-1.5 text-xs transition-colors w-fit"
                    style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--primary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    <UserPlusIcon className="w-3.5 h-3.5" />
                    Atribuir funcionário
                  </button>
                </div>

                {/* preview de cálculo */}
                {item.funcionarios.length > 0 && (
                  <div
                    className="ml-6 flex items-center gap-6 pt-2"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    {[
                      {
                        label: "Custo base",
                        value: formatBRL(calc.custoBase),
                        highlight: false,
                      },
                      {
                        label: `Com margem (${margemLucro}%)`,
                        value: formatBRL(calc.comMargem),
                        highlight: false,
                      },
                      {
                        label: `Com imposto (${aliquotaImposto}%)`,
                        value: formatBRL(calc.comImposto),
                        highlight: true,
                      },
                    ].map((b) => (
                      <div key={b.label}>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {b.label}
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{
                            color: b.highlight
                              ? "var(--primary)"
                              : "var(--text-secondary)",
                          }}
                        >
                          {b.value}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Overhead aplicado
            </p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {formatBRL(overheadPorHora)}/hora
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !clienteId || !titulo}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
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
          {isPending ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
