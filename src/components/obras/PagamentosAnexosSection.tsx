import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useDespesas } from "@/hooks/useDespesas";
import { ChevronDown, ChevronRight, Folder, FileText, Image as ImageIcon, ExternalLink, Download, Eye, Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Props {
  obraId: string;
}

type Anexo = {
  id: string;
  nome: string;
  url: string;
  tipo_arquivo: string | null;
  tamanho: number | null;
  despesa_id: string;
  despesa: { descricao: string; data: string; fornecedor_id: string | null; fornecedores: { nome: string } | null };
};

const isImage = (t: string | null) => !!t?.startsWith("image/");

const formatSize = (b: number | null) => {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
};

const PagamentosAnexosSection = ({ obraId }: Props) => {
  const { toast } = useToast();
  const { data: despesas } = useDespesas(obraId);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(true);
  const [preview, setPreview] = useState<{ url: string; nome: string; tipo: string | null } | null>(null);

  useEffect(() => {
    if (!despesas?.length) { setAnexos([]); setLoading(false); return; }
    const ids = despesas.map((d: any) => d.id);
    setLoading(true);
    supabase
      .from("despesa_anexos")
      .select("*")
      .in("despesa_id", ids)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setLoading(false); return; }
        const map = new Map(despesas.map((d: any) => [d.id, d]));
        const enriched: Anexo[] = (data || []).map((a: any) => ({ ...a, despesa: map.get(a.despesa_id) as any }));
        setAnexos(enriched);
        setLoading(false);
      });
  }, [despesas, toast]);

  const groups = useMemo(() => {
    const m = new Map<string, { nome: string; items: Anexo[] }>();
    for (const a of anexos) {
      const fornNome = a.despesa?.fornecedores?.nome || "Sem fornecedor";
      const key = a.despesa?.fornecedor_id || "__none__";
      if (!m.has(key)) m.set(key, { nome: fornNome, items: [] });
      m.get(key)!.items.push(a);
    }
    return Array.from(m.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [anexos]);

  const toggle = (k: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  };

  const openAnexo = async (a: Anexo, inNewTab = false) => {
    const { data, error } = await supabase.storage.from("despesa-anexos").createSignedUrl(a.url, 3600);
    if (error || !data?.signedUrl) {
      toast({ title: "Erro ao abrir anexo", variant: "destructive" });
      return;
    }
    if (inNewTab || !isImage(a.tipo_arquivo)) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } else {
      setPreview({ url: data.signedUrl, nome: a.nome, tipo: a.tipo_arquivo });
    }
  };

  const downloadAnexo = async (a: Anexo) => {
    const { data, error } = await supabase.storage.from("despesa-anexos").download(a.url);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(data);
    link.download = a.nome;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (!loading && anexos.length === 0) return null;

  return (
    <Card className="rounded-xl border-border/50 shadow-premium overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Folder className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 text-left">
          <p className="font-semibold text-sm">Anexos de Pagamentos</p>
          <p className="text-xs text-muted-foreground">
            {loading ? "Carregando..." : `${anexos.length} ${anexos.length === 1 ? "anexo" : "anexos"} • ${groups.length} ${groups.length === 1 ? "fornecedor" : "fornecedores"}`}
          </p>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && !loading && (
        <div className="divide-y divide-border/50">
          {groups.map(g => {
            const isOpen = expanded.has(g.key);
            return (
              <div key={g.key}>
                <button
                  type="button"
                  onClick={() => toggle(g.key)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
                >
                  {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm flex-1 text-left">{g.nome}</span>
                  <span className="text-xs text-muted-foreground">{g.items.length}</span>
                </button>
                {isOpen && (
                  <div className="bg-muted/20 divide-y divide-border/40">
                    {g.items.map(a => (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 px-4 py-2 pl-12 hover:bg-muted/40 cursor-pointer group"
                        onClick={() => openAnexo(a)}
                      >
                        <div className={cn("h-8 w-8 rounded flex items-center justify-center shrink-0", isImage(a.tipo_arquivo) ? "bg-emerald-500/10" : "bg-muted")}>
                          {isImage(a.tipo_arquivo) ? <ImageIcon className="h-4 w-4 text-emerald-500" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{a.nome}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {a.despesa?.descricao} {a.despesa?.data && `• ${new Date(a.despesa.data + "T12:00:00").toLocaleDateString("pt-BR")}`}
                            {a.tamanho && ` • ${formatSize(a.tamanho)}`}
                          </p>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAnexo(a)} title="Visualizar">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openAnexo(a, true)} title="Abrir em nova aba">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadAnexo(a)} title="Baixar">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!preview} onOpenChange={(v) => { if (!v) setPreview(null); }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="text-sm font-medium truncate flex items-center justify-between gap-2">
              <span className="truncate">{preview?.nome}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => preview && window.open(preview.url, "_blank")}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center bg-muted/20 max-h-[80vh] overflow-auto">
            {preview && isImage(preview.tipo) ? (
              <img src={preview.url} alt={preview.nome} className="max-w-full max-h-[80vh] object-contain" />
            ) : preview ? (
              <iframe src={preview.url} className="w-full h-[80vh]" title={preview.nome} />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PagamentosAnexosSection;
