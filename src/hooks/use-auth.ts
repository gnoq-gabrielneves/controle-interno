"use client";
import { SignIn } from "@/services/auth";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useSignIn() {
  const router = useRouter();
  return useMutation({
    mutationFn: SignIn,
    onSuccess: () => {
      console.log("Sucesso ao logar.");
      router.push("/home");
    },
    onError: (error: Error) => {
      toast.error("Erro ao realizar login.");
      console.error("Erro ao realizar login: ", error.message);
    },
  });
}
