"use client";

import { useGetConfiguracoes } from "@/hooks/use-configuracoes";
import { useListFuncionarios } from "@/hooks/use-funcionarios";
import { useListGastos } from "@/hooks/use-gastos";
import { useGetOrcamento } from "@/hooks/use-orcamentos";
import { useListSocietarios } from "@/hooks/use-societarios";
import { ArrowLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatPct(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

type FuncionarioData = {
  id: number;
  name: string;
  salario: number;
};

type ItemFuncionario = {
  id: string;
  horas: number;
  funcionario_data: FuncionarioData | FuncionarioData[] | null;
};

type OrcamentoItem = {
  id: string;
  descricao: string;
  orcamento_item_funcionarios: ItemFuncionario[];
};

type OrcamentoRaw = {
  id: string;
  titulo: string;
  margem_lucro: number;
  aliquota_imposto: number;
  orcamento_itens: OrcamentoItem[];
};

type Gasto = {
  recorrencia: "mensal" | "anual";
  valor: number;
};

export default function DistribuicaoOrcamentoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: orcamento, isLoading: loadingOrc } = useGetOrcamento(id);
  const { data: societarios, isLoading: loadingSoc } = useListSocietarios();
  const { data: config, isLoading: loadingConfig } = useGetConfiguracoes();
  const { data: gastos } = useListGastos();
  const { data: funcionarios } = useListFuncionarios();

  const isLoading = loadingOrc || loadingSoc || loadingConfig;

  const calculo = useMemo(() => {
    if (!orcamento || !societarios || !config) return null;

    const orc = orcamento as unknown as OrcamentoRaw;

    // overhead por hora — igual ao cálculo do orçamento
    const totalGastos =
      (gastos as Gasto[] | undefined)?.reduce(
        (acc, g) => acc + (g.recorrencia === "mensal" ? g.valor : g.valor / 12),
        0,
      ) ?? 0;
    const totalFunc = funcionarios?.length ?? 1;
    const overheadPorHora = totalGastos / (totalFunc * 220);

    // valor total do projeto — recalcula igual à página de detalhes
    // usando salário/hora + overhead/hora pra bater com o valor do orçamento
    const valorProjeto = (orc.orcamento_itens ?? []).reduce((acc, item) => {
      const custoBaseItem = (item.orcamento_item_funcionarios ?? []).reduce(
        (a, f) => {
          const func = Array.isArray(f.funcionario_data)
            ? (f.funcionario_data as unknown as FuncionarioData[])[0]
            : (f.funcionario_data as unknown as FuncionarioData | null);
          if (!func) return a;
          const salarioPorHora = func.salario / 220;
          return a + f.horas * (salarioPorHora + overheadPorHora);
        },
        0,
      );

      const comMargem = custoBaseItem * (1 + orc.margem_lucro);
      const comImposto = comMargem * (1 + orc.aliquota_imposto);
      console.log(
        `Item "${item.descricao}": base=${custoBaseItem.toFixed(2)} margem=${comMargem.toFixed(2)} imposto=${comImposto.toFixed(2)}`,
      );
      return acc + comImposto;
    }, 0);

    console.log("overhead/hora:", overheadPorHora);
    console.log("totalGastos:", totalGastos);
    console.log("totalFunc:", totalFunc);
    console.log("valorProjeto calculado:", valorProjeto);

    // imposto sobre o valor do projeto
    const imposto =
      (valorProjeto * orc.aliquota_imposto) / (1 + orc.aliquota_imposto);
    const valorLiquido = valorProjeto - imposto;

    // pagamento de cada funcionário (horas × salário/hora apenas — sem overhead)
    const pagamentosPorFuncionario: Record<
      number,
      { name: string; valor: number; horas: number }
    > = {};

    (orc.orcamento_itens ?? []).forEach((item) => {
      (item.orcamento_item_funcionarios ?? []).forEach((f) => {
        const func = Array.isArray(f.funcionario_data)
          ? f.funcionario_data[0]
          : (f.funcionario_data as FuncionarioData | null);
        if (!func) return;
        const salarioPorHora = func.salario / 220;
        const valor = f.horas * salarioPorHora;
        if (pagamentosPorFuncionario[func.id]) {
          pagamentosPorFuncionario[func.id].valor += valor;
          pagamentosPorFuncionario[func.id].horas += f.horas;
        } else {
          pagamentosPorFuncionario[func.id] = {
            name: func.name,
            valor,
            horas: f.horas,
          };
        }
      });
    });

    const custoTotalEquipe = Object.values(pagamentosPorFuncionario).reduce(
      (acc, f) => acc + f.valor,
      0,
    );
    const lucroBruto = valorLiquido - custoTotalEquipe;
    const valorReserva = lucroBruto * config.reserva_empresa;
    const lucroDistribuivel = lucroBruto - valorReserva;

    // distribuição por sócio
    const distribuicao = societarios.map((s, index) => {
      const func = Array.isArray(s.funcionario_data)
        ? (s.funcionario_data as unknown as FuncionarioData[])[0]
        : (s.funcionario_data as unknown as FuncionarioData | null);

      const percent = s.percent ?? 0;
      const lucroSocio = lucroDistribuivel * percent;
      const pagamentoComoFunc =
        pagamentosPorFuncionario[func?.id ?? 0]?.valor ?? 0;

      return {
        id: func?.id ?? index,
        name: func?.name ?? "—",
        percent,
        lucro: lucroSocio,
        pagamentoFunc: pagamentoComoFunc,
        horas: pagamentosPorFuncionario[func?.id ?? 0]?.horas ?? 0,
        total: lucroSocio + pagamentoComoFunc,
      };
    });

    return {
      valorProjeto,
      imposto,
      aliquotaImposto: orc.aliquota_imposto,
      valorLiquido,
      pagamentosPorFuncionario,
      custoTotalEquipe,
      totalGastos, // ← adiciona
      lucroBruto,
      reservaEmpresa: config.reserva_empresa,
      valorReserva,
      lucroDistribuivel,
      distribuicao,
    };
  }, [orcamento, societarios, config, gastos, funcionarios]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
      </div>
    );
  }

  if (!calculo) return null;

  const orc = orcamento as unknown as { titulo: string };

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
          <h1 className="text-xl font-semibold">Distribuição do projeto</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{orc.titulo}</p>
        </div>
      </div>

      {/* resumo financeiro */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="bg-white/[0.02] px-5 py-3 border-b border-white/10">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Resumo financeiro
          </p>
        </div>

        {[
          {
            label: "Valor do projeto",
            value: formatBRL(calculo.valorProjeto),
            highlight: false,
            muted: false,
          },
          {
            label: `Imposto Simples Nacional (${formatPct(calculo.aliquotaImposto)})`,
            value: `- ${formatBRL(calculo.imposto)}`,
            highlight: false,
            muted: true,
          },
          {
            label: "Valor líquido após imposto",
            value: formatBRL(calculo.valorLiquido),
            highlight: false,
            muted: false,
          },
          {
            label: "Custo total da equipe",
            value: `- ${formatBRL(calculo.custoTotalEquipe)}`,
            highlight: false,
            muted: true,
          },
          {
            label: "Lucro bruto do projeto",
            value: formatBRL(calculo.lucroBruto),
            highlight: false,
            muted: false,
          },
          {
            label: `Reserva empresa (${formatPct(calculo.reservaEmpresa)})`,
            value: `- ${formatBRL(calculo.valorReserva)}`,
            highlight: false,
            muted: true,
          },
          {
            label: "Lucro distribuível",
            value: formatBRL(calculo.lucroDistribuivel),
            highlight: true,
            muted: false,
          },
        ].map((row, i) => (
          <div
            key={`row-${i}`}
            className={`flex justify-between items-center px-5 py-3 border-b border-white/5 last:border-0 ${row.highlight ? "bg-sky-500/5" : ""}`}
          >
            <span
              className={`text-sm ${row.muted ? "text-white/40" : "text-white/70"}`}
            >
              {row.label}
            </span>
            <span
              className={`text-sm font-medium ${row.highlight ? "text-sky-300" : row.muted ? "text-red-400/70" : "text-white/80"}`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {/* card de reserva */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-amber-300/60 uppercase tracking-wider mb-1">
            Valor para reserva da empresa
          </p>
          <p className="text-2xl font-semibold text-amber-300">
            {formatBRL(calculo.valorReserva)}
          </p>
          <p className="text-xs text-amber-300/40 mt-1">
            {formatPct(calculo.reservaEmpresa)} do lucro bruto de{" "}
            {formatBRL(calculo.lucroBruto)}
          </p>
        </div>
        <div className="text-right text-sm text-amber-300/40">
          <p>Configurado em</p>
          <p className="font-medium text-amber-300/60">
            Configurações → Reserva empresa
          </p>
        </div>
      </div>

      {/* pagamentos da equipe */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="bg-white/[0.02] px-5 py-3 border-b border-white/10">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Pagamento da equipe
          </p>
        </div>
        {Object.entries(calculo.pagamentosPorFuncionario).map(([funcId, f]) => (
          <div
            key={funcId}
            className="flex justify-between items-center px-5 py-3 border-b border-white/5 last:border-0"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 text-xs font-medium">
                {f.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-white/80">{f.name}</p>
                <p className="text-xs text-white/30">{f.horas}h trabalhadas</p>
              </div>
            </div>
            <span className="text-sm font-medium text-white/70">
              {formatBRL(f.valor)}
            </span>
          </div>
        ))}
      </div>

      {/* distribuição dos sócios */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="bg-white/[0.02] px-5 py-3 border-b border-white/10">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Distribuição dos sócios
          </p>
        </div>

        {calculo.distribuicao.map((d) => (
          <div key={d.id} className="border-b border-white/5 last:border-0">
            <div className="flex justify-between items-center px-5 py-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 text-xs font-medium">
                  {d.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80">{d.name}</p>
                  <p className="text-xs text-white/30">
                    Participação: {formatPct(d.percent)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/30 mb-1">Total a receber</p>
                <p className="text-base font-semibold text-sky-300">
                  {formatBRL(d.total)}
                </p>
              </div>
            </div>

            <div className="px-5 pb-3 flex gap-6">
              <div>
                <p className="text-xs text-white/20">
                  Lucro ({formatPct(d.percent)})
                </p>
                <p className="text-sm text-white/50">{formatBRL(d.lucro)}</p>
              </div>
              {d.pagamentoFunc > 0 && (
                <div>
                  <p className="text-xs text-white/20">
                    Pagamento pelo projeto
                  </p>
                  <p className="text-sm text-white/50">
                    {formatBRL(d.pagamentoFunc)}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
