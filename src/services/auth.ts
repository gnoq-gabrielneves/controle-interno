import { supabase } from "@/lib/supabase/supabase";
import { ISignInInput } from "@/types/auth-types";

export async function SignIn({ email, password }: ISignInInput) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  console.log("data:", data);
  console.log("error:", error);
  if (error) throw new Error(error.message);
  return data;
}
