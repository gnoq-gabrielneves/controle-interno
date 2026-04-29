import {
  CreateReceita,
  DeleteReceita,
  ListReceitas,
} from "@/services/receitas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useListReceitas() {
  return useQuery({
    queryKey: ["list-receitas"],
    queryFn: ListReceitas,
  });
}

export function useCreateReceita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CreateReceita,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-receitas"] });
      toast.success("Receita adicionada.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao adicionar receita.");
      console.error(error.message);
    },
  });
}

export function useDeleteReceita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: DeleteReceita,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-receitas"] });
      toast.success("Receita removida.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover receita.");
      console.error(error.message);
    },
  });
}
