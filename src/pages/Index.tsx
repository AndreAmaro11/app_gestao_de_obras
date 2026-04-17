import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import NovaObraDialog from "@/components/NovaObraDialog";
import ObraCard from "@/components/ObraCard";
import { useObras, useDeleteObra } from "@/hooks/useObras";
import { useToast } from "@/hooks/use-toast";
import { DataToolbar, useSearch } from "@/components/DataToolbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { useConfirm } from "@/components/ConfirmDialog";

const Index = () => {
  const { data: obras, isLoading } = useObras();
  const deleteObra = useDeleteObra();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [filtroPadrao, setFiltroPadrao] = useState("todos");

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((obra: any) => (
            <ObraCard key={obra.id} obra={obra} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Index;
