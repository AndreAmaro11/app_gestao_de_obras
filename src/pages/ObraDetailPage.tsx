import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import ObraDashboardHeader from "@/components/ObraDashboardHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, FileText, DollarSign, BarChart3, ClipboardCheck, FolderOpen } from "lucide-react";
import CronogramaTab from "@/components/obras/CronogramaTab";
import OrcamentoTab from "@/components/obras/OrcamentoTab";
import DespesasTab from "@/components/obras/DespesasTab";
import FinanceiroTab from "@/components/obras/FinanceiroTab";
import ChecklistTab from "@/components/obras/ChecklistTab";
import DocumentosTab from "@/components/obras/DocumentosTab";
import { useObra } from "@/hooks/useObras";

const ObraDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: obra, isLoading } = useObra(id);

  if (isLoading)
    return (
      <AppLayout>
        <div className="space-y-6 animate-pulse">
          <div className="h-40 rounded-2xl bg-muted" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-xl bg-muted" />)}
          </div>
        </div>
      </AppLayout>
    );

  if (!obra)
    return (
      <AppLayout>
        <div className="text-center text-muted-foreground py-20">Obra não encontrada</div>
      </AppLayout>
    );

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <button onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground transition-colors">
          Obras
        </button>
        <span className="text-muted-foreground/50">/</span>
        <span className="text-foreground font-medium truncate">{obra.nome}</span>
      </div>

      {/* Dashboard header with KPIs */}
      <ObraDashboardHeader obraId={obra.id} obraNome={obra.nome} />

      {/* Tabs */}
      <Tabs defaultValue="cronograma" className="mt-8">
        <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex-wrap gap-0.5">
          <TabsTrigger value="cronograma" className="rounded-lg data-[state=active]:shadow-sm gap-2 text-sm">
            <Calendar className="h-4 w-4" /> Cronograma
          </TabsTrigger>
          <TabsTrigger value="orcamento" className="rounded-lg data-[state=active]:shadow-sm gap-2 text-sm">
            <FileText className="h-4 w-4" /> Orçamento
          </TabsTrigger>
          <TabsTrigger value="despesas" className="rounded-lg data-[state=active]:shadow-sm gap-2 text-sm">
            <DollarSign className="h-4 w-4" /> Despesas
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="rounded-lg data-[state=active]:shadow-sm gap-2 text-sm">
            <BarChart3 className="h-4 w-4" /> Financeiro
          </TabsTrigger>
          <TabsTrigger value="checklist" className="rounded-lg data-[state=active]:shadow-sm gap-2 text-sm">
            <ClipboardCheck className="h-4 w-4" /> Checklist
          </TabsTrigger>
          <TabsTrigger value="documentos" className="rounded-lg data-[state=active]:shadow-sm gap-2 text-sm">
            <FolderOpen className="h-4 w-4" /> Documentos
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="cronograma"><CronogramaTab obraId={obra.id} /></TabsContent>
          <TabsContent value="orcamento"><OrcamentoTab obraId={obra.id} /></TabsContent>
          <TabsContent value="despesas"><DespesasTab obraId={obra.id} /></TabsContent>
          <TabsContent value="financeiro"><FinanceiroTab obraId={obra.id} /></TabsContent>
          <TabsContent value="checklist"><ChecklistTab obraId={obra.id} /></TabsContent>
          <TabsContent value="documentos"><DocumentosTab obraId={obra.id} /></TabsContent>
        </div>
      </Tabs>
    </AppLayout>
  );
};

export default ObraDetailPage;
