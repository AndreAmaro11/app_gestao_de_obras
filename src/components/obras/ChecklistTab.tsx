import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useChecklistByObra, useCreateChecklistItem, useToggleChecklist, useDeleteChecklistItem } from "@/hooks/useChecklist";
import { useEtapas } from "@/hooks/useEtapas";
import { useToast } from "@/hooks/use-toast";

interface Props { obraId: string; }

const ChecklistTab = ({ obraId }: Props) => {
  const { data: checklist, isLoading } = useChecklistByObra(obraId);
  const { data: etapas } = useEtapas(obraId);
  const createItem = useCreateChecklistItem();
  const toggleItem = useToggleChecklist();
  const deleteItem = useDeleteChecklistItem();
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [item, setItem] = useState("");
  const [etapaId, setEtapaId] = useState("");
  const [observacao, setObservacao] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!etapaId) { toast({ title: "Selecione uma etapa", variant: "destructive" }); return; }
    try {
      await createItem.mutateAsync({ etapa_id: etapaId, item, observacao: observacao || null, obra_id: obraId });
      setShowAdd(false); setItem(""); setEtapaId(""); setObservacao("");
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Checklist</h2>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Novo Item</Button>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Item do Checklist</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={etapaId} onValueChange={setEtapaId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{etapas?.map(et => <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Item</Label><Input value={item} onChange={e => setItem(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Observação</Label><Input value={observacao} onChange={e => setObservacao(e.target.value)} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button><Button type="submit">Criar</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Etapa</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="w-24 text-center">Concluído</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : !checklist?.length ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum item no checklist</TableCell></TableRow>
            ) : (
              checklist.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-muted-foreground">{(c.etapas as any)?.nome || "—"}</TableCell>
                  <TableCell className={`font-medium ${c.concluido ? "line-through text-muted-foreground" : ""}`}>{c.item}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox checked={c.concluido} onCheckedChange={(checked) => toggleItem.mutate({ id: c.id, concluido: !!checked })} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.observacao || "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem.mutate(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ChecklistTab;
