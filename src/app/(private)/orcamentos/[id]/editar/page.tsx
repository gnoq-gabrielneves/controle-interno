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
import {
  calcularOrcamento,
  formatBRL,
  formatPct,
} from "@/helpers/calculo-orcamento";
import { useListClientes } from "@/hooks/use-clientes";
import { useListFuncionarios } from "@/hooks/use-funcionarios";
import { useGetOrcamento, useUpdateOrcamento } from "@/hooks/use-orcamentos";
import { OrcamentoTipo } from "@/types/orcamentos-types";
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  PlusIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

// ───────── tipos locais (UI) ─────────
type EquipeMembro = { funcionario_id: number; meses: number };

type Item = {
  id: string;
  descricao: string;
  descricao_detalhada: string;
  valor_manual: string;
  equipe: EquipeMembro[];
};

// ───────── tipos do orçamento existente (vindo do banco) ─────────
type FuncionarioRaw = {
  funcionario: number;
  meses_alocados: number;
  salario_snapshot: number;
};
type ItemRaw = {
  id: string;
  descricao: string;
  descricao_detalhada: string | null;
  valor_manual: number | null;
  orcamento_item_funcionarios: FuncionarioRaw[];
};
type ClienteRaw = { id: string; nome: string };
type OrcamentoRaw = {
  id: string;
  titulo: string;
  tipo: OrcamentoTipo;
  margem_lucro: number;
  aliquota_imposto: number;
  buffer_atraso: number;
  validade_dias: number;
  observacoes: string | null;
  cliente: ClienteRaw | null;
  orcamento_itens: ItemRaw[];
};

const TIPO_LABELS: Record<OrcamentoTipo, string> = {
  projeto_fechado: "Projeto fechado (preço único)",
  por_modulo: "Por módulo (preço por entrega)",
};

// ───────── shell: gate de loading ─────────
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
    <EditarOrcamentoForm orcamento={orcamento as unknown as OrcamentoRaw} />
  );
}

// ───────── form principal ─────────
function EditarOrcamentoForm({ orcamento }: { orcamento: OrcamentoRaw }) {
  const router = useRouter();
  const { mutate: updateOrcamento, isPending } = useUpdateOrcamento(
    orcamento.id,
  );
  const { data: clientes } = useListClientes();
  const { data: funcionarios } = useListFuncionarios();

  // ─── inicialização a partir do orçamento existente ───

  const [titulo, setTitulo] = useState(orcamento.titulo ?? "");
  const [clienteId, setClienteId] = useState(orcamento.cliente?.id ?? "");
  const [tipo, setTipo] = useState<OrcamentoTipo>(
    orcamento.tipo ?? "projeto_fechado",
  );
  const [validadeDias, setValidadeDias] = useState(
    orcamento.validade_dias ?? 30,
  );
  const [observacoes, setObservacoes] = useState(orcamento.observacoes ?? "");
  const [margemLucro, setMargemLucro] = useState(
    (orcamento.margem_lucro ?? 0.4) * 100,
  );
  const [aliquotaImposto, setAliquotaImposto] = useState(
    (orcamento.aliquota_imposto ?? 0.06) * 100,
  );
  const [bufferAtraso, setBufferAtraso] = useState(
    (orcamento.buffer_atraso ?? 0.2) * 100,
  );

  // equipe global: se projeto_fechado, lê do primeiro item (foi onde o novo salvou)
  const [equipeGlobal, setEquipeGlobal] = useState<EquipeMembro[]>(() => {
    if (orcamento.tipo === "projeto_fechado") {
      const primeiroItem = orcamento.orcamento_itens?.[0];
      return (primeiroItem?.orcamento_item_funcionarios ?? []).map((f) => ({
        funcionario_id: f.funcionario,
        meses: f.meses_alocados,
      }));
    }
    return [];
  });

  // itens (carrega do banco, ou cria um vazio se for orçamento sem itens)
  const [itens, setItens] = useState<Item[]>(() => {
    const itensExistentes = orcamento.orcamento_itens ?? [];

    if (itensExistentes.length === 0) {
      return [
        {
          id: crypto.randomUUID(),
          descricao: "",
          descricao_detalhada: "",
          valor_manual: "",
          equipe: [],
        },
      ];
    }

    return itensExistentes.map((item) => ({
      id: item.id,
      descricao: item.descricao,
      descricao_detalhada: item.descricao_detalhada ?? "",
      valor_manual: item.valor_manual != null ? String(item.valor_manual) : "",
      // em por_modulo cada item tem sua equipe; em projeto_fechado a equipe
      // mora no primeiro item mas é gerenciada via equipeGlobal, então
      // os itens individuais não precisam carregar nada
      equipe:
        orcamento.tipo === "por_modulo"
          ? (item.orcamento_item_funcionarios ?? []).map((f) => ({
              funcionario_id: f.funcionario,
              meses: f.meses_alocados,
            }))
          : [],
    }));
  });

  // helpers
  function getSalario(funcionarioId: number): number {
    const f = funcionarios?.find((fn) => fn.id === funcionarioId);
    return f?.salario ?? 0;
  }
  const clienteSelecionado = clientes?.find((c) => c.id === clienteId);

  // cálculo
  const calculo = useMemo(() => {
    const alocacoes =
      tipo === "projeto_fechado"
        ? equipeGlobal
        : itens.flatMap((i) => i.equipe);

    const funcionariosCalc = alocacoes
      .filter((a) => a.funcionario_id > 0)
      .map((a) => ({
        salario: getSalario(a.funcionario_id),
        meses: a.meses,
      }));

    const itensCalc =
      tipo === "por_modulo"
        ? itens.map((i) => ({
            valor: i.valor_manual.trim() === "" ? null : Number(i.valor_manual),
          }))
        : undefined;

    return calcularOrcamento({
      funcionarios: funcionariosCalc,
      bufferAtraso: bufferAtraso / 100,
      margemLucro: margemLucro / 100,
      aliquotaImposto: aliquotaImposto / 100,
      itens: itensCalc,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    tipo,
    equipeGlobal,
    itens,
    bufferAtraso,
    margemLucro,
    aliquotaImposto,
    funcionarios,
  ]);

  // ─── mutators ───

  function addMembroGlobal() {
    setEquipeGlobal((prev) => [...prev, { funcionario_id: 0, meses: 1 }]);
  }
  function removeMembroGlobal(index: number) {
    setEquipeGlobal((prev) => prev.filter((_, i) => i !== index));
  }
  function updateMembroGlobal(
    index: number,
    field: keyof EquipeMembro,
    value: number,
  ) {
    setEquipeGlobal((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  function addItem() {
    setItens((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        descricao: "",
        descricao_detalhada: "",
        valor_manual: "",
        equipe: [],
      },
    ]);
  }
  function removeItem(id: string) {
    setItens((prev) => prev.filter((item) => item.id !== id));
  }
  function updateItem(id: string, patch: Partial<Item>) {
    setItens((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addMembroItem(itemId: string) {
    setItens((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              equipe: [...item.equipe, { funcionario_id: 0, meses: 1 }],
            }
          : item,
      ),
    );
  }
  function removeMembroItem(itemId: string, index: number) {
    setItens((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, equipe: item.equipe.filter((_, i) => i !== index) }
          : item,
      ),
    );
  }
  function updateMembroItem(
    itemId: string,
    index: number,
    field: keyof EquipeMembro,
    value: number,
  ) {
    setItens((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              equipe: item.equipe.map((m, i) =>
                i === index ? { ...m, [field]: value } : m,
              ),
            }
          : item,
      ),
    );
  }

  // ─── submit ───
  function handleSubmit() {
    if (!titulo || !clienteId) return;

    const itensInput = itens.map((item) => {
      const equipeDoItem =
        tipo === "por_modulo"
          ? item.equipe
          : itens.indexOf(item) === 0
            ? equipeGlobal
            : [];

      return {
        descricao: item.descricao,
        descricao_detalhada: item.descricao_detalhada || null,
        valor_manual:
          tipo === "por_modulo" && item.valor_manual.trim() !== ""
            ? Number(item.valor_manual)
            : null,
        funcionarios: equipeDoItem
          .filter((m) => m.funcionario_id > 0)
          .map((m) => ({
            funcionario: m.funcionario_id,
            meses_alocados: m.meses,
            salario_snapshot: getSalario(m.funcionario_id),
          })),
      };
    });

    updateOrcamento(
      {
        titulo,
        cliente: clienteId,
        tipo,
        margem_lucro: margemLucro / 100,
        aliquota_imposto: aliquotaImposto / 100,
        buffer_atraso: bufferAtraso / 100,
        validade_dias: validadeDias,
        observacoes: observacoes || undefined,
        itens: itensInput,
      },
      {
        onSuccess: () => router.push(`/orcamentos/${orcamento.id}`),
      },
    );
  }

  // ─── estilos compartilhados ───
  const sectionStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 20,
  } as const;

  const inputStyle = {
    background: "var(--bg-card)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };

  const labelClass = "text-xs uppercase tracking-wider font-medium";

  // ─── breakdown lines ───
  const breakdownLines = [
    {
      label: "Custo da equipe",
      value: formatBRL(calculo.custoEquipe),
      muted: false,
      operator: "",
    },
    {
      label: `Buffer de atraso (${formatPct(bufferAtraso / 100)})`,
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
      label: `Margem de lucro (${formatPct(margemLucro / 100)})`,
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
      label: `Imposto (${formatPct(aliquotaImposto / 100)})`,
      value: formatBRL(calculo.valorImposto),
      muted: true,
      operator: "+",
    },
  ];

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
            {orcamento.titulo}
          </p>
        </div>
      </div>

      {/* dados básicos */}
      <div style={sectionStyle} className="flex flex-col gap-4">
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Dados básicos
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label
              className={labelClass}
              style={{ color: "var(--text-muted)" }}
            >
              Título do projeto
            </Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
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
              onValueChange={(v) => setClienteId(v ?? "")}
            >
              <SelectTrigger style={inputStyle} className="w-full">
                <SelectValue placeholder="Selecione">
                  {clienteSelecionado?.nome}
                </SelectValue>
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                {clientes?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
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
              Tipo de orçamento
            </Label>
            <Select
              value={tipo}
              onValueChange={(v) => v && setTipo(v as OrcamentoTipo)}
            >
              <SelectTrigger style={inputStyle} className="w-full">
                <SelectValue>{TIPO_LABELS[tipo]}</SelectValue>
              </SelectTrigger>
              <SelectContent sideOffset={4}>
                <SelectItem value="projeto_fechado">
                  {TIPO_LABELS.projeto_fechado}
                </SelectItem>
                <SelectItem value="por_modulo">
                  {TIPO_LABELS.por_modulo}
                </SelectItem>
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
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* CALCULADORA */}
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
            Calculadora
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
              {tipo === "por_modulo"
                ? "Valor cobrado (soma dos módulos)"
                : "Valor do projeto"}
            </span>
            {tipo === "por_modulo" && calculo.somaItens != null && (
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

        {tipo === "por_modulo" && calculo.temDivergencia && (
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
                  ? "Você está cobrando mais do que o necessário — confirma se é intencional."
                  : "Você está cobrando menos do que o necessário pra cobrir custo + buffer + margem."}
              </p>
            </div>
          </div>
        )}

        <div
          className="px-5 py-4 grid grid-cols-3 gap-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {[
            {
              label: "Buffer de atraso",
              value: bufferAtraso,
              setter: setBufferAtraso,
              hint: "Protege contra meses extras",
            },
            {
              label: "Margem de lucro",
              value: margemLucro,
              setter: setMargemLucro,
              hint: "Aplicada sobre custo protegido",
            },
            {
              label: "Imposto",
              value: aliquotaImposto,
              setter: setAliquotaImposto,
              hint: "Simples Nacional",
            },
          ].map((field) => (
            <div key={field.label} className="flex flex-col gap-1">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                {field.label} (%)
              </Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                value={field.value}
                onChange={(e) => field.setter(Number(e.target.value))}
                style={inputStyle}
              />
              <span
                className="text-[10px]"
                style={{ color: "var(--text-faint)" }}
              >
                {field.hint}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* EQUIPE GLOBAL */}
      {tipo === "projeto_fechado" && (
        <div style={sectionStyle} className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Equipe alocada
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--text-faint)" }}
              >
                Pessoas que vão trabalhar no projeto e por quantos meses
              </p>
            </div>
            <button
              type="button"
              onClick={addMembroGlobal}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <UserPlusIcon className="w-3.5 h-3.5" />
              Adicionar pessoa
            </button>
          </div>

          {equipeGlobal.length === 0 ? (
            <p
              className="text-sm py-4 text-center"
              style={{ color: "var(--text-faint)" }}
            >
              Nenhuma pessoa alocada ainda
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {equipeGlobal.map((membro, i) => (
                <MembroRow
                  key={i}
                  membro={membro}
                  funcionarios={funcionarios ?? []}
                  onUpdate={(field, value) =>
                    updateMembroGlobal(i, field, value)
                  }
                  onRemove={() => removeMembroGlobal(i)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ITENS / MÓDULOS */}
      <div style={sectionStyle} className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {tipo === "por_modulo" ? "Módulos" : "Escopo do projeto"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
              {tipo === "por_modulo"
                ? "Cada módulo tem sua equipe e seu preço"
                : "Itens descritivos do escopo (aparecem no PDF do cliente)"}
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-all"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <PlusIcon className="w-3.5 h-3.5" />
            {tipo === "por_modulo" ? "Adicionar módulo" : "Adicionar item"}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {itens.map((item, idx) => (
            <div
              key={item.id}
              className="rounded-lg p-4 flex flex-col gap-3"
              style={{
                border: "1px solid var(--border)",
                background: "var(--bg-card-alt)",
              }}
            >
              <div className="flex items-start gap-3">
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
                <div className="flex-1 flex flex-col gap-2">
                  <Input
                    value={item.descricao}
                    onChange={(e) =>
                      updateItem(item.id, { descricao: e.target.value })
                    }
                    placeholder={
                      tipo === "por_modulo"
                        ? "Nome do módulo (ex: Estoque)"
                        : "Descrição do item"
                    }
                    style={inputStyle}
                  />
                  <Input
                    value={item.descricao_detalhada}
                    onChange={(e) =>
                      updateItem(item.id, {
                        descricao_detalhada: e.target.value,
                      })
                    }
                    placeholder="Detalhamento (opcional)"
                    style={inputStyle}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={itens.length === 1}
                  className="p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => {
                    if (itens.length > 1)
                      e.currentTarget.style.color = "var(--error)";
                  }}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                >
                  <Trash2Icon className="w-4 h-4" />
                </button>
              </div>

              {tipo === "por_modulo" && (
                <div
                  className="pl-9 flex flex-col gap-3 pt-3"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs uppercase tracking-wider"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Equipe deste módulo
                    </span>
                    <button
                      type="button"
                      onClick={() => addMembroItem(item.id)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-all"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <UserPlusIcon className="w-3 h-3" />
                      Pessoa
                    </button>
                  </div>

                  {item.equipe.length === 0 ? (
                    <p
                      className="text-xs py-2"
                      style={{ color: "var(--text-faint)" }}
                    >
                      Nenhuma pessoa neste módulo
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {item.equipe.map((membro, i) => (
                        <MembroRow
                          key={i}
                          membro={membro}
                          funcionarios={funcionarios ?? []}
                          onUpdate={(field, value) =>
                            updateMembroItem(item.id, i, field, value)
                          }
                          onRemove={() => removeMembroItem(item.id, i)}
                          compact
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 mt-1">
                    <Label
                      className={labelClass}
                      style={{ color: "var(--text-muted)" }}
                    >
                      Valor cobrado neste módulo
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.valor_manual}
                      onChange={(e) =>
                        updateItem(item.id, { valor_manual: e.target.value })
                      }
                      placeholder="R$ 0,00"
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* observações */}
      <div style={sectionStyle} className="flex flex-col gap-2">
        <Label className={labelClass} style={{ color: "var(--text-muted)" }}>
          Observações (opcional)
        </Label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          className="rounded-md p-2 text-sm"
          style={{
            ...inputStyle,
            border: "1px solid var(--border)",
            resize: "vertical",
          }}
          placeholder="Condições especiais, prazos diferenciados, etc."
        />
      </div>

      {/* ações */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 rounded-lg text-sm transition-all"
          style={{
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !titulo || !clienteId}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "var(--primary)",
            color: "#ffffff",
            border: "1px solid var(--primary)",
          }}
        >
          {isPending ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// MembroRow — idêntico ao da novo/page.tsx
// ──────────────────────────────────────────────────────────────────
function MembroRow({
  membro,
  funcionarios,
  onUpdate,
  onRemove,
  compact = false,
}: {
  membro: EquipeMembro;
  funcionarios: { id: number; name: string; salario: number }[];
  onUpdate: (field: keyof EquipeMembro, value: number) => void;
  onRemove: () => void;
  compact?: boolean;
}) {
  const func = funcionarios.find((f) => f.id === membro.funcionario_id);
  const salario = func?.salario ?? 0;
  const custoTotal = salario * membro.meses;

  const inputStyle = {
    background: "var(--bg-card)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="grid items-center gap-2"
      style={{
        gridTemplateColumns: compact
          ? "1fr 110px 80px 100px 28px"
          : "1fr 140px 100px 130px 32px",
      }}
    >
      <Select
        value={membro.funcionario_id ? String(membro.funcionario_id) : ""}
        onValueChange={(v) => v && onUpdate("funcionario_id", Number(v))}
      >
        <SelectTrigger style={inputStyle} className="w-full">
          <SelectValue placeholder="Selecione">{func?.name}</SelectValue>
        </SelectTrigger>
        <SelectContent sideOffset={4}>
          {funcionarios.map((f) => (
            <SelectItem key={f.id} value={String(f.id)}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={formatBRL(salario)}
        disabled
        style={{
          ...inputStyle,
          color: "var(--text-muted)",
          fontVariantNumeric: "tabular-nums",
        }}
        title="Salário do cadastro do funcionário (não editável)"
      />

      <Input
        type="number"
        min="0"
        step="0.5"
        value={membro.meses}
        onChange={(e) => onUpdate("meses", Number(e.target.value))}
        style={inputStyle}
        placeholder="Meses"
      />

      <Input
        value={formatBRL(custoTotal)}
        disabled
        style={{
          ...inputStyle,
          color: custoTotal > 0 ? "var(--primary)" : "var(--text-muted)",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 500,
        }}
        title="Custo total (salário × meses)"
      />

      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 rounded transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--text-muted)")
        }
      >
        <Trash2Icon className="w-4 h-4" />
      </button>
    </div>
  );
}
