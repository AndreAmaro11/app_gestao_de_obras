import { ReactNode, useState, useMemo } from "react";
import { HardHat, LogOut, LayoutDashboard, Calendar, FileText, DollarSign, BarChart3, FolderOpen, Users, ChevronLeft, ChevronRight as ChevronRightIcon, ClipboardCheck, ArrowLeft, TrendingUp, Menu, X, FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useObra } from "@/hooks/useObras";
import { useEtapas } from "@/hooks/useEtapas";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { label: "Obras", icon: LayoutDashboard, path: "/" },
  { label: "Fornecedores", icon: Users, path: "/fornecedores" },
];

const obraNavItems = [
  { label: "Dashboard", icon: BarChart3, tab: "dashboard" },
  { label: "Cronograma", icon: Calendar, tab: "cronograma" },
  { label: "Orçamento", icon: FileText, tab: "orcamento" },
  { label: "Despesas", icon: DollarSign, tab: "despesas" },
  { label: "Receitas", icon: TrendingUp, tab: "receitas" },
  { label: "Financeiro", icon: BarChart3, tab: "financeiro" },
  { label: "Checklist", icon: ClipboardCheck, tab: "checklist" },
  { label: "Documentos", icon: FolderOpen, tab: "documentos" },
  { label: "RDO", icon: FileImage, tab: "rdo" },
];

const AppLayout = ({ children }: AppLayoutProps) => {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const obraMatch = location.pathname.match(/^\/obra\/([^/]+)/);
  const obraId = obraMatch ? obraMatch[1] : null;
  const activeTab = searchParams.get("tab") || "dashboard";

  const { data: obra } = useObra(obraId || undefined);
  const { data: etapas } = useEtapas(obraId || undefined);

  const progresso = useMemo(() => {
    if (!etapas?.length) return 0;
    return Math.round(etapas.reduce((s, e) => s + (e.percentual_concluido || 0), 0) / etapas.length);
  }, [etapas]);

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  const handleTabClick = (tab: string) => {
    setSearchParams({ tab });
    setMobileOpen(false);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const renderNavItem = (item: { label: string; icon: any; path?: string; tab?: string }, isActive: boolean, onClick?: () => void) => {
    const LinkContent = onClick ? (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
        <span>{item.label}</span>
      </button>
    ) : (
      <Link
        to={item.path!}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
        <span>{item.label}</span>
      </Link>
    );

    return <div key={item.label}>{LinkContent}</div>;
  };

  // Collapsed desktop nav item with tooltip
  const renderCollapsedNavItem = (item: { label: string; icon: any; path?: string; tab?: string }, isActive: boolean, onClick?: () => void) => {
    const LinkContent = onClick ? (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
      </button>
    ) : (
      <Link
        to={item.path!}
        className={cn(
          "flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )}
      >
        <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
      </Link>
    );

    return (
      <Tooltip key={item.label} delayDuration={0}>
        <TooltipTrigger asChild>{LinkContent}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  const sidebarContent = (isCollapsed: boolean) => (
    <>
      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {obraId ? (
          <>
            {/* Back to obras */}
            {!isCollapsed ? (
              <button
                onClick={() => handleNavClick("/")}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all w-full text-left mb-2"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span>Voltar para Obras</span>
              </button>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleNavClick("/")}
                    className="flex items-center justify-center px-3 py-2.5 rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all w-full mb-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Voltar para Obras</TooltipContent>
              </Tooltip>
            )}

            {/* Obra name + progress */}
            {!isCollapsed && obra && (
              <div className="px-3 mb-4 animate-fade-in">
                <p className="text-sm font-semibold truncate">{obra.nome}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={progresso} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground font-mono">{progresso}%</span>
                </div>
              </div>
            )}

            {/* Obra nav items */}
            {obraNavItems.map((item) =>
              isCollapsed
                ? renderCollapsedNavItem(item, activeTab === item.tab, () => handleTabClick(item.tab))
                : renderNavItem(item, activeTab === item.tab, () => handleTabClick(item.tab))
            )}
          </>
        ) : (
          navItems.map((item) =>
            isCollapsed
              ? renderCollapsedNavItem(item, location.pathname === item.path)
              : renderNavItem(item, location.pathname === item.path, () => handleNavClick(item.path))
          )
        )}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className={cn("flex items-center gap-3", isCollapsed && "justify-center")}>
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sm font-bold text-sidebar-primary shrink-0">
            {userInitial}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sair</TooltipContent>
          </Tooltip>
          {!isMobile && (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 ml-auto" onClick={() => setCollapsed(!collapsed)}>
                  {collapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">{collapsed ? "Expandir" : "Recolher"}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile header bar */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-50 h-14 bg-sidebar border-b border-sidebar-border flex items-center px-3 gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-sidebar-foreground">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border">
              <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
                <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shrink-0">
                  <HardHat className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold tracking-tight">ObraControl</span>
              </div>
              {sidebarContent(false)}
            </SheetContent>
          </Sheet>
          <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
            <HardHat className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-sidebar-foreground truncate">
            {obraId && obra ? obra.nome : "ObraControl"}
          </span>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
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
          {sidebarContent(collapsed)}
        </aside>
      )}

      {/* Main content */}
      <main className={cn(
        "flex-1 transition-all duration-300 ease-out",
        isMobile ? "mt-14" : (collapsed ? "ml-16" : "ml-60")
      )}>
        <div className="p-3 sm:p-6 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
