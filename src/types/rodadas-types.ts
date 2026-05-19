export type DistribuicaoTipo = "equipe" | "lucro_socio" | "reserva" | "imposto";

export type DistribuicaoStatus = "pendente" | "pago" | "adiado";

export type RodadaDistribuicao = {
  id: string;
  rodada: string;
  funcionario: number | null;
  tipo: DistribuicaoTipo;
  valor: number;
  status: DistribuicaoStatus;
  pago_em: string | null;
  created_at: string;
  // join com funcionarios
  funcionario_data?: {
    id: number;
    name: string;
  } | null;
};

export type RodadaPagamento = {
  id: string;
  orcamento: string | null;
  descricao: string;
  valor_recebido: number;
  data_recebimento: string; // ISO date
  observacoes: string | null;
  created_at: string;
  // join com orçamento (opcional)
  orcamento_data?: {
    id: string;
    titulo: string;
  } | null;
  // distribuições embutidas
  rodada_distribuicoes?: RodadaDistribuicao[];
};

// ─── inputs ───

// quando vincula a um orçamento, distribuições são geradas auto.
// quando avulsa, usuário monta as distribuições à mão.
export type CreateRodadaInput =
  | {
      tipo: "com_orcamento";
      orcamento: string;
      descricao: string;
      valor_recebido: number;
      data_recebimento: string;
      observacoes?: string;
      // calculadas no client, enviadas prontas pro server
      distribuicoes: {
        funcionario: number | null;
        tipo: DistribuicaoTipo;
        valor: number;
      }[];
    }
  | {
      tipo: "avulsa";
      descricao: string;
      valor_recebido: number;
      data_recebimento: string;
      observacoes?: string;
      distribuicoes: {
        funcionario: number | null;
        tipo: DistribuicaoTipo;
        valor: number;
      }[];
    };

export type UpdateDistribuicaoStatusInput = {
  id: string;
  status: DistribuicaoStatus;
};

export type UpdateDistribuicaoValorInput = {
  id: string;
  valor: number;
};
