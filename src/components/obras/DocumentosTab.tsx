import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { usePastas, useCreatePasta, useDeletePasta, useDocumentos, useUploadDocumento, useDeleteDocumento, useDownloadDocumento } from "@/hooks/useDocumentos";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Folder, FolderPlus, Upload, Download, Trash2, FileText, List, LayoutGrid,
  Image as ImageIcon, Eye, ExternalLink, Pencil, FileSpreadsheet, FileArchive,
  File, ChevronRight, CloudUpload, MoreVertical, Grid3X3
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface Props { obraId: string; }

type ViewMode = "list" | "cards" | "grid";

const isImage = (tipo: string | null) => tipo?.startsWith("image/");
const isPdf = (tipo: string | null) => tipo === "application/pdf";
const isSpreadsheet = (tipo: string | null) => !!tipo && (tipo.includes("spreadsheet") || tipo.includes("excel") || tipo.includes("csv"));
const isArchive = (tipo: string | null) => !!tipo && (tipo.includes("zip") || tipo.includes("rar") || tipo.includes("7z") || tipo.includes("tar"));

const fileIconColor = (tipo: string | null) => {
  if (isImage(tipo)) return { icon: ImageIcon, color: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (isPdf(tipo)) return { icon: FileText, color: "text-red-500", bg: "bg-red-500/10" };
  if (isSpreadsheet(tipo)) return { icon: FileSpreadsheet, color: "text-green-600", bg: "bg-green-600/10" };
  if (isArchive(tipo)) return { icon: FileArchive, color: "text-amber-500", bg: "bg-amber-500/10" };
  return { icon: File, color: "text-primary", bg: "bg-primary/10" };
};

const folderColors = [
  { bg: "bg-blue-500/10", icon: "text-blue-500" },
  { bg: "bg-violet-500/10", icon: "text-violet-500" },
  { bg: "bg-amber-500/10", icon: "text-amber-500" },
  { bg: "bg-emerald-500/10", icon: "text-emerald-500" },
  { bg: "bg-rose-500/10", icon: "text-rose-500" },
];

const useRenameDocumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obraId, nome }: { id: string; obraId: string; nome: string }) => {
      const { error } = await supabase.from("documentos").update({ nome }).eq("id", id);
      if (error) throw error;
      return obraId;
    },
    onSuccess: (obraId) => qc.invalidateQueries({ queryKey: ["documentos", obraId] }),
  });
};

const DocumentosTab = ({ obraId }: Props) => {
  const [pastaAtual, setPastaAtual] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; nome: string }[]>([{ id: null, nome: "Documentos" }]);
  const [novaPasta, setNovaPasta] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [previewDoc, setPreviewDoc] = useState<{ url: string; nome: string; tipo: string | null } | null>(null);
  const [renameDoc, setRenameDoc] = useState<{ id: string; nome: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: pastas } = usePastas(obraId, pastaAtual);
  const { data: documentos } = useDocumentos(obraId, pastaAtual);
  const createPasta = useCreatePasta();
  const deletePasta = useDeletePasta();
  const uploadDoc = useUploadDocumento();
  const deleteDoc = useDeleteDocumento();
  const downloadDoc = useDownloadDocumento();
  const renameDocMut = useRenameDocumento();

  // Drag & Drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    for (const file of files) {
      try {
        await uploadDoc.mutateAsync({ obraId, pastaId: pastaAtual, file });
        toast({ title: "Arquivo enviado", description: file.name });
      } catch (err: any) {
        toast({ title: "Erro upload", description: err.message, variant: "destructive" });
      }
    }
  }, [obraId, pastaAtual, uploadDoc, toast]);

  const navegarPasta = (id: string, nome: string) => {
    setPastaAtual(id);
    setBreadcrumbs(prev => [...prev, { id, nome }]);
  };

  const voltarPasta = (index: number) => {
    const target = breadcrumbs[index];
    setPastaAtual(target.id);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  };

  const handleCriarPasta = async () => {
    if (!novaPasta.trim()) return;
    try {
      await createPasta.mutateAsync({ obra_id: obraId, nome: novaPasta.trim(), pasta_pai_id: pastaAtual });
      setNovaPasta("");
      setShowNewFolder(false);
      toast({ title: "Pasta criada" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      try {
        await uploadDoc.mutateAsync({ obraId, pastaId: pastaAtual, file });
        toast({ title: "Arquivo enviado", description: file.name });
      } catch (err: any) {
        toast({ title: "Erro upload", description: err.message, variant: "destructive" });
      }
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openFile = async (url: string, nome: string, tipo: string | null, inNewTab: boolean) => {
    const { data, error } = await supabase.storage.from("obra-documentos").createSignedUrl(url, 3600);
    if (error || !data?.signedUrl) {
      toast({ title: "Erro ao abrir arquivo", variant: "destructive" });
      return;
    }
    if (inNewTab) {
      window.open(data.signedUrl, "_blank");
    } else {
      setPreviewDoc({ url: data.signedUrl, nome, tipo });
    }
  };

  const handleRename = async () => {
    if (!renameDoc || !renameValue.trim()) return;
    try {
      await renameDocMut.mutateAsync({ id: renameDoc.id, obraId, nome: renameValue.trim() });
      setRenameDoc(null);
      toast({ title: "Arquivo renomeado" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const getSignedUrl = (url: string) => supabase.storage.from("obra-documentos").createSignedUrl(url, 3600);

  const totalItems = (pastas?.length || 0) + (documentos?.length || 0);

  const viewModes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: "list", icon: <List className="h-4 w-4" />, label: "Lista" },
    { mode: "cards", icon: <LayoutGrid className="h-4 w-4" />, label: "Cards" },
    { mode: "grid", icon: <Grid3X3 className="h-4 w-4" />, label: "Grid" },
  ];

  return (
    <div
      ref={dropRef}
      className="space-y-5 relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 rounded-2xl border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="text-center space-y-3">
            <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto">
              <CloudUpload className="h-8 w-8 text-white" />
            </div>
            <p className="text-lg font-semibold text-foreground">Solte os arquivos aqui</p>
            <p className="text-sm text-muted-foreground">Os arquivos serão enviados para a pasta atual</p>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(v) => { if (!v) setPreviewDoc(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] rounded-2xl">
          <DialogHeader><DialogTitle className="text-lg">{previewDoc?.nome}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-auto rounded-xl">
            {previewDoc && isImage(previewDoc.tipo) ? (
              <img src={previewDoc.url} alt={previewDoc.nome} className="max-w-full max-h-[70vh] mx-auto rounded-lg" />
            ) : previewDoc?.tipo === "application/pdf" ? (
              <iframe src={previewDoc.url} className="w-full h-[70vh] rounded-lg" title={previewDoc.nome} />
            ) : (
              <div className="text-center py-16 space-y-4">
                <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Visualização não disponível</p>
                <Button variant="outline" className="rounded-xl" onClick={() => window.open(previewDoc?.url, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />Abrir em nova aba
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameDoc} onOpenChange={(v) => { if (!v) setRenameDoc(null); }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Renomear Arquivo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Novo nome</Label>
              <Input className="rounded-xl" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleRename()} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setRenameDoc(null)}>Cancelar</Button>
              <Button className="rounded-xl" onClick={handleRename}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm">
            {breadcrumbs.map((bc, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
                <button
                  className={cn(
                    "hover:text-foreground transition-colors",
                    i === breadcrumbs.length - 1 ? "text-foreground font-semibold" : "text-muted-foreground"
                  )}
                  onClick={() => voltarPasta(i)}
                >
                  {bc.nome}
                </button>
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalItems} {totalItems === 1 ? "item" : "itens"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
            {viewModes.map(vm => (
              <Button
                key={vm.mode}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2.5 rounded-md transition-all",
                  viewMode === vm.mode && "bg-card shadow-sm text-foreground"
                )}
                onClick={() => setViewMode(vm.mode)}
                title={vm.label}
              >
                {vm.icon}
              </Button>
            ))}
          </div>

          {/* New folder */}
          <Button variant="outline" size="sm" className="rounded-lg gap-1.5" onClick={() => setShowNewFolder(!showNewFolder)}>
            <FolderPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Pasta</span>
          </Button>

          {/* Upload */}
          <Button size="sm" className="rounded-lg gap-1.5 gradient-primary text-white shadow-premium" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* New folder inline */}
      {showNewFolder && (
        <div className="flex items-center gap-2 animate-slide-up">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <FolderPlus className="h-5 w-5 text-primary" />
          </div>
          <Input
            placeholder="Nome da pasta..."
            value={novaPasta}
            onChange={e => setNovaPasta(e.target.value)}
            className="rounded-xl flex-1"
            autoFocus
            onKeyDown={e => {
              if (e.key === "Enter") handleCriarPasta();
              if (e.key === "Escape") { setShowNewFolder(false); setNovaPasta(""); }
            }}
          />
          <Button size="sm" className="rounded-lg" onClick={handleCriarPasta} disabled={!novaPasta.trim()}>Criar</Button>
          <Button size="sm" variant="ghost" className="rounded-lg" onClick={() => { setShowNewFolder(false); setNovaPasta(""); }}>Cancelar</Button>
        </div>
      )}

      {/* Empty state */}
      {totalItems === 0 && (
        <div
          className="border-2 border-dashed border-border/60 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/40 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CloudUpload className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">Arraste arquivos ou clique para enviar</p>
          <p className="text-sm text-muted-foreground mt-1">Ou crie uma pasta para organizar seus documentos</p>
        </div>
      )}

      {/* ===== LIST VIEW ===== */}
      {viewMode === "list" && totalItems > 0 && (
        <div className="bg-card rounded-xl border border-border/50 shadow-premium overflow-hidden">
          <div className="divide-y divide-border/50">
            {pastas?.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors group"
                onClick={() => navegarPasta(p.id, p.nome)}
              >
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", folderColors[i % folderColors.length].bg)}>
                  <Folder className={cn("h-5 w-5", folderColors[i % folderColors.length].icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">Pasta</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive" onClick={e => { e.stopPropagation(); deletePasta.mutate({ id: p.id, obraId }); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {documentos?.map((d) => {
              const fic = fileIconColor(d.tipo_arquivo);
              return (
                <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors group" onClick={() => openFile(d.url, d.nome, d.tipo_arquivo, false)}>
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", fic.bg)}>
                    <fic.icon className={cn("h-5 w-5", fic.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{d.nome}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(d.tamanho)} · {new Date(d.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <DocActions
                      onOpen={() => openFile(d.url, d.nome, d.tipo_arquivo, false)}
                      onOpenTab={() => openFile(d.url, d.nome, d.tipo_arquivo, true)}
                      onRename={() => { setRenameDoc({ id: d.id, nome: d.nome }); setRenameValue(d.nome); }}
                      onDownload={() => downloadDoc(d.url, d.nome)}
                      onDelete={() => deleteDoc.mutate({ id: d.id, obraId, url: d.url })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== CARDS VIEW ===== */}
      {viewMode === "cards" && totalItems > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {pastas?.map((p, i) => (
            <Card
              key={p.id}
              className="group overflow-hidden hover-lift shadow-premium rounded-xl border-border/50 cursor-pointer"
              onClick={() => navegarPasta(p.id, p.nome)}
            >
              <div className={cn("h-28 flex items-center justify-center", folderColors[i % folderColors.length].bg)}>
                <Folder className={cn("h-12 w-12 transition-transform group-hover:scale-110", folderColors[i % folderColors.length].icon)} />
              </div>
              <div className="p-3">
                <p className="font-medium text-sm truncate">{p.nome}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pasta</p>
              </div>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 bg-white/80 backdrop-blur rounded-lg text-destructive" onClick={e => { e.stopPropagation(); deletePasta.mutate({ id: p.id, obraId }); }}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </Card>
          ))}
          {documentos?.map((d) => (
            <DocCardItem
              key={d.id}
              doc={d}
              onOpen={() => openFile(d.url, d.nome, d.tipo_arquivo, false)}
              onOpenTab={() => openFile(d.url, d.nome, d.tipo_arquivo, true)}
              onRename={() => { setRenameDoc({ id: d.id, nome: d.nome }); setRenameValue(d.nome); }}
              onDownload={() => downloadDoc(d.url, d.nome)}
              onDelete={() => deleteDoc.mutate({ id: d.id, obraId, url: d.url })}
              getSignedUrl={getSignedUrl}
              formatSize={formatSize}
            />
          ))}
        </div>
      )}

      {/* ===== GRID VIEW (large thumbnails) ===== */}
      {viewMode === "grid" && totalItems > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {pastas?.map((p, i) => (
            <Card
              key={p.id}
              className="group overflow-hidden hover-lift shadow-premium rounded-xl border-border/50 cursor-pointer"
              onClick={() => navegarPasta(p.id, p.nome)}
            >
              <div className={cn("h-40 flex items-center justify-center", folderColors[i % folderColors.length].bg)}>
                <Folder className={cn("h-16 w-16 transition-transform group-hover:scale-110", folderColors[i % folderColors.length].icon)} />
              </div>
              <div className="p-4">
                <p className="font-semibold truncate">{p.nome}</p>
              </div>
            </Card>
          ))}
          {documentos?.map((d) => (
            <DocGridItem
              key={d.id}
              doc={d}
              onOpen={() => openFile(d.url, d.nome, d.tipo_arquivo, false)}
              onOpenTab={() => openFile(d.url, d.nome, d.tipo_arquivo, true)}
              onRename={() => { setRenameDoc({ id: d.id, nome: d.nome }); setRenameValue(d.nome); }}
              onDownload={() => downloadDoc(d.url, d.nome)}
              onDelete={() => deleteDoc.mutate({ id: d.id, obraId, url: d.url })}
              getSignedUrl={getSignedUrl}
              formatSize={formatSize}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ===== Doc Actions Dropdown ===== */
const DocActions = ({ onOpen, onOpenTab, onRename, onDownload, onDelete }: {
  onOpen: () => void; onOpenTab: () => void; onRename: () => void;
  onDownload: () => void; onDelete: () => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="rounded-xl">
      <DropdownMenuItem onClick={onOpen}><Eye className="h-4 w-4 mr-2" />Visualizar</DropdownMenuItem>
      <DropdownMenuItem onClick={onOpenTab}><ExternalLink className="h-4 w-4 mr-2" />Abrir em nova aba</DropdownMenuItem>
      <DropdownMenuItem onClick={onRename}><Pencil className="h-4 w-4 mr-2" />Renomear</DropdownMenuItem>
      <DropdownMenuItem onClick={onDownload}><Download className="h-4 w-4 mr-2" />Download</DropdownMenuItem>
      <DropdownMenuItem className="text-destructive" onClick={onDelete}><Trash2 className="h-4 w-4 mr-2" />Excluir</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

/* ===== Card Item ===== */
const DocCardItem = ({ doc, onOpen, onOpenTab, onRename, onDownload, onDelete, getSignedUrl, formatSize }: {
  doc: any;
  onOpen: () => void; onOpenTab: () => void; onRename: () => void;
  onDownload: () => void; onDelete: () => void;
  getSignedUrl: (url: string) => Promise<{ data: { signedUrl: string } | null; error: any }>;
  formatSize: (bytes: number | null) => string;
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const isImg = isImage(doc.tipo_arquivo);
  const fic = fileIconColor(doc.tipo_arquivo);

  useEffect(() => {
    if (isImg) {
      getSignedUrl(doc.url).then(({ data }) => { if (data) setSignedUrl(data.signedUrl); });
    }
  }, [doc.url, isImg]);

  return (
    <Card className="group overflow-hidden hover-lift shadow-premium rounded-xl border-border/50 cursor-pointer relative" onClick={onOpen}>
      <div className="h-28 flex items-center justify-center bg-muted/30 overflow-hidden">
        {isImg && signedUrl ? (
          <img src={signedUrl} alt={doc.nome} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className={cn("h-14 w-14 rounded-xl flex items-center justify-center", fic.bg)}>
            <fic.icon className={cn("h-7 w-7", fic.color)} />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-sm truncate">{doc.nome}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatSize(doc.tamanho)}</p>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <DocActions onOpen={onOpen} onOpenTab={onOpenTab} onRename={onRename} onDownload={onDownload} onDelete={onDelete} />
      </div>
    </Card>
  );
};

/* ===== Grid Item (Large) ===== */
const DocGridItem = ({ doc, onOpen, onOpenTab, onRename, onDownload, onDelete, getSignedUrl, formatSize }: {
  doc: any;
  onOpen: () => void; onOpenTab: () => void; onRename: () => void;
  onDownload: () => void; onDelete: () => void;
  getSignedUrl: (url: string) => Promise<{ data: { signedUrl: string } | null; error: any }>;
  formatSize: (bytes: number | null) => string;
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const isImg = isImage(doc.tipo_arquivo);
  const fic = fileIconColor(doc.tipo_arquivo);

  useEffect(() => {
    if (isImg) {
      getSignedUrl(doc.url).then(({ data }) => { if (data) setSignedUrl(data.signedUrl); });
    }
  }, [doc.url, isImg]);

  return (
    <Card className="group overflow-hidden hover-lift shadow-premium rounded-xl border-border/50 cursor-pointer relative" onClick={onOpen}>
      <div className="h-40 flex items-center justify-center bg-muted/30 overflow-hidden">
        {isImg && signedUrl ? (
          <img src={signedUrl} alt={doc.nome} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className={cn("h-20 w-20 rounded-2xl flex items-center justify-center", fic.bg)}>
            <fic.icon className={cn("h-10 w-10", fic.color)} />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-semibold text-sm truncate">{doc.nome}</p>
        <p className="text-xs text-muted-foreground mt-1">{formatSize(doc.tamanho)} · {new Date(doc.created_at).toLocaleDateString("pt-BR")}</p>
      </div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
        <DocActions onOpen={onOpen} onOpenTab={onOpenTab} onRename={onRename} onDownload={onDownload} onDelete={onDelete} />
      </div>
    </Card>
  );
};

export default DocumentosTab;
