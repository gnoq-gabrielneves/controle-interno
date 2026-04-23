import { supabase } from "@/lib/supabase/supabase";
import { Cliente, CreateClienteInput } from "@/types/clientes-types";

export async function ListClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("nome", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function GetCliente(id: string): Promise<Cliente> {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function CreateCliente(
  input: CreateClienteInput,
): Promise<Cliente> {
  const { data, error } = await supabase
    .from("clientes")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function UpdateCliente(
  id: string,
  input: Partial<CreateClienteInput>,
): Promise<Cliente> {
  const { data, error } = await supabase
    .from("clientes")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
