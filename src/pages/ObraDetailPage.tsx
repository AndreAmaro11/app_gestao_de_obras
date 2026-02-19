import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import ObraDashboardTab from "@/components/ObraDashboardTab";
import CronogramaTab from "@/components/obras/CronogramaTab";
import OrcamentoTab from "@/components/obras/OrcamentoTab";
import DespesasTab from "@/components/obras/DespesasTab";
import FinanceiroTab from "@/components/obras/FinanceiroTab";
import ChecklistTab from "@/components/obras/ChecklistTab";
import DocumentosTab from "@/components/obras/DocumentosTab";
import { useObra } from "@/hooks/useObras";
import { useEtapas } from "@/hooks/useEtapas";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";

const ObraDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "dashboard";
  const { data: obra, isLoading } = useObra(id);
  const { data: etapas } = useEtapas(id);

  const progresso = useMemo(() => {
    if (!etapas?.length) return 0;
    return Math.round(etapas.reduce((s, e) => s + (e.percentual_concluido || 0), 0) / etapas.length);
  }, [etapas]);

  if (isLoading)
    return (
      <AppLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-10 rounded-xl bg-muted w-1/3" />
          <div className="h-[400px] rounded-xl bg-muted" />
        </div>
      </AppLayout>
    );

  if (!obra)
    return (
      <AppLayout>
        <div className="text-center text-muted-foreground py-20">Obra não encontrada</div>
      </AppLayout>
    );

  const tabLabel: Record<string, string> = {
    dashboard: "Dashboard",
    cronograma: "Cronograma",
    orcamento: "Orçamento",
    despesas: "Despesas",
    financeiro: "Financeiro",
    checklist: "Checklist",
    documentos: "Documentos",
  };

  return (
    <AppLayout>
      {/* Compact header for operational tabs */}
      {activeTab !== "dashboard" && (
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <button onClick={() => navigate("/")} className="hover:text-foreground transition-colors">Obras</button>
              <span className="text-muted-foreground/50">/</span>
              <span className="truncate">{obra.nome}</span>
              <span className="text-muted-foreground/50">/</span>
              <span className="text-foreground font-medium">{tabLabel[activeTab] || activeTab}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight truncate">{tabLabel[activeTab]}</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Progress value={progresso} className="h-2 w-24" />
            <span className="text-sm font-mono text-muted-foreground">{progresso}%</span>
          </div>
        </div>
      )}

      {/* Tab content with fade-in */}
      <div className="animate-fade-in">
        {activeTab === "dashboard" && <ObraDashboardTab obraId={obra.id} obraNome={obra.nome} />}
        {activeTab === "cronograma" && <CronogramaTab obraId={obra.id} />}
        {activeTab === "orcamento" && <OrcamentoTab obraId={obra.id} />}
        {activeTab === "despesas" && <DespesasTab obraId={obra.id} />}
        {activeTab === "financeiro" && <FinanceiroTab obraId={obra.id} />}
        {activeTab === "checklist" && <ChecklistTab obraId={obra.id} />}
        {activeTab === "documentos" && <DocumentosTab obraId={obra.id} />}
      </div>
    </AppLayout>
  );
};

export default ObraDetailPage;
