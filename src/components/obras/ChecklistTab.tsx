import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { useChecklistByObra, useCreateChecklistItem, useToggleChecklist, useDeleteChecklistItem, useUpdateChecklistItem } from "@/hooks/useChecklist";
import { useEtapas } from "@/hooks/useEtapas";
import { useSubetapas } from "@/hooks/useSubetapas";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ConfirmDialog";

interface Props { obraId: string; }

// Sub-component to load subetapas per etapa in form
const SubetapaSelect = ({ etapaId, value, onChange }: { etapaId: string; value: string; onChange: (v: string) => void }) => {
  const { data: subetapas } = useSubetapas(etapaId);
  if (!etapaId || !subetapas?.length) return null;
  return (
    <div className="space-y-2">
      <Label>Subetapa <span className="text-muted-foreground text-xs">(opcional)</span></Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Nenhuma</SelectItem>
          {subetapas.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
};

const ChecklistTab = ({ obraId }: Props) => {
  const { data: checklist, isLoading } = useChecklistByObra(obraId);
  const { data: etapas } = useEtapas(obraId);
  const createItem = useCreateChecklistItem();
  const toggleItem = useToggleChecklist();
  const deleteItem = useDeleteChecklistItem();
  const updateItem = useUpdateChecklistItem();
  const { toast } = useToast();
  const confirm = useConfirm();

  const handleDeleteItem = async (id: string, label?: string) => {
    if (await confirm({
      title: "Excluir item do checklist?",
      description: label ? `O item "${label}" será removido permanentemente.` : "O item será removido permanentemente.",
    })) {
      deleteItem.mutate(id);
    }
  };

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [item, setItem] = useState("");
  const [etapaId, setEtapaId] = useState("");
  const [subetapaId, setSubetapaId] = useState("");
  const [observacao, setObservacao] = useState("");
  const [agrupado, setAgrupado] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const resetForm = () => { setItem(""); setEtapaId(""); setSubetapaId(""); setObservacao(""); setEditing(null); };

  const openEdit = (c: any) => {
    setEditing(c);
    setItem(c.item);
    setEtapaId(c.etapa_id || "");
    setSubetapaId("");
    setObservacao(c.observacao || "");
    setShowAdd(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!etapaId) { toast({ title: "Selecione uma etapa", variant: "destructive" }); return; }
    try {
      if (editing) {
        await updateItem.mutateAsync({ id: editing.id, item, etapa_id: etapaId, observacao: observacao || null });
      } else {
        await createItem.mutateAsync({ etapa_id: etapaId, item, observacao: observacao || null, obra_id: obraId });
      }
      setShowAdd(false); resetForm();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // Build groups by etapa
  const groups = useMemo(() => {
    if (!checklist) return [];
    const map = new Map<string, { label: string; items: any[] }>();
    for (const c of checklist) {
      const etapaNome = (c.etapas as any)?.nome || "Sem etapa";
      const key = c.etapa_id || "__sem_etapa__";
      if (!map.has(key)) map.set(key, { label: etapaNome, items: [] });
      map.get(key)!.items.push(c);
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
  }, [checklist]);

  const totalItems = checklist?.length || 0;
  const totalConcluidos = checklist?.filter(c => c.concluido).length || 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Checklist</h2>
          {totalItems > 0 && (
            <Badge variant="secondary" className="text-xs">{totalConcluidos}/{totalItems} concluídos</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={agrupado ? "secondary" : "outline"}
            onClick={() => setAgrupado(v => !v)}
            title="Agrupar por etapa"
          >
            <Layers className="h-4 w-4 mr-1" />
            {agrupado ? "Desagrupar" : "Agrupar"}
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowAdd(true); }}>
            <Plus className="h-4 w-4 mr-1" />Novo Item
          </Button>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={(v) => { setShowAdd(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Item" : "Novo Item do Checklist"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Etapa *</Label>
              <Select value={etapaId} onValueChange={(v) => { setEtapaId(v); setSubetapaId(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
                <SelectContent>{etapas?.map(et => <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <SubetapaSelect etapaId={etapaId} value={subetapaId} onChange={setSubetapaId} />
            <div className="space-y-2"><Label>Item *</Label><Input value={item} onChange={e => setItem(e.target.value)} required placeholder="Descreva o item..." /></div>
            <div className="space-y-2"><Label>Observação</Label><Input value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Opcional" /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancelar</Button>
              <Button type="submit">{editing ? "Salvar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {agrupado && <TableHead className="w-8"></TableHead>}
              <TableHead className="w-36">Etapa</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="w-24 text-center">Concluído</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={agrupado ? 6 : 5} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : !checklist?.length ? (
              <TableRow><TableCell colSpan={agrupado ? 6 : 5} className="text-center text-muted-foreground py-8">Nenhum item no checklist</TableCell></TableRow>
            ) : agrupado ? (
              // Grouped view
              groups.map(group => {
                const isCollapsed = collapsedGroups.has(group.key);
                const groupConcluidos = group.items.filter(c => c.concluido).length;
                return (
                  <>
                    {/* Group header row */}
                    <TableRow
                      key={`group-${group.key}`}
                      className="bg-muted/40 cursor-pointer hover:bg-muted/60"
                      onClick={() => toggleGroup(group.key)}
                    >
                      <TableCell className="py-2 px-2">
                        {isCollapsed
                          ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell colSpan={3} className="py-2 font-semibold">
                        {group.label}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="secondary" className="text-xs">{groupConcluidos}/{group.items.length}</Badge>
                      </TableCell>
                      <TableCell className="py-2" />
                    </TableRow>
                    {/* Group items */}
                    {!isCollapsed && group.items.map((c) => (
                      <TableRow key={c.id} className="hover:bg-muted/20">
                        <TableCell />
                        <TableCell className="text-muted-foreground text-sm pl-6">{(c.etapas as any)?.nome || "—"}</TableCell>
                        <TableCell className={`font-medium ${c.concluido ? "line-through text-muted-foreground" : ""}`}>{c.item}</TableCell>
                        <TableCell className="text-center">
                          <Checkbox checked={c.concluido} onCheckedChange={(checked) => toggleItem.mutate({ id: c.id, concluido: !!checked })} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.observacao || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(c.id, c.item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Subtotal row */}
                    {!isCollapsed && (
                      <TableRow key={`subtotal-${group.key}`} className="bg-muted/20 text-xs text-muted-foreground">
                        <TableCell colSpan={3} className="text-right py-1.5 italic">Subtotal do grupo</TableCell>
                        <TableCell className="text-center py-1.5">{groupConcluidos}/{group.items.length} concluídos</TableCell>
                        <TableCell colSpan={2} />
                      </TableRow>
                    )}
                  </>
                );
              })
            ) : (
              // Flat view
              checklist.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/20">
                  <TableCell className="text-muted-foreground">{(c.etapas as any)?.nome || "—"}</TableCell>
                  <TableCell className={`font-medium ${c.concluido ? "line-through text-muted-foreground" : ""}`}>{c.item}</TableCell>
                  <TableCell className="text-center">
                    <Checkbox checked={c.concluido} onCheckedChange={(checked) => toggleItem.mutate({ id: c.id, concluido: !!checked })} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.observacao || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteItem(c.id, c.item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
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
