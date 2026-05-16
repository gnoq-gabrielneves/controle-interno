// src/hooks/use-gastos.ts
import {
  CountSocietarios,
  CreateGasto,
  DeleteGasto,
  ListGastos,
  UpdateGasto,
} from "@/services/gastos";
import { CreateGastoInput } from "@/types/gastos-types";
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

export function useDeleteGasto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DeleteGasto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-gastos"] });
      toast.success("Gasto removido.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover gasto.");
      console.error(error.message);
    },
  });
}

export function useUpdateGasto(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateGastoInput>) => UpdateGasto(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-gastos"] });
      toast.success("Gasto atualizado.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar gasto.");
      console.error(error.message);
    },
  });
}
