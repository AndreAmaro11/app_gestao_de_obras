import AppLayout from "@/components/AppLayout";
import NovaObraDialog from "@/components/NovaObraDialog";
import ObraCard from "@/components/ObraCard";
import { useObras, useDeleteObra } from "@/hooks/useObras";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { data: obras, isLoading } = useObras();
  const deleteObra = useDeleteObra();
  const { toast } = useToast();

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
      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">Carregando...</p>
      ) : !obras?.length ? (
        <p className="text-center text-muted-foreground py-12">Nenhuma obra cadastrada</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {obras.map((obra) => (
            <ObraCard key={obra.id} obra={obra} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default Index;
