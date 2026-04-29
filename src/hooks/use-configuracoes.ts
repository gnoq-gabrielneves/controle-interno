import {
  GetConfiguracoes,
  UpdateConfiguracoes,
} from "@/services/configuracoes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useGetConfiguracoes() {
  return useQuery({
    queryKey: ["configuracoes"],
    queryFn: GetConfiguracoes,
  });
}

export function useUpdateConfiguracoes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reserva_empresa,
    }: {
      id: string;
      reserva_empresa: number;
    }) => UpdateConfiguracoes(id, reserva_empresa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracoes"] });
      toast.success("Configurações salvas.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar configurações.");
      console.error(error.message);
    },
  });
}
