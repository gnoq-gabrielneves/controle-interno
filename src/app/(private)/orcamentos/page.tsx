"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListOrcamentos } from "@/hooks/use-orcamentos";
import { FileTextIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

const statusConfig = {
  rascunho: {
    label: "Rascunho",
    color: "#6b7280",
    bg: "rgba(107,114,128,0.10)",
    border: "rgba(107,114,128,0.30)",
  },
  enviado: {
    label: "Enviado",
    color: "#00719C",
    bg: "rgba(0,113,156,0.10)",
    border: "rgba(0,113,156,0.30)",
  },
  aprovado: {
    label: "Aprovado",
    color: "#15803d",
    bg: "rgba(21,128,61,0.10)",
    border: "rgba(21,128,61,0.30)",
  },
  recusado: {
    label: "Recusado",
    color: "#b91c1c",
    bg: "rgba(185,28,28,0.10)",
    border: "rgba(185,28,28,0.30)",
  },
};

export default function OrcamentosPage() {
  const { data, isLoading } = useListOrcamentos();
  const router = useRouter();

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Orçamentos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {data?.length ?? 0} orçamentos cadastrados
          </p>
        </div>
        <button
          onClick={() => router.push("/orcamentos/novo")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: "var(--primary)",
            color: "#ffffff",
            border: "1px solid var(--primary)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--primary-light)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--primary)")
          }
        >
          <PlusIcon className="w-4 h-4" />
          Novo orçamento
        </button>
      </div>

      {/* tabela */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <Table>
          <TableHeader>
            <TableRow
              className="hover:bg-transparent"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-card-alt)",
              }}
            >
              {["Título", "Cliente", "Status", "Validade", "Criado em"].map(
                (h) => (
                  <TableHead
                    key={h}
                    className="text-xs uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {h}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="flex justify-center">
                    <div
                      className="w-5 h-5 rounded-full border-2 animate-spin"
                      style={{
                        borderColor: "var(--primary-border)",
                        borderTopColor: "var(--primary)",
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              data?.map((orcamento) => {
                const status = statusConfig[orcamento.status];
                const validade = new Date(orcamento.created_at);
                validade.setDate(validade.getDate() + orcamento.validade_dias);

                return (
                  <TableRow
                    key={orcamento.id}
                    onClick={() => router.push(`/orcamentos/${orcamento.id}`)}
                    className="cursor-pointer transition-colors"
                    style={{ borderColor: "var(--border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <TableCell
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {orcamento.titulo}
                    </TableCell>

                    <TableCell
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {(orcamento.cliente as { nome: string } | null)?.nome ??
                        "—"}
                    </TableCell>

                    <TableCell>
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          color: status.color,
                          background: status.bg,
                          border: `1px solid ${status.border}`,
                        }}
                      >
                        {status.label}
                      </span>
                    </TableCell>

                    <TableCell
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {validade.toLocaleDateString("pt-BR")}
                    </TableCell>

                    <TableCell
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {new Date(orcamento.created_at).toLocaleDateString(
                        "pt-BR",
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

            {!isLoading && (!data || data.length === 0) && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <FileTextIcon
                      className="w-8 h-8"
                      style={{ color: "var(--text-faint)" }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Nenhum orçamento cadastrado
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
