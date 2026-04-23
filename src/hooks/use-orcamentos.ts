import {
  CreateOrcamento,
  GetOrcamento,
  ListOrcamentos,
  UpdateOrcamento,
  UpdateOrcamentoStatus,
} from "@/services/orcamentos";
import {
  CreateOrcamentoInput,
  OrcamentoStatus,
} from "@/types/orcamentos-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useListOrcamentos() {
  return useQuery({
    queryKey: ["list-orcamentos"],
    queryFn: ListOrcamentos,
  });
}

export function useGetOrcamento(id: string) {
  return useQuery({
    queryKey: ["get-orcamento", id],
    queryFn: () => GetOrcamento(id),
    enabled: !!id,
  });
}

export function useCreateOrcamento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CreateOrcamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-orcamentos"] });
      toast.success("Orçamento criado com sucesso.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar orçamento.");
      console.error(error.message);
    },
  });
}

export function useUpdateOrcamentoStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: OrcamentoStatus) => UpdateOrcamentoStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["get-orcamento", id] });
      toast.success("Status atualizado.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar status.");
      console.error(error.message);
    },
  });
}

// adiciona no src/hooks/use-orcamentos.ts
export function useUpdateOrcamento(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateOrcamentoInput) => UpdateOrcamento(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-orcamentos"] });
      queryClient.invalidateQueries({ queryKey: ["get-orcamento", id] });
      toast.success("Orçamento atualizado com sucesso.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar orçamento.");
      console.error(error.message);
    },
  });
}
