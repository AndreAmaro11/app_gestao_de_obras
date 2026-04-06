import { useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useEtapas } from "@/hooks/useEtapas";
import { useDespesas } from "@/hooks/useDespesas";
import { useReceitas } from "@/hooks/useReceitas";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line, ComposedChart, ReferenceLine,
} from "recharts";

const fmt = (v: number) =>
  v >= 1000
    ? `R$ ${(v / 1000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}k`
    : `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

interface Props {
  obraId: string;
  obraNome: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 71% 45%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(262 83% 58%)",
  "hsl(199 89% 48%)",
  "hsl(25 95% 53%)",
];

const CATEGORIA_LABELS: Record<string, string> = {
  material: "Material",
  mao_de_obra: "Mão de Obra",
  servico: "Serviço",
  equipamento: "Equipamento",
  transporte: "Transporte",
  administrativo: "Administrativo",
  projeto: "Projeto",
  outros: "Outros",
};

const ObraDashboardTab = ({ obraId, obraNome }: Props) => {
  const { data: etapas } = useEtapas(obraId);
  const { data: despesas } = useDespesas(obraId);
  const { data: receitas } = useReceitas(obraId);

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

    return { progressoGeral, orcamentoTotal, totalPago, totalReal, desvio, etapasConcluidas: etapasList.filter((e: any) => e.status === "concluida").length, totalEtapas };
  }, [etapas, despesas]);

  // Chart data: Orçado vs Realizado por etapa
  const barData = useMemo(() => {
    if (!etapas || !despesas) return [];
    return (etapas || []).map((e: any) => {
      const etapaDespesas = (despesas || []).filter((d: any) => d.etapa_id === e.id && !d.despesa_pai_id);
      return {
        nome: e.nome.length > 12 ? e.nome.slice(0, 12) + "…" : e.nome,
        orcado: etapaDespesas.reduce((s: number, d: any) => s + (d.valor_previsto || 0), 0),
        realizado: etapaDespesas.reduce((s: number, d: any) => s + (d.valor_real || 0), 0),
      };
    }).filter(d => d.orcado > 0 || d.realizado > 0);
  }, [etapas, despesas]);

  // Chart data: Donut por categoria
  const pieData = useMemo(() => {
    if (!despesas) return [];
    const despesasList = (despesas || []).filter((d: any) => !d.despesa_pai_id);
    const grouped: Record<string, number> = {};
    despesasList.forEach((d: any) => {
      const cat = d.categoria || "outros";
      grouped[cat] = (grouped[cat] || 0) + (d.valor_real || 0);
    });
    return Object.entries(grouped)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: CATEGORIA_LABELS[name] || name, value }));
  }, [despesas]);

  // Chart data: Evolução mensal
  const lineData = useMemo(() => {
    if (!despesas) return [];
    const despesasList = (despesas || []).filter((d: any) => !d.despesa_pai_id);
    const monthly: Record<string, { previsto: number; real: number }> = {};
    despesasList.forEach((d: any) => {
      const month = d.data?.slice(0, 7);
      if (!month) return;
      if (!monthly[month]) monthly[month] = { previsto: 0, real: 0 };
      monthly[month].previsto += d.valor_previsto || 0;
      monthly[month].real += d.valor_real || 0;
    });
    return Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({
        mes: new Date(month + "-01").toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        previsto: v.previsto,
        real: v.real,
      }));
  }, [despesas]);

  // Chart data: Entradas vs Saídas com saldo acumulado
  const fluxoData = useMemo(() => {
    if (!despesas && !receitas) return [];
    const despesasList = (despesas || []).filter((d: any) => !d.despesa_pai_id);

    // Expand receitas into monthly entries
    const entradasPorMes: Record<string, number> = {};
    (receitas || []).forEach((r: any) => {
      const meses = r.recorrente ? (r.meses_repeticao || 1) : 1;
      const baseDate = new Date(r.data_inicio + "T12:00:00");
      for (let i = 0; i < meses; i++) {
        const d = new Date(baseDate);
        d.setMonth(d.getMonth() + i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        entradasPorMes[key] = (entradasPorMes[key] || 0) + r.valor;
      }
    });

    // Expand despesas (with parcelas) into monthly saídas
    const saidasPorMes: Record<string, number> = {};
    despesasList.forEach((d: any) => {
      const childParcelas = (despesas || []).filter((c: any) => c.despesa_pai_id === d.id);
      if (childParcelas.length > 0) {
        childParcelas.forEach((c: any) => {
          if (!c.data_vencimento) return;
          const dt = new Date(c.data_vencimento);
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
          saidasPorMes[key] = (saidasPorMes[key] || 0) + (c.valor_real || c.valor_previsto);
        });
      } else if (d.data_vencimento && d.parcelas > 1) {
        const baseDate = new Date(d.data_vencimento + "T12:00:00");
        const valorParcela = Math.round((d.valor_real || d.valor_previsto) / d.parcelas * 100) / 100;
        for (let i = 0; i < d.parcelas; i++) {
          const venc = new Date(baseDate);
          venc.setMonth(venc.getMonth() + i);
          const key = `${venc.getFullYear()}-${String(venc.getMonth() + 1).padStart(2, "0")}`;
          saidasPorMes[key] = (saidasPorMes[key] || 0) + valorParcela;
        }
      } else if (d.data_vencimento) {
        const dt = new Date(d.data_vencimento);
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        saidasPorMes[key] = (saidasPorMes[key] || 0) + (d.valor_real || d.valor_previsto);
      }
    });

    const allMonths = Array.from(new Set([...Object.keys(entradasPorMes), ...Object.keys(saidasPorMes)])).sort();
    let acumulado = 0;
    return allMonths.map(mes => {
      const entradas = entradasPorMes[mes] || 0;
      const saidas = saidasPorMes[mes] || 0;
      acumulado += entradas - saidas;
      const [y, m] = mes.split("-");
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return {
        mes: `${monthNames[parseInt(m) - 1]}/${y.slice(2)}`,
        Entradas: entradas,
        Saídas: saidas,
        Acumulado: acumulado,
      };
    });
  }, [despesas, receitas]);

  const kpis = [
    {
      title: "Progresso",
      value: `${stats.progressoGeral}%`,
      subtitle: `${stats.etapasConcluidas}/${stats.totalEtapas} etapas`,
      icon: CheckCircle2,
      iconBg: "bg-primary/10 text-primary",
    },
    {
      title: "Orçamento",
      value: fmt(stats.orcamentoTotal),
      subtitle: "Valor previsto",
      icon: BarChart3,
      iconBg: "bg-accent/10 text-accent",
    },
    {
      title: "Total Pago",
      value: fmt(stats.totalPago),
      subtitle: `de ${fmt(stats.totalReal)}`,
      icon: DollarSign,
      iconBg: "bg-green-500/10 text-green-600",
    },
    {
      title: "Desvio",
      value: `${stats.desvio >= 0 ? "+" : ""}${stats.desvio.toFixed(1)}%`,
      subtitle: stats.desvio > 0 ? "Acima do orçado" : stats.desvio < 0 ? "Abaixo do orçado" : "No orçamento",
      icon: AlertTriangle,
      iconBg: stats.desvio > 5 ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Compact header */}
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{obraNome}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral do projeto</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Progress value={stats.progressoGeral} className="h-2.5 w-32" />
          <span className="text-lg font-bold font-mono">{stats.progressoGeral}%</span>
        </div>
      </div>

      {/* KPI Cards - compact row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="shadow-sm rounded-xl border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{kpi.title}</p>
                  <p className="text-xl font-bold mt-1">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.subtitle}</p>
                </div>
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", kpi.iconBg)}>
                  <kpi.icon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart: Orçado vs Realizado */}
        <Card className="shadow-sm rounded-xl border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Orçado vs Realizado por Etapa</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="nome" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <RechartsTooltip formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="orcado" name="Orçado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados para exibir</p>
            )}
          </CardContent>
        </Card>

        {/* Donut: Distribuição por categoria */}
        <Card className="shadow-sm rounded-xl border-border/50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Distribuição por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(v: number) => fmt(v)} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados para exibir</p>
            )}
          </CardContent>
        </Card>

        {/* Line chart: Evolução mensal */}
        <Card className="shadow-sm rounded-xl border-border/50 lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Evolução Financeira Mensal</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {lineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={lineData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <RechartsTooltip formatter={(v: number) => fmt(v)} />
                  <Line type="monotone" dataKey="previsto" name="Previsto" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="real" name="Realizado" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados para exibir</p>
            )}
          </CardContent>
        </Card>
        {/* Composed chart: Entradas vs Saídas + Saldo Acumulado */}
        <Card className="shadow-sm rounded-xl border-border/50 lg:col-span-2">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold">Fluxo de Caixa — Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {fluxoData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={fluxoData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <RechartsTooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
                  <Legend />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                  <Bar dataKey="Entradas" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Saídas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="Acumulado" name="Saldo Acumulado" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem receitas ou despesas para exibir</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ObraDashboardTab;
