import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateObra } from "@/hooks/useObras";
import { useObraImagens, useUploadObraImagem, useSetCapa, useDeleteObraImagem } from "@/hooks/useObraImagens";
import { useToast } from "@/hooks/use-toast";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface Props {
  obra: Tables<"obras">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditarObraDialog = ({ obra, open, onOpenChange }: Props) => {
  const [nome, setNome] = useState(obra.nome);
  const [metragem, setMetragem] = useState(obra.metragem?.toString() || "");
  const [padrao, setPadrao] = useState(obra.padrao);
  const [dataInicio, setDataInicio] = useState(obra.data_inicio || "");
  const [dataPrevisao, setDataPrevisao] = useState(obra.data_previsao_fim || "");
  const fileRef = useRef<HTMLInputElement>(null);
  const updateObra = useUpdateObra();
  const { data: imagens } = useObraImagens(obra.id);
  const uploadImagem = useUploadObraImagem();
  const setCapa = useSetCapa();
  const deleteImagem = useDeleteObraImagem();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateObra.mutateAsync({
        id: obra.id,
        nome,
        metragem: Number(metragem),
        padrao: padrao as any,
        data_inicio: dataInicio || null,
        data_previsao_fim: dataPrevisao || null,
      });
      toast({ title: "Obra atualizada!" });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        await uploadImagem.mutateAsync({ obraId: obra.id, file });
      } catch (err: any) {
        toast({ title: "Erro upload", description: err.message, variant: "destructive" });
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar Obra</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nome">Nome</Label>
            <Input id="edit-nome" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-metragem">Metragem (m²)</Label>
              <Input id="edit-metragem" type="number" value={metragem} onChange={e => setMetragem(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Padrão</Label>
              <Select value={padrao} onValueChange={v => setPadrao(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixo">Baixo</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Previsão Fim</Label>
              <Input type="date" value={dataPrevisao} onChange={e => setDataPrevisao(e.target.value)} />
            </div>
          </div>

          {/* Imagens */}
          <div className="space-y-2">
            <Label>Imagens da Obra</Label>
            <div className="grid grid-cols-3 gap-2">
              {imagens?.map((img) => (
                <div key={img.id} className="relative group rounded-md overflow-hidden border aspect-video bg-muted">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-white hover:text-accent"
                      onClick={() => setCapa.mutate({ imagemId: img.id, obraId: obra.id })}>
                      <Star className={`h-4 w-4 ${img.is_capa ? "fill-accent text-accent" : ""}`} />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-white hover:text-destructive"
                      onClick={() => deleteImagem.mutate({ imagemId: img.id, obraId: obra.id })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {img.is_capa && (
                    <span className="absolute top-1 left-1 bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5 rounded font-medium">Capa</span>
                  )}
                </div>
              ))}
              <button type="button"
                className="border-2 border-dashed rounded-md aspect-video flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                onClick={() => fileRef.current?.click()}>
                <ImagePlus className="h-6 w-6 mb-1" />
                <span className="text-xs">Adicionar</span>
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={updateObra.isPending}>{updateObra.isPending ? "Salvando..." : "Salvar"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditarObraDialog;
