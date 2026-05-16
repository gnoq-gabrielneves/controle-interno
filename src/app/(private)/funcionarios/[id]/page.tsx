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
import { ArrowLeftIcon, MailIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { IMaskInput } from "react-imask";

type Form = {
  name: string;
  cargo: string;
  cpf: string;
  salario: string;
  tipo_contrato: "clt" | "pj" | "estagio" | "autonomo";
  telefone: string;
  email: string;
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
  telefone: string | null;
  email: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export default function FuncionarioPage() {
  const { id } = useParams<{ id: string }>();
  const { data: funcionario, isLoading } = useGetFuncionario(id);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div
          className="w-5 h-5 rounded-full border-2 animate-spin"
          style={{
            borderColor: "var(--primary-border)",
            borderTopColor: "var(--primary)",
          }}
        />
      </div>
    );
  }

  if (!funcionario) return null;

  return <FuncionarioForm funcionario={funcionario as Funcionario} />;
}

function FuncionarioForm({ funcionario }: { funcionario: Funcionario }) {
  const router = useRouter();
  const { mutate: updateFuncionario, isPending } = useUpdateFuncionario(
    funcionario.id,
  );
  const [buscandoCep, setBuscandoCep] = useState(false);

  const [form, setForm] = useState<Form>({
    name: funcionario.name ?? "",
    cargo: funcionario.cargo ?? "",
    cpf: funcionario.cpf ?? "",
    salario: funcionario.salario?.toString() ?? "",
    tipo_contrato: funcionario.tipo_contrato ?? "clt",
    telefone: funcionario.telefone ?? "",
    email: funcionario.email ?? "",
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
      telefone: form.telefone || undefined,
      email: form.email || undefined,
      cep: form.cep,
      logradouro: form.logradouro,
      numero: form.numero,
      complemento: form.complemento || undefined,
      bairro: form.bairro,
      cidade: form.cidade,
      estado: form.estado,
    });
  }

  const inputClass = `
    w-full rounded-md border px-3 py-1.5 text-sm transition-colors
    focus:outline-none focus:ring-1
  `;

  const inputStyle = {
    background: "var(--bg-card)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };

  const labelClass = "text-xs uppercase tracking-wider font-medium";

  const sectionStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 24,
  };

  return (
    <div className="p-8 w-full flex flex-col gap-6">
      {/* cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg transition-all"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div>
            <h1
              className="text-xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {funcionario.name}
            </h1>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {funcionario.cargo}
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            router.push(`/funcionarios/${funcionario.id}/assinatura`)
          }
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
          style={{
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <MailIcon className="w-4 h-4" />
          Gerar assinatura
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* dados pessoais */}
        <div style={sectionStyle} className="flex flex-col gap-4">
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Dados pessoais
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Nome",
                field: "name" as keyof Form,
                type: "text",
                required: true,
              },
              { label: "CPF", field: "cpf" as keyof Form, type: "text" },
              { label: "Email", field: "email" as keyof Form, type: "email" },
            ].map((f) => (
              <div key={f.field} className="flex flex-col gap-1.5">
                <Label
                  className={labelClass}
                  style={{ color: "var(--text-muted)" }}
                >
                  {f.label}
                </Label>
                <Input
                  type={f.type}
                  value={form[f.field]}
                  onChange={(e) => handleChange(f.field, e.target.value)}
                  required={f.required}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            ))}
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Telefone
              </Label>
              <IMaskInput
                mask="(00) 00000-0000"
                value={form.telefone}
                onAccept={(value: string) => handleChange("telefone", value)}
                placeholder="(00) 00000-0000"
                className={`flex h-9 ${inputClass}`}
                style={{ ...inputStyle, height: 36 }}
              />
            </div>
          </div>
        </div>

        {/* dados profissionais */}
        <div style={sectionStyle} className="flex flex-col gap-4">
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Dados profissionais
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Cargo
              </Label>
              <Input
                value={form.cargo}
                onChange={(e) => handleChange("cargo", e.target.value)}
                required
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Salário
              </Label>
              <Input
                type="number"
                step="0.01"
                value={form.salario}
                onChange={(e) => handleChange("salario", e.target.value)}
                required
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Tipo de contrato
              </Label>
              <Select
                value={form.tipo_contrato}
                onValueChange={(v) => v && handleChange("tipo_contrato", v)}
              >
                <SelectTrigger
                  className="w-full"
                  style={{ ...inputStyle, height: 36 }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
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
        <div style={sectionStyle} className="flex flex-col gap-4">
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Endereço
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                CEP
              </Label>
              <Input
                value={form.cep}
                onChange={(e) => handleChange("cep", e.target.value)}
                onBlur={handleCepBlur}
                className={inputClass}
                style={inputStyle}
              />
              {buscandoCep && (
                <p className="text-xs" style={{ color: "var(--secondary)" }}>
                  Buscando...
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Logradouro
              </Label>
              <Input
                value={form.logradouro}
                onChange={(e) => handleChange("logradouro", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Número
              </Label>
              <Input
                value={form.numero}
                onChange={(e) => handleChange("numero", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Complemento
              </Label>
              <Input
                value={form.complemento}
                onChange={(e) => handleChange("complemento", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Bairro
              </Label>
              <Input
                value={form.bairro}
                onChange={(e) => handleChange("bairro", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Cidade
              </Label>
              <Input
                value={form.cidade}
                onChange={(e) => handleChange("cidade", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Estado
              </Label>
              <Input
                value={form.estado}
                onChange={(e) => handleChange("estado", e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* botão salvar */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          style={{
            background: "var(--primary)",
            color: "#ffffff",
            border: "1px solid var(--primary)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--primary-light)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--primary)")
          }
        >
          {isPending ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
