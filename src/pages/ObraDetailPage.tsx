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

const ObraDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock - will be replaced with Supabase query
  const obra = { id, nome: "Casa Residencial Silva", metragem: 180, padrao: "Médio", data_inicio: "2024-03-01", data_previsao_fim: "2024-12-15" };

  return (
    <AppLayout>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{obra.nome}</h1>
          <p className="text-sm text-muted-foreground">{obra.metragem} m² · {obra.padrao} · {new Date(obra.data_inicio).toLocaleDateString("pt-BR")} → {new Date(obra.data_previsao_fim).toLocaleDateString("pt-BR")}</p>
        </div>
      </div>

      <Tabs defaultValue="cronograma">
        <TabsList className="mb-4">
          <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
          <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
        </TabsList>
        <TabsContent value="cronograma"><CronogramaTab /></TabsContent>
        <TabsContent value="orcamento"><OrcamentoTab /></TabsContent>
        <TabsContent value="despesas"><DespesasTab /></TabsContent>
        <TabsContent value="financeiro"><FinanceiroTab /></TabsContent>
        <TabsContent value="checklist"><ChecklistTab /></TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default ObraDetailPage;
