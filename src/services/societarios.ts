import { supabase } from "@/lib/supabase/supabase";

export async function ListSocietarios() {
  const { data, error } = await supabase.from("sociedade").select(`
      funcionario,
      percent,
      funcionario_data:funcionario (
        id,
        name,
        cargo
      )
    `);

  if (error) throw new Error(error.message);
  return data;
}
