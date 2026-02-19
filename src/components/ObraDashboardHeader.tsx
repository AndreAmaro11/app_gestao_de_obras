import { useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useEtapas } from "@/hooks/useEtapas";
import { useDespesas } from "@/hooks/useDespesas";

const fmt = (v: number) =>
  v >= 1000
    ? `R$ ${(v / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`
    : `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

interface Props {
  obraId: string;
  obraNome: string;
}

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: number;
  color: string;
  iconBg: string;
}

const KPICard = ({ title, value, subtitle, icon: Icon, trend, color, iconBg }: KPICardProps) => (
  <Card className="shadow-premium hover-lift rounded-xl border-border/50 overflow-hidden">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className={cn("text-2xl font-bold tracking-tight", color)}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50">
          {trend >= 0 ? (
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          )}
          <span className={cn("text-xs font-medium", trend >= 0 ? "text-success" : "text-destructive")}>
            {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground ml-1">vs orçado</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const ObraDashboardHeader = ({ obraId, obraNome }: Props) => {
  const { data: etapas } = useEtapas(obraId);
  const { data: despesas } = useDespesas(obraId);

  const stats = useMemo(() => {
    const etapasList = etapas || [];
    const despesasList = (despesas || []).filter((d: any) => !d.despesa_pai_id);

    const totalEtapas = etapasList.length;
    const progressoGeral = totalEtapas > 0
      ? Math.round(etapasList.reduce((s: number, e: any) => s + (e.percentual_concluido || 0), 0) / totalEtapas)
      : 0;

    const orcamentoTotal = despesasList.reduce((s: number, d: any) => s + (d.valor_previsto || 0), 0);
    const totalPago = despesasList.filter((d: any) => d.pago).reduce((s: number, d: any) => s + (d.valor_real || 0), 0);
    const totalReal = despesasList.reduce((s: number, d: any) => s + (d.valor_real || 0), 0);
    const desvio = orcamentoTotal > 0 ? ((totalReal - orcamentoTotal) / orcamentoTotal) * 100 : 0;

    return { progressoGeral, orcamentoTotal, totalPago, totalReal, desvio };
  }, [etapas, despesas]);

  return (
    <div className="space-y-6">
      {/* Premium header bar */}
      <div className="gradient-primary rounded-2xl p-6 text-white shadow-premium-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{obraNome}</h1>
            <p className="text-white/60 text-sm mt-1">Visão geral do projeto</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold">{stats.progressoGeral}%</p>
            <p className="text-white/60 text-sm">concluído</p>
          </div>
        </div>
        <div className="mt-4">
          <Progress
            value={stats.progressoGeral}
            className="h-2.5 bg-white/20 rounded-full [&>div]:rounded-full [&>div]:bg-white [&>div]:transition-all [&>div]:duration-700"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Progresso da Obra"
          value={`${stats.progressoGeral}%`}
          subtitle={`${(etapas || []).filter((e: any) => e.status === "concluida").length} de ${(etapas || []).length} etapas`}
          icon={CheckCircle2}
          color="text-foreground"
          iconBg="bg-primary/10 text-primary"
        />
        <KPICard
          title="Orçamento Total"
          value={fmt(stats.orcamentoTotal)}
          subtitle="Valor previsto"
          icon={BarChart3}
          color="text-foreground"
          iconBg="bg-accent/10 text-accent"
        />
        <KPICard
          title="Total Pago"
          value={fmt(stats.totalPago)}
          subtitle={`de ${fmt(stats.totalReal)} realizado`}
          icon={DollarSign}
          color="text-foreground"
          iconBg="bg-success/10 text-success"
        />
        <KPICard
          title="Desvio Orçamentário"
          value={`${stats.desvio >= 0 ? "+" : ""}${stats.desvio.toFixed(1)}%`}
          subtitle={stats.desvio > 0 ? "Acima do orçado" : stats.desvio < 0 ? "Abaixo do orçado" : "No orçamento"}
          icon={AlertTriangle}
          trend={stats.desvio}
          color={stats.desvio > 5 ? "text-destructive" : stats.desvio < 0 ? "text-success" : "text-foreground"}
          iconBg={stats.desvio > 5 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}
        />
      </div>
    </div>
  );
};

export default ObraDashboardHeader;
