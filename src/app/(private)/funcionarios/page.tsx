"use client";
import { NewFuncionario } from "@/components/NewFuncionario/NewFuncionario";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListFuncionarios } from "@/hooks/use-funcionarios";
import { UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FuncionariosPage() {
  const { data, isLoading } = useListFuncionarios();
  const router = useRouter();

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Funcionários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.length ?? 0} funcionários cadastrados
          </p>
        </div>
        <NewFuncionario />
      </div>

      {/* tabela */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent bg-white/2">
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Nome
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Cargo
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                CPF
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Salário
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Tipo de Contrato
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* loading */}
            {isLoading && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={2} className="py-16 text-center">
                  <div className="flex justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
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
                  className="border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
                >
                  {/* nome com avatar */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 text-xs font-medium">
                        {(funcionario.name ?? "")
                          .split(" ")
                          .slice(0, 2)
                          .map((n: string) => n.charAt(0).toUpperCase())
                          .join("") || "?"}
                      </div>
                      <span className="text-sm text-white/80">
                        {funcionario.name}
                      </span>
                    </div>
                  </TableCell>

                  {/* cargo */}
                  <TableCell className="text-sm text-white/50">
                    {funcionario.cargo}
                  </TableCell>
                  {/* cpf */}
                  <TableCell className="text-sm text-white/50">
                    {funcionario.cpf}
                  </TableCell>
                  {/* salario */}
                  <TableCell className="text-sm text-white/50">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(funcionario.salario ?? 0)}
                  </TableCell>
                  <TableCell className="text-sm text-white/50">
                    {funcionario.tipo_contrato.toUpperCase()}
                  </TableCell>
                </TableRow>
              ))}

            {/* vazio */}
            {!isLoading && (!data || data.length === 0) && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={2} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <UserIcon className="w-8 h-8 text-white/10" />
                    <p className="text-sm text-white/30">
                      Nenhum funcionário cadastrado
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
