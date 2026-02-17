import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import NovaObraDialog from "@/components/NovaObraDialog";
import StatusBadge from "@/components/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { useObras, useDeleteObra } from "@/hooks/useObras";
import { useToast } from "@/hooks/use-toast";

const padraoLabel: Record<string, string> = { baixo: "Baixo", medio: "Médio", alto: "Alto" };

const Index = () => {
  const navigate = useNavigate();
  const { data: obras, isLoading } = useObras();
  const deleteObra = useDeleteObra();
  const { toast } = useToast();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteObra.mutateAsync(id);
      toast({ title: "Obra excluída" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

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
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : !obras?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma obra cadastrada</TableCell></TableRow>
            ) : (
              obras.map((obra) => (
                <TableRow key={obra.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/obra/${obra.id}`)}>
                  <TableCell className="font-medium">{obra.nome}</TableCell>
                  <TableCell>{obra.metragem ? `${obra.metragem} m²` : "—"}</TableCell>
                  <TableCell>{padraoLabel[obra.padrao] || obra.padrao}</TableCell>
                  <TableCell>{obra.data_inicio ? new Date(obra.data_inicio).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>{obra.data_previsao_fim ? new Date(obra.data_previsao_fim).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/obra/${obra.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => handleDelete(obra.id, e)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
};

export default Index;
