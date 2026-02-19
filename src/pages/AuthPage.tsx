import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HardHat, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  if (authLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-xl gradient-primary animate-pulse" />
      </div>
    );
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side — gradient panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <HardHat className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight">ObraControl</span>
          </div>

          <div className="space-y-6 max-w-md">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              Gestão inteligente para suas obras
            </h2>
            <p className="text-lg text-white/70 leading-relaxed">
              Controle cronograma, orçamento, despesas e documentos em um único lugar. Simples, profissional e eficiente.
            </p>
            <div className="flex gap-8 pt-4">
              <div>
                <p className="text-3xl font-bold">100%</p>
                <p className="text-sm text-white/60">Controle financeiro</p>
              </div>
              <div>
                <p className="text-3xl font-bold">360°</p>
                <p className="text-sm text-white/60">Visão da obra</p>
              </div>
              <div>
                <p className="text-3xl font-bold">24/7</p>
                <p className="text-sm text-white/60">Acesso online</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/40">© 2025 ObraControl. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-3 lg:items-start">
            <div className="lg:hidden h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
              <HardHat className="h-7 w-7 text-white" />
            </div>
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                {isLogin ? "Bem-vindo de volta" : "Criar conta"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {isLogin ? "Entre com suas credenciais para continuar" : "Preencha os dados para começar"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-muted/50 border-border/60 focus:bg-card transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 rounded-xl bg-muted/50 border-border/60 focus:bg-card transition-colors"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl gradient-primary text-white font-semibold text-base shadow-premium hover:shadow-premium-hover transition-all duration-200 hover:-translate-y-0.5"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Aguarde...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {isLogin ? "Entrar" : "Cadastrar"}
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Cadastre-se" : "Faça login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
