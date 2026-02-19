import { ReactNode, useState } from "react";
import { HardHat, LogOut, LayoutDashboard, Calendar, FileText, DollarSign, BarChart3, FolderOpen, Users, ChevronLeft, ChevronRight as ChevronRightIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: "Obras", icon: LayoutDashboard, path: "/" },
  { label: "Fornecedores", icon: Users, path: "/fornecedores" },
];

const obraNavItems = [
  { label: "Cronograma", icon: Calendar, tab: "cronograma" },
  { label: "Orçamento", icon: FileText, tab: "orcamento" },
  { label: "Despesas", icon: DollarSign, tab: "despesas" },
  { label: "Financeiro", icon: BarChart3, tab: "financeiro" },
  { label: "Documentos", icon: FolderOpen, tab: "documentos" },
];

const AppLayout = ({ children }: AppLayoutProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen z-50 flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-out",
          collapsed ? "w-16" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
          <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <HardHat className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight animate-fade-in">
              ObraControl
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const LinkContent = (
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.path} delayDuration={0}>
                  <TooltipTrigger asChild>{LinkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return <div key={item.path}>{LinkContent}</div>;
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {/* User avatar */}
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-bold text-sidebar-primary shrink-0">
              {userInitial}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-medium truncate">{user?.email}</p>
              </div>
            )}
          </div>

          {/* Sign out & collapse */}
          <div className="flex items-center gap-1">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 ml-auto"
                  onClick={() => setCollapsed(!collapsed)}
                >
                  {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{collapsed ? "Expandir" : "Recolher"}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 ease-out",
          collapsed ? "ml-16" : "ml-60"
        )}
      >
        <div className="max-w-7xl mx-auto p-6 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
