import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import CronogramaTab from "@/components/obras/CronogramaTab";
import OrcamentoTab from "@/components/obras/OrcamentoTab";
import DespesasTab from "@/components/obras/DespesasTab";
import FinanceiroTab from "@/components/obras/FinanceiroTab";
import ChecklistTab from "@/components/obras/ChecklistTab";
import DocumentosTab from "@/components/obras/DocumentosTab";
import { useObra } from "@/hooks/useObras";

const padraoLabel: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };

const ObraDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: obra, isLoading } = useObra(id);

  if (isLoading) return <AppLayout><div className="text-center text-muted-foreground py-12">Carregando...</div></AppLayout>;
  if (!obra) return <AppLayout><div className="text-center text-muted-foreground py-12">Obra não encontrada</div></AppLayout>;

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{obra.nome}</h1>
          <p className="text-sm text-muted-foreground">
            {obra.metragem ? `${obra.metragem} m²` : ""} · {padraoLabel[obra.padrao] || obra.padrao}
            {obra.data_inicio && ` · ${new Date(obra.data_inicio).toLocaleDateString("pt-BR")}`}
            {obra.data_previsao_fim && ` → ${new Date(obra.data_previsao_fim).toLocaleDateString("pt-BR")}`}
          </p>
        </div>
      </div>

      <Tabs defaultValue="cronograma">
        <TabsList className="mb-4">
          <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
          <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>
        <TabsContent value="cronograma"><CronogramaTab obraId={obra.id} /></TabsContent>
        <TabsContent value="orcamento"><OrcamentoTab obraId={obra.id} /></TabsContent>
        <TabsContent value="despesas"><DespesasTab obraId={obra.id} /></TabsContent>
        <TabsContent value="financeiro"><FinanceiroTab obraId={obra.id} /></TabsContent>
        <TabsContent value="checklist"><ChecklistTab obraId={obra.id} /></TabsContent>
        <TabsContent value="documentos"><DocumentosTab obraId={obra.id} /></TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default ObraDetailPage;
