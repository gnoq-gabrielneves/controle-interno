"use client";
import { NewFuncionario } from "@/components/NewFuncionario/NewFuncionario";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListFuncionarios } from "@/hooks/use-funcionarios";
import { UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

export default function FuncionariosPage() {
  const { data, isLoading } = useListFuncionarios();
  const router = useRouter();
  const custoTotalEquipe = useMemo(
    () => (data ?? []).reduce((acc, f) => acc + (f.salario ?? 0), 0),
    [data],
  );

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Funcionários
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {data?.length ?? 0} funcionários cadastrados
          </p>
        </div>
        <NewFuncionario />
      </div>

      {/* tabela */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <Table>
          <TableHeader>
            <TableRow
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--bg-card-alt)",
              }}
              className="hover:bg-transparent"
            >
              {["Nome", "Cargo", "CPF", "Salário", "Tipo de Contrato"].map(
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
              data?.map((funcionario) => (
                <TableRow
                  key={funcionario.id}
                  onClick={() => router.push(`/funcionarios/${funcionario.id}`)}
                  className="cursor-pointer transition-colors"
                  style={{ borderColor: "var(--border)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
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
                        {(funcionario.name ?? "")
                          .split(" ")
                          .slice(0, 2)
                          .map((n: string) => n.charAt(0).toUpperCase())
                          .join("") || "?"}
                      </div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {funcionario.name}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {funcionario.cargo}
                  </TableCell>

                  <TableCell
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {funcionario.cpf}
                  </TableCell>

                  <TableCell
                    className="text-sm"
                    style={{ color: "var(--text-secondary)" }}
                    title={`R$ ${((funcionario.salario ?? 0) / 220).toFixed(2)}/h (base 220h)`}
                  >
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(funcionario.salario ?? 0)}
                  </TableCell>

                  <TableCell className="text-sm">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: "var(--primary-bg)",
                        color: "var(--primary)",
                        border: "1px solid var(--primary-border)",
                      }}
                    >
                      {funcionario.tipo_contrato.toUpperCase()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}

            {/* vazio */}
            {!isLoading && (!data || data.length === 0) && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <UserIcon
                      className="w-8 h-8"
                      style={{ color: "var(--text-faint)" }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Nenhum funcionário cadastrado
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          {!isLoading && data && data.length > 0 && (
            <TableFooter
              style={{
                backgroundColor: "var(--bg-card-alt)",
                borderTop: "1px solid var(--border)",
              }}
            >
              <TableRow
                className="hover:bg-transparent"
                style={{ borderColor: "var(--border)" }}
              >
                <TableCell
                  colSpan={3}
                  className="text-xs uppercase tracking-wider font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Custo total da equipe
                </TableCell>
                <TableCell
                  className="text-sm font-semibold"
                  style={{ color: "var(--primary)" }}
                  title={`${data.length} funcionário${data.length > 1 ? "s" : ""} · R$ ${(custoTotalEquipe / 220).toFixed(2)}/h base`}
                >
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(custoTotalEquipe)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
