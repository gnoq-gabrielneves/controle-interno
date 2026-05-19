import { calcularOrcamento } from "@/helpers/calculo-orcamento";
import { DistribuicaoTipo } from "@/types/rodadas-types";

// ─── tipos vindos do banco ───
type FuncionarioData = { id: number; name: string; salario: number };

type ItemFuncionarioRaw = {
  funcionario: number;
  meses_alocados: number;
  salario_snapshot: number;
  funcionario_data: FuncionarioData | FuncionarioData[] | null;
};

type OrcamentoItemRaw = {
  id: string;
  valor_manual: number | null;
  orcamento_item_funcionarios: ItemFuncionarioRaw[];
};

type OrcamentoRaw = {
  id: string;
  titulo: string;
  tipo: "projeto_fechado" | "por_modulo";
  margem_lucro: number;
  aliquota_imposto: number;
  buffer_atraso: number;
  orcamento_itens: OrcamentoItemRaw[];
};

type SocietarioRaw = {
  funcionario: number;
  percent: number | null;
  funcionario_data: FuncionarioData | FuncionarioData[] | null;
};

type ConfigRaw = {
  reserva_empresa: number;
};

function pickFunc(f: {
  funcionario_data: FuncionarioData | FuncionarioData[] | null;
}): FuncionarioData | null {
  if (!f.funcionario_data) return null;
  return Array.isArray(f.funcionario_data)
    ? (f.funcionario_data[0] ?? null)
    : f.funcionario_data;
}

// ─── output: uma sugestão de distribuição pra UI mostrar antes de salvar ───
export type DistribuicaoSugerida = {
  funcionario: number | null;
  tipo: DistribuicaoTipo;
  valor: number;
  // metadados pra renderização (não vão pro banco)
  nome?: string;
  detalhe?: string;
};

export type CalculoRodadaInput = {
  orcamento: OrcamentoRaw;
  societarios: SocietarioRaw[];
  config: ConfigRaw;
  valorRecebido: number;
};

export type CalculoRodadaOutput = {
  // percentual desse pagamento sobre o valor total do orçamento
  percentualRecebido: number;
  // valor total do orçamento (pra você comparar)
  valorOrcamento: number;
  // breakdown pra mostrar no preview do dialog
  imposto: number;
  custoNaoSocios: number;
  custoSocios: number; // sócios trabalhando: parte de equipe
  reserva: number;
  lucroDistribuivelTotal: number;
  totalDistribuido: number;
  diferenca: number; // valorRecebido - totalDistribuido (deve ser ~0)
  // lista de distribuições prontas pra inserir no banco
  distribuicoes: DistribuicaoSugerida[];
};

/**
 * Calcula a distribuição sugerida de uma rodada de pagamento.
 *
 * Lógica:
 * 1. Calcula o que o orçamento deveria gerar (custo equipe, reserva, lucro).
 * 2. Imposto sai direto do valor recebido (gross-up).
 * 3. Os outros valores são distribuídos pro-rata pelo percentual recebido.
 *    Ex: cliente pagou 30k de 80k = 37,5%. Cada distribuição vira 37,5% do total esperado.
 * 4. Sócios que trabalharam no projeto recebem 2 distribuições:
 *    - tipo "equipe" pelo trabalho
 *    - tipo "lucro_socio" pela participação societária
 */
export function calcularDistribuicaoRodada(
  input: CalculoRodadaInput,
): CalculoRodadaOutput {
  const { orcamento, societarios, config, valorRecebido } = input;

  // ─── 1. cálculo do orçamento (referência) ───
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

  const calc = calcularOrcamento({
    funcionarios: funcionariosCalc,
    bufferAtraso: orcamento.buffer_atraso,
    margemLucro: orcamento.margem_lucro,
    aliquotaImposto: orcamento.aliquota_imposto,
    itens: itensCalc,
  });

  const valorOrcamento = calc.valorCobrado;
  const percentualRecebido =
    valorOrcamento > 0 ? valorRecebido / valorOrcamento : 0;

  // ─── 2. imposto direto sobre o valor recebido (gross-up) ───
  const imposto =
    (valorRecebido * orcamento.aliquota_imposto) /
    (1 + orcamento.aliquota_imposto);

  // o que sobra pra distribuir entre equipe + reserva + lucro
  const valorLiquidoRecebido = valorRecebido - imposto;

  // ─── 3. consolida pagamento por funcionário no orçamento ───
  // (custo total que cada pessoa deveria receber se o orçamento fosse 100% pago)
  const totaisPorFuncionario: Record<
    number,
    { id: number; name: string; valor: number }
  > = {};

  todasAlocacoes.forEach((f) => {
    const func = pickFunc(f);
    if (!func) return;
    const valor = f.salario_snapshot * f.meses_alocados;
    if (totaisPorFuncionario[func.id]) {
      totaisPorFuncionario[func.id].valor += valor;
    } else {
      totaisPorFuncionario[func.id] = {
        id: func.id,
        name: func.name,
        valor,
      };
    }
  });

  // ─── 4. identifica sócios ───
  const sociosPorId: Record<
    number,
    { id: number; name: string; percent: number }
  > = {};
  societarios.forEach((s) => {
    const func = pickFunc(s);
    if (!func) return;
    sociosPorId[func.id] = {
      id: func.id,
      name: func.name,
      percent: s.percent ?? 0,
    };
  });
  const idsDeSocios = new Set(Object.keys(sociosPorId).map(Number));

  // ─── 5. monta as distribuições ───
  const distribuicoes: DistribuicaoSugerida[] = [];

  // 5.1 — imposto (não tem funcionário)
  distribuicoes.push({
    funcionario: null,
    tipo: "imposto",
    valor: imposto,
    nome: "Imposto",
    detalhe: `${(orcamento.aliquota_imposto * 100).toFixed(2)}% sobre o recebido`,
  });

  // 5.2 — equipe pro-rata (TODOS os funcionários alocados, incluindo sócios trabalhando)
  Object.values(totaisPorFuncionario).forEach((p) => {
    const valorPagamento = p.valor * percentualRecebido;
    if (valorPagamento <= 0) return;
    distribuicoes.push({
      funcionario: p.id,
      tipo: "equipe",
      valor: valorPagamento,
      nome: p.name,
      detalhe: idsDeSocios.has(p.id)
        ? "Pagamento pelo trabalho"
        : "Pagamento pelo trabalho",
    });
  });

  // 5.3 — reserva pro-rata
  // (valor total da reserva calculado em cima do orçamento × percentual recebido)
  const reservaTotal = calc.custoEquipe; // placeholder
  // reserva = (lucroBruto × percent_reserva), onde lucroBruto = valorLiquido - custoEquipe
  // mas como estamos pro-rata, fazemos:
  const custoTotalEquipe = Object.values(totaisPorFuncionario).reduce(
    (acc, p) => acc + p.valor,
    0,
  );
  const valorLiquidoOrcamento =
    valorOrcamento -
    (valorOrcamento * orcamento.aliquota_imposto) /
      (1 + orcamento.aliquota_imposto);
  const lucroBrutoOrcamento = valorLiquidoOrcamento - custoTotalEquipe;
  const reservaOrcamento = lucroBrutoOrcamento * config.reserva_empresa;
  const reserva = reservaOrcamento * percentualRecebido;

  if (reserva > 0) {
    distribuicoes.push({
      funcionario: null,
      tipo: "reserva",
      valor: reserva,
      nome: "Reserva da empresa",
      detalhe: `${(config.reserva_empresa * 100).toFixed(0)}% do lucro bruto`,
    });
  }

  // 5.4 — lucro dos sócios pro-rata
  const lucroDistribuivelTotalOrc = lucroBrutoOrcamento - reservaOrcamento;
  const lucroDistribuivelRodada =
    lucroDistribuivelTotalOrc * percentualRecebido;

  Object.values(sociosPorId).forEach((s) => {
    const lucroSocio = lucroDistribuivelRodada * s.percent;
    if (lucroSocio <= 0) return;
    distribuicoes.push({
      funcionario: s.id,
      tipo: "lucro_socio",
      valor: lucroSocio,
      nome: s.name,
      detalhe: `${(s.percent * 100).toFixed(2)}% do lucro`,
    });
  });

  // ─── 6. métricas pro breakdown ───
  const custoNaoSocios = Object.values(totaisPorFuncionario)
    .filter((p) => !idsDeSocios.has(p.id))
    .reduce((acc, p) => acc + p.valor * percentualRecebido, 0);

  const custoSocios = Object.values(totaisPorFuncionario)
    .filter((p) => idsDeSocios.has(p.id))
    .reduce((acc, p) => acc + p.valor * percentualRecebido, 0);

  const totalDistribuido = distribuicoes.reduce((acc, d) => acc + d.valor, 0);
  const diferenca = valorRecebido - totalDistribuido;

  // silencia warnings de variável não usada
  void reservaTotal;
  void valorLiquidoRecebido;

  return {
    percentualRecebido,
    valorOrcamento,
    imposto,
    custoNaoSocios,
    custoSocios,
    reserva,
    lucroDistribuivelTotal: lucroDistribuivelRodada,
    totalDistribuido,
    diferenca,
    distribuicoes,
  };
}
