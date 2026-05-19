import { supabase } from "@/lib/supabase/supabase";
import {
  CreateRodadaInput,
  RodadaPagamento,
  UpdateDistribuicaoStatusInput,
  UpdateDistribuicaoValorInput,
} from "@/types/rodadas-types";

// ─────────────────────────────────────────────────────────
// LIST — todas as rodadas com suas distribuições e orçamento (se houver)
// ─────────────────────────────────────────────────────────
export async function ListRodadas(): Promise<RodadaPagamento[]> {
  const { data, error } = await supabase
    .from("rodadas_pagamento")
    .select(
      `
      id, orcamento, descricao, valor_recebido, data_recebimento,
      observacoes, created_at,
      orcamento_data:orcamentos (id, titulo),
      rodada_distribuicoes (
        id, rodada, funcionario, tipo, valor, status, pago_em, created_at,
        funcionario_data:funcionarios (id, name)
      )
    `,
    )
    .order("data_recebimento", { ascending: false });

  if (error) throw new Error(error.message);
  return data as unknown as RodadaPagamento[];
}

// ─────────────────────────────────────────────────────────
// LIST filtrado por mês/ano (usa data_recebimento)
// ─────────────────────────────────────────────────────────
export async function ListRodadasPorMes(
  mes: number,
  ano: number,
): Promise<RodadaPagamento[]> {
  // bounds do mês no formato ISO (mes é 1-indexed)
  const ini = new Date(Date.UTC(ano, mes - 1, 1)).toISOString().slice(0, 10);
  const fim = new Date(Date.UTC(ano, mes, 1)).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("rodadas_pagamento")
    .select(
      `
      id, orcamento, descricao, valor_recebido, data_recebimento,
      observacoes, created_at,
      orcamento_data:orcamentos (id, titulo),
      rodada_distribuicoes (
        id, rodada, funcionario, tipo, valor, status, pago_em, created_at,
        funcionario_data:funcionarios (id, name)
      )
    `,
    )
    .gte("data_recebimento", ini)
    .lt("data_recebimento", fim)
    .order("data_recebimento", { ascending: false });

  if (error) throw new Error(error.message);
  return data as unknown as RodadaPagamento[];
}

// ─────────────────────────────────────────────────────────
// CREATE — cria rodada + distribuições em cadeia
// ─────────────────────────────────────────────────────────
export async function CreateRodada(input: CreateRodadaInput) {
  const { data: rodada, error: rodadaError } = await supabase
    .from("rodadas_pagamento")
    .insert({
      orcamento: input.tipo === "com_orcamento" ? input.orcamento : null,
      descricao: input.descricao,
      valor_recebido: input.valor_recebido,
      data_recebimento: input.data_recebimento,
      observacoes: input.observacoes ?? null,
    })
    .select()
    .single();

  if (rodadaError) throw new Error(rodadaError.message);

  if (input.distribuicoes.length > 0) {
    const { error: distError } = await supabase
      .from("rodada_distribuicoes")
      .insert(
        input.distribuicoes.map((d) => ({
          rodada: rodada.id,
          funcionario: d.funcionario,
          tipo: d.tipo,
          valor: d.valor,
        })),
      );

    if (distError) {
      // se falhou as distribuições, melhor deletar a rodada criada
      // pra não deixar lixo no banco
      await supabase.from("rodadas_pagamento").delete().eq("id", rodada.id);
      throw new Error(distError.message);
    }
  }

  return rodada;
}

// ─────────────────────────────────────────────────────────
// DELETE — apaga rodada (cascade já leva as distribuições)
// ─────────────────────────────────────────────────────────
export async function DeleteRodada(id: string): Promise<void> {
  const { error } = await supabase
    .from("rodadas_pagamento")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────
// UPDATE status — marcar como pago/adiado/pendente
// quando vira "pago", também preenche pago_em com hoje
// quando volta pra outro status, limpa pago_em
// ─────────────────────────────────────────────────────────
export async function UpdateDistribuicaoStatus(
  input: UpdateDistribuicaoStatusInput,
) {
  const payload: { status: string; pago_em: string | null } = {
    status: input.status,
    pago_em:
      input.status === "pago" ? new Date().toISOString().slice(0, 10) : null,
  };

  const { error } = await supabase
    .from("rodada_distribuicoes")
    .update(payload)
    .eq("id", input.id);

  if (error) throw new Error(error.message);
}

// ─────────────────────────────────────────────────────────
// UPDATE valor — só usado em rodadas avulsas (lá no service não
// validamos isso porque é validação de UI; aqui só executa)
// ─────────────────────────────────────────────────────────
export async function UpdateDistribuicaoValor(
  input: UpdateDistribuicaoValorInput,
) {
  const { error } = await supabase
    .from("rodada_distribuicoes")
    .update({ valor: input.valor })
    .eq("id", input.id);

  if (error) throw new Error(error.message);
}
