"use client";
import { ListFuncionarios } from "@/services/funcionarios";
import { useQuery } from "@tanstack/react-query";

export function useListFuncionarios() {
  return useQuery({
    queryKey: ["list-funcionarios"],
    queryFn: ListFuncionarios,
  });
}
