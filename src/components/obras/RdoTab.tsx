import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Trash2, Camera, Video, Cloud, Sun, CloudRain, CloudSnow, CloudDrizzle,
  Image as ImageIcon, Play, Calendar, Filter, ChevronDown, ChevronRight, Upload, FileSpreadsheet
} from "lucide-react";
import { exportToExcel, formatDateForExcel } from "@/lib/excelExport";
import { useRdos, useCreateRdo, useUpdateRdo, useDeleteRdo, useUploadRdoMidia, useDeleteRdoMidia } from "@/hooks/useRdo";
import { useEtapas } from "@/hooks/useEtapas";
import { useSubetapas } from "@/hooks/useSubetapas";
import { useToast } from "@/hooks/use-toast";
import { useConfirm } from "@/components/ConfirmDialog";
import MediaLightbox, { LightboxItem } from "@/components/MediaLightbox";

const climaIcons: Record<string, any> = {
  bom: Sun,
  nublado: Cloud,
  chuvoso: CloudRain,
  garoa: CloudDrizzle,
  frio: CloudSnow,
};

const climaLabel: Record<string, string> = {
  bom: "Bom",
  nublado: "Nublado",
  chuvoso: "Chuvoso",
  garoa: "Garoa",
  frio: "Frio",
};

interface Props { obraId: string; }

const SubetapaSelectRdo = ({ etapaId, value, onChange }: { etapaId: string | undefined; value: string; onChange: (v: string) => void }) => {
  const { data: subetapas } = useSubetapas(etapaId || "");
  if (!etapaId || !subetapas?.length) return null;
  return (
    <div className="space-y-2">
      <Label>Subetapa</Label>
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

const RdoTab = ({ obraId }: Props) => {
  const { data: rdos, isLoading } = useRdos(obraId);
  const { data: etapas } = useEtapas(obraId);
  const createRdo = useCreateRdo();
  const updateRdo = useUpdateRdo();
  const deleteRdo = useDeleteRdo();
  const uploadMidia = useUploadRdoMidia();
  const deleteMidia = useDeleteRdoMidia();
  const { toast } = useToast();
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);
  const [descricao, setDescricao] = useState("");
  const [clima, setClima] = useState("bom");
  const [etapaId, setEtapaId] = useState("");
  const [subetapaId, setSubetapaId] = useState("");
  const [uploadingRdoId, setUploadingRdoId] = useState<string | null>(null);
  const [filterEtapa, setFilterEtapa] = useState("__all__");
  const [filterSemana, setFilterSemana] = useState("__all__");
  const [expandedRdos, setExpandedRdos] = useState<Set<string>>(new Set());
  const [lightboxItems, setLightboxItems] = useState<LightboxItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedRdos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openLightbox = (midias: any[], index: number) => {
    setLightboxItems(midias.map(m => ({ id: m.id, url: m.url, tipo: m.tipo, descricao: m.descricao })));
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleDeleteRdo = async (id: string) => {
    if (await confirm({
      title: "Excluir relatório?",
      description: "O RDO e todas as suas mídias serão removidos permanentemente.",
    })) {
      deleteRdo.mutate({ id, obra_id: obraId });
    }
  };

  // Get week numbers for filter
  const weekOptions = useMemo(() => {
    if (!rdos) return [];
    const weeks = new Map<string, string>();
    rdos.forEach(r => {
      const d = new Date(r.data + "T12:00:00");
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay());
      const key = startOfWeek.toISOString().split("T")[0];
      const end = new Date(startOfWeek);
      end.setDate(end.getDate() + 6);
      weeks.set(key, `${startOfWeek.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} - ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`);
    });
    return Array.from(weeks.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [rdos]);

  const filteredRdos = useMemo(() => {
    if (!rdos) return [];
    return rdos.filter(r => {
      if (filterEtapa !== "__all__" && r.etapa_id !== filterEtapa) return false;
      if (filterSemana !== "__all__") {
        const d = new Date(r.data + "T12:00:00");
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        if (startOfWeek.toISOString().split("T")[0] !== filterSemana) return false;
      }
      return true;
    });
  }, [rdos, filterEtapa, filterSemana]);

  const handleCreate = async () => {
    try {
      await createRdo.mutateAsync({
        obra_id: obraId,
        data,
        descricao: descricao || undefined,
        clima,
        etapa_id: etapaId && etapaId !== "__none__" ? etapaId : null,
        subetapa_id: subetapaId && subetapaId !== "__none__" ? subetapaId : null,
      });
      toast({ title: "RDO criado!" });
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setData(new Date().toISOString().split("T")[0]);
    setDescricao("");
    setClima("bom");
    setEtapaId("");
    setSubetapaId("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !uploadingRdoId) return;

    for (const file of Array.from(files)) {
      // Client-side size check (warn if > 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo grande",
          description: `${file.name} tem ${(file.size / 1024 / 1024).toFixed(1)}MB. Considere comprimir antes de enviar.`,
          variant: "destructive",
        });
        continue;
      }

      try {
        await uploadMidia.mutateAsync({
          rdoId: uploadingRdoId,
          obraId,
          file,
        });
      } catch (err: any) {
        toast({ title: "Erro upload", description: err.message, variant: "destructive" });
      }
    }
    if (fileRef.current) fileRef.current.value = "";
    setUploadingRdoId(null);
  };

  const openUpload = (rdoId: string) => {
    setUploadingRdoId(rdoId);
    setTimeout(() => fileRef.current?.click(), 100);
  };

  const ClimaIcon = ({ clima: c }: { clima: string }) => {
    const Icon = climaIcons[c] || Sun;
    return <Icon className="h-4 w-4" />;
  };

  if (isLoading) return <div className="space-y-4 animate-pulse"><div className="h-40 bg-muted rounded-xl" /><div className="h-40 bg-muted rounded-xl" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Relatório de Obra (RDO)</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportToExcel(
              (filteredRdos || []) as any[],
              [
                { header: "Data", accessor: (r: any) => formatDateForExcel(r.data), width: 12 },
                { header: "Clima", accessor: (r: any) => climaLabel[r.clima] || r.clima || "", width: 12 },
                { header: "Etapa", accessor: (r: any) => r.etapas?.nome || "", width: 22 },
                { header: "Subetapa", accessor: (r: any) => r.subetapas?.nome || "", width: 22 },
                { header: "Descrição", accessor: (r: any) => r.descricao || "", width: 50 },
                { header: "Mídias", accessor: (r: any) => r.rdo_midias?.length || 0, width: 8 },
              ],
              "rdo",
              "RDO"
            )}
            disabled={!filteredRdos?.length}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />Excel
          </Button>
          <Button onClick={() => setDialogOpen(true)} className="gradient-primary text-white">
            <Plus className="h-4 w-4 mr-2" /> Novo Relatório
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={filterEtapa} onValueChange={setFilterEtapa}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Filtrar etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas Etapas</SelectItem>
            {etapas?.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSemana} onValueChange={setFilterSemana}>
          <SelectTrigger className="w-[220px]">
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Filtrar semana" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas Semanas</SelectItem>
            {weekOptions.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* RDO Cards */}
      {filteredRdos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Camera className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>Nenhum relatório encontrado</p>
            <p className="text-sm mt-1">Crie um novo relatório para registrar a evolução da obra</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRdos.map(rdo => {
            const midias = (rdo.rdo_midias || []).filter((m: any) => !m.deleted_at);
            const fotos = midias.filter((m: any) => m.tipo === "foto");
            const videos = midias.filter((m: any) => m.tipo === "video");
            const isExpanded = expandedRdos.has(rdo.id);
            const etapa = etapas?.find(e => e.id === rdo.etapa_id);

            return (
              <Card key={rdo.id} className="overflow-hidden">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggleExpand(rdo.id)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">
                            {new Date(rdo.data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                          </CardTitle>
                          <Badge variant="outline" className="gap-1 text-xs">
                            <ClimaIcon clima={rdo.clima || "bom"} />
                            {climaLabel[rdo.clima || "bom"]}
                          </Badge>
                        </div>
                        {etapa && <p className="text-xs text-muted-foreground mt-0.5">{etapa.nome}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {fotos.length > 0 && <span className="flex items-center gap-0.5"><ImageIcon className="h-3.5 w-3.5" />{fotos.length}</span>}
                        {videos.length > 0 && <span className="flex items-center gap-0.5"><Play className="h-3.5 w-3.5" />{videos.length}</span>}
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openUpload(rdo.id)} title="Adicionar mídia">
                        <Upload className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                        onClick={() => handleDeleteRdo(rdo.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-3">
                    {rdo.descricao && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{rdo.descricao}</p>
                    )}

                    {/* Media grid */}
                    {midias.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {midias.map((m: any, idx: number) => (
                          <div key={m.id} className="relative group rounded-lg overflow-hidden border aspect-video bg-muted">
                            {m.tipo === "foto" ? (
                              <img
                                src={m.url}
                                alt={m.descricao || ""}
                                className="w-full h-full object-cover cursor-zoom-in"
                                loading="lazy"
                                onClick={() => openLightbox(midias, idx)}
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center bg-black/10 cursor-pointer"
                                onClick={() => openLightbox(midias, idx)}
                              >
                                <Play className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="pointer-events-none absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end p-1">
                              <Button
                                variant="ghost" size="icon"
                                className="pointer-events-auto h-7 w-7 text-white hover:text-destructive bg-black/40 hover:bg-black/60"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (await confirm({ title: "Excluir mídia?", description: "Esta foto/vídeo será removida permanentemente do relatório." })) {
                                    deleteMidia.mutate({ id: m.id, obraId });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {m.descricao && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                                <p className="text-[10px] text-white truncate">{m.descricao}</p>
                              </div>
                            )}
                          </div>
                        ))}
                        {/* Add more button */}
                        <button
                          className="border-2 border-dashed rounded-lg aspect-video flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                          onClick={() => openUpload(rdo.id)}
                        >
                          <Camera className="h-5 w-5 mb-1" />
                          <span className="text-[10px]">Adicionar</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        className="w-full border-2 border-dashed rounded-lg py-8 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                        onClick={() => openUpload(rdo.id)}
                      >
                        <Camera className="h-6 w-6 mb-2" />
                        <span className="text-sm">Adicionar fotos ou vídeos</span>
                      </button>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[92vh] sm:max-h-[90vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0"><DialogTitle>Novo Relatório de Obra</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={data} onChange={e => setData(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Clima</Label>
                <Select value={clima} onValueChange={setClima}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(climaLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select value={etapaId} onValueChange={v => { setEtapaId(v); setSubetapaId(""); }}>
                <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {etapas?.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <SubetapaSelectRdo etapaId={etapaId && etapaId !== "__none__" ? etapaId : undefined} value={subetapaId} onChange={setSubetapaId} />
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Atividades realizadas, observações..." rows={3} />
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-3 border-t bg-background shrink-0">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createRdo.isPending}>
              {createRdo.isPending ? "Criando..." : "Criar Relatório"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <MediaLightbox
        items={lightboxItems}
        startIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
};

export default RdoTab;
