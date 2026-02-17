import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePastas, useCreatePasta, useDeletePasta, useDocumentos, useUploadDocumento, useDeleteDocumento, useDownloadDocumento } from "@/hooks/useDocumentos";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Folder, FolderPlus, ArrowLeft, Upload, Download, Trash2, FileText, Grid, List, LayoutGrid, Image as ImageIcon, Eye, ExternalLink, Pencil } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Props {
  obraId: string;
}

type ViewMode = "list" | "small" | "medium" | "large";

const isImage = (tipo: string | null) => tipo?.startsWith("image/");

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
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; nome: string }[]>([{ id: null, nome: "Raiz" }]);
  const [novaPasta, setNovaPasta] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [previewDoc, setPreviewDoc] = useState<{ url: string; nome: string; tipo: string | null } | null>(null);
  const [renameDoc, setRenameDoc] = useState<{ id: string; nome: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: pastas } = usePastas(obraId, pastaAtual);
  const { data: documentos } = useDocumentos(obraId, pastaAtual);
  const createPasta = useCreatePasta();
  const deletePasta = useDeletePasta();
  const uploadDoc = useUploadDocumento();
  const deleteDoc = useDeleteDocumento();
  const downloadDoc = useDownloadDocumento();
  const renameDocMut = useRenameDocumento();

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

  const viewModes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: "list", icon: <List className="h-4 w-4" />, label: "Lista" },
    { mode: "small", icon: <Grid className="h-4 w-4" />, label: "Pequeno" },
    { mode: "medium", icon: <LayoutGrid className="h-4 w-4" />, label: "Médio" },
    { mode: "large", icon: <ImageIcon className="h-4 w-4" />, label: "Grande" },
  ];

  const gridClass = viewMode === "small" ? "grid-cols-6 sm:grid-cols-8 md:grid-cols-10" : viewMode === "medium" ? "grid-cols-3 sm:grid-cols-4 md:grid-cols-6" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
  const thumbSize = viewMode === "small" ? "h-16 w-16" : viewMode === "medium" ? "h-28 w-28" : "h-44 w-44";

  return (
    <div className="space-y-4">
      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(v) => { if (!v) setPreviewDoc(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader><DialogTitle>{previewDoc?.nome}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-auto">
            {previewDoc && isImage(previewDoc.tipo) ? (
              <img src={previewDoc.url} alt={previewDoc.nome} className="max-w-full max-h-[70vh] mx-auto" />
            ) : previewDoc?.tipo === "application/pdf" ? (
              <iframe src={previewDoc.url} className="w-full h-[70vh]" title={previewDoc.nome} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4" />
                <p>Visualização não disponível para este tipo de arquivo.</p>
                <Button className="mt-4" onClick={() => window.open(previewDoc?.url, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />Abrir em nova aba
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameDoc} onOpenChange={(v) => { if (!v) setRenameDoc(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renomear Arquivo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Novo nome</Label>
              <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleRename()} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenameDoc(null)}>Cancelar</Button>
              <Button onClick={handleRename}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbs.map((bc, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span>/</span>}
            <button className="hover:text-foreground hover:underline" onClick={() => voltarPasta(i)}>
              {bc.nome}
            </button>
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {pastaAtual && (
          <Button variant="outline" size="sm" onClick={() => voltarPasta(breadcrumbs.length - 2)}>
            <ArrowLeft className="h-4 w-4 mr-1" />Voltar
          </Button>
        )}
        <div className="flex items-center gap-1">
          <Input placeholder="Nova pasta..." value={novaPasta} onChange={e => setNovaPasta(e.target.value)} className="w-40 h-9"
            onKeyDown={e => e.key === "Enter" && handleCriarPasta()} />
          <Button variant="outline" size="sm" onClick={handleCriarPasta} disabled={!novaPasta.trim()}>
            <FolderPlus className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4 mr-1" />Upload
        </Button>
        <input ref={fileRef} type="file" multiple className="hidden" onChange={handleUpload} />

        <div className="ml-auto flex items-center border rounded-md">
          {viewModes.map(vm => (
            <Button key={vm.mode} variant={viewMode === vm.mode ? "default" : "ghost"} size="sm" className="h-8 px-2" onClick={() => setViewMode(vm.mode)} title={vm.label}>
              {vm.icon}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      {viewMode === "list" ? (
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-24">Tamanho</TableHead>
                <TableHead className="w-32 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastas?.map((p) => (
                <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navegarPasta(p.id, p.nome)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2"><Folder className="h-4 w-4 text-accent" />{p.nome}</div>
                  </TableCell>
                  <TableCell>—</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); deletePasta.mutate({ id: p.id, obraId }); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {documentos?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {isImage(d.tipo_arquivo) ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                      {d.nome}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatSize(d.tamanho)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Visualizar" onClick={() => openFile(d.url, d.nome, d.tipo_arquivo, false)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Abrir em nova aba" onClick={() => openFile(d.url, d.nome, d.tipo_arquivo, true)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Renomear" onClick={() => { setRenameDoc({ id: d.id, nome: d.nome }); setRenameValue(d.nome); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Download" onClick={() => downloadDoc(d.url, d.nome)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDoc.mutate({ id: d.id, obraId, url: d.url })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!pastas?.length && !documentos?.length && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Pasta vazia</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className={`grid ${gridClass} gap-3`}>
          {pastas?.map((p) => (
            <div key={p.id} className="group relative flex flex-col items-center justify-center bg-card border rounded-md p-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navegarPasta(p.id, p.nome)}>
              <Folder className={`${viewMode === "small" ? "h-8 w-8" : viewMode === "medium" ? "h-12 w-12" : "h-16 w-16"} text-accent`} />
              <span className="text-xs text-center mt-1 truncate w-full">{p.nome}</span>
              <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={e => { e.stopPropagation(); deletePasta.mutate({ id: p.id, obraId }); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {documentos?.map((d) => (
            <DocGridItem key={d.id} doc={d} viewMode={viewMode} thumbSize={thumbSize}
              onOpen={() => openFile(d.url, d.nome, d.tipo_arquivo, false)}
              onOpenTab={() => openFile(d.url, d.nome, d.tipo_arquivo, true)}
              onRename={() => { setRenameDoc({ id: d.id, nome: d.nome }); setRenameValue(d.nome); }}
              onDownload={() => downloadDoc(d.url, d.nome)}
              onDelete={() => deleteDoc.mutate({ id: d.id, obraId, url: d.url })}
              getSignedUrl={getSignedUrl}
            />
          ))}
          {!pastas?.length && !documentos?.length && (
            <div className="col-span-full text-center text-muted-foreground py-8">Pasta vazia</div>
          )}
        </div>
      )}
    </div>
  );
};

const DocGridItem = ({ doc, viewMode, thumbSize, onOpen, onOpenTab, onRename, onDownload, onDelete, getSignedUrl }: {
  doc: any; viewMode: ViewMode; thumbSize: string;
  onOpen: () => void; onOpenTab: () => void; onRename: () => void;
  onDownload: () => void; onDelete: () => void;
  getSignedUrl: (url: string) => Promise<{ data: { signedUrl: string } | null; error: any }>;
}) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const isImg = isImage(doc.tipo_arquivo);

  useState(() => {
    if (isImg) {
      getSignedUrl(doc.url).then(({ data }) => {
        if (data) setSignedUrl(data.signedUrl);
      });
    }
  });

  return (
    <div className="group relative flex flex-col items-center bg-card border rounded-md p-2 hover:bg-muted/50 transition-colors cursor-pointer" onClick={onOpen}>
      <div className={`${thumbSize} flex items-center justify-center overflow-hidden rounded`}>
        {isImg && signedUrl ? (
          <img src={signedUrl} alt={doc.nome} className="object-cover w-full h-full rounded" />
        ) : (
          <FileText className={`${viewMode === "small" ? "h-8 w-8" : viewMode === "medium" ? "h-12 w-12" : "h-16 w-16"} text-muted-foreground`} />
        )}
      </div>
      <span className="text-xs text-center mt-1 truncate w-full">{doc.nome}</span>
      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-6 w-6" title="Nova aba" onClick={e => { e.stopPropagation(); onOpenTab(); }}>
          <ExternalLink className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" title="Renomear" onClick={e => { e.stopPropagation(); onRename(); }}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" title="Download" onClick={e => { e.stopPropagation(); onDownload(); }}>
          <Download className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" title="Excluir" onClick={e => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default DocumentosTab;
