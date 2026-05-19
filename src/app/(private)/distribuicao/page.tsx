"use client";
import { NovaRodadaDialog } from "@/components/NovaRodada/NovaRodadaDialog";
import { formatBRL } from "@/helpers/calculo-orcamento";
import {
  useDeleteRodada,
  useListRodadasPorMes,
  useUpdateDistribuicaoStatus,
} from "@/hooks/use-rodadas";
import {
  DistribuicaoStatus,
  DistribuicaoTipo,
  RodadaDistribuicao,
} from "@/types/rodadas-types";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClockIcon,
  PlusIcon,
  Trash2Icon,
  WalletIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const TIPO_LABELS: Record<DistribuicaoTipo, string> = {
  equipe: "Equipe",
  lucro_socio: "Lucro sócio",
  reserva: "Reserva",
  imposto: "Imposto",
};

const TIPO_COLORS: Record<DistribuicaoTipo, string> = {
  equipe: "#0F4C81",
  lucro_socio: "#7c3aed",
  reserva: "#b45309",
  imposto: "#64748b",
};

const STATUS_CONFIG: Record<
  DistribuicaoStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pendente: {
    label: "Pendente",
    color: "#b45309",
    bg: "rgba(180,83,9,0.10)",
    border: "rgba(180,83,9,0.30)",
  },
  pago: {
    label: "Pago",
    color: "#15803d",
    bg: "rgba(21,128,61,0.10)",
    border: "rgba(21,128,61,0.30)",
  },
  adiado: {
    label: "Adiado",
    color: "#b91c1c",
    bg: "rgba(185,28,28,0.10)",
    border: "rgba(185,28,28,0.30)",
  },
};

export default function DistribuicaoPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: rodadas, isLoading } = useListRodadasPorMes(mes, ano);

  function mesAnterior() {
    if (mes === 1) {
      setMes(12);
      setAno(ano - 1);
    } else setMes(mes - 1);
  }
  function proximoMes() {
    if (mes === 12) {
      setMes(1);
      setAno(ano + 1);
    } else setMes(mes + 1);
  }

  // ─── métricas dos cards ───
  const metricas = useMemo(() => {
    const all = (rodadas ?? []).flatMap((r) => r.rodada_distribuicoes ?? []);
    const totalRecebido = (rodadas ?? []).reduce(
      (acc, r) => acc + r.valor_recebido,
      0,
    );
    const totalPago = all
      .filter((d) => d.status === "pago")
      .reduce((acc, d) => acc + d.valor, 0);
    const totalPendente = all
      .filter((d) => d.status === "pendente")
      .reduce((acc, d) => acc + d.valor, 0);
    const totalAdiado = all
      .filter((d) => d.status === "adiado")
      .reduce((acc, d) => acc + d.valor, 0);
    return { totalRecebido, totalPago, totalPendente, totalAdiado };
  }, [rodadas]);

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Distribuição
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Rodadas de pagamento por mês
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={mesAnterior}
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
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span
              className="text-sm font-medium min-w-36 text-center"
              style={{ color: "var(--text-primary)" }}
            >
              {MESES[mes - 1]} {ano}
            </span>
            <button
              onClick={proximoMes}
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
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: "var(--primary)",
              color: "#ffffff",
              border: "1px solid var(--primary)",
            }}
          >
            <PlusIcon className="w-4 h-4" />
            Nova rodada
          </button>
        </div>
      </div>

      {/* cards */}
      <div className="grid grid-cols-4 gap-4">
        <CardMetrica
          label="Total recebido"
          value={metricas.totalRecebido}
          color="var(--primary)"
          icon={WalletIcon}
        />
        <CardMetrica
          label="Total pago"
          value={metricas.totalPago}
          color="var(--success, #15803d)"
          icon={CheckIcon}
        />
        <CardMetrica
          label="Total pendente"
          value={metricas.totalPendente}
          color="var(--warning, #b45309)"
          icon={ClockIcon}
        />
        <CardMetrica
          label="Total adiado"
          value={metricas.totalAdiado}
          color="var(--error, #b91c1c)"
          icon={ClockIcon}
        />
      </div>

      {/* lista de rodadas */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div
            className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{
              borderColor: "var(--primary-border)",
              borderTopColor: "var(--primary)",
            }}
          />
        </div>
      ) : !rodadas || rodadas.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <WalletIcon
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: "var(--text-faint)" }}
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Nenhuma rodada de pagamento em {MESES[mes - 1]} {ano}
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-3 text-sm font-medium"
            style={{ color: "var(--primary)" }}
          >
            + Criar a primeira
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rodadas.map((r) => (
            <RodadaCard key={r.id} rodada={r} />
          ))}
        </div>
      )}

      <NovaRodadaDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
function CardMetrica({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string;
  value: number;
  color: string;
  icon: typeof WalletIcon;
}) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-1"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center justify-between">
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </p>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p
        className="text-2xl font-semibold"
        style={{ color, fontVariantNumeric: "tabular-nums" }}
      >
        {formatBRL(value)}
      </p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// CARD DE UMA RODADA — expansível
// ──────────────────────────────────────────────────────────────────
function RodadaCard({
  rodada,
}: {
  rodada: import("@/types/rodadas-types").RodadaPagamento;
}) {
  const [expanded, setExpanded] = useState(false);
  const { mutate: deleteRodada } = useDeleteRodada();

  const distribuicoes = rodada.rodada_distribuicoes ?? [];

  // sócio + equipe agregados por funcionário pra exibição
  // (sócios que trabalham aparecem com soma de "equipe" + "lucro_socio")
  const distribuicoesAgrupadas = useMemo(() => {
    const map: Record<
      string,
      {
        key: string;
        funcionarioId: number | null;
        nome: string;
        valorEquipe: number;
        valorLucro: number;
        valor: number;
        statusEquipe?: DistribuicaoStatus;
        statusLucro?: DistribuicaoStatus;
        idsByTipo: Partial<Record<DistribuicaoTipo, string>>;
      }
    > = {};

    distribuicoes.forEach((d) => {
      const isPessoa = d.tipo === "equipe" || d.tipo === "lucro_socio";
      const key = isPessoa ? `func-${d.funcionario}` : `tipo-${d.tipo}`;

      const nome =
        d.tipo === "reserva"
          ? "Reserva da empresa"
          : d.tipo === "imposto"
            ? "Imposto"
            : (pickFuncName(d) ?? "—");

      if (!map[key]) {
        map[key] = {
          key,
          funcionarioId: d.funcionario,
          nome,
          valorEquipe: 0,
          valorLucro: 0,
          valor: 0,
          idsByTipo: {},
        };
      }

      const slot = map[key];
      slot.valor += d.valor;
      slot.idsByTipo[d.tipo] = d.id;

      if (d.tipo === "equipe") {
        slot.valorEquipe = d.valor;
        slot.statusEquipe = d.status;
      } else if (d.tipo === "lucro_socio") {
        slot.valorLucro = d.valor;
        slot.statusLucro = d.status;
      }
    });

    // ordena: pessoas primeiro (com sócios primeiro), depois reserva, depois imposto
    return Object.values(map).sort((a, b) => {
      const order = (k: string) => {
        if (k.startsWith("func-")) return 0;
        if (k === "tipo-reserva") return 1;
        if (k === "tipo-imposto") return 2;
        return 3;
      };
      return order(a.key) - order(b.key);
    });
  }, [distribuicoes]);

  const totalDistribuido = distribuicoes.reduce((acc, d) => acc + d.valor, 0);
  const totalPago = distribuicoes
    .filter((d) => d.status === "pago")
    .reduce((acc, d) => acc + d.valor, 0);
  const progresso =
    totalDistribuido > 0 ? (totalPago / totalDistribuido) * 100 : 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* header da rodada */}
      <div
        className="px-5 py-4 flex items-center justify-between cursor-pointer transition-colors"
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "transparent")
        }
      >
        <div className="flex items-center gap-4 flex-1">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "var(--primary-bg)",
              border: "1px solid var(--primary-border)",
            }}
          >
            <WalletIcon
              className="w-5 h-5"
              style={{ color: "var(--primary)" }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {rodada.descricao}
              </p>
              {rodada.orcamento_data && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: "var(--bg-card-alt)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  Orçamento
                </span>
              )}
            </div>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {new Date(rodada.data_recebimento).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
              {rodada.orcamento_data && ` · ${rodada.orcamento_data.titulo}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Recebido
            </p>
            <p
              className="text-base font-semibold"
              style={{
                color: "var(--primary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatBRL(rodada.valor_recebido)}
            </p>
          </div>

          {/* mini progress bar */}
          <div className="flex flex-col gap-1 items-end">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {progresso.toFixed(0)}% pago
            </p>
            <div
              className="w-24 h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--bg-card-alt)" }}
            >
              <div
                className="h-full transition-all"
                style={{
                  width: `${progresso}%`,
                  background: "var(--success, #15803d)",
                }}
              />
            </div>
          </div>

          {expanded ? (
            <ChevronUpIcon
              className="w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
          ) : (
            <ChevronDownIcon
              className="w-4 h-4"
              style={{ color: "var(--text-muted)" }}
            />
          )}
        </div>
      </div>

      {/* corpo expansível */}
      {expanded && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          {distribuicoesAgrupadas.length === 0 ? (
            <p
              className="text-sm py-6 text-center"
              style={{ color: "var(--text-faint)" }}
            >
              Sem distribuições cadastradas.
            </p>
          ) : (
            distribuicoesAgrupadas.map((d, i) => (
              <DistribuicaoLinha
                key={d.key}
                grupo={d}
                distribuicoes={distribuicoes}
                isLast={i === distribuicoesAgrupadas.length - 1}
              />
            ))
          )}

          {/* ações da rodada */}
          <div
            className="flex justify-between items-center px-5 py-3"
            style={{
              background: "var(--bg-card-alt)",
              borderTop: "1px solid var(--border)",
            }}
          >
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              {rodada.observacoes ? (
                <span>📝 {rodada.observacoes}</span>
              ) : (
                <span>—</span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (
                  confirm(
                    `Excluir esta rodada? Todas as distribuições (${distribuicoes.length}) serão removidas.`,
                  )
                ) {
                  deleteRodada(rodada.id);
                }
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-all"
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
            >
              <Trash2Icon className="w-3 h-3" />
              Excluir rodada
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function pickFuncName(d: RodadaDistribuicao): string | null {
  if (!d.funcionario_data) return null;
  const fd = d.funcionario_data;
  return Array.isArray(fd) ? (fd[0]?.name ?? null) : fd.name;
}

// ──────────────────────────────────────────────────────────────────
// Linha de distribuição (pessoa, reserva ou imposto)
// Sócios trabalhando aparecem com soma "equipe + lucro_socio"
// ──────────────────────────────────────────────────────────────────
function DistribuicaoLinha({
  grupo,
  distribuicoes,
  isLast,
}: {
  grupo: {
    key: string;
    funcionarioId: number | null;
    nome: string;
    valorEquipe: number;
    valorLucro: number;
    valor: number;
    statusEquipe?: DistribuicaoStatus;
    statusLucro?: DistribuicaoStatus;
    idsByTipo: Partial<Record<DistribuicaoTipo, string>>;
  };
  distribuicoes: RodadaDistribuicao[];
  isLast: boolean;
}) {
  const { mutate: updateStatus } = useUpdateDistribuicaoStatus();

  // resolve qual ID da distribuição estamos editando
  // se a pessoa tem 2 linhas (equipe + lucro), mostramos um botão "marcar
  // pago" pra cada uma separadamente
  const isPessoa = grupo.idsByTipo.equipe || grupo.idsByTipo.lucro_socio;
  const isReserva = grupo.idsByTipo.reserva;
  const isImposto = grupo.idsByTipo.imposto;

  // descobrir tipo principal da linha
  const tipoPrincipal: DistribuicaoTipo = isReserva
    ? "reserva"
    : isImposto
      ? "imposto"
      : grupo.idsByTipo.equipe
        ? "equipe"
        : "lucro_socio";

  const cor = TIPO_COLORS[tipoPrincipal];

  // se for pessoa com 2 tipos, status individual; se só 1, único status
  function renderStatusBlocks() {
    if (isPessoa && grupo.idsByTipo.equipe && grupo.idsByTipo.lucro_socio) {
      // sócio trabalhando: 2 botões
      return (
        <div className="flex flex-col gap-1.5 items-end">
          <StatusBotao
            label="Trabalho"
            valor={grupo.valorEquipe}
            status={grupo.statusEquipe!}
            onChange={(s) =>
              updateStatus({ id: grupo.idsByTipo.equipe!, status: s })
            }
          />
          <StatusBotao
            label="Lucro"
            valor={grupo.valorLucro}
            status={grupo.statusLucro!}
            onChange={(s) =>
              updateStatus({ id: grupo.idsByTipo.lucro_socio!, status: s })
            }
          />
        </div>
      );
    }

    // caso normal: 1 distribuição
    const dist = distribuicoes.find(
      (d) =>
        d.id === grupo.idsByTipo.equipe ||
        d.id === grupo.idsByTipo.lucro_socio ||
        d.id === grupo.idsByTipo.reserva ||
        d.id === grupo.idsByTipo.imposto,
    );
    if (!dist) return null;
    return (
      <StatusBotao
        valor={grupo.valor}
        status={dist.status}
        onChange={(s) => updateStatus({ id: dist.id, status: s })}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-between px-5 py-3"
      style={{
        borderBottom: isLast ? "none" : "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
          style={{
            background: `${cor}15`,
            border: `1px solid ${cor}40`,
            color: cor,
          }}
        >
          {grupo.nome.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {grupo.nome}
          </p>
          {isPessoa && grupo.idsByTipo.equipe && grupo.idsByTipo.lucro_socio ? (
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              Sócio · {formatBRL(grupo.valorEquipe)} (trabalho) +{" "}
              {formatBRL(grupo.valorLucro)} (lucro)
            </p>
          ) : (
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {TIPO_LABELS[tipoPrincipal]}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <p
          className="text-sm font-semibold"
          style={{ color: cor, fontVariantNumeric: "tabular-nums" }}
        >
          {formatBRL(grupo.valor)}
        </p>
        {renderStatusBlocks()}
      </div>
    </div>
  );
}

function StatusBotao({
  label,
  valor,
  status,
  onChange,
}: {
  label?: string;
  valor?: number;
  status: DistribuicaoStatus;
  onChange: (s: DistribuicaoStatus) => void;
}) {
  const st = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
          {label}
          {valor != null && ` · ${formatBRL(valor)}`}
        </span>
      )}
      <div className="flex gap-1">
        <span
          className="text-xs px-2 py-1 rounded-full"
          style={{
            color: st.color,
            background: st.bg,
            border: `1px solid ${st.border}`,
          }}
        >
          {st.label}
        </span>
        {status !== "pago" && (
          <button
            onClick={() => onChange("pago")}
            className="text-xs px-2 py-1 rounded transition-all"
            style={{
              color: "var(--success, #15803d)",
              background: "var(--success-bg, rgba(21,128,61,0.10))",
              border: "1px solid var(--success-border, rgba(21,128,61,0.30))",
            }}
            title="Marcar como pago"
          >
            ✓
          </button>
        )}
        {status === "pendente" && (
          <button
            onClick={() => onChange("adiado")}
            className="text-xs px-2 py-1 rounded transition-all"
            style={{
              color: "var(--error, #b91c1c)",
              background: "var(--error-bg, rgba(185,28,28,0.10))",
              border: "1px solid var(--error-border, rgba(185,28,28,0.30))",
            }}
            title="Adiar"
          >
            ⏸
          </button>
        )}
        {status === "pago" && (
          <button
            onClick={() => onChange("pendente")}
            className="text-xs px-2 py-1 rounded transition-all"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
            title="Desfazer"
          >
            ↶
          </button>
        )}
      </div>
    </div>
  );
}
