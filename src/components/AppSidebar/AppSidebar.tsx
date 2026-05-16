"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  BoxIcon,
  CpuIcon,
  DollarSignIcon,
  GemIcon,
  HomeIcon,
  LogOutIcon,
  SettingsIcon,
  TagIcon,
  UserIcon,
  VerifiedIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";

const menuItems = {
  geral: [{ label: "Home", url: "/home", icon: HomeIcon }],
  pessoas: [
    { label: "Funcionários", url: "/funcionarios", icon: UserIcon },
    { label: "Societários", url: "/societarios", icon: VerifiedIcon },
    { label: "Clientes", url: "/clientes", icon: GemIcon },
  ],
  investimentos: [
    { label: "Gastos", url: "/gastos", icon: DollarSignIcon },
    { label: "Orçamentos", url: "/orcamentos", icon: TagIcon },
    { label: "Distribuição", url: "/distribuicao", icon: BoxIcon },
  ],
  sistema: [{ label: "DevBlogs", url: "/devblogs", icon: CpuIcon }],
  auditoria: [
    {
      label: "Configurações Globais",
      url: "/configuracoes",
      icon: SettingsIcon,
    },
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState("??");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserEmail(user.email ?? null);

      // pega as iniciais do email (parte antes do @)
      const name = user.email?.split("@")[0] ?? "";
      const parts = name.split(".");
      const initials = parts
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join("");
      setUserInitials(initials);
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActive(url: string) {
    return pathname === url || pathname.startsWith(url + "/");
  }

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.geral.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton isActive={isActive(item.url)}>
                    <Link
                      href={item.url}
                      className="flex items-center gap-2 w-full"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Pessoas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.pessoas.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton isActive={isActive(item.url)}>
                    <Link
                      href={item.url}
                      className="flex items-center gap-2 w-full"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Investimentos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.investimentos.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton isActive={isActive(item.url)}>
                    <Link
                      href={item.url}
                      className="flex items-center gap-2 w-full"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.sistema.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton isActive={isActive(item.url)}>
                    <Link
                      href={item.url}
                      className="flex items-center gap-2 w-full"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Auditoria</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.auditoria.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton isActive={isActive(item.url)}>
                    <Link
                      href={item.url}
                      className="flex items-center gap-2 w-full"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2.5">
                <Avatar className="w-8 h-8 border border-sky-500/30">
                  <AvatarFallback className="bg-sky-500/20 text-sky-300 text-xs font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white/80 max-w-36 truncate">
                    {userEmail ?? "Carregando..."}
                  </span>
                  <span className="text-xs text-white/30">Administrador</span>
                </div>
              </div>

              {/* botão de logout */}
              <button
                onClick={handleLogout}
                className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                title="Sair"
              >
                <LogOutIcon className="w-4 h-4" />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
