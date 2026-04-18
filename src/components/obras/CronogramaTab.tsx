import { useState, useCallback } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, FileSpreadsheet } from "lucide-react";
import { exportToExcel, formatDateForExcel } from "@/lib/excelExport";
import { useEtapas, useCreateEtapa, useUpdateEtapa, useDeleteEtapa } from "@/hooks/useEtapas";
import { useSubetapas, useUpdateSubetapa } from "@/hooks/useSubetapas";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import SubetapasRow from "./SubetapasRow";
import GanttChart from "./GanttChart";
import { useConfirm } from "@/components/ConfirmDialog";

interface Props { obraId: string; }

type ViewMode = "tabela" | "gantt";

const CronogramaTab = ({ obraId }: Props) => {
  const { data: etapas, isLoading } = useEtapas(obraId);
  const [viewMode, setViewMode] = useState<ViewMode>("tabela");
  const createEtapa = useCreateEtapa();
  const updateEtapa = useUpdateEtapa();
  const deleteEtapa = useDeleteEtapa();
  const { toast } = useToast();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  const [showDialog, setShowDialog] = useState(false);
  const [editingEtapa, setEditingEtapa] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [inicioPrev, setInicioPrev] = useState("");
  const [fimPrev, setFimPrev] = useState("");
  const [status, setStatus] = useState("nao_iniciada");
  const [percentual, setPercentual] = useState("0");
  const [dependencia, setDependencia] = useState<string>("");

  const resetForm = () => { setNome(""); setInicioPrev(""); setFimPrev(""); setStatus("nao_iniciada"); setPercentual("0"); setDependencia(""); setEditingEtapa(null); };

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
    setDependencia(etapa.dependencia || "");
    setShowDialog(true);
  };

  // Auto-sync: recalculate etapa progress from subetapas
  const syncEtapaProgress = useCallback(async (etapaId: string) => {
    const { data: subs } = await supabase
      .from("subetapas")
      .select("percentual_concluido")
      .eq("etapa_id", etapaId)
      .is("deleted_at", null);
    if (!subs || subs.length === 0) return;
    const avg = Math.round(subs.reduce((s, sub) => s + sub.percentual_concluido, 0) / subs.length);
    const allDone = subs.every(s => s.percentual_concluido === 100);
    const anyStarted = subs.some(s => s.percentual_concluido > 0);
    const newStatus = allDone ? "concluida" : anyStarted ? "em_andamento" : "nao_iniciada";
    await supabase.from("etapas").update({ percentual_concluido: avg, status: newStatus }).eq("id", etapaId);
    qc.invalidateQueries({ queryKey: ["etapas", obraId] });
  }, [obraId, qc]);

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
      if (editingEtapa) {
        await updateEtapa.mutateAsync({
          id: editingEtapa.id, obra_id: obraId, nome,
          inicio_previsto: inicioPrev || null, fim_previsto: fimPrev || null,
          status: autoStatus as any, percentual_concluido: pct,
          dependencia: dependencia && dependencia !== "none" ? dependencia : null,
        });
      } else {
        await createEtapa.mutateAsync({
          obra_id: obraId, nome, ordem: (etapas?.length || 0) + 1,
          inicio_previsto: inicioPrev || null, fim_previsto: fimPrev || null,
          dependencia: dependencia && dependencia !== "none" ? dependencia : null,
        });
      }
      setShowDialog(false); resetForm();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  // Available deps: all etapas except the one being edited
  const availableDeps = etapas?.filter(e => e.id !== editingEtapa?.id) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Etapas</h2>
          <div className="flex items-center bg-muted rounded-lg p-0.5 ml-4">
            <button
              onClick={() => setViewMode("tabela")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                viewMode === "tabela" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tabela
            </button>
            <button
              onClick={() => setViewMode("gantt")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                viewMode === "gantt" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Gantt
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const statusLabel: Record<string, string> = { nao_iniciada: "Não Iniciada", em_andamento: "Em Andamento", concluida: "Concluída" };
              exportToExcel(
                (etapas || []) as any[],
                [
                  { header: "Ordem", accessor: "ordem", width: 8 },
                  { header: "Nome", accessor: "nome", width: 30 },
                  { header: "Status", accessor: (e: any) => statusLabel[e.status] || e.status, width: 16 },
                  { header: "% Concluído", accessor: "percentual_concluido", width: 12, numFmt: "0\"%\"" },
                  { header: "Início Previsto", accessor: (e: any) => formatDateForExcel(e.inicio_previsto), width: 14 },
                  { header: "Fim Previsto", accessor: (e: any) => formatDateForExcel(e.fim_previsto), width: 14 },
                  { header: "Início Real", accessor: (e: any) => formatDateForExcel(e.inicio_real), width: 14 },
                  { header: "Fim Real", accessor: (e: any) => formatDateForExcel(e.fim_real), width: 14 },
                  { header: "Dependência", accessor: (e: any) => etapas?.find((x: any) => x.id === e.dependencia)?.nome || "", width: 25 },
                ],
                "cronograma",
                "Cronograma"
              );
            }}
            disabled={!etapas?.length}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />Excel
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowDialog(true); }}><Plus className="h-4 w-4 mr-1" />Nova Etapa</Button>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingEtapa ? "Editar Etapa" : "Nova Etapa"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={nome} onChange={e => setNome(e.target.value)} required /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Início Previsto</Label><Input type="date" value={inicioPrev} onChange={e => setInicioPrev(e.target.value)} /></div>
              <div className="space-y-2"><Label>Fim Previsto</Label><Input type="date" value={fimPrev} onChange={e => setFimPrev(e.target.value)} /></div>
            </div>
            {editingEtapa && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Dependência (etapa predecessora)</Label>
              <Select value={dependencia} onValueChange={setDependencia}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {availableDeps.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.ordem}. {e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancelar</Button>
              <Button type="submit">{editingEtapa ? "Salvar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {viewMode === "tabela" && (
        <div className="bg-card rounded-md border animate-fade-in">
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
                etapas.map((etapa) => {
                  const dep = etapa.dependencia ? etapas.find(e => e.id === etapa.dependencia) : null;
                  return (
                    <>
                      <TableRow key={etapa.id} className="cursor-pointer" onClick={() => toggleExpand(etapa.id)}>
                        <TableCell className="text-center font-mono">{etapa.ordem}</TableCell>
                        <TableCell className="font-medium">
                          <span className="inline-flex items-center gap-1">
                            {expandedEtapas.has(etapa.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            {etapa.nome}
                          </span>
                          {dep && <span className="text-[10px] text-muted-foreground ml-2">dep: {dep.nome}</span>}
                        </TableCell>
                        <TableCell>{etapa.inicio_previsto ? new Date(etapa.inicio_previsto + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                        <TableCell>{etapa.fim_previsto ? new Date(etapa.fim_previsto + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
                        <TableCell><span className="font-mono text-sm">{etapa.percentual_concluido}%</span></TableCell>
                        <TableCell><StatusBadge status={etapa.status} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(etapa)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => {
                              if (await confirm({
                                title: "Excluir etapa?",
                                description: `A etapa "${etapa.nome}" e todas as suas subetapas, checklists e vínculos serão removidos. Esta ação não pode ser desfeita.`,
                              })) {
                                deleteEtapa.mutate({ id: etapa.id, obra_id: obraId });
                              }
                            }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedEtapas.has(etapa.id) && (
                        <SubetapasRow
                          key={`sub-${etapa.id}`}
                          etapaId={etapa.id}
                          obraId={obraId}
                          onSubetapaChange={() => syncEtapaProgress(etapa.id)}
                        />
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {viewMode === "gantt" && etapas && etapas.length > 0 && (
        <div className="animate-fade-in">
          <GanttChart etapas={etapas} fullWidth />
        </div>
      )}

      {viewMode === "gantt" && (!etapas || etapas.length === 0) && (
        <div className="text-center text-muted-foreground py-12">Nenhuma etapa cadastrada</div>
      )}
    </div>
  );
};

export default CronogramaTab;
