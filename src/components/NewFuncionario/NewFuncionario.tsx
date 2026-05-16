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

const emptyForm: Form = {
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
};

export function NewFuncionario() {
  const { mutate: createFuncionario, isPending } = useCreateFuncionario();
  const [open, setOpen] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);

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
          setForm(emptyForm);
        },
      },
    );
  }

  const inputStyle = {
    background: "var(--bg-base)",
    borderColor: "var(--border)",
    color: "var(--text-primary)",
  };
  const labelClass = "text-xs uppercase tracking-wider font-medium";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
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
        <PlusIcon className="w-4 h-4" />
        Novo funcionário
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="min-w-[50%] max-h-[90vh] overflow-y-auto"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "var(--text-primary)" }}>
              Novo funcionário
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            {/* dados pessoais */}
            <div className="flex flex-col gap-3">
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Dados pessoais
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label
                    className={labelClass}
                    style={{ color: "var(--text-muted)" }}
                  >
                    Nome
                  </Label>
                  <Input
                    placeholder="Nome completo"
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label
                    className={labelClass}
                    style={{ color: "var(--text-muted)" }}
                  >
                    CPF
                  </Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => handleChange("cpf", e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)" }} />

            {/* dados profissionais */}
            <div className="flex flex-col gap-3">
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Dados profissionais
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label
                    className={labelClass}
                    style={{ color: "var(--text-muted)" }}
                  >
                    Cargo
                  </Label>
                  <Input
                    placeholder="Ex: Desenvolvedor"
                    value={form.cargo}
                    onChange={(e) => handleChange("cargo", e.target.value)}
                    required
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
                    placeholder="0,00"
                    value={form.salario}
                    onChange={(e) => handleChange("salario", e.target.value)}
                    required
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
                      }}
                    >
                      <SelectItem
                        value="clt"
                        style={{ color: "var(--text-primary)" }}
                      >
                        CLT
                      </SelectItem>
                      <SelectItem
                        value="pj"
                        style={{ color: "var(--text-primary)" }}
                      >
                        PJ
                      </SelectItem>
                      <SelectItem
                        value="estagio"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Estágio
                      </SelectItem>
                      <SelectItem
                        value="autonomo"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Autônomo
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)" }} />

            {/* endereço */}
            <div className="flex flex-col gap-3">
              <p
                className="text-xs uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Endereço
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label
                    className={labelClass}
                    style={{ color: "var(--text-muted)" }}
                  >
                    CEP
                  </Label>
                  <Input
                    placeholder="00000-000"
                    value={form.cep}
                    onChange={(e) => handleChange("cep", e.target.value)}
                    onBlur={handleCepBlur}
                    style={inputStyle}
                  />
                  {buscandoCep && (
                    <p
                      className="text-xs"
                      style={{ color: "var(--secondary)" }}
                    >
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
                    placeholder="Rua, Avenida..."
                    value={form.logradouro}
                    onChange={(e) => handleChange("logradouro", e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label
                    className={labelClass}
                    style={{ color: "var(--text-muted)" }}
                  >
                    Número
                  </Label>
                  <Input
                    placeholder="Ex: 123"
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
                    placeholder="Apto, Bloco... (opcional)"
                    value={form.complemento}
                    onChange={(e) =>
                      handleChange("complemento", e.target.value)
                    }
                    style={inputStyle}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label
                    className={labelClass}
                    style={{ color: "var(--text-muted)" }}
                  >
                    Bairro
                  </Label>
                  <Input
                    placeholder="Bairro"
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
                    placeholder="Cidade"
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
                    placeholder="UF"
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
              className="w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
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
              {isPending ? "Cadastrando..." : "Cadastrar funcionário"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
