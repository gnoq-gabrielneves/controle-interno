export type Receita = {
  id: string;
  descricao: string;
  valor: number;
  mes: number;
  ano: number;
  created_at: string;
};

export type CreateReceitaInput = {
  descricao: string;
  valor: number;
  mes: number;
  ano: number;
};
