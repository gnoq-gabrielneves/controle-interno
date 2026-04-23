"use client";
import { useCreateCliente } from "@/hooks/use-clientes";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

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

const emptyForm: Form = {
  nome: "",
  email: "",
  telefone: "",
  cpf_cnpj: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
};

export function NewCliente() {
  const { mutate: createCliente, isPending } = useCreateCliente();
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
    createCliente(
      {
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
      },
      {
        onSuccess: () => {
          setOpen(false);
          setForm(emptyForm);
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
        Novo cliente
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-[#0d0d1a] border border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Novo cliente</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-2">
            {/* dados principais */}
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
                Dados principais
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <Label className={labelClass}>Nome</Label>
                  <Input
                    placeholder="Nome completo ou razão social"
                    value={form.nome}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className={labelClass}>CPF / CNPJ</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={form.cpf_cnpj}
                    onChange={(e) => handleChange("cpf_cnpj", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className={labelClass}>Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={form.telefone}
                    onChange={(e) => handleChange("telefone", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col gap-1.5 col-span-2">
                  <Label className={labelClass}>Email</Label>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* endereço */}
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider mb-3">
                Endereço
              </p>
              <div className="flex flex-col gap-3">
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
              className="w-full mt-2 py-2 rounded-lg border border-sky-500/30 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-sm transition-all disabled:opacity-50"
            >
              {isPending ? "Cadastrando..." : "Cadastrar cliente"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
