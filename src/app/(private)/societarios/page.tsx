"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListSocietarios } from "@/hooks/use-societarios";
import { VerifiedIcon } from "lucide-react";

type FuncionarioData = {
  id: string;
  name: string;
  cargo: string;
} | null;

export default function SocietariosPage() {
  const { data, isLoading } = useListSocietarios();

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Societários
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {data?.length ?? 0} societários cadastrados
          </p>
        </div>
        <button
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
          <VerifiedIcon className="w-4 h-4" />
          Novo societário
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
              {["Funcionário", "Cargo"].map((h) => (
                <TableHead
                  key={h}
                  className="text-xs uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  {h}
                </TableHead>
              ))}
              <TableHead
                className="text-xs uppercase tracking-wider text-right"
                style={{ color: "var(--text-muted)" }}
              >
                Participação
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* loading */}
            {isLoading && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={3} className="py-16 text-center">
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

            {/* lista */}
            {!isLoading &&
              data?.map((societario) => {
                const func =
                  societario.funcionario_data as unknown as FuncionarioData;

                return (
                  <TableRow
                    key={societario.funcionario}
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
                    {/* nome com avatar */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                          style={{
                            background: "var(--primary-bg)",
                            border: "1px solid var(--primary-border)",
                            color: "var(--primary)",
                          }}
                        >
                          {(func?.name ?? "")
                            .split(" ")
                            .slice(0, 2)
                            .map((n: string) => n.charAt(0).toUpperCase())
                            .join("") || "?"}
                        </div>
                        <span
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {func?.name ?? "—"}
                        </span>
                      </div>
                    </TableCell>

                    {/* cargo */}
                    <TableCell
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {func?.cargo ?? "—"}
                    </TableCell>

                    {/* participação */}
                    <TableCell className="text-right">
                      <span
                        className="text-sm font-semibold px-2 py-1 rounded-full"
                        style={{
                          background: "var(--primary-bg)",
                          color: "var(--primary)",
                          border: "1px solid var(--primary-border)",
                        }}
                      >
                        {((societario.percent ?? 0) * 100).toFixed(2)}%
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}

            {/* vazio */}
            {!isLoading && (!data || data.length === 0) && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={3} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <VerifiedIcon
                      className="w-8 h-8"
                      style={{ color: "var(--text-faint)" }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Nenhum societário cadastrado
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
