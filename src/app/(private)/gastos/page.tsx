"use client";

import { EditGastoDialog } from "@/components/EditGastoDialog/EditGastoDialog";
import { NewGasto } from "@/components/NewGasto/NewGasto";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCountSocietarios,
  useDeleteGasto,
  useListGastos,
} from "@/hooks/use-gastos";
import { Gasto } from "@/types/gastos-types";
import { DollarSignIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function GastosPage() {
  const { data: gastos, isLoading } = useListGastos();
  const { data: totalSocios = 0 } = useCountSocietarios();
  const { mutate: deleteGasto } = useDeleteGasto();
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null);

  const totalMensal =
    gastos?.reduce(
      (acc, g) => acc + (g.recorrencia === "mensal" ? g.valor : g.valor / 12),
      0,
    ) ?? 0;

  const totalAnual =
    gastos?.reduce(
      (acc, g) => acc + (g.recorrencia === "anual" ? g.valor : g.valor * 12),
      0,
    ) ?? 0;

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Gastos
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
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
            className="rounded-xl p-4 flex flex-col gap-1"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              {card.label}
            </span>
            <span
              className="text-xl font-semibold"
              style={{ color: "var(--primary)" }}
            >
              {card.value}
            </span>
          </div>
        ))}
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
              {[
                "Nome",
                "Categoria",
                "Recorrência",
                "Valor",
                "Mensal",
                "Anual",
                "Por sócio/mês",
                "Ações",
              ].map((h, i) => (
                <TableHead
                  key={h}
                  className={`text-xs uppercase tracking-wider ${i >= 3 ? "text-right" : ""}`}
                  style={{ color: "var(--text-muted)" }}
                >
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={8} className="py-16 text-center">
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
                    className="transition-colors"
                    style={{ borderColor: "var(--border)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "var(--bg-hover)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <TableCell>
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {gasto.nome}
                        </p>
                        {gasto.descricao && (
                          <p
                            className="text-xs mt-0.5"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {gasto.descricao}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell
                      className="text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {gasto.categoria ?? "—"}
                    </TableCell>

                    <TableCell>
                      <span
                        className="text-xs px-2 py-1 rounded-full"
                        style={
                          gasto.recorrencia === "mensal"
                            ? {
                                background: "var(--primary-bg)",
                                border: "1px solid var(--primary-border)",
                                color: "var(--primary)",
                              }
                            : {
                                background: "var(--secondary-bg)",
                                border: "1px solid var(--secondary-border)",
                                color: "var(--secondary)",
                              }
                        }
                      >
                        {gasto.recorrencia}
                      </span>
                    </TableCell>

                    <TableCell
                      className="text-sm text-right font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {formatBRL(gasto.valor)}
                    </TableCell>
                    <TableCell
                      className="text-sm text-right"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {formatBRL(mensal)}
                    </TableCell>
                    <TableCell
                      className="text-sm text-right"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {formatBRL(anual)}
                    </TableCell>
                    <TableCell
                      className="text-sm text-right font-medium"
                      style={{ color: "var(--primary)" }}
                    >
                      {formatBRL(porSocio)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setGastoEditando(gasto)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: "var(--text-faint)" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "var(--secondary)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "var(--text-faint)")
                          }
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteGasto(gasto.id)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: "var(--text-faint)" }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "var(--error)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "var(--text-faint)")
                          }
                        >
                          <Trash2Icon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

            {!isLoading && (!gastos || gastos.length === 0) && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={8} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <DollarSignIcon
                      className="w-8 h-8"
                      style={{ color: "var(--text-faint)" }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Nenhum gasto foi cadastrado
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {gastoEditando && (
        <EditGastoDialog
          gasto={gastoEditando}
          open={!!gastoEditando}
          onClose={() => setGastoEditando(null)}
        />
      )}
    </div>
  );
}
