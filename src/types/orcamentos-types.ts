export type OrcamentoStatus = "rascunho" | "enviado" | "aprovado" | "recusado";

export type OrcamentoItemFuncionario = {
  id: string;
  funcionario: number;
  horas: number;
  funcionario_data?: {
    id: number;
    name: string;
    salario: number;
  };
};

export type OrcamentoItem = {
  id: string;
  descricao: string;
  horas: number;
  funcionarios: OrcamentoItemFuncionario[];
};

export type Orcamento = {
  id: string;
  titulo: string;
  status: OrcamentoStatus;
  margem_lucro: number;
  aliquota_imposto: number;
  validade_dias: number;
  observacoes: string | null;
  created_at: string;
  cliente: {
    id: string;
    nome: string;
    email: string | null;
    cpf_cnpj: string | null;
  } | null;
};

export type CreateOrcamentoInput = {
  titulo: string;
  cliente: string;
  margem_lucro: number;
  aliquota_imposto: number;
  validade_dias: number;
  observacoes?: string;
  itens: {
    descricao: string;
    descricao_detalhada?: string | null; // ← era null, agora é opcional
    funcionarios: {
      funcionario: number;
      horas: number;
    }[];
  }[];
};

// src/services/orcamentos.ts
export type CreateOrcamentoItemInput = {
  descricao: string;
  descricao_detalhada?: string | null;
  funcionarios: { funcionario: number; horas: number }[];
};
