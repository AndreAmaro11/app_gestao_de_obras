import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePastas, useCreatePasta, useDeletePasta, useDocumentos, useUploadDocumento, useDeleteDocumento, useDownloadDocumento } from "@/hooks/useDocumentos";
import { useToast } from "@/hooks/use-toast";
import { Folder, FolderPlus, ArrowLeft, Upload, Download, Trash2, FileText } from "lucide-react";

interface Props {
  obraId: string;
}

const DocumentosTab = ({ obraId }: Props) => {
  const [pastaAtual, setPastaAtual] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; nome: string }[]>([{ id: null, nome: "Raiz" }]);
  const [novaPasta, setNovaPasta] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: pastas } = usePastas(obraId, pastaAtual);
  const { data: documentos } = useDocumentos(obraId, pastaAtual);
  const createPasta = useCreatePasta();
  const deletePasta = useDeletePasta();
  const uploadDoc = useUploadDocumento();
  const deleteDoc = useDeleteDocumento();
  const downloadDoc = useDownloadDocumento();

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

  return (
    <div className="space-y-4">
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
      </div>

      {/* Content */}
      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-24">Tamanho</TableHead>
              <TableHead className="w-20 text-right">Ações</TableHead>
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
                  <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{d.nome}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatSize(d.tamanho)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadDoc(d.url, d.nome)}>
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
    </div>
  );
};

export default DocumentosTab;
