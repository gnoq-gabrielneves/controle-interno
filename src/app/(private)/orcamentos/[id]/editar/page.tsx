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

type ItemFuncionario = {
  funcionario_id: number;
  horas: number;
};

type Item = {
  id: string;
  descricao: string;
  funcionarios: ItemFuncionario[];
};

type FuncionarioExistente = {
  funcionario: number;
  horas: number;
};

type OrcamentoItemExistente = {
  id: string;
  descricao: string;
  orcamento_item_funcionarios: FuncionarioExistente[];
};

type ClienteExistente = {
  id: string;
  nome: string;
};

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

type Gasto = {
  recorrencia: "mensal" | "anual";
  valor: number;
};

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
        <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
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
      return [{ id: crypto.randomUUID(), descricao: "", funcionarios: [] }];
    }
    return orcamento.orcamento_itens.map((item) => ({
      id: item.id,
      descricao: item.descricao,
      funcionarios: (item.orcamento_item_funcionarios ?? []).map((f) => ({
        funcionario_id: f.funcionario,
        horas: f.horas,
      })),
    }));
  });

  const overheadPorHora = useMemo(() => {
    const totalMensal =
      (gastos as Gasto[] | undefined)?.reduce((acc, g) => {
        return acc + (g.recorrencia === "mensal" ? g.valor : g.valor / 12);
      }, 0) ?? 0;
    const totalFunc = funcionarios?.length ?? 1;
    return totalMensal / (totalFunc * 220);
  }, [gastos, funcionarios]);

  function calcularItem(item: Item) {
    const custoBase = item.funcionarios.reduce((acc, f) => {
      const func = funcionarios?.find((fn) => fn.id === f.funcionario_id);
      if (!func) return acc;
      const salarioPorHora = (func.salario ?? 0) / 220;
      return acc + f.horas * (salarioPorHora + overheadPorHora);
    }, 0);
    const comMargem = custoBase * (1 + margemLucro / 100);
    const comImposto = comMargem * (1 + aliquotaImposto / 100);
    return { custoBase, comMargem, comImposto };
  }

  const totalOrcamento = useMemo(() => {
    return itens.reduce((acc, item) => acc + calcularItem(item).comImposto, 0);
  }, [itens, margemLucro, aliquotaImposto, funcionarios, overheadPorHora]);

  function addItem() {
    setItens((prev) => [
      ...prev,
      { id: crypto.randomUUID(), descricao: "", funcionarios: [] },
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
          funcionarios: item.funcionarios
            .filter((f) => f.funcionario_id !== 0)
            .map((f) => ({ funcionario: f.funcionario_id, horas: f.horas })),
        })),
      },
      {
        onSuccess: () => router.push(`/orcamentos/${orcamento.id}`),
      },
    );
  }

  const inputClass =
    "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-sky-500/50";
  const labelClass = "text-white/60 text-xs uppercase tracking-wider";

  return (
    <div className="p-8 w-full flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-white/50 hover:text-white/80"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold">Editar orçamento</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overhead/hora:{" "}
            <span className="text-sky-300">{formatBRL(overheadPorHora)}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* dados do orçamento */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 flex flex-col gap-4">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Dados do orçamento
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label className={labelClass}>Título</Label>
              <Input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Cliente</Label>
              <Select
                value={clienteId}
                onValueChange={(v) => v && setClienteId(v)}
              >
                <SelectTrigger className="bg-white/5 w-full border-white/10 text-white">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d1a] border-white/10 text-white">
                  {clientes?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Validade (dias)</Label>
              <Input
                type="number"
                value={validadeDias}
                onChange={(e) => setValidadeDias(Number(e.target.value))}
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Margem de lucro (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={margemLucro}
                onChange={(e) => setMargemLucro(Number(e.target.value))}
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Alíquota imposto (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={aliquotaImposto}
                onChange={(e) => setAliquotaImposto(Number(e.target.value))}
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label className={labelClass}>Observações</Label>
              <Input
                placeholder="Opcional"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* itens */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/30 uppercase tracking-wider">
              Itens do orçamento
            </p>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-200 transition-colors"
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
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30 w-5">
                    {itemIndex + 1}.
                  </span>
                  <Input
                    placeholder="Descrição do item"
                    value={item.descricao}
                    onChange={(e) =>
                      updateItemDescricao(item.id, e.target.value)
                    }
                    required
                    className={`flex-1 ${inputClass}`}
                  />
                  {itens.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-8">
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
                        <SelectTrigger className="bg-white/5 flex-1 border-white/10 text-white">
                          <SelectValue placeholder="Selecione um funcionário" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d0d1a] border-white/10 text-white">
                          {funcionarios?.map((fn) => (
                            <SelectItem key={fn.id} value={String(fn.id)}>
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
                          className={`w-20 ${inputClass}`}
                        />
                        <span className="text-xs text-white/30">h</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeFuncionarioFromItem(item.id, fIndex)
                        }
                        className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2Icon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addFuncionarioToItem(item.id)}
                    className="flex items-center gap-1.5 text-xs text-white/30 hover:text-sky-300 transition-colors w-fit"
                  >
                    <UserPlusIcon className="w-3.5 h-3.5" />
                    Atribuir funcionário
                  </button>
                </div>

                {item.funcionarios.length > 0 && (
                  <div className="ml-8 flex items-center gap-6 pt-2 border-t border-white/5">
                    <div>
                      <p className="text-xs text-white/30">Custo base</p>
                      <p className="text-sm text-white/50">
                        {formatBRL(calc.custoBase)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">
                        Com margem ({margemLucro}%)
                      </p>
                      <p className="text-sm text-white/50">
                        {formatBRL(calc.comMargem)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/30">
                        Com imposto ({aliquotaImposto}%)
                      </p>
                      <p className="text-sm text-sky-300 font-medium">
                        {formatBRL(calc.comImposto)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

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
          <div className="text-right">
            <p className="text-xs text-white/30">Overhead aplicado</p>
            <p className="text-sm text-white/50">
              {formatBRL(overheadPorHora)}/hora
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending || !clienteId || !titulo}
          className="w-full py-2.5 rounded-lg border border-sky-500/30 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-sm transition-all disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
