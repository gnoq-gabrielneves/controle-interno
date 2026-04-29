import { supabase } from "@/lib/supabase/supabase";
import { Configuracoes } from "@/types/configuracoes-types";

export async function GetConfiguracoes(): Promise<Configuracoes> {
  const { data, error } = await supabase
    .from("configuracoes")
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function UpdateConfiguracoes(
  id: string,
  reserva_empresa: number,
): Promise<Configuracoes> {
  const { data, error } = await supabase
    .from("configuracoes")
    .update({ reserva_empresa, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
