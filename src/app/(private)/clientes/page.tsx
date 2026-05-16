"use client";

import { NewCliente } from "@/components/NewCliente/NewCliente";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListClientes } from "@/hooks/use-clientes";
import { BuildingIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ClientesPage() {
  const { data, isLoading } = useListClientes();
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
            Clientes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {data?.length ?? 0} clientes cadastrados
          </p>
        </div>
        <NewCliente />
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
              {["Nome", "CPF / CNPJ", "Email", "Telefone", "Cidade"].map(
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
            {/* loading */}
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

            {/* lista */}
            {!isLoading &&
              data?.map((cliente) => (
                <TableRow
                  key={cliente.id}
                  onClick={() => router.push(`/clientes/${cliente.id}`)}
                  className="cursor-pointer transition-colors"
                  style={{ borderColor: "var(--border)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                        style={{
                          background: "var(--secondary-bg)",
                          border: "1px solid var(--secondary-border)",
                          color: "var(--secondary)",
                        }}
                      >
                        {(cliente.nome ?? "")
                          .split(" ")
                          .slice(0, 2)
                          .map((n: string) => n.charAt(0).toUpperCase())
                          .join("") || "?"}
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {cliente.nome}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {cliente.cpf_cnpj ?? "—"}
                  </TableCell>
                  <TableCell
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {cliente.email ?? "—"}
                  </TableCell>
                  <TableCell
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {cliente.telefone ?? "—"}
                  </TableCell>
                  <TableCell
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {cliente.cidade
                      ? `${cliente.cidade}/${cliente.estado}`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}

            {/* vazio */}
            {!isLoading && (!data || data.length === 0) && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <BuildingIcon
                      className="w-8 h-8"
                      style={{ color: "var(--text-faint)" }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Nenhum cliente cadastrado
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
