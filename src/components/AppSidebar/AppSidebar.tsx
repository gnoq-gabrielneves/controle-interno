/* eslint-disable @next/next/no-img-element */
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

function MenuGroup({
  label,
  items,
  isActive,
}: {
  label: string;
  items: typeof menuItems.geral;
  isActive: (url: string) => boolean;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
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
  );
}

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
      {/* logo no topo */}
      <div className="flex items-center justify-center px-4 py-4 border-b border-secondary">
        <img
          src="/gnoq2026.png"
          alt="GNOQ"
          className="w-full max-w-45 select-none pointer-events-none"
        />
      </div>

      <SidebarContent>
        <MenuGroup label="Geral" items={menuItems.geral} isActive={isActive} />
        <MenuGroup
          label="Pessoas"
          items={menuItems.pessoas}
          isActive={isActive}
        />
        <MenuGroup
          label="Investimentos"
          items={menuItems.investimentos}
          isActive={isActive}
        />
        <MenuGroup
          label="Sistema"
          items={menuItems.sistema}
          isActive={isActive}
        />
        <MenuGroup
          label="Auditoria"
          items={menuItems.auditoria}
          isActive={isActive}
        />
      </SidebarContent>

      <SidebarFooter style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2.5">
                <Avatar
                  className="w-8 h-8"
                  style={{ border: "1px solid rgba(255,255,255,0.25)" }}
                >
                  <AvatarFallback
                    className="text-xs font-medium"
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      color: "#ffffff",
                    }}
                  >
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span
                    className="text-sm font-medium max-w-36 truncate"
                    style={{ color: "rgba(255,255,255,0.90)" }}
                  >
                    {userEmail ?? "Carregando..."}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "rgba(255,255,255,0.50)" }}
                  >
                    Administrador
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 transition-colors"
                style={{ color: "rgba(255,255,255,0.30)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#fca5a5")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.30)")
                }
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
