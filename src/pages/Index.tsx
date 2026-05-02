import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import NovaObraDialog from "@/components/NovaObraDialog";
import ObraCard from "@/components/ObraCard";
import { useObras, useDeleteObra } from "@/hooks/useObras";
import { useToast } from "@/hooks/use-toast";
import { DataToolbar, useSearch } from "@/components/DataToolbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Receipt } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Index = () => {
  const { data: obras, isLoading } = useObras();
  const deleteObra = useDeleteObra();
  const { toast } = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [filtroPadrao, setFiltroPadrao] = useState("todos");
  const [showQuickDespesa, setShowQuickDespesa] = useState(false);

  const { search, setSearch, filtered: searched } = useSearch(obras, ["nome"]);

  const filtered = searched.filter((o: any) => {
    if (filtroPadrao !== "todos" && o.padrao !== filtroPadrao) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    const obra = obras?.find((o: any) => o.id === id);
    if (!await confirm({
      title: "Excluir obra?",
      description: `A obra "${obra?.nome || ""}" e todos os seus dados (etapas, despesas, documentos, etc.) serão excluídos. Esta ação não pode ser desfeita.`,
    })) return;
    try {
      await deleteObra.mutateAsync(id);
      toast({ title: "Obra excluída" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const goToDespesas = (obraId: string) => {
    setShowQuickDespesa(false);
    navigate(`/obra/${obraId}?tab=despesas&new=1`);
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Minhas Obras</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Gerencie todos os seus projetos em um só lugar</p>
        </div>
        <NovaObraDialog />
      </div>
      <div className="mb-6">
        <DataToolbar
          searchPlaceholder="Buscar obra..."
          searchValue={search}
          onSearchChange={setSearch}
        >
          <Select value={filtroPadrao} onValueChange={setFiltroPadrao}>
            <SelectTrigger className="w-36 h-9 rounded-lg"><SelectValue placeholder="Padrão" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="baixo">Baixo</SelectItem>
              <SelectItem value="medio">Médio</SelectItem>
              <SelectItem value="alto">Alto</SelectItem>
            </SelectContent>
          </Select>
        </DataToolbar>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-muted animate-pulse h-72" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="text-center py-20 space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-lg">
            {search ? "Nenhuma obra encontrada" : "Nenhuma obra cadastrada"}
          </p>
          {!search && <p className="text-muted-foreground text-sm">Clique em "Nova Obra" para começar</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-24 md:pb-0">
          {filtered.map((obra: any) => (
            <ObraCard key={obra.id} obra={obra} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* FAB mobile: Nova Despesa rápida */}
      {(obras?.length || 0) > 0 && (
        <Button
          onClick={() => {
            if ((obras?.length || 0) === 1) {
              goToDespesas(obras![0].id);
            } else {
              setShowQuickDespesa(true);
            }
          }}
          className="md:hidden fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg p-0"
          aria-label="Nova despesa"
        >
          <Receipt className="h-6 w-6" />
        </Button>
      )}

      <Dialog open={showQuickDespesa} onOpenChange={setShowQuickDespesa}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nova despesa em qual obra?</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {obras?.map((o: any) => (
              <button
                key={o.id}
                onClick={() => goToDespesas(o.id)}
                className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors flex items-center gap-3"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{o.nome}</p>
                  {o.endereco && <p className="text-xs text-muted-foreground truncate">{o.endereco}</p>}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Index;
