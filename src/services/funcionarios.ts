import { supabase } from "@/lib/supabase/supabase";

export async function ListFuncionarios() {
  const { data, error } = await supabase.from("funcionarios").select("*");
  if (error) throw new Error(error.message);
  return data;
}
