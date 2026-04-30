import { supabaseSecondary } from "@/lib/supabase/supabase";
import { CreatePostInput, IPost } from "@/types/secondary/devblog-types";

export async function ListPosts(): Promise<IPost[]> {
  const { data, error } = await supabaseSecondary
    .from("devblog")
    .select("*")
    .order("id", { ascending: false });

  console.log("devblog data:", data);
  console.log("devblog error:", error);

  if (error) throw new Error(error.message);
  return data;
}

export async function CreatePost(input: CreatePostInput): Promise<IPost> {
  const { data, error } = await supabaseSecondary
    .from("devblog")
    .insert(input)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function DeletePost(id: number): Promise<void> {
  const { error } = await supabaseSecondary
    .from("devblog")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
