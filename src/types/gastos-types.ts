export type Gasto = {
  id: string;
  nome: string;
  descricao: string | null;
  valor: number;
  valor_unitario: number | null;
  quantidade: number | null;
  recorrencia: "mensal" | "anual";
  categoria: string | null;
  ativo: boolean;
  created_at: string;
};

// src/services/gastos.ts
export type CreateGastoInput = {
  nome: string;
  descricao?: string;
  valor: number;
  valor_unitario?: number;
  quantidade?: number;
  recorrencia: "mensal" | "anual";
  categoria?: string;
};
