// middleware.ts (raiz do projeto)
import { updateSession } from "@/lib/supabase/middleware";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user } = await updateSession(request);
  console.log(
    "🔒 middleware rodando:",
    pathname,
    "| user:",
    user?.email ?? "null",
  );

  const isPublicRoute =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  // Não logado tentando acessar rota privada → login
  if (!user && !isPublicRoute) {
    console.log("❌ sem user, redirecionando pra /login");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Já logado tentando acessar login → home
  if (user && isPublicRoute) {
    console.log("✅ user logado em rota pública, redirecionando pra /home");
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // IMPORTANTE: sempre retornar o supabaseResponse, não NextResponse.next()
  // Ele carrega os cookies atualizados da sessão
  return supabaseResponse;
}

export const config = {
  matcher: [
    // Ignora arquivos estáticos e internos do Next.js
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
