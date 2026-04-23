"use client";
import {
  DollarSignIcon,
  GemIcon,
  HomeIcon,
  TagIcon,
  UserIcon,
  VerifiedIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
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

/*
 * DEFINIÇÃO DAS ROTAS
 * - centraliza tudo num array pra facilitar adicionar novos itens
 * - cada item tem: label, url e ícone
 */
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
  ],
};

export function AppSidebar() {
  /*
   * usePathname: retorna a URL atual ex: "/home"
   * usamos pra comparar com o url de cada item e saber qual está ativo
   */
  const pathname = usePathname();

  /*
   * FUNÇÃO HELPER
   * - recebe a url do item e retorna as classes certas
   * - ativo: fundo azul + texto azul claro
   * - inativo: texto apagado com hover azul sutil
   */
  function menuButtonClass(url: string) {
    const isActive = pathname === url;
    return isActive
      ? "bg-sky-500/15 text-sky-300 hover:bg-sky-500/20 hover:text-sky-300"
      : "text-white/50 hover:bg-sky-500/10 hover:text-sky-300 transition-all";
  }

  return (
    <Sidebar>
      <SidebarContent>
        {/* GRUPO: GERAL */}
        <SidebarGroup>
          <SidebarGroupLabel>Geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.geral.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton className={menuButtonClass(item.url)}>
                    <a
                      href={item.url}
                      className="flex flex-row gap-1.5 items-center"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* GRUPO: PESSOAS */}
        <SidebarGroup>
          <SidebarGroupLabel>Pessoas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.pessoas.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton className={menuButtonClass(item.url)}>
                    <a
                      href={item.url}
                      className="flex flex-row gap-1.5 items-center"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* GRUPO: INVESTIMENTOS */}
        <SidebarGroup>
          <SidebarGroupLabel>Investimentos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.investimentos.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton className={menuButtonClass(item.url)}>
                    <a
                      href={item.url}
                      className="flex flex-row gap-1.5 items-center"
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* FOOTER: USUÁRIO */}
      <SidebarFooter className="border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-sky-500/10 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Avatar className="w-8 h-8 border border-sky-500/30">
                  <AvatarFallback className="bg-sky-500/20 text-sky-300 text-xs font-medium">
                    GN
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white/80">
                    Nome Sobrenome
                  </span>
                  <span className="text-xs text-white/30">
                    email@gnoq.com.br
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
