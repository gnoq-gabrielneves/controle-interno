"use client";

import { AssinaturaForm } from "@/components/AssinaturaForm/AssinaturaForm";
import { useGetFuncionario } from "@/hooks/use-funcionarios";
import { FuncionarioAssinatura } from "@/types/assinatura-types";
import { useParams } from "next/navigation";

export default function AssinaturaPage() {
  const { id } = useParams<{ id: string }>();
  const { data: funcionario, isLoading } = useGetFuncionario(id);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{
            borderColor: "var(--primary-border)",
            borderTopColor: "var(--primary)",
          }}
        />
      </div>
    );
  }

  if (!funcionario) return null;

  return <AssinaturaForm funcionario={funcionario as FuncionarioAssinatura} />;
}
