/* eslint-disable @next/next/no-img-element */
"use client";

import { FuncionarioAssinatura } from "@/types/assinatura-types";
import { ArrowLeftIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export function AssinaturaForm({
  funcionario,
}: {
  funcionario: FuncionarioAssinatura;
}) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function gerarHTML() {
    const foto = fotoUrl
      ? `<img src="${fotoUrl}" width="80" height="80" style="width:80px;height:80px;border-radius:50%;object-fit:cover;display:block;" alt="${funcionario.name}" />`
      : `<table cellpadding="0" cellspacing="0" border="0" style="width:80px;height:80px;">
          <tr>
            <td width="80" height="80" align="center" valign="middle" style="width:80px;height:80px;border-radius:50%;background-color:#0F4C81;border:2px solid #00719C;font-size:28px;font-weight:700;color:#ffffff;font-family:Arial,sans-serif;">
              ${(funcionario.name ?? "?").charAt(0).toUpperCase()}
            </td>
          </tr>
        </table>`;

    return `<table cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="font-family:Arial,sans-serif;font-size:13px;color:#1e293b;background-color:#ffffff;padding:16px;">
  <tr>
    <td valign="top" style="padding-right:16px;border-right:3px solid #0F4C81;">
      ${foto}
    </td>
    <td valign="top" style="padding-left:16px;">
      <p style="margin:0 0 2px 0;font-size:16px;font-weight:700;color:#0f1f33;">${funcionario.name ?? ""}</p>
      <p style="margin:0 0 10px 0;font-size:12px;color:#5a7a9a;">${funcionario.cargo ?? ""}</p>
      <table cellpadding="0" cellspacing="0" border="0">
        ${funcionario.telefone ? `<tr><td style="padding-bottom:3px;color:#8fadc8;font-size:11px;padding-right:8px;">Tel</td><td style="padding-bottom:3px;font-size:11px;color:#2d4a6b;">${funcionario.telefone}</td></tr>` : ""}
        <tr><td style="padding-bottom:3px;color:#8fadc8;font-size:11px;padding-right:8px;">Email</td><td style="padding-bottom:3px;font-size:11px;color:#2d4a6b;">${funcionario.email ?? ""}</td></tr>
        <tr><td style="padding-bottom:3px;color:#8fadc8;font-size:11px;padding-right:8px;">Site</td><td style="padding-bottom:3px;font-size:11px;"><a href="https://www.gnoq.com.br" style="color:#00719C;text-decoration:none;">www.gnoq.com.br</a></td></tr>
      </table>
      <p style="margin:10px 0 0 0;font-size:11px;font-weight:700;color:#0F4C81;letter-spacing:1px;">GNOQ</p>
      <p style="margin:0;font-size:9px;color:#8fadc8;letter-spacing:0.5px;">GLOBAL NODE OF QUANTUM</p>
    </td>
  </tr>
</table>`;
  }

  async function handleCopiar() {
    const html = gerarHTML();
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([html], { type: "text/plain" }),
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleDownload() {
    const html = gerarHTML();
    const blob = new Blob(
      [`<!DOCTYPE html><html><body>${html}</body></html>`],
      { type: "text/html" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assinatura-${(funcionario.name ?? "funcionario").toLowerCase().replace(/\s+/g, "-")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sectionStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: 24,
  };

  return (
    <div className="p-8 max-w-3xl flex flex-col gap-6">
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
            Assinatura de email
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {funcionario.name}
          </p>
        </div>
      </div>

      {/* upload de foto */}
      <div style={sectionStyle} className="flex flex-col gap-4">
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Foto
        </p>
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{
              border: "1px solid var(--primary-border)",
              background: "var(--primary-bg)",
            }}
          >
            {fotoUrl ? (
              <img
                src={fotoUrl}
                alt="foto"
                className="w-full h-full object-cover"
              />
            ) : (
              <span
                className="text-xl font-bold"
                style={{ color: "var(--primary)" }}
              >
                {(funcionario.name ?? "?").charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="foto-upload"
              className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all w-fit"
              style={{
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
              }}
            >
              {fotoUrl ? "Trocar foto" : "Selecionar foto"}
            </label>
            <input
              id="foto-upload"
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              className="hidden"
            />
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>
              PNG ou JPG recomendado · tamanho quadrado
            </p>
          </div>
        </div>
      </div>

      {/* preview */}
      <div style={sectionStyle} className="flex flex-col gap-4">
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Preview
        </p>
        <div className="rounded-lg bg-white p-6" ref={previewRef}>
          <div dangerouslySetInnerHTML={{ __html: gerarHTML() }} />
        </div>
      </div>

      {/* ações */}
      <div className="flex gap-3">
        <button
          onClick={handleCopiar}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
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
          <CopyIcon className="w-4 h-4" />
          {copied ? "Copiado!" : "Copiar HTML para Outlook"}
        </button>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm transition-all"
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
          <DownloadIcon className="w-4 h-4" />
          Baixar .html
        </button>
      </div>

      {/* instruções */}
      <div style={sectionStyle} className="flex flex-col gap-3">
        <p
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          Como usar no Outlook
        </p>
        <ol className="flex flex-col gap-2">
          {[
            'Clique em "Copiar HTML para Outlook"',
            "Abra o Outlook e vá em Arquivo → Opções → Email → Assinaturas",
            'Crie uma nova assinatura e clique em "Editar"',
            "Na barra de ferramentas clique em Inserir → Inserir HTML",
            "Cole o código copiado e salve",
          ].map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5"
                style={{
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
