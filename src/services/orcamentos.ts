import { supabase } from "@/lib/supabase/supabase";
import {
  CreateOrcamentoInput,
  Orcamento,
  OrcamentoStatus,
} from "@/types/orcamentos-types";

export async function ListOrcamentos(): Promise<Orcamento[]> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select(
      `
      id, titulo, status, margem_lucro, aliquota_imposto,
      validade_dias, observacoes, created_at,
      cliente (id, nome, email, cpf_cnpj)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as unknown as Orcamento[];
}

export async function GetOrcamento(id: string) {
  const { data, error } = await supabase
    .from("orcamentos")
    .select(
      `
      id, titulo, status, numero, margem_lucro, aliquota_imposto,
      validade_dias, observacoes, created_at,
      cliente (id, nome, email, cpf_cnpj, telefone, logradouro, numero, cidade, estado),
      orcamento_itens (
        id, descricao,
        orcamento_item_funcionarios (
          id, horas,
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

export async function CreateOrcamento(input: CreateOrcamentoInput) {
  // 1. cria o orçamento
  const { data: orcamento, error: orcamentoError } = await supabase
    .from("orcamentos")
    .insert({
      titulo: input.titulo,
      cliente: input.cliente,
      margem_lucro: input.margem_lucro,
      aliquota_imposto: input.aliquota_imposto,
      validade_dias: input.validade_dias,
      observacoes: input.observacoes,
    })
    .select()
    .single();

  if (orcamentoError) throw new Error(orcamentoError.message);

  // 2. cria os itens
  for (const item of input.itens) {
    const { data: itemData, error: itemError } = await supabase
      .from("orcamento_itens")
      .insert({
        orcamento: orcamento.id,
        descricao: item.descricao,
        horas: item.funcionarios.reduce((acc, f) => acc + f.horas, 0),
      })
      .select()
      .single();

    if (itemError) throw new Error(itemError.message);

    // 3. atribui funcionários ao item
    if (item.funcionarios.length > 0) {
      const { error: funcError } = await supabase
        .from("orcamento_item_funcionarios")
        .insert(
          item.funcionarios.map((f) => ({
            item: itemData.id,
            funcionario: f.funcionario,
            horas: f.horas,
          })),
        );

      if (funcError) throw new Error(funcError.message);
    }
  }

  return orcamento;
}

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

export async function UpdateOrcamento(id: string, input: CreateOrcamentoInput) {
  // 1. atualiza o cabeçalho
  const { error: orcamentoError } = await supabase
    .from("orcamentos")
    .update({
      titulo: input.titulo,
      cliente: input.cliente,
      margem_lucro: input.margem_lucro,
      aliquota_imposto: input.aliquota_imposto,
      validade_dias: input.validade_dias,
      observacoes: input.observacoes,
    })
    .eq("id", id);

  if (orcamentoError) throw new Error(orcamentoError.message);

  // 2. deleta todos os itens antigos (cascade deleta os funcionários também)
  const { error: deleteError } = await supabase
    .from("orcamento_itens")
    .delete()
    .eq("orcamento", id);

  if (deleteError) throw new Error(deleteError.message);

  // 3. recria os itens com os novos dados
  for (const item of input.itens) {
    const { data: itemData, error: itemError } = await supabase
      .from("orcamento_itens")
      .insert({
        orcamento: id,
        descricao: item.descricao,
        horas: item.funcionarios.reduce((acc, f) => acc + f.horas, 0),
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
            horas: f.horas,
          })),
        );

      if (funcError) throw new Error(funcError.message);
    }
  }
}
