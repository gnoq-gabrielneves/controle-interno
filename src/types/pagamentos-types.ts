export type PagamentoStatus = "pendente" | "pago" | "adiado";

export type PagamentoSocio = {
  id: string;
  societario: number;
  mes: number;
  ano: number;
  valor_base: number;
  valor_total: number;
  status: PagamentoStatus;
  created_at: string;
  funcionario?: {
    id: number;
    name: string;
    cargo: string;
  };
};
