"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetCliente, useUpdateCliente } from "@/hooks/use-clientes";
import { ArrowLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

type Form = {
  nome: string;
  email: string;
  telefone: string;
  cpf_cnpj: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
};

type Cliente = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf_cnpj: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
};

export default function ClientePage() {
  const { id } = useParams<{ id: string }>();
  const { data: cliente, isLoading } = useGetCliente(id);

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

  if (!cliente) return null;

  return <ClienteForm cliente={cliente as Cliente} />;
}

function ClienteForm({ cliente }: { cliente: Cliente }) {
  const router = useRouter();
  const { mutate: updateCliente, isPending } = useUpdateCliente(cliente.id);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const [form, setForm] = useState<Form>({
    nome: cliente.nome ?? "",
    email: cliente.email ?? "",
    telefone: cliente.telefone ?? "",
    cpf_cnpj: cliente.cpf_cnpj ?? "",
    cep: cliente.cep ?? "",
    logradouro: cliente.logradouro ?? "",
    numero: cliente.numero ?? "",
    complemento: cliente.complemento ?? "",
    bairro: cliente.bairro ?? "",
    cidade: cliente.cidade ?? "",
    estado: cliente.estado ?? "",
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
    updateCliente({
      nome: form.nome,
      email: form.email || null,
      telefone: form.telefone || null,
      cpf_cnpj: form.cpf_cnpj || null,
      cep: form.cep || null,
      logradouro: form.logradouro || null,
      numero: form.numero || null,
      complemento: form.complemento || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
    });
  }

  const inputStyle = {
    background: "var(--bg-card)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };

  const sectionStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 24,
  };

  const labelClass = "text-xs uppercase tracking-wider font-medium";

  return (
    <div className="p-8 w-full flex flex-col gap-6">
      {/* cabeçalho */}
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
            {cliente.nome}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {cliente.cpf_cnpj ?? "Sem CPF/CNPJ"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* dados principais */}
        <div style={sectionStyle} className="flex flex-col gap-4">
          <p
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Dados principais
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Nome
              </Label>
              <Input
                value={form.nome}
                onChange={(e) => handleChange("nome", e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                CPF / CNPJ
              </Label>
              <Input
                value={form.cpf_cnpj}
                onChange={(e) => handleChange("cpf_cnpj", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Telefone
              </Label>
              <Input
                value={form.telefone}
                onChange={(e) => handleChange("telefone", e.target.value)}
                style={inputStyle}
              />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <Label
                className={labelClass}
                style={{ color: "var(--text-muted)" }}
              >
                Email
              </Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                style={inputStyle}
              />
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
                style={inputStyle}
              />
            </div>
          </div>
        </div>

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
