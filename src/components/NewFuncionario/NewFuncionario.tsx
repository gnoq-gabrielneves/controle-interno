// src/components/funcionarios/new-funcionario.tsx
"use client";
import { useCreateFuncionario } from "@/hooks/use-funcionarios";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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

export function NewFuncionario() {
  const { mutate: createFuncionario, isPending } = useCreateFuncionario();
  const [open, setOpen] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const [form, setForm] = useState<Form>({
    name: "",
    cargo: "",
    cpf: "",
    salario: "",
    tipo_contrato: "clt",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  function handleChange(field: keyof Form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  /*
   * BUSCA CEP
   * - chama a API do ViaCEP quando o campo perde o foco
   * - preenche logradouro, bairro, cidade e estado automaticamente
   */
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
    createFuncionario(
      {
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
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm({
            name: "",
            cargo: "",
            cpf: "",
            salario: "",
            tipo_contrato: "clt",
            cep: "",
            logradouro: "",
            numero: "",
            complemento: "",
            bairro: "",
            cidade: "",
            estado: "",
          });
        },
      },
    );
  }

  const inputClass =
    "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:border-sky-500/50";
  const labelClass = "text-white/60 text-xs uppercase tracking-wider";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-300 text-sm hover:bg-sky-500/20 transition-all"
      >
        <PlusIcon className="w-4 h-4" />
        Novo funcionário
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0d0d1a] border border-white/10 text-white min-w-[50%] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Novo funcionário</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            {/* dados pessoais */}
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
                Dados pessoais
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className={labelClass}>Nome</Label>
                  <Input
                    placeholder="Nome completo"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className={labelClass}>CPF</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => handleChange("cpf", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* dados profissionais */}
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
                Dados profissionais
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className={labelClass}>Cargo</Label>
                  <Input
                    placeholder="Ex: Desenvolvedor"
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
                    placeholder="0,00"
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
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
                Endereço
              </p>
              <div className="flex flex-col gap-3">
                {/* cep */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className={labelClass}>CEP</Label>
                    <Input
                      placeholder="00000-000"
                      value={form.cep}
                      onChange={(e) => handleChange("cep", e.target.value)}
                      onBlur={handleCepBlur}
                      className={inputClass}
                    />
                    {/* feedback enquanto busca o cep */}
                    {buscandoCep && (
                      <p className="text-xs text-sky-400">Buscando...</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <Label className={labelClass}>Logradouro</Label>
                    <Input
                      placeholder="Rua, Avenida..."
                      value={form.logradouro}
                      onChange={(e) =>
                        handleChange("logradouro", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* numero e complemento */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className={labelClass}>Número</Label>
                    <Input
                      placeholder="Ex: 123"
                      value={form.numero}
                      onChange={(e) => handleChange("numero", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className={labelClass}>Complemento</Label>
                    <Input
                      placeholder="Apto, Bloco... (opcional)"
                      value={form.complemento}
                      onChange={(e) =>
                        handleChange("complemento", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* bairro, cidade, estado */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className={labelClass}>Bairro</Label>
                    <Input
                      placeholder="Bairro"
                      value={form.bairro}
                      onChange={(e) => handleChange("bairro", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className={labelClass}>Cidade</Label>
                    <Input
                      placeholder="Cidade"
                      value={form.cidade}
                      onChange={(e) => handleChange("cidade", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className={labelClass}>Estado</Label>
                    <Input
                      placeholder="UF"
                      value={form.estado}
                      onChange={(e) => handleChange("estado", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2 rounded-lg border border-sky-500/30 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-sm transition-all disabled:opacity-50"
            >
              {isPending ? "Cadastrando..." : "Cadastrar funcionário"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
