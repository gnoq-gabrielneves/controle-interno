"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function NotFound() {
  const router = useRouter();

  /*
   * CONTADOR REGRESSIVO
   * - começa em 10 e decrementa a cada segundo
   * - quando chega a 0, redireciona pro dashboard
   */
  const [count, setCount] = useState(10);

  useEffect(() => {
    if (count === 0) {
      router.push("/home");
      return;
    }

    const timer = setTimeout(() => setCount((c) => c - 1), 1000);

    // cleanup: cancela o timer se o usuário sair antes
    return () => clearTimeout(timer);
  }, [count, router]);

  /*
   * PROGRESSO DA BARRA
   * - começa em 100% e vai até 0 conforme o contador diminui
   * - (count / 10) * 100 = percentual restante
   */
  const progress = (count / 10) * 100;

  return (
    /*
     * CAMADA RAIZ
     * - mesmo fundo da página de login pra consistência visual
     */
    <div className="relative h-screen w-full overflow-hidden bg-[#080810] flex items-center justify-center">
      {/* GRID DE FUNDO */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,179,237,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,179,237,0.07) 1px, transparent 1px)
          `,
          backgroundSize: "35px 35px",
        }}
      />

      {/* VINHETA NAS BORDAS */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, #080810 80%)",
        }}
      />

      {/*
       * BRILHO VERMELHO NO CENTRO
       * - diferente do login que usa azul, aqui usamos vermelho
         pra comunicar visualmente que algo deu errado
       */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(239,68,68,0.07) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* CONTEÚDO PRINCIPAL */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {/*
         * NÚMERO 404
         * - text-[160px]: gigante, vira elemento visual não só texto
         * - leading-none: remove line-height padrão que adicionaria espaço
         * - bg-clip-text + text-transparent: aplica o gradiente no texto
         * - o gradiente vai do branco pra um branco bem apagado
         *   criando sensação de profundidade/desgaste
         */}
        <h1
          className="font-bold leading-none select-none"
          style={{
            fontSize: "clamp(100px, 20vw, 180px)",
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.15) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </h1>

        {/*
         * LINHA DECORATIVA
         * - separa o número do texto abaixo
         * - gradiente de transparente > vermelho > transparente
         *   pra não ter bordas duras
         */}
        <div
          className="w-48 h-px my-6"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)",
          }}
        />

        {/* TÍTULO E DESCRIÇÃO */}
        <h2 className="text-xl font-semibold text-white mb-2">
          Página não encontrada
        </h2>
        <p className="text-sm text-white/40 max-w-xs">
          O endereço que você acessou não existe ou foi removido.
        </p>

        {/*
         * BARRA DE PROGRESSO + CONTADOR
         * - mt-10: espaço generoso acima
         * - a barra encolhe da direita pra esquerda via width dinâmico
         * - transition-all duration-1000: animação de 1 segundo
         *   sincronizada com o intervalo do setTimeout
         */}
        <div className="mt-10 w-64">
          <p className="text-xs text-white/30 mb-3">
            Redirecionando em{" "}
            <span className="text-white/60 font-medium">{count}s</span>
          </p>

          {/* trilha da barra */}
          <div className="h-px w-full bg-white/10 rounded-full overflow-hidden">
            {/* preenchimento da barra */}
            <div
              className="h-full bg-red-500/60 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/*
         * BOTÃO VOLTAR
         * - volta uma página no histórico do browser
         * - estilo fantasma pra não competir com o 404
         */}
        <button
          onClick={() => router.back()}
          className="mt-8 text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-4"
        >
          ou volte à página anterior
        </button>
      </div>
    </div>
  );
}
