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
    class: "bg-white/10 border-white/20 text-white/50",
  },
  enviado: {
    label: "Enviado",
    class: "bg-sky-500/10 border-sky-500/30 text-sky-300",
  },
  aprovado: {
    label: "Aprovado",
    class: "bg-green-500/10 border-green-500/30 text-green-300",
  },
  recusado: {
    label: "Recusado",
    class: "bg-red-500/10 border-red-500/30 text-red-300",
  },
};

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function OrcamentosPage() {
  const { data, isLoading } = useListOrcamentos();
  const router = useRouter();

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Orçamentos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.length ?? 0} orçamentos cadastrados
          </p>
        </div>
        <button
          onClick={() => router.push("/orcamentos/novo")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 text-sm hover:bg-sky-500/20 transition-all"
        >
          <PlusIcon className="w-4 h-4" />
          Novo orçamento
        </button>
      </div>

      {/* tabela */}
      <div className="rounded-xl border border-white/10 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent bg-white/[0.02]">
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Título
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Cliente
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Status
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Validade
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-white/30">
                Criado em
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow className="border-0 hover:bg-transparent">
                <TableCell colSpan={5} className="py-16 text-center">
                  <div className="flex justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
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
                    className="border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <TableCell className="text-sm text-white/80">
                      {orcamento.titulo}
                    </TableCell>
                    <TableCell className="text-sm text-white/50">
                      {(orcamento.cliente as { nome: string } | null)?.nome ??
                        "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${status.class}`}
                      >
                        {status.label}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-white/50">
                      {validade.toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-sm text-white/50">
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
                    <FileTextIcon className="w-8 h-8 text-white/10" />
                    <p className="text-sm text-white/30">
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
