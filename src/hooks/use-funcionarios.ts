"use client";
import {
  CreateFuncionario,
  GetFuncionario,
  ListFuncionarios,
  UpdateFuncionario,
} from "@/services/funcionarios";
import { CreateFuncionarioInput } from "@/types/funcionarios-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useListFuncionarios() {
  return useQuery({
    queryKey: ["list-funcionarios"],
    queryFn: ListFuncionarios,
  });
}

export function useCreateFuncionario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: CreateFuncionario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-funcionarios"] });
      toast.success("Funcionário cadastrado com sucesso.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao cadastrar funcionário.");
      console.error(error.message);
    },
  });
}

export function useGetFuncionario(id: string) {
  return useQuery({
    queryKey: ["get-funcionario", id],
    queryFn: () => GetFuncionario(id),
    enabled: !!id, // só busca se tiver id
  });
}

export function useUpdateFuncionario(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<CreateFuncionarioInput>) =>
      UpdateFuncionario(id, input),
    onSuccess: () => {
      // invalida tanto a lista quanto o detalhe
      queryClient.invalidateQueries({ queryKey: ["list-funcionarios"] });
      queryClient.invalidateQueries({ queryKey: ["get-funcionario", id] });
      toast.success("Funcionário atualizado com sucesso.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar funcionário.");
      console.error(error.message);
    },
  });
}
