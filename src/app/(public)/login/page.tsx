/* eslint-disable @next/next/no-img-element */
"use client";

import { Input } from "@/components/ui/input";
import { useSignIn } from "@/hooks/use-auth";
import { LogInIcon } from "lucide-react";
import React, { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate, isPending } = useSignIn();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate({ email, password });
  }

  return (
    <div
      className="h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div
        className="rounded-2xl overflow-hidden flex max-w-3xl w-full mx-4"
        style={{
          border: "1px solid var(--border)",
          background: "var(--bg-card)",
        }}
      >
        {/* imagem */}
        <div
          className="w-1/2 relative hidden md:block"
          style={{ background: "#02447f" }}
        >
          <img
            src="./gnoq2026.png"
            alt="GNOQ"
            className="w-full h-full object-contain"
          />
          {/* overlay sutil */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(15,76,129,0.3) 0%, rgba(0,113,156,0.1) 100%)",
            }}
          />
        </div>

        {/* formulário */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          {/* logo mobile */}
          <div className="md:hidden mb-8 flex justify-center">
            <img src="./gnoq2026.png" alt="GNOQ" className="h-12 w-auto" />
          </div>

          <div className="mb-8">
            <h1
              className="text-2xl font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Bem-vindo de volta
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Entre com sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs uppercase tracking-wider font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Email
              </label>
              <Input
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                style={{
                  background: "var(--bg-base)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className="text-xs uppercase tracking-wider font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                Senha
              </label>
              <Input
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                style={{
                  background: "var(--bg-base)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all disabled:opacity-60"
              style={{
                background: "var(--primary)",
                color: "#ffffff",
                border: "1px solid var(--primary)",
              }}
              onMouseEnter={(e) =>
                !isPending &&
                (e.currentTarget.style.background = "var(--primary-light)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "var(--primary)")
              }
            >
              {isPending ? (
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{
                    borderColor: "rgba(255,255,255,0.3)",
                    borderTopColor: "#ffffff",
                  }}
                />
              ) : (
                <LogInIcon className="w-4 h-4" />
              )}
              {isPending ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p
            className="text-xs text-center mt-8"
            style={{ color: "var(--text-faint)" }}
          >
            GNOQ · Global Node of Quantum
          </p>
        </div>
      </div>
    </div>
  );
}
