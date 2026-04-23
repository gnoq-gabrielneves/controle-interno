import { supabase } from "@/lib/supabase/supabase";
import { CreateFuncionarioInput } from "@/types/funcionarios-types";

export async function ListFuncionarios() {
  const { data, error } = await supabase
    .from("funcionarios")
    .select("*")
    .order("id", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function CreateFuncionario(input: CreateFuncionarioInput) {
  const { data, error } = await supabase
    .from("funcionarios")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function GetFuncionario(id: string) {
  const { data, error } = await supabase
    .from("funcionarios")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function UpdateFuncionario(
  id: string,
  input: Partial<CreateFuncionarioInput>,
) {
  const { data, error } = await supabase
    .from("funcionarios")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
