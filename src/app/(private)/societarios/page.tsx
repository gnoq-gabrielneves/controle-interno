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
          <h1 className="text-xl font-semibold">Societários</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.length ?? 0} societários cadastrados
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 text-sm hover:bg-sky-500/20 transition-all">
          <VerifiedIcon className="w-4 h-4" />
          Novo societário
        </button>
      </div>

      {/* tabela */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent bg-white/2">
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Funcionário
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Cargo
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30 text-right">
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
                    <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* lista */}
            {!isLoading &&
              data?.map((societario) => {
                // funcionario_data é um objeto direto, não array
                const func =
                  societario.funcionario_data as unknown as FuncionarioData;

                return (
                  <TableRow
                    key={societario.funcionario}
                    className="border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
                  >
                    {/* nome com avatar */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-300 text-xs font-medium">
                          {(func?.name ?? "")
                            .split(" ")
                            .slice(0, 2)
                            .map((n: string) => n.charAt(0).toUpperCase())
                            .join("") || "?"}
                        </div>
                        <span className="text-sm text-white/80">
                          {func?.name ?? "—"}
                        </span>
                      </div>
                    </TableCell>

                    {/* cargo */}
                    <TableCell className="text-sm text-white/50">
                      {func?.cargo ?? "—"}
                    </TableCell>

                    {/* participação */}
                    <TableCell className="text-right">
                      <span className="text-sm font-medium text-sky-300">
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
                    <VerifiedIcon className="w-8 h-8 text-white/10" />
                    <p className="text-sm text-white/30">
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
