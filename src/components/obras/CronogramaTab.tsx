import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { differenceInDays } from "date-fns";
import { useEtapas, useCreateEtapa, useUpdateEtapa, useDeleteEtapa } from "@/hooks/useEtapas";
import { useSubetapas, useCreateSubetapa, useUpdateSubetapa, useDeleteSubetapa } from "@/hooks/useSubetapas";
import { useToast } from "@/hooks/use-toast";

interface Props { obraId: string; }

const SubetapasRow = ({ etapaId, obraId }: { etapaId: string; obraId: string }) => {
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
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteSub.mutate({ id: s.id, etapa_id: etapaId })}>
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

const CronogramaTab = ({ obraId }: Props) => {
  const { data: etapas, isLoading } = useEtapas(obraId);
  const createEtapa = useCreateEtapa();
  const updateEtapa = useUpdateEtapa();
  const deleteEtapa = useDeleteEtapa();
  const { toast } = useToast();
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [inicioPrev, setInicioPrev] = useState("");
  const [fimPrev, setFimPrev] = useState("");
  const [status, setStatus] = useState("nao_iniciada");
  const [percentual, setPercentual] = useState("0");

  const resetForm = () => { setNome(""); setInicioPrev(""); setFimPrev(""); setStatus("nao_iniciada"); setPercentual("0"); setEditingEtapa(null); };

  const toggleExpand = (id: string) => {
    setExpandedEtapas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openEdit = (etapa: any) => {
    setEditingEtapa(etapa);
    setNome(etapa.nome);
    setInicioPrev(etapa.inicio_previsto || "");
    setFimPrev(etapa.fim_previsto || "");
    setStatus(etapa.status);
    setPercentual(String(etapa.percentual_concluido));
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEtapa) {
        await updateEtapa.mutateAsync({
          id: editingEtapa.id, obra_id: obraId, nome,
          inicio_previsto: inicioPrev || null, fim_previsto: fimPrev || null,
          status: status as any, percentual_concluido: Number(percentual),
        });
      } else {
        await createEtapa.mutateAsync({
          obra_id: obraId, nome, ordem: (etapas?.length || 0) + 1,
          inicio_previsto: inicioPrev || null, fim_previsto: fimPrev || null,
        });
      }
      setShowDialog(false); resetForm();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  // Gantt calc
  const allDates = etapas?.flatMap(e => [e.inicio_previsto, e.fim_previsto].filter(Boolean)) || [];
  const obraStart = allDates.length ? new Date(allDates.sort()[0]!) : new Date();
  const obraEnd = allDates.length ? new Date(allDates.sort().reverse()[0]!) : new Date();
  const totalDays = Math.max(differenceInDays(obraEnd, obraStart), 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Etapas</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowDialog(true); }}><Plus className="h-4 w-4 mr-1" />Nova Etapa</Button>
      </div>

      <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingEtapa ? "Editar Etapa" : "Nova Etapa"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Início Previsto</Label><Input type="date" value={inicioPrev} onChange={e => setInicioPrev(e.target.value)} /></div>
              <div className="space-y-2"><Label>Fim Previsto</Label><Input type="date" value={fimPrev} onChange={e => setFimPrev(e.target.value)} /></div>
            </div>
            {editingEtapa && (
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
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancelar</Button>
              <Button type="submit">{editingEtapa ? "Salvar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Ordem</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead className="w-28">Início Prev.</TableHead>
              <TableHead className="w-28">Fim Prev.</TableHead>
              <TableHead className="w-16">%</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : !etapas?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhuma etapa cadastrada</TableCell></TableRow>
            ) : (
              etapas.map((etapa) => (
                <>
                  <TableRow key={etapa.id} className="cursor-pointer" onClick={() => toggleExpand(etapa.id)}>
                    <TableCell className="text-center font-mono">{etapa.ordem}</TableCell>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-1">
                        {expandedEtapas.has(etapa.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        {etapa.nome}
                      </span>
                    </TableCell>
                    <TableCell>{etapa.inicio_previsto ? new Date(etapa.inicio_previsto).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell>{etapa.fim_previsto ? new Date(etapa.fim_previsto).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    <TableCell><span className="font-mono text-sm">{etapa.percentual_concluido}%</span></TableCell>
                    <TableCell><StatusBadge status={etapa.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(etapa)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteEtapa.mutate({ id: etapa.id, obra_id: obraId })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedEtapas.has(etapa.id) && <SubetapasRow key={`sub-${etapa.id}`} etapaId={etapa.id} obraId={obraId} />}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Gantt Simples */}
      {etapas && etapas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Gantt</h3>
          <div className="bg-card rounded-md border p-4 space-y-2">
            {etapas.filter(e => e.inicio_previsto && e.fim_previsto).map((etapa) => {
              const start = differenceInDays(new Date(etapa.inicio_previsto!), obraStart);
              const duration = differenceInDays(new Date(etapa.fim_previsto!), new Date(etapa.inicio_previsto!));
              const leftPct = (start / totalDays) * 100;
              const widthPct = (duration / totalDays) * 100;
              return (
                <div key={etapa.id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-40 truncate shrink-0">{etapa.nome}</span>
                  <div className="flex-1 h-6 bg-muted rounded relative">
                    <div className="absolute h-full rounded bg-primary/70 flex items-center justify-center" style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 2)}%` }}>
                      {widthPct > 8 && <span className="text-[10px] text-primary-foreground font-medium">{etapa.percentual_concluido}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CronogramaTab;