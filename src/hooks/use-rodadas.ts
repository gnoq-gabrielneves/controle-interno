import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CreateRodada,
  DeleteRodada,
  ListRodadas,
  ListRodadasPorMes,
  UpdateDistribuicaoStatus,
  UpdateDistribuicaoValor,
} from "../services/rodadas";

// chaves
const k = {
  all: ["rodadas"] as const,
  list: () => [...k.all, "list"] as const,
  porMes: (mes: number, ano: number) =>
    [...k.all, "por-mes", mes, ano] as const,
};

export function useListRodadas() {
  return useQuery({
    queryKey: k.list(),
    queryFn: ListRodadas,
  });
}

export function useListRodadasPorMes(mes: number, ano: number) {
  return useQuery({
    queryKey: k.porMes(mes, ano),
    queryFn: () => ListRodadasPorMes(mes, ano),
  });
}

export function useCreateRodada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CreateRodada,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: k.all });
      toast.success("Rodada de pagamento criada.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar rodada.");
      console.error(error.message);
    },
  });
}

export function useDeleteRodada() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DeleteRodada,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: k.all });
      toast.success("Rodada excluída.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir rodada.");
      console.error(error.message);
    },
  });
}

export function useUpdateDistribuicaoStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateDistribuicaoStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: k.all });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar status.");
      console.error(error.message);
    },
  });
}

export function useUpdateDistribuicaoValor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpdateDistribuicaoValor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: k.all });
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar valor.");
      console.error(error.message);
    },
  });
}
