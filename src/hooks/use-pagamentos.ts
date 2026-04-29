import {
  AtualizarStatusPagamento,
  ListPagamentos,
  ListPagamentosBySocio,
  UpsertPagamento,
} from "@/services/pagamentos";
import { PagamentoStatus } from "@/types/pagamentos-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useListPagamentos(mes: number, ano: number) {
  return useQuery({
    queryKey: ["list-pagamentos", mes, ano],
    queryFn: () => ListPagamentos(mes, ano),
  });
}

export function useListPagamentosBySocio(societarioId: number) {
  return useQuery({
    queryKey: ["list-pagamentos-socio", societarioId],
    queryFn: () => ListPagamentosBySocio(societarioId),
    enabled: !!societarioId,
  });
}

export function useUpsertPagamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: UpsertPagamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-pagamentos"] });
      toast.success("Pagamento atualizado.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar pagamento.");
      console.error(error.message);
    },
  });
}

export function useAtualizarStatusPagamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PagamentoStatus }) =>
      AtualizarStatusPagamento(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-pagamentos"] });
      toast.success("Status atualizado.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar status.");
      console.error(error.message);
    },
  });
}
