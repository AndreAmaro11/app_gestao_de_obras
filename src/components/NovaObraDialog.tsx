import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCreateObra } from "@/hooks/useObras";
import { useToast } from "@/hooks/use-toast";

const NovaObraDialog = () => {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [metragem, setMetragem] = useState("");
  const [padrao, setPadrao] = useState<string>("medio");
  const [dataInicio, setDataInicio] = useState("");
  const [dataPrevisao, setDataPrevisao] = useState("");
  const createObra = useCreateObra();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createObra.mutateAsync({
        nome,
        metragem: Number(metragem),
        padrao: padrao as any,
        data_inicio: dataInicio || null,
        data_previsao_fim: dataPrevisao || null,
      });
      toast({ title: "Obra criada com sucesso!" });
      setOpen(false);
      setNome(""); setMetragem(""); setPadrao("medio"); setDataInicio(""); setDataPrevisao("");
    } catch (error: any) {
      toast({ title: "Erro ao criar obra", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" />Nova Obra</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Obra</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Casa Residencial Silva" required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metragem">Metragem (m²)</Label>
              <Input id="metragem" type="number" value={metragem} onChange={e => setMetragem(e.target.value)} placeholder="180" required />
            </div>
            <div className="space-y-2">
              <Label>Padrão</Label>
              <Select value={padrao} onValueChange={setPadrao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inicio">Data Início</Label>
              <Input id="inicio" type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="previsao">Previsão Fim</Label>
              <Input id="previsao" type="date" value={dataPrevisao} onChange={e => setDataPrevisao(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={createObra.isPending}>{createObra.isPending ? "Criando..." : "Criar Obra"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NovaObraDialog;
