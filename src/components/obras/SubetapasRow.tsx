import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useSubetapas, useCreateSubetapa, useUpdateSubetapa, useDeleteSubetapa } from "@/hooks/useSubetapas";
import { useToast } from "@/hooks/use-toast";

interface Props {
  etapaId: string;
  obraId: string;
  onSubetapaChange?: () => void;
}

const SubetapasRow = ({ etapaId, obraId, onSubetapaChange }: Props) => {
  const { data: subetapas, isLoading } = useSubetapas(etapaId);
  const createSub = useCreateSubetapa();
  const updateSub = useUpdateSubetapa();
  const deleteSub = useDeleteSubetapa();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [inicioPrev, setInicioPrev] = useState("");
  const [fimPrev, setFimPrev] = useState("");
  const [status, setStatus] = useState("nao_iniciada");
  const [percentual, setPercentual] = useState("0");

  const resetForm = () => { setNome(""); setInicioPrev(""); setFimPrev(""); setStatus("nao_iniciada"); setPercentual("0"); setEditingSub(null); };

  const openEdit = (s: any) => {
    setEditingSub(s);
    setNome(s.nome);
    setInicioPrev(s.inicio_previsto || "");
    setFimPrev(s.fim_previsto || "");
    setStatus(s.status);
    setPercentual(String(s.percentual_concluido));
    setShowAdd(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSub) {
        await updateSub.mutateAsync({
          id: editingSub.id, etapa_id: etapaId, nome,
          inicio_previsto: inicioPrev || null, fim_previsto: fimPrev || null,
          status: status as any, percentual_concluido: Number(percentual),
        });
      } else {
        await createSub.mutateAsync({ etapa_id: etapaId, nome, ordem: (subetapas?.length || 0) + 1, inicio_previsto: inicioPrev || null, fim_previsto: fimPrev || null });
      }
      setShowAdd(false); resetForm();
      onSubetapaChange?.();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  if (isLoading) return <TableRow><TableCell colSpan={7} className="pl-12 text-muted-foreground text-sm">Carregando subetapas...</TableCell></TableRow>;

  return (
    <>
      {subetapas?.map(s => (
        <TableRow key={s.id} className="bg-muted/30">
          <TableCell className="text-center font-mono text-muted-foreground pl-10">{s.ordem}</TableCell>
          <TableCell className="text-sm pl-10">↳ {s.nome}</TableCell>
          <TableCell className="text-sm">{s.inicio_previsto ? new Date(s.inicio_previsto).toLocaleDateString("pt-BR") : "—"}</TableCell>
          <TableCell className="text-sm">{s.fim_previsto ? new Date(s.fim_previsto).toLocaleDateString("pt-BR") : "—"}</TableCell>
          <TableCell><span className="font-mono text-sm">{s.percentual_concluido}%</span></TableCell>
          <TableCell><StatusBadge status={s.status} /></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { deleteSub.mutate({ id: s.id, etapa_id: etapaId }); onSubetapaChange?.(); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}
      <Dialog open={showAdd} onOpenChange={(v) => { setShowAdd(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSub ? "Editar Subetapa" : "Nova Subetapa"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Início Previsto</Label><Input type="date" value={inicioPrev} onChange={e => setInicioPrev(e.target.value)} /></div>
              <div className="space-y-2"><Label>Fim Previsto</Label><Input type="date" value={fimPrev} onChange={e => setFimPrev(e.target.value)} /></div>
            </div>
            {editingSub && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao_iniciada">Não Iniciada</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>% Concluído</Label><Input type="number" min="0" max="100" value={percentual} onChange={e => setPercentual(e.target.value)} /></div>
              </div>
            )}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancelar</Button><Button type="submit">{editingSub ? "Salvar" : "Criar"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
      <TableRow className="bg-muted/20">
        <TableCell colSpan={7} className="pl-10">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { resetForm(); setShowAdd(true); }}>
            <Plus className="h-3 w-3 mr-1" />Subetapa
          </Button>
        </TableCell>
      </TableRow>
    </>
  );
};

export default SubetapasRow;
