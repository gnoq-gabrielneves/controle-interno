"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetFuncionario,
  useUpdateFuncionario,
} from "@/hooks/use-funcionarios";
import { ArrowLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

type Form = {
  name: string;
  cargo: string;
  cpf: string;
  salario: string;
  tipo_contrato: "clt" | "pj" | "estagio" | "autonomo";
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

type Funcionario = {
  id: string;
  name: string;
  cargo: string;
  cpf: string;
  salario: number;
  tipo_contrato: "clt" | "pj" | "estagio" | "autonomo";
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

// componente pai — aguarda os dados e só então monta o form
export default function FuncionarioPage() {
  const { id } = useParams<{ id: string }>();
  const { data: funcionario, isLoading } = useGetFuncionario(id);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-sky-500/30 border-t-sky-400 animate-spin" />
      </div>
    );
  }

  if (!funcionario) return null;

  // só monta o form quando funcionario está disponível
  return <FuncionarioForm funcionario={funcionario as Funcionario} />;
}

// componente filho — recebe os dados prontos e inicializa o form uma vez
function FuncionarioForm({ funcionario }: { funcionario: Funcionario }) {
  const router = useRouter();
  const { mutate: updateFuncionario, isPending } = useUpdateFuncionario(
    funcionario.id,
  );
  const [buscandoCep, setBuscandoCep] = useState(false);

  // useState inicializa direto com os dados — sem useEffect
  const [form, setForm] = useState<Form>({
    name: funcionario.name ?? "",
    cargo: funcionario.cargo ?? "",
    cpf: funcionario.cpf ?? "",
    salario: funcionario.salario?.toString() ?? "",
    tipo_contrato: funcionario.tipo_contrato ?? "clt",
    cep: funcionario.cep ?? "",
    logradouro: funcionario.logradouro ?? "",
    numero: funcionario.numero ?? "",
    complemento: funcionario.complemento ?? "",
    bairro: funcionario.bairro ?? "",
    cidade: funcionario.cidade ?? "",
    estado: funcionario.estado ?? "",
  });

  function handleChange(field: keyof Form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCepBlur() {
    const cep = form.cep.replace(/\D/g, "");
    if (cep.length !== 8) return;

    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((prev) => ({
          ...prev,
          logradouro: data.logradouro ?? "",
          bairro: data.bairro ?? "",
          cidade: data.localidade ?? "",
          estado: data.uf ?? "",
        }));
      }
    } catch {
      console.error("Erro ao buscar CEP");
    } finally {
      setBuscandoCep(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateFuncionario({
      name: form.name,
      cargo: form.cargo,
      cpf: form.cpf,
      salario: parseFloat(form.salario),
      tipo_contrato: form.tipo_contrato,
      cep: form.cep,
      logradouro: form.logradouro,
      numero: form.numero,
      complemento: form.complemento || undefined,
      bairro: form.bairro,
      cidade: form.cidade,
      estado: form.estado,
    });
  }

  const inputClass =
    "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-sky-500/50";
  const labelClass = "text-white/60 text-xs uppercase tracking-wider";

  return (
    <div className="p-8 w-full flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-all text-white/50 hover:text-white/80"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-semibold">{funcionario.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {funcionario.cargo}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* dados pessoais */}
        <div className="rounded-xl border border-white/10 bg-white/2 p-6 flex flex-col gap-4">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Dados pessoais
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>CPF</Label>
              <Input
                value={form.cpf}
                onChange={(e) => handleChange("cpf", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* dados profissionais */}
        <div className="rounded-xl border border-white/10 bg-white/2 p-6 flex flex-col gap-4">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Dados profissionais
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Cargo</Label>
              <Input
                value={form.cargo}
                onChange={(e) => handleChange("cargo", e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Salário</Label>
              <Input
                type="number"
                step="0.01"
                value={form.salario}
                onChange={(e) => handleChange("salario", e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Tipo de contrato</Label>
              <Select
                value={form.tipo_contrato}
                onValueChange={(v) => v && handleChange("tipo_contrato", v)}
              >
                <SelectTrigger className="bg-white/5 w-full border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d0d1a] border-white/10 text-white">
                  <SelectItem value="clt">CLT</SelectItem>
                  <SelectItem value="pj">PJ</SelectItem>
                  <SelectItem value="estagio">Estágio</SelectItem>
                  <SelectItem value="autonomo">Autônomo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* endereço */}
        <div className="rounded-xl border border-white/10 bg-white/2 p-6 flex flex-col gap-4">
          <p className="text-xs text-white/30 uppercase tracking-wider">
            Endereço
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>CEP</Label>
              <Input
                value={form.cep}
                onChange={(e) => handleChange("cep", e.target.value)}
                onBlur={handleCepBlur}
                className={inputClass}
              />
              {buscandoCep && (
                <p className="text-xs text-sky-400">Buscando...</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label className={labelClass}>Logradouro</Label>
              <Input
                value={form.logradouro}
                onChange={(e) => handleChange("logradouro", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Número</Label>
              <Input
                value={form.numero}
                onChange={(e) => handleChange("numero", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Complemento</Label>
              <Input
                value={form.complemento}
                onChange={(e) => handleChange("complemento", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Bairro</Label>
              <Input
                value={form.bairro}
                onChange={(e) => handleChange("bairro", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Cidade</Label>
              <Input
                value={form.cidade}
                onChange={(e) => handleChange("cidade", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className={labelClass}>Estado</Label>
              <Input
                value={form.estado}
                onChange={(e) => handleChange("estado", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* botão salvar */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 rounded-lg border border-sky-500/30 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-sm transition-all disabled:opacity-50"
        >
          {isPending ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
