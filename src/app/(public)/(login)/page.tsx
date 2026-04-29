/* eslint-disable @next/next/no-img-element */
"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignIn } from "@/hooks/use-auth";
import { LogInIcon } from "lucide-react";
import React, { useState } from "react";

export default function LoginPage() {
  // variaveis
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // toda a lógica de mutation, redirect e erro fica no hook
  const { mutate, isPending } = useSignIn();

  // funcao pra fazer login
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("submit chamado", { email, password });
    mutate({ email, password });
  }

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="p-5 border rounded-2xl max-w-2xl w-full flex items-center gap-3">
        {/* imagem */}
        <img
          src="./gnoq.png"
          alt="global node of quantum"
          className="w-1/2 rounded-2xl"
        />

        {/* formulario de login */}
        <div className="w-1/2">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold">Bem-vindo</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Entre com sua conta para continuar
            </p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
            <Input
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
            <Button type="submit" disabled={isPending}>
              <LogInIcon />
              <span>{isPending ? "Entrando..." : "Entrar"}</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
