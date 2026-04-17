import { useState, useRef } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Pencil, Trash2, GripVertical, ArrowRightLeft } from "lucide-react";
import { useSubetapas, useCreateSubetapa, useUpdateSubetapa, useDeleteSubetapa } from "@/hooks/useSubetapas";
import { useEtapas } from "@/hooks/useEtapas";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useConfirm } from "@/components/ConfirmDialog";

interface Props {
  etapaId: string;
  obraId: string;
  onSubetapaChange?: () => void;
}

const SubetapasRow = ({ etapaId, obraId, onSubetapaChange }: Props) => {
  const { data: subetapas, isLoading } = useSubetapas(etapaId);
  const { data: etapas } = useEtapas(obraId);
  const createSub = useCreateSubetapa();
  const updateSub = useUpdateSubetapa();
  const deleteSub = useDeleteSubetapa();
  const { toast } = useToast();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [showAdd, setShowAdd] = useState(false);
  const [editingSub, setEditingSub] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [inicioPrev, setInicioPrev] = useState("");
  const [fimPrev, setFimPrev] = useState("");
  const [status, setStatus] = useState("nao_iniciada");
  const [percentual, setPercentual] = useState("0");
  const [moveEtapaId, setMoveEtapaId] = useState("");

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<number | null>(null);

  // Move dialog
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [movingSub, setMovingSub] = useState<any>(null);
  const [targetEtapaId, setTargetEtapaId] = useState("");

  const resetForm = () => { setNome(""); setInicioPrev(""); setFimPrev(""); setStatus("nao_iniciada"); setPercentual("0"); setEditingSub(null); setMoveEtapaId(""); };

  const openEdit = (s: any) => {
    setEditingSub(s);
    setNome(s.nome);
    setInicioPrev(s.inicio_previsto || "");
    setFimPrev(s.fim_previsto || "");
    setStatus(s.status);
    setPercentual(String(s.percentual_concluido));
    setMoveEtapaId("");
    setShowAdd(true);
  };

  const deriveStatus = (pct: number): string => {
    if (pct >= 100) return "concluida";
    if (pct > 0) return "em_andamento";
    return "nao_iniciada";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const pct = Number(percentual);
      const autoStatus = deriveStatus(pct);
      if (editingSub) {
        const newEtapaId = moveEtapaId && moveEtapaId !== etapaId ? moveEtapaId : etapaId;
        await updateSub.mutateAsync({
          id: editingSub.id, etapa_id: newEtapaId, nome,
          inicio_previsto: inicioPrev || null, fim_previsto: fimPrev || null,
          status: autoStatus as any, percentual_concluido: pct,
        });
        if (newEtapaId !== etapaId) {
          qc.invalidateQueries({ queryKey: ["subetapas", newEtapaId] });
          qc.invalidateQueries({ queryKey: ["subetapas", etapaId] });
        }
      } else {
        await createSub.mutateAsync({ etapa_id: etapaId, nome, ordem: (subetapas?.length || 0) + 1, inicio_previsto: inicioPrev || null, fim_previsto: fimPrev || null });
      }
      setShowAdd(false); resetForm();
      onSubetapaChange?.();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  // Drag handlers
  const handleDragStart = (idx: number) => {
    setDragIndex(idx);
    dragNodeRef.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragNodeRef.current !== idx) {
      setDragOverIndex(idx);
    }
  };

  const handleDrop = async (idx: number) => {
    if (dragIndex === null || dragIndex === idx || !subetapas) return;
    
    const items = [...subetapas];
    const [moved] = items.splice(dragIndex, 1);
    items.splice(idx, 0, moved);

    // Update ordem for all affected items
    try {
      await Promise.all(
        items.map((item, i) =>
          supabase.from("subetapas").update({ ordem: i + 1 }).eq("id", item.id)
        )
      );
      qc.invalidateQueries({ queryKey: ["subetapas", etapaId] });
    } catch (err: any) {
      toast({ title: "Erro ao reordenar", description: err.message, variant: "destructive" });
    }

    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Move to another etapa
  const openMoveDialog = (s: any) => {
    setMovingSub(s);
    setTargetEtapaId("");
    setShowMoveDialog(true);
  };

  const handleMove = async () => {
    if (!movingSub || !targetEtapaId || targetEtapaId === etapaId) return;
    try {
      // Get count of subetapas in target etapa for ordem
      const { data: targetSubs } = await supabase
        .from("subetapas")
        .select("id")
        .eq("etapa_id", targetEtapaId)
        .is("deleted_at", null);
      
      const newOrdem = (targetSubs?.length || 0) + 1;
      
      await supabase
        .from("subetapas")
        .update({ etapa_id: targetEtapaId, ordem: newOrdem })
        .eq("id", movingSub.id);

      qc.invalidateQueries({ queryKey: ["subetapas", etapaId] });
      qc.invalidateQueries({ queryKey: ["subetapas", targetEtapaId] });
      onSubetapaChange?.();
      setShowMoveDialog(false);
      setMovingSub(null);
      toast({ title: "Subetapa movida com sucesso" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const otherEtapas = etapas?.filter(e => e.id !== etapaId) || [];

  if (isLoading) return <TableRow><TableCell colSpan={7} className="pl-12 text-muted-foreground text-sm">Carregando subetapas...</TableCell></TableRow>;

  return (
    <>
      {subetapas?.map((s, idx) => (
        <TableRow
          key={s.id}
          className={cn(
            "bg-muted/30 transition-all",
            dragIndex === idx && "opacity-50",
            dragOverIndex === idx && "border-t-2 border-primary"
          )}
          draggable
          onDragStart={() => handleDragStart(idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={() => handleDrop(idx)}
          onDragEnd={handleDragEnd}
        >
          <TableCell className="text-center font-mono text-muted-foreground pl-10">
            <div className="flex items-center justify-center gap-1">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
              {s.ordem}
            </div>
          </TableCell>
          <TableCell className="text-sm pl-10">↳ {s.nome}</TableCell>
          <TableCell className="text-sm">{s.inicio_previsto ? new Date(s.inicio_previsto + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
          <TableCell className="text-sm">{s.fim_previsto ? new Date(s.fim_previsto + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
          <TableCell><span className="font-mono text-sm">{s.percentual_concluido}%</span></TableCell>
          <TableCell><StatusBadge status={s.status} /></TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" title="Mover para outra etapa" onClick={() => openMoveDialog(s)}>
                <ArrowRightLeft className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => {
                if (await confirm({
                  title: "Excluir subetapa?",
                  description: `A subetapa "${s.nome}" será removida.`,
                })) {
                  deleteSub.mutate({ id: s.id, etapa_id: etapaId });
                  onSubetapaChange?.();
                }
              }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))}

      {/* Edit/Create Dialog */}
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
              <>
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
                {otherEtapas.length > 0 && (
                  <div className="space-y-2">
                    <Label>Mover para outra Etapa</Label>
                    <Select value={moveEtapaId} onValueChange={setMoveEtapaId}>
                      <SelectTrigger><SelectValue placeholder="Manter na etapa atual" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keep">Manter na etapa atual</SelectItem>
                        {otherEtapas.map(e => (
                          <SelectItem key={e.id} value={e.id}>{e.ordem}. {e.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancelar</Button><Button type="submit">{editingSub ? "Salvar" : "Criar"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Move Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Mover Subetapa</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Mover "<strong>{movingSub?.nome}</strong>" para:</p>
          <Select value={targetEtapaId} onValueChange={setTargetEtapaId}>
            <SelectTrigger><SelectValue placeholder="Selecione a etapa destino" /></SelectTrigger>
            <SelectContent>
              {otherEtapas.map(e => (
                <SelectItem key={e.id} value={e.id}>{e.ordem}. {e.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>Cancelar</Button>
            <Button onClick={handleMove} disabled={!targetEtapaId}>Mover</Button>
          </div>
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
