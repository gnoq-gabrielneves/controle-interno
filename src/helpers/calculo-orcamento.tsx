/**
 * Motor único de cálculo de orçamento.
 * Usado em: novo, editar, detalhe do orçamento e distribuição.
 *
 * Lógica:
 *   custo da equipe = soma(salario_snapshot × meses_alocados)
 *   custo protegido = custo × (1 + buffer)
 *   com margem      = protegido × (1 + margem)
 *   valor projeto   = com margem × (1 + imposto)
 *
 * No tipo "por_modulo", o valor cobrado do cliente vem da soma dos itens
 * (valor_manual). A função retorna AMBOS — calculado e o que veio dos itens —
 * pra UI poder avisar quando não bate.
 */

export type FuncionarioAlocado = {
  salario: number; // snapshot, mensal
  meses: number;
};

export type ItemManual = {
  valor: number | null;
};

export type CalculoInput = {
  funcionarios: FuncionarioAlocado[];
  bufferAtraso: number; // 0.20 = 20%
  margemLucro: number; // 0.40 = 40%
  aliquotaImposto: number; // 0.06 = 6%
  itens?: ItemManual[]; // só pra tipo "por_modulo"
};

export type CalculoOutput = {
  // breakdown da calculadora
  custoEquipe: number;
  valorBuffer: number;
  custoProtegido: number;
  valorMargem: number;
  subtotal: number;
  valorImposto: number;
  valorCalculado: number;

  // valor que de fato vai pro cliente
  valorCobrado: number;

  // ajuda a UI a decidir o que mostrar
  somaItens: number | null; // null se nenhum item tem valor
  divergencia: number; // valorCobrado - valorCalculado (positivo = a mais)
  temDivergencia: boolean;
};

export function calcularOrcamento(input: CalculoInput): CalculoOutput {
  const { funcionarios, bufferAtraso, margemLucro, aliquotaImposto, itens } =
    input;

  // 1. custo real da equipe
  const custoEquipe = funcionarios.reduce(
    (acc, f) => acc + (f.salario || 0) * (f.meses || 0),
    0,
  );

  // 2. aplica buffer (proteção contra atraso)
  const valorBuffer = custoEquipe * bufferAtraso;
  const custoProtegido = custoEquipe + valorBuffer;

  // 3. aplica margem em cima do custo já protegido
  const valorMargem = custoProtegido * margemLucro;
  const subtotal = custoProtegido + valorMargem;

  // 4. imposto por fora (gross-up: cliente paga, empresa repassa)
  const valorImposto = subtotal * aliquotaImposto;
  const valorCalculado = subtotal + valorImposto;

  // 5. se tem itens com valor manual, calcula a soma
  const itensComValor = (itens ?? []).filter(
    (i): i is { valor: number } => i.valor != null && !Number.isNaN(i.valor),
  );
  const somaItens =
    itensComValor.length > 0
      ? itensComValor.reduce((acc, i) => acc + i.valor, 0)
      : null;

  // 6. valor cobrado: soma dos itens se existir, senão o calculado
  const valorCobrado = somaItens ?? valorCalculado;

  // 7. divergência (só faz sentido se tiver soma de itens)
  const divergencia = somaItens != null ? somaItens - valorCalculado : 0;
  const temDivergencia = somaItens != null && Math.abs(divergencia) > 0.01;

  return {
    custoEquipe,
    valorBuffer,
    custoProtegido,
    valorMargem,
    subtotal,
    valorImposto,
    valorCalculado,
    valorCobrado,
    somaItens,
    divergencia,
    temDivergencia,
  };
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPct(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}
