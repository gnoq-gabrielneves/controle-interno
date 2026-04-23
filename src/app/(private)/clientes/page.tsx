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
          <h1 className="text-xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.length ?? 0} clientes cadastrados
          </p>
        </div>
        <NewCliente />
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
                CPF / CNPJ
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Email
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Telefone
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Cidade
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* loading */}
            {isLoading && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="flex justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
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
                  className="border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 text-xs font-medium">
                        {(cliente.nome ?? "")
                          .split(" ")
                          .slice(0, 2)
                          .map((n: string) => n.charAt(0).toUpperCase())
                          .join("") || "?"}
                      </div>
                      <span className="text-sm text-white/80">
                        {cliente.nome}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-white/50">
                    {cliente.cpf_cnpj ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-white/50">
                    {cliente.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-white/50">
                    {cliente.telefone ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-white/50">
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
                    <BuildingIcon className="w-8 h-8 text-white/10" />
                    <p className="text-sm text-white/30">
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
