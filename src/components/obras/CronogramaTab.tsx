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
import { useSubetapas, useCreateSubetapa, useDeleteSubetapa } from "@/hooks/useSubetapas";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props { obraId: string; }

const SubetapasRow = ({ etapaId, obraId }: { etapaId: string; obraId: string }) => {
  const { data: subetapas, isLoading } = useSubetapas(etapaId);
  const createSub = useCreateSubetapa();
  const deleteSub = useDeleteSubetapa();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [nome, setNome] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSub.mutateAsync({ etapa_id: etapaId, nome, ordem: (subetapas?.length || 0) + 1 });
      setNome(""); setShowAdd(false);
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
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteSub.mutate({ id: s.id, etapa_id: etapaId })}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TableCell>
        </TableRow>
      ))}
      {showAdd ? (
        <TableRow className="bg-muted/20">
          <TableCell colSpan={7} className="pl-10">
            <form onSubmit={handleAdd} className="flex items-center gap-2">
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da subetapa" className="h-8 w-64" required />
              <Button size="sm" type="submit" className="h-8">Salvar</Button>
              <Button size="sm" variant="ghost" type="button" className="h-8" onClick={() => setShowAdd(false)}>Cancelar</Button>
            </form>
          </TableCell>
        </TableRow>
      ) : (
        <TableRow className="bg-muted/20">
          <TableCell colSpan={7} className="pl-10">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowAdd(true)}>
              <Plus className="h-3 w-3 mr-1" />Subetapa
            </Button>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

const CronogramaTab = ({ obraId }: Props) => {
  const { data: etapas, isLoading } = useEtapas(obraId);
  const createEtapa = useCreateEtapa();
  const deleteEtapa = useDeleteEtapa();
  const { toast } = useToast();
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [nome, setNome] = useState("");
  const [inicioPrev, setInicioPrev] = useState("");
  const [fimPrev, setFimPrev] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedEtapas(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEtapa.mutateAsync({
        obra_id: obraId, nome, ordem: (etapas?.length || 0) + 1,
        inicio_previsto: inicioPrev || null, fim_previsto: fimPrev || null,
      });
      setShowDialog(false); setNome(""); setInicioPrev(""); setFimPrev("");
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
        <Button size="sm" onClick={() => setShowDialog(true)}><Plus className="h-4 w-4 mr-1" />Nova Etapa</Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Etapa</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Início Previsto</Label><Input type="date" value={inicioPrev} onChange={e => setInicioPrev(e.target.value)} /></div>
              <div className="space-y-2"><Label>Fim Previsto</Label><Input type="date" value={fimPrev} onChange={e => setFimPrev(e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
              <Button type="submit">Criar</Button>
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
