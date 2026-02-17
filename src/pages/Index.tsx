import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import NovaObraDialog from "@/components/NovaObraDialog";
import StatusBadge from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";

const mockObras = [
  { id: "1", nome: "Casa Residencial Silva", metragem: 180, padrao: "medio", data_inicio: "2024-03-01", data_previsao_fim: "2024-12-15", status: "em_andamento" as const },
  { id: "2", nome: "Reforma Apt 302", metragem: 75, padrao: "alto", data_inicio: "2024-06-01", data_previsao_fim: "2024-09-30", status: "concluida" as const },
  { id: "3", nome: "Sobrado Jardins", metragem: 240, padrao: "alto", data_inicio: "2024-09-01", data_previsao_fim: "2025-08-01", status: "nao_iniciada" as const },
];

const padraoLabel: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };

const Index = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Minhas Obras</h1>
        <NovaObraDialog />
      </div>
      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-24">Metragem</TableHead>
              <TableHead className="w-24">Padrão</TableHead>
              <TableHead className="w-28">Início</TableHead>
              <TableHead className="w-28">Previsão</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockObras.map((obra) => (
              <TableRow key={obra.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/obra/${obra.id}`)}>
                <TableCell className="font-medium">{obra.nome}</TableCell>
                <TableCell>{obra.metragem} m²</TableCell>
                <TableCell>{padraoLabel[obra.padrao]}</TableCell>
                <TableCell>{new Date(obra.data_inicio).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>{new Date(obra.data_previsao_fim).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell><StatusBadge status={obra.status} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/obra/${obra.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
};

export default Index;
