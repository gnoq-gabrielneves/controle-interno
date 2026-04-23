import { AppSidebar } from "@/components/AppSidebar/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import "../globals.css";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">{children}</main>
    </SidebarProvider>
  );
}
