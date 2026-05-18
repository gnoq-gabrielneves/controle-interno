export type OrcamentoStatus = "rascunho" | "enviado" | "aprovado" | "recusado";
export type OrcamentoTipo = "projeto_fechado" | "por_modulo";

export type OrcamentoItemFuncionario = {
  id: string;
  funcionario: number;
  meses_alocados: number;
  salario_snapshot: number;
  funcionario_data?: {
    id: number;
    name: string;
    salario: number; // salário atual no cadastro (pra mostrar "estava X, agora Y")
  };
};

export type OrcamentoItem = {
  id: string;
  descricao: string;
  descricao_detalhada: string | null;
  valor_manual: number | null;
  orcamento_item_funcionarios: OrcamentoItemFuncionario[];
};

export type Orcamento = {
  id: string;
  titulo: string;
  status: OrcamentoStatus;
  tipo: OrcamentoTipo;
  margem_lucro: number;
  aliquota_imposto: number;
  buffer_atraso: number;
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
  tipo: OrcamentoTipo;
  margem_lucro: number;
  aliquota_imposto: number;
  buffer_atraso: number;
  validade_dias: number;
  observacoes?: string;
  itens: {
    descricao: string;
    descricao_detalhada?: string | null;
    valor_manual?: number | null;
    funcionarios: {
      funcionario: number;
      meses_alocados: number;
      salario_snapshot: number;
    }[];
  }[];
};
