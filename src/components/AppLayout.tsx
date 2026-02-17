import { ReactNode } from "react";
import { HardHat, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <HardHat className="h-6 w-6 text-accent" />
          <span className="text-lg font-bold text-foreground tracking-tight">ObraControl</span>
        </Link>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <LogOut className="h-4 w-4 mr-1" />
          Sair
        </Button>
      </header>
      <main className="max-w-7xl mx-auto p-6">{children}</main>
    </div>
  );
};

export default AppLayout;
