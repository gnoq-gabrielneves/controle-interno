import { supabase } from "@/lib/supabase/supabase";
import { CreateReceitaInput, Receita } from "@/types/receitas-types";

export async function ListReceitas(): Promise<Receita[]> {
  const { data, error } = await supabase
    .from("receitas")
    .select("*")
    .order("ano", { ascending: false })
    .order("mes", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function CreateReceita(
  input: CreateReceitaInput,
): Promise<Receita> {
  const { data, error } = await supabase
    .from("receitas")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function DeleteReceita(id: string): Promise<void> {
  const { error } = await supabase.from("receitas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
