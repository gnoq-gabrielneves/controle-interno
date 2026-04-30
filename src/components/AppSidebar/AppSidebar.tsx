"use client";

import {
  BoxIcon,
  CpuIcon,
  DollarSignIcon,
  GemIcon,
  HomeIcon,
  SettingsIcon,
  TagIcon,
  UserIcon,
  VerifiedIcon,
} from "lucide-react";
import Link from "next/link";
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
  auditoria: [
    {
      label: "Configurações Globais",
      url: "/configuracoes",
      icon: SettingsIcon,
    },
  ],
  sistema: [{ label: "DevBlogs", url: "/devblogs", icon: CpuIcon }],
};

export function AppSidebar() {
  const pathname = usePathname();

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
