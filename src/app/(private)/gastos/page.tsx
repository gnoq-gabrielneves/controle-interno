// src/app/(private)/gastos/page.tsx
"use client";

import { NewGasto } from "@/components/NewGasto/NewGasto";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCountSocietarios, useListGastos } from "@/hooks/use-gastos";
import { DollarSignIcon } from "lucide-react";

// formata valor em BRL
function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function GastosPage() {
  const { data: gastos, isLoading } = useListGastos();
  const { data: totalSocios = 0 } = useCountSocietarios();

  // totais do rodapé
  const totalMensal =
    gastos?.reduce((acc, g) => {
      return acc + (g.recorrencia === "mensal" ? g.valor : g.valor / 12);
    }, 0) ?? 0;

  const totalAnual =
    gastos?.reduce((acc, g) => {
      return acc + (g.recorrencia === "anual" ? g.valor : g.valor * 12);
    }, 0) ?? 0;

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Gastos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {gastos?.length ?? 0} gastos recorrentes cadastrados
          </p>
        </div>

        <NewGasto />
      </div>

      {/* cards de resumo */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total mensal", value: formatBRL(totalMensal) },
          { label: "Total anual", value: formatBRL(totalAnual) },
          {
            label: `Por sócio/mês (${totalSocios} sócios)`,
            value: totalSocios > 0 ? formatBRL(totalMensal / totalSocios) : "—",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-white/10 bg-white/2 p-4 flex flex-col gap-1"
          >
            <span className="text-xs text-white/30 uppercase tracking-wider">
              {card.label}
            </span>
            <span className="text-xl font-semibold text-sky-300">
              {card.value}
            </span>
          </div>
        ))}
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
                Categoria
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Recorrência
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30 text-right">
                Valor
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30 text-right">
                Mensal
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30 text-right">
                Anual
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30 text-right">
                Por sócio/mês
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {/* loading */}
            {isLoading && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
                  </div>
                </TableCell>
              </TableRow>
            )}

            {/* lista */}
            {!isLoading &&
              gastos?.map((gasto) => {
                const mensal =
                  gasto.recorrencia === "mensal"
                    ? gasto.valor
                    : gasto.valor / 12;
                const anual =
                  gasto.recorrencia === "anual"
                    ? gasto.valor
                    : gasto.valor * 12;
                const porSocio = totalSocios > 0 ? mensal / totalSocios : 0;

                return (
                  <TableRow
                    key={gasto.id}
                    className="border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
                  >
                    <TableCell>
                      <div>
                        <p className="text-sm text-white/80">{gasto.nome}</p>
                        {gasto.descricao && (
                          <p className="text-xs text-white/30 mt-0.5">
                            {gasto.descricao}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-white/50">
                      {gasto.categoria ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          gasto.recorrencia === "mensal"
                            ? "bg-sky-500/10 border-sky-500/30 text-sky-300"
                            : "bg-purple-500/10 border-purple-500/30 text-purple-300"
                        }`}
                      >
                        {gasto.recorrencia}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-white/80 text-right">
                      {formatBRL(gasto.valor)}
                    </TableCell>
                    <TableCell className="text-sm text-white/50 text-right">
                      {formatBRL(mensal)}
                    </TableCell>
                    <TableCell className="text-sm text-white/50 text-right">
                      {formatBRL(anual)}
                    </TableCell>
                    <TableCell className="text-sm text-sky-300 text-right">
                      {formatBRL(porSocio)}
                    </TableCell>
                  </TableRow>
                );
              })}

            {/* vazio */}
            {!isLoading && (!gastos || gastos.length === 0) && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <DollarSignIcon className="w-8 h-8 text-white/10" />
                    <p className="text-sm text-white/30">
                      Nenhum gasto cadastrado
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
