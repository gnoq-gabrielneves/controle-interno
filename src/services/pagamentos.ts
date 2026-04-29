import { supabase } from "@/lib/supabase/supabase";
import { PagamentoSocio, PagamentoStatus } from "@/types/pagamentos-types";

export async function ListPagamentos(
  mes: number,
  ano: number,
): Promise<PagamentoSocio[]> {
  const { data, error } = await supabase
    .from("pagamentos_socios")
    .select(`*, funcionario:funcionarios(id, name, cargo)`)
    .eq("mes", mes)
    .eq("ano", ano);

  if (error) throw new Error(error.message);
  return data as unknown as PagamentoSocio[];
}

export async function ListPagamentosBySocio(
  societarioId: number,
): Promise<PagamentoSocio[]> {
  const { data, error } = await supabase
    .from("pagamentos_socios")
    .select("*")
    .eq("societario", societarioId)
    .order("ano", { ascending: false })
    .order("mes", { ascending: false });

  if (error) throw new Error(error.message);
  return data as unknown as PagamentoSocio[];
}

export async function UpsertPagamento(input: {
  societario: number;
  mes: number;
  ano: number;
  valor_base: number;
  valor_total: number;
  status: PagamentoStatus;
}): Promise<PagamentoSocio> {
  const { data, error } = await supabase
    .from("pagamentos_socios")
    .upsert(input, { onConflict: "societario,mes,ano" })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as unknown as PagamentoSocio;
}

export async function AtualizarStatusPagamento(
  id: string,
  status: PagamentoStatus,
): Promise<void> {
  const { error } = await supabase
    .from("pagamentos_socios")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
