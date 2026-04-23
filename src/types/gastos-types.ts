export type Gasto = {
  id: string;
  nome: string;
  descricao: string | null;
  valor: number;
  recorrencia: "mensal" | "anual";
  categoria: string | null;
  ativo: boolean;
  created_at: string;
};

export type CreateGastoInput = {
  nome: string;
  descricao?: string;
  valor: number;
  recorrencia: "mensal" | "anual";
  categoria?: string;
};
