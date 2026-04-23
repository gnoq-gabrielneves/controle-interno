import { supabase } from "@/lib/supabase/supabase";
import { CreateGastoInput, Gasto } from "@/types/gastos-types";

export async function ListGastos(): Promise<Gasto[]> {
  const { data, error } = await supabase
    .from("gastos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function CreateGasto(input: CreateGastoInput): Promise<Gasto> {
  const { data, error } = await supabase
    .from("gastos")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function CountSocietarios(): Promise<number> {
  const { count, error } = await supabase
    .from("sociedade")
    .select("*", { count: "exact", head: true });

  if (error) throw new Error(error.message);
  return count ?? 0;
}
