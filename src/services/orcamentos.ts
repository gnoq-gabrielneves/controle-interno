import { supabase } from "@/lib/supabase/supabase";
import {
  CreateOrcamentoInput,
  Orcamento,
  OrcamentoStatus,
} from "@/types/orcamentos-types";

// ─────────────────────────────────────────────────────────
// LIST — listagem leve pra tela de orçamentos e dashboard
// ─────────────────────────────────────────────────────────
export async function ListOrcamentos(): Promise<Orcamento[]> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select(
      `
      id, titulo, status, tipo,
      margem_lucro, aliquota_imposto, buffer_atraso,
      validade_dias, observacoes, created_at,
      cliente (id, nome, email, cpf_cnpj)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as unknown as Orcamento[];
}

// ─────────────────────────────────────────────────────────
// GET — detalhe com itens e alocações
// ─────────────────────────────────────────────────────────
export async function GetOrcamento(id: string) {
  const { data, error } = await supabase
    .from("orcamentos")
    .select(
      `
      id, titulo, status, numero, tipo,
      margem_lucro, aliquota_imposto, buffer_atraso,
      validade_dias, observacoes, created_at,
      cliente (id, nome, email, cpf_cnpj, telefone, logradouro, numero, cidade, estado),
      orcamento_itens (
        id, descricao, descricao_detalhada, valor_manual,
        orcamento_item_funcionarios (
          id, meses_alocados, salario_snapshot,
          funcionario,
          funcionario_data:funcionarios (id, name, salario)
        )
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─────────────────────────────────────────────────────────
// CREATE — cria orçamento + itens + alocações em cadeia
// ─────────────────────────────────────────────────────────
export async function CreateOrcamento(input: CreateOrcamentoInput) {
  const { data: orcamento, error: orcamentoError } = await supabase
    .from("orcamentos")
    .insert({
      titulo: input.titulo,
      cliente: input.cliente,
      tipo: input.tipo,
      margem_lucro: input.margem_lucro,
      aliquota_imposto: input.aliquota_imposto,
      buffer_atraso: input.buffer_atraso,
      validade_dias: input.validade_dias,
      observacoes: input.observacoes,
    })
    .select()
    .single();

  if (orcamentoError) throw new Error(orcamentoError.message);

  for (const item of input.itens) {
    const { data: itemData, error: itemError } = await supabase
      .from("orcamento_itens")
      .insert({
        orcamento: orcamento.id,
        descricao: item.descricao,
        descricao_detalhada: item.descricao_detalhada ?? null,
        valor_manual: item.valor_manual ?? null,
      })
      .select()
      .single();

    if (itemError) throw new Error(itemError.message);

    if (item.funcionarios.length > 0) {
      const { error: funcError } = await supabase
        .from("orcamento_item_funcionarios")
        .insert(
          item.funcionarios.map((f) => ({
            item: itemData.id,
            funcionario: f.funcionario,
            meses_alocados: f.meses_alocados,
            salario_snapshot: f.salario_snapshot,
          })),
        );

      if (funcError) throw new Error(funcError.message);
    }
  }

  return orcamento;
}

// ─────────────────────────────────────────────────────────
// UPDATE STATUS — usado em rascunho → enviado → aprovado etc.
// ─────────────────────────────────────────────────────────
export async function UpdateOrcamentoStatus(
  id: string,
  status: OrcamentoStatus,
) {
  const { data, error } = await supabase
    .from("orcamentos")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─────────────────────────────────────────────────────────
// UPDATE — atualiza cabeçalho e recria itens do zero
// (mais simples que diffar; o cascade dos itens limpa as alocações)
// ─────────────────────────────────────────────────────────
export async function UpdateOrcamento(id: string, input: CreateOrcamentoInput) {
  const { error: orcamentoError } = await supabase
    .from("orcamentos")
    .update({
      titulo: input.titulo,
      cliente: input.cliente,
      tipo: input.tipo,
      margem_lucro: input.margem_lucro,
      aliquota_imposto: input.aliquota_imposto,
      buffer_atraso: input.buffer_atraso,
      validade_dias: input.validade_dias,
      observacoes: input.observacoes,
    })
    .eq("id", id);

  if (orcamentoError) throw new Error(orcamentoError.message);

  const { error: deleteError } = await supabase
    .from("orcamento_itens")
    .delete()
    .eq("orcamento", id);

  if (deleteError) throw new Error(deleteError.message);

  for (const item of input.itens) {
    const { data: itemData, error: itemError } = await supabase
      .from("orcamento_itens")
      .insert({
        orcamento: id,
        descricao: item.descricao,
        descricao_detalhada: item.descricao_detalhada ?? null,
        valor_manual: item.valor_manual ?? null,
      })
      .select()
      .single();

    if (itemError) throw new Error(itemError.message);

    if (item.funcionarios.length > 0) {
      const { error: funcError } = await supabase
        .from("orcamento_item_funcionarios")
        .insert(
          item.funcionarios.map((f) => ({
            item: itemData.id,
            funcionario: f.funcionario,
            meses_alocados: f.meses_alocados,
            salario_snapshot: f.salario_snapshot,
          })),
        );

      if (funcError) throw new Error(funcError.message);
    }
  }
}

// ─────────────────────────────────────────────────────────
// STATS — usado no dashboard pra calcular métricas agregadas.
// Traz já com snapshot do salário (não depende mais do cadastro).
// ─────────────────────────────────────────────────────────
export async function GetOrcamentosStats() {
  const { data, error } = await supabase
    .from("orcamentos")
    .select(
      `
      id, titulo, status, tipo, created_at,
      margem_lucro, aliquota_imposto, buffer_atraso,
      validade_dias,
      cliente (id, nome),
      orcamento_itens (
        id, valor_manual,
        orcamento_item_funcionarios (
          funcionario, meses_alocados, salario_snapshot
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// ─────────────────────────────────────────────────────────
// DELETE — remove orçamento (cascade deleta itens e alocações)
// ─────────────────────────────────────────────────────────
export async function DeleteOrcamento(id: string): Promise<void> {
  const { error } = await supabase.from("orcamentos").delete().eq("id", id);

  if (error) throw new Error(error.message);
}
