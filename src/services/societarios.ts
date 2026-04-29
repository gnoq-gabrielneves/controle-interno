import { supabase } from "@/lib/supabase/supabase";

// src/services/societarios.ts
export async function ListSocietarios() {
  const { data, error } = await supabase.from("sociedade").select(`
      funcionario,
      percent,
      funcionario_data:funcionario (
        id,
        name,
        cargo,
        salario
      )
    `);

  if (error) throw new Error(error.message);
  return data;
}
