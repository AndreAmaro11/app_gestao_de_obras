import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import NovaObraDialog from "@/components/NovaObraDialog";
import ObraCard from "@/components/ObraCard";
import { useObras, useDeleteObra } from "@/hooks/useObras";
import { useToast } from "@/hooks/use-toast";
import { DataToolbar, useSearch } from "@/components/DataToolbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Index = () => {
  const { data: obras, isLoading } = useObras();
  const deleteObra = useDeleteObra();
  const { toast } = useToast();
  const [filtroPadrao, setFiltroPadrao] = useState("todos");

  const { search, setSearch, filtered: searched } = useSearch(obras, ["nome"]);

  const filtered = searched.filter((o: any) => {
    if (filtroPadrao !== "todos" && o.padrao !== filtroPadrao) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
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
      <div className="mb-4">
        <DataToolbar
          searchPlaceholder="Buscar obra..."
          searchValue={search}
          onSearchChange={setSearch}
        >
          <Select value={filtroPadrao} onValueChange={setFiltroPadrao}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Padrão" /></SelectTrigger>
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
        <p className="text-center text-muted-foreground py-12">Carregando...</p>
      ) : !filtered.length ? (
        <p className="text-center text-muted-foreground py-12">{search ? "Nenhuma obra encontrada" : "Nenhuma obra cadastrada"}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((obra: any) => (
            <ObraCard key={obra.id} obra={obra} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Index;
