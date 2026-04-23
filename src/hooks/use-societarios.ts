import { ListSocietarios } from "@/services/societarios";
import { useQuery } from "@tanstack/react-query";

export function useListSocietarios() {
  return useQuery({
    queryKey: ["list-societarios"],
    queryFn: ListSocietarios,
  });
}
