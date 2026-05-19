"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL } from "@/helpers/calculo-orcamento";
import { calcularDistribuicaoRodada } from "@/helpers/calculo-rodada";
import { useGetConfiguracoes } from "@/hooks/use-configuracoes";
import { useListFuncionarios } from "@/hooks/use-funcionarios";
import { useGetOrcamento, useListOrcamentos } from "@/hooks/use-orcamentos";
import { useCreateRodada } from "@/hooks/use-rodadas";
import { useListSocietarios } from "@/hooks/use-societarios";
import { DistribuicaoTipo } from "@/types/rodadas-types";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";

type Modo = "com_orcamento" | "avulsa";

type LinhaAvulsa = {
  id: string;
  funcionario: number | null;
  tipo: DistribuicaoTipo;
  valor: string;
};

const TIPO_LABELS: Record<DistribuicaoTipo, string> = {
  equipe: "Equipe",
  lucro_socio: "Lucro sócio",
  reserva: "Reserva",
  imposto: "Imposto",
};

function inputStyle() {
  return {
    background: "var(--bg-card)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };
}

export function NovaRodadaDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate: createRodada, isPending } = useCreateRodada();
  const { data: orcamentos } = useListOrcamentos();
  const { data: funcionarios } = useListFuncionarios();
  const { data: societarios } = useListSocietarios();
  const { data: config } = useGetConfiguracoes();

  // ─── estado comum ───
  const [modo, setModo] = useState<Modo>("com_orcamento");
  const [descricao, setDescricao] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [dataRecebimento, setDataRecebimento] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [observacoes, setObservacoes] = useState("");

  // ─── modo com orçamento ───
  const [orcamentoId, setOrcamentoId] = useState("");
  const { data: orcamentoCompleto } = useGetOrcamento(orcamentoId);

  // ─── modo avulsa ───
  const [linhasAvulsas, setLinhasAvulsas] = useState<LinhaAvulsa[]>([
    {
      id: crypto.randomUUID(),
      funcionario: null,
      tipo: "equipe",
      valor: "",
    },
  ]);

  // ─── cálculo (só roda quando tem dados suficientes) ───
  const calculo = useMemo(() => {
    if (
      modo !== "com_orcamento" ||
      !orcamentoCompleto ||
      !societarios ||
      !config ||
      !valorRecebido ||
      Number(valorRecebido) <= 0
    ) {
      return null;
    }
    return calcularDistribuicaoRodada({
      orcamento: orcamentoCompleto as never,
      societarios: societarios as never,
      config,
      valorRecebido: Number(valorRecebido),
    });
  }, [modo, orcamentoCompleto, societarios, config, valorRecebido]);

  function resetState() {
    setModo("com_orcamento");
    setDescricao("");
    setValorRecebido("");
    setDataRecebimento(new Date().toISOString().slice(0, 10));
    setObservacoes("");
    setOrcamentoId("");
    setLinhasAvulsas([
      {
        id: crypto.randomUUID(),
        funcionario: null,
        tipo: "equipe",
        valor: "",
      },
    ]);
  }

  function handleOpenChange(o: boolean) {
    if (!o) resetState();
    onOpenChange(o);
  }

  function handleSubmit() {
    if (modo === "com_orcamento") {
      if (!calculo || !orcamentoId) return;
      createRodada(
        {
          tipo: "com_orcamento",
          orcamento: orcamentoId,
          descricao,
          valor_recebido: Number(valorRecebido),
          data_recebimento: dataRecebimento,
          observacoes: observacoes || undefined,
          distribuicoes: calculo.distribuicoes.map((d) => ({
            funcionario: d.funcionario,
            tipo: d.tipo,
            valor: d.valor,
          })),
        },
        { onSuccess: () => handleOpenChange(false) },
      );
    } else {
      const distribuicoes = linhasAvulsas
        .filter((l) => Number(l.valor) > 0)
        .map((l) => ({
          funcionario: l.funcionario,
          tipo: l.tipo,
          valor: Number(l.valor),
        }));

      createRodada(
        {
          tipo: "avulsa",
          descricao,
          valor_recebido: Number(valorRecebido),
          data_recebimento: dataRecebimento,
          observacoes: observacoes || undefined,
          distribuicoes,
        },
        { onSuccess: () => handleOpenChange(false) },
      );
    }
  }

  const orcamentosAprovados = useMemo(
    () => orcamentos?.filter((o) => o.status === "aprovado") ?? [],
    [orcamentos],
  );

  const orcamentoSelecionado = orcamentosAprovados.find(
    (o) => o.id === orcamentoId,
  );

  const canSubmit =
    !!descricao &&
    !!valorRecebido &&
    Number(valorRecebido) > 0 &&
    (modo === "com_orcamento" ? !!orcamentoId && !!calculo : true);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="!max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "var(--text-primary)" }}>
            Nova rodada de pagamento
          </DialogTitle>
        </DialogHeader>

        {/* tabs de modo */}
        <div
          className="flex p-1 rounded-lg"
          style={{
            background: "var(--bg-card-alt)",
            border: "1px solid var(--border)",
          }}
        >
          {(["com_orcamento", "avulsa"] as Modo[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className="flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                background: modo === m ? "var(--bg-card)" : "transparent",
                color: modo === m ? "var(--primary)" : "var(--text-muted)",
                boxShadow: modo === m ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
              }}
            >
              {m === "com_orcamento" ? "Vinculada a orçamento" : "Avulsa"}
            </button>
          ))}
        </div>

        {/* campos comuns */}
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Data do recebimento">
            <Input
              type="date"
              value={dataRecebimento}
              onChange={(e) => setDataRecebimento(e.target.value)}
              style={inputStyle()}
            />
          </Campo>
          <Campo label="Valor recebido">
            <Input
              type="number"
              step="0.01"
              value={valorRecebido}
              onChange={(e) => setValorRecebido(e.target.value)}
              placeholder="R$ 0,00"
              style={inputStyle()}
            />
          </Campo>
        </div>

        {/* MODO COM ORÇAMENTO */}
        {modo === "com_orcamento" && (
          <div className="flex flex-col gap-3">
            <Campo label="Orçamento (aprovados)">
              <Select
                value={orcamentoId}
                onValueChange={(v) => {
                  setOrcamentoId(v ?? "");
                  const o = orcamentosAprovados.find((x) => x.id === v);
                  if (o && !descricao) setDescricao(`Pagamento — ${o.titulo}`);
                }}
              >
                <SelectTrigger style={inputStyle()} className="w-full">
                  <SelectValue placeholder="Selecione um orçamento aprovado">
                    {orcamentoSelecionado?.titulo}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent sideOffset={4}>
                  {orcamentosAprovados.length === 0 ? (
                    <div
                      className="px-3 py-2 text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Nenhum orçamento aprovado.
                    </div>
                  ) : (
                    orcamentosAprovados.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.titulo}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </Campo>

            <Campo label="Descrição">
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Sinal do projeto X"
                style={inputStyle()}
              />
            </Campo>

            {/* preview da distribuição calculada */}
            {calculo && (
              <div
                className="rounded-lg p-3 flex flex-col gap-2"
                style={{
                  background: "var(--bg-card-alt)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex justify-between items-center">
                  <span
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Distribuição calculada
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: "var(--primary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {(calculo.percentualRecebido * 100).toFixed(2)}% do
                    orçamento ({formatBRL(calculo.valorOrcamento)})
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 mt-1">
                  {calculo.distribuicoes.map((d, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center text-xs"
                    >
                      <span style={{ color: "var(--text-secondary)" }}>
                        {d.nome}
                        {d.detalhe && (
                          <span
                            style={{
                              color: "var(--text-faint)",
                              marginLeft: 6,
                              fontSize: 10,
                            }}
                          >
                            ({d.detalhe})
                          </span>
                        )}
                      </span>
                      <span
                        style={{
                          color: "var(--text-primary)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatBRL(d.valor)}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  className="flex justify-between items-center pt-2 mt-1 text-sm font-medium"
                  style={{ borderTop: "1px solid var(--border)" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>Total</span>
                  <span
                    style={{
                      color: "var(--primary)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatBRL(calculo.totalDistribuido)}
                  </span>
                </div>

                {Math.abs(calculo.diferenca) > 0.05 && (
                  <div
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: "var(--warning-bg)",
                      color: "var(--warning)",
                    }}
                  >
                    Diferença de {formatBRL(Math.abs(calculo.diferenca))}{" "}
                    {calculo.diferenca > 0
                      ? "não distribuída"
                      : "distribuída a mais"}{" "}
                    (arredondamento)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODO AVULSA */}
        {modo === "avulsa" && (
          <div className="flex flex-col gap-3">
            <Campo label="Descrição">
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex: Consultoria avulsa"
                style={inputStyle()}
              />
            </Campo>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label
                  className="text-xs uppercase tracking-wider font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Distribuições
                </Label>
                <button
                  type="button"
                  onClick={() =>
                    setLinhasAvulsas((p) => [
                      ...p,
                      {
                        id: crypto.randomUUID(),
                        funcionario: null,
                        tipo: "equipe",
                        valor: "",
                      },
                    ])
                  }
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-all"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <PlusIcon className="w-3 h-3" />
                  Adicionar
                </button>
              </div>

              {linhasAvulsas.map((linha, idx) => (
                <LinhaAvulsaRow
                  key={linha.id}
                  linha={linha}
                  funcionarios={funcionarios ?? []}
                  onUpdate={(patch) =>
                    setLinhasAvulsas((p) =>
                      p.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
                    )
                  }
                  onRemove={() =>
                    setLinhasAvulsas((p) => p.filter((_, i) => i !== idx))
                  }
                  canRemove={linhasAvulsas.length > 1}
                />
              ))}

              <ResumoAvulsa
                linhas={linhasAvulsas}
                valorRecebido={Number(valorRecebido) || 0}
              />
            </div>
          </div>
        )}

        {/* observações comum */}
        <Campo label="Observações (opcional)">
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={2}
            className="rounded-md p-2 text-sm w-full"
            style={{
              ...inputStyle(),
              border: "1px solid var(--border)",
              resize: "vertical",
            }}
            placeholder="Notas internas, comprovante, etc."
          />
        </Campo>

        {/* ações */}
        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="px-4 py-2 rounded-lg text-sm transition-all"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !canSubmit}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--primary)",
              color: "#ffffff",
              border: "1px solid var(--primary)",
            }}
          >
            {isPending ? "Criando..." : "Criar rodada"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────────
// LINHA AVULSA
// ──────────────────────────────────────────────────────────────────
function LinhaAvulsaRow({
  linha,
  funcionarios,
  onUpdate,
  onRemove,
  canRemove,
}: {
  linha: LinhaAvulsa;
  funcionarios: { id: number; name: string }[];
  onUpdate: (patch: Partial<LinhaAvulsa>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const func = funcionarios.find((f) => f.id === linha.funcionario);
  const precisaFuncionario =
    linha.tipo === "equipe" || linha.tipo === "lucro_socio";

  return (
    <div
      className="grid items-center gap-2"
      style={{ gridTemplateColumns: "140px 1fr 110px 28px" }}
    >
      <Select
        value={linha.tipo}
        onValueChange={(v) => {
          if (!v) return;
          onUpdate({
            tipo: v as DistribuicaoTipo,
            funcionario:
              v === "reserva" || v === "imposto" ? null : linha.funcionario,
          });
        }}
      >
        <SelectTrigger style={inputStyle()} className="w-full">
          <SelectValue>{TIPO_LABELS[linha.tipo]}</SelectValue>
        </SelectTrigger>
        <SelectContent sideOffset={4}>
          <SelectItem value="equipe">{TIPO_LABELS.equipe}</SelectItem>
          <SelectItem value="lucro_socio">{TIPO_LABELS.lucro_socio}</SelectItem>
          <SelectItem value="reserva">{TIPO_LABELS.reserva}</SelectItem>
          <SelectItem value="imposto">{TIPO_LABELS.imposto}</SelectItem>
        </SelectContent>
      </Select>

      {precisaFuncionario ? (
        <Select
          value={linha.funcionario ? String(linha.funcionario) : ""}
          onValueChange={(v) => v && onUpdate({ funcionario: Number(v) })}
        >
          <SelectTrigger style={inputStyle()} className="w-full">
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
      ) : (
        <Input
          value={linha.tipo === "reserva" ? "Reserva da empresa" : "Imposto"}
          disabled
          style={{ ...inputStyle(), color: "var(--text-muted)" }}
        />
      )}

      <Input
        type="number"
        step="0.01"
        value={linha.valor}
        onChange={(e) => onUpdate({ valor: e.target.value })}
        placeholder="R$ 0,00"
        style={inputStyle()}
      />

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => {
          if (canRemove) e.currentTarget.style.color = "var(--error)";
        }}
        onMouseLeave={(e) =>
          (e.currentTarget.style.color = "var(--text-muted)")
        }
      >
        <Trash2Icon className="w-4 h-4" />
      </button>
    </div>
  );
}

function ResumoAvulsa({
  linhas,
  valorRecebido,
}: {
  linhas: LinhaAvulsa[];
  valorRecebido: number;
}) {
  const soma = linhas.reduce((acc, l) => acc + (Number(l.valor) || 0), 0);
  const diferenca = valorRecebido - soma;
  const ok = Math.abs(diferenca) < 0.05;

  return (
    <div
      className="flex justify-between items-center px-3 py-2 rounded text-xs"
      style={{
        background: ok ? "var(--bg-card-alt)" : "var(--warning-bg)",
        color: ok ? "var(--text-muted)" : "var(--warning)",
      }}
    >
      <span>
        Soma das distribuições: <strong>{formatBRL(soma)}</strong>
      </span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>
        {ok
          ? "✓ Bate com o valor recebido"
          : `Diferença: ${formatBRL(Math.abs(diferenca))} ${diferenca > 0 ? "faltando" : "a mais"}`}
      </span>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label
        className="text-xs uppercase tracking-wider font-medium"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </Label>
      {children}
    </div>
  );
}
