import {
  CreateCliente,
  GetCliente,
  ListClientes,
  UpdateCliente,
} from "@/services/clientes";
import { CreateClienteInput } from "@/types/clientes-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useListClientes() {
  return useQuery({
    queryKey: ["list-clientes"],
    queryFn: ListClientes,
  });
}

export function useGetCliente(id: string) {
  return useQuery({
    queryKey: ["get-cliente", id],
    queryFn: () => GetCliente(id),
    enabled: !!id,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: CreateCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-clientes"] });
      toast.success("Cliente cadastrado com sucesso.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao cadastrar cliente.");
      console.error(error.message);
    },
  });
}

export function useUpdateCliente(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateClienteInput>) =>
      UpdateCliente(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-clientes"] });
      queryClient.invalidateQueries({ queryKey: ["get-cliente", id] });
      toast.success("Cliente atualizado com sucesso.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar cliente.");
      console.error(error.message);
    },
  });
}
