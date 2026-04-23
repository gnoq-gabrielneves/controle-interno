// src/hooks/use-gastos.ts
import { CountSocietarios, CreateGasto, ListGastos } from "@/services/gastos";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useListGastos() {
  return useQuery({
    queryKey: ["list-gastos"],
    queryFn: ListGastos,
  });
}

export function useCountSocietarios() {
  return useQuery({
    queryKey: ["count-societarios"],
    queryFn: CountSocietarios,
  });
}

export function useCreateGasto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: CreateGasto,
    onSuccess: () => {
      // invalida o cache pra lista atualizar automaticamente
      queryClient.invalidateQueries({ queryKey: ["list-gastos"] });
      toast.success("Gasto criado com sucesso.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar gasto.");
      console.error(error.message);
    },
  });
}
