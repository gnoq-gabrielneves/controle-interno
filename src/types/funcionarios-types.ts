export type CreateFuncionarioInput = {
  name: string;
  cargo: string;
  cpf: string;
  salario: number;
  tipo_contrato: "clt" | "pj" | "estagio" | "autonomo";
  telefone?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
};
