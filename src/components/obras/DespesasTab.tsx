import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Layers, Paperclip, Download, X, FileText, Image as ImageIcon, Eye, ExternalLink, FileSpreadsheet } from "lucide-react";
import { exportToExcel, formatDateForExcel } from "@/lib/excelExport";
import { useDespesas, useCreateDespesa, useUpdateDespesa, useDeleteDespesa } from "@/hooks/useDespesas";
import { useDespesaAnexos, useUploadDespesaAnexo, useDeleteDespesaAnexo, useDownloadDespesaAnexo, getDespesaAnexoSignedUrl } from "@/hooks/useDespesaAnexos";
import { useEtapas } from "@/hooks/useEtapas";
import { useSubetapas } from "@/hooks/useSubetapas";
import { useFornecedores, useCreateFornecedor } from "@/hooks/useFornecedores";
import { useToast } from "@/hooks/use-toast";
import { DataToolbar, SortableHeader, useSort, useSearch } from "@/components/DataToolbar";
import { Textarea } from "@/components/ui/textarea";
import { useConfirm } from "@/components/ConfirmDialog";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import MediaLightbox, { LightboxItem } from "@/components/MediaLightbox";


const categoriaLabel: Record<string, string> = {
  material: "Material", mao_de_obra: "Mão de Obra", servico: "Serviço",
  equipamento: "Equipamento", transporte: "Transporte", administrativo: "Administrativo",
  projeto: "Projeto", outros: "Outros",
};
const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

interface Props { obraId: string; }

const SubetapaSelect = ({ etapaId, value, onChange }: { etapaId: string | undefined; value: string; onChange: (v: string) => void }) => {
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

const DespesasTab = ({ obraId }: Props) => {
  const { data: despesas, isLoading } = useDespesas(obraId);
  const { data: etapas } = useEtapas(obraId);
  const { data: fornecedores } = useFornecedores();
  const createDespesa = useCreateDespesa();
  const updateDespesa = useUpdateDespesa();
  const deleteDespesa = useDeleteDespesa();
  const createFornecedor = useCreateFornecedor();
  const { toast } = useToast();
  const confirm = useConfirm();
  const unsaved = useUnsavedChanges();

  const handleDeleteDespesa = async (d: any) => {
    if (await confirm({
      title: "Excluir despesa?",
      description: `A despesa "${d.descricao}" (R$ ${fmt(d.valor_real || d.valor_previsto)}) e suas parcelas/anexos serão removidos. Esta ação afeta o financeiro.`,
    })) {
      deleteDespesa.mutate({ id: d.id, obra_id: obraId });
    }
  };

  const [filtroEtapa, setFiltroEtapa] = useState("todos");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [descricao, setDescricao] = useState("");
  const [etapaId, setEtapaId] = useState("");
  const [subetapaId, setSubetapaId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [categoria, setCategoria] = useState("material");
  const [valorPrev, setValorPrev] = useState("");
  const [valorReal, setValorReal] = useState("");
  const [data, setData] = useState("");
  const [condicaoPagamento, setCondicaoPagamento] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [parcelas, setParcelas] = useState("1");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showNewFornecedor, setShowNewFornecedor] = useState(false);
  const [newForn, setNewForn] = useState({ nome: "", nome_fantasia: "", cnpj: "", telefone: "", email: "", endereco: "", observacao: "", tipo: "misto" });
  const [agrupado, setAgrupado] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [anexosDespesaId, setAnexosDespesaId] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-abre o dialog de nova despesa quando vier ?new=1 (FAB da home mobile)
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowDialog(true);
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setDescricao(""); setEtapaId(""); setSubetapaId(""); setFornecedorId("");
    setCategoria("material"); setValorPrev(""); setValorReal(""); setData("");
    setCondicaoPagamento(""); setDataVencimento(""); setParcelas("1");
    setEditing(null);
    unsaved.reset();
  };

  const openEdit = (d: any) => {
    setEditing(d); setDescricao(d.descricao); setEtapaId(d.etapa_id || "");
    setSubetapaId(d.subetapa_id || ""); setFornecedorId(d.fornecedor_id || "");
    setCategoria(d.categoria); setValorPrev(String(d.valor_previsto));
    setValorReal(String(d.valor_real)); setData(d.data);
    setCondicaoPagamento(d.condicao_pagamento || "");
    setDataVencimento(d.data_vencimento || ""); setParcelas(String(d.parcelas || 1));
    setShowDialog(true);
    unsaved.reset();
  };

  const tryCloseDialog = async () => {
    if (await unsaved.confirmDiscard()) {
      setShowDialog(false);
      resetForm();
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroup = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };


  const mainDespesas = despesas?.filter((d: any) => !d.despesa_pai_id) || [];
  const childDespesas = despesas?.filter((d: any) => !!d.despesa_pai_id) || [];

  const getChildren = (parentId: string) => childDespesas.filter((d: any) => d.despesa_pai_id === parentId);

  // Search
  const { search, setSearch, filtered: searched } = useSearch(mainDespesas, ["descricao", "etapas.nome", "fornecedores.nome"]);

  // Apply filters
  const afterFilters = searched.filter((d: any) => {
    if (filtroEtapa !== "todos" && d.etapa_id !== filtroEtapa) return false;
    if (filtroCategoria !== "todos" && d.categoria !== filtroCategoria) return false;
    return true;
  });

  // Sort
  const { sorted, sortField, sortDir, toggleSort } = useSort(afterFilters);

  const totalPrevisto = sorted.reduce((s: number, d: any) => s + d.valor_previsto, 0);
  const totalReal = sorted.reduce((s: number, d: any) => s + d.valor_real, 0);

  // Build groups by etapa + subetapa for agrupado view
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: any[]; totalPrev: number; totalReal: number }>();
    for (const d of sorted) {
      const etapaNome = (d.etapas as any)?.nome || "Sem etapa";
      const subetapaNome = (d.subetapas as any)?.nome;
      const key = `${d.etapa_id || "__sem__"}___${d.subetapa_id || "__sem__"}`;
      const label = subetapaNome ? `${etapaNome} › ${subetapaNome}` : etapaNome;
      if (!map.has(key)) map.set(key, { label, items: [], totalPrev: 0, totalReal: 0 });
      const g = map.get(key)!;
      g.items.push(d);
      g.totalPrev += d.valor_previsto;
      g.totalReal += d.valor_real;
    }
    return Array.from(map.entries()).map(([key, v]) => ({ key, ...v }));
  }, [sorted]);



  const handleTogglePago = async (d: any) => {
    try {
      await updateDespesa.mutateAsync({ id: d.id, obra_id: obraId, pago: !d.pago });
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = Number(valorReal || valorPrev || 0);
    const payload = {
      obra_id: obraId, descricao,
      etapa_id: etapaId || null,
      subetapa_id: subetapaId && subetapaId !== "__none__" ? subetapaId : null,
      fornecedor_id: fornecedorId || null,
      categoria: categoria as any,
      valor_previsto: valor,
      valor_real: valor,
      data: data || new Date().toISOString().split("T")[0],
      condicao_pagamento: condicaoPagamento || null,
      data_vencimento: dataVencimento || null,
      parcelas: Number(parcelas) || 1,
    };
    try {
      if (editing) {
        await updateDespesa.mutateAsync({ id: editing.id, obra_id: obraId, ...payload });
      } else {
        await createDespesa.mutateAsync(payload);
        if (Number(parcelas) > 1 && dataVencimento) {
          toast({ title: `Despesa criada com ${parcelas} parcelas automáticas!` });
        }
      }
      unsaved.reset();
      setShowDialog(false); resetForm();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <h2 className="text-lg font-semibold">Despesas</h2>
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="hidden sm:inline-flex"
            onClick={() => exportToExcel(
              sorted as any[],
              [
                { header: "Data", accessor: (d: any) => formatDateForExcel(d.data), width: 12 },
                { header: "Descrição", accessor: "descricao", width: 35 },
                { header: "Etapa", accessor: (d: any) => d.etapas?.nome || "", width: 22 },
                { header: "Subetapa", accessor: (d: any) => d.subetapas?.nome || "", width: 22 },
                { header: "Fornecedor", accessor: (d: any) => d.fornecedores?.nome || "", width: 25 },
                { header: "Categoria", accessor: (d: any) => categoriaLabel[d.categoria] || d.categoria, width: 16 },
                { header: "Valor Previsto", accessor: (d: any) => Number(d.valor_previsto || 0), width: 14, numFmt: "R$ #,##0.00" },
                { header: "Valor Real", accessor: (d: any) => Number(d.valor_real || 0), width: 14, numFmt: "R$ #,##0.00" },
                { header: "Vencimento", accessor: (d: any) => formatDateForExcel(d.data_vencimento), width: 12 },
                { header: "Parcelas", accessor: (d: any) => d.parcelas || 1, width: 9 },
                { header: "Pago", accessor: (d: any) => d.pago ? "Sim" : "Não", width: 8 },
              ],
              "despesas",
              "Despesas"
            )}
            disabled={!sorted?.length}
          >
            <FileSpreadsheet className="h-4 w-4 mr-1" />Excel
          </Button>
          <Button
            size="sm"
            variant={agrupado ? "secondary" : "outline"}
            className="hidden sm:inline-flex"
            onClick={() => setAgrupado(v => !v)}
          >
            <Layers className="h-4 w-4 mr-1" />
            {agrupado ? "Desagrupar" : "Agrupar"}
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowDialog(true); }}><Plus className="h-4 w-4 mr-1" />Nova Despesa</Button>
        </div>
      </div>


      <Dialog open={showNewFornecedor} onOpenChange={setShowNewFornecedor}>
        <DialogContent className="max-w-lg max-h-[92vh] sm:max-h-[90vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0"><DialogTitle>Cadastrar Fornecedor</DialogTitle></DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              const created = await createFornecedor.mutateAsync({
                nome: newForn.nome, nome_fantasia: newForn.nome_fantasia || null,
                cnpj: newForn.cnpj || null, telefone: newForn.telefone || null,
                email: newForn.email || null, endereco: newForn.endereco || null,
                observacao: newForn.observacao || null, tipo: newForn.tipo as any,
              });
              setFornecedorId(created.id);
              setShowNewFornecedor(false);
              setNewForn({ nome: "", nome_fantasia: "", cnpj: "", telefone: "", email: "", endereco: "", observacao: "", tipo: "misto" });
              toast({ title: "Fornecedor criado!" });
            } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
          }} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Razão Social *</Label><Input value={newForn.nome} onChange={e => setNewForn({ ...newForn, nome: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Nome Fantasia</Label><Input value={newForn.nome_fantasia} onChange={e => setNewForn({ ...newForn, nome_fantasia: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>CNPJ/CPF</Label><Input value={newForn.cnpj} onChange={e => setNewForn({ ...newForn, cnpj: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newForn.tipo} onValueChange={v => setNewForn({ ...newForn, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                    <SelectItem value="misto">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Telefone</Label><Input value={newForn.telefone} onChange={e => setNewForn({ ...newForn, telefone: e.target.value })} /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={newForn.email} onChange={e => setNewForn({ ...newForn, email: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Endereço</Label><Input value={newForn.endereco} onChange={e => setNewForn({ ...newForn, endereco: e.target.value })} /></div>
            <div className="space-y-2"><Label>Observação</Label><Textarea value={newForn.observacao} onChange={e => setNewForn({ ...newForn, observacao: e.target.value })} rows={2} /></div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-3 border-t bg-background shrink-0">
              <Button type="button" variant="outline" onClick={() => setShowNewFornecedor(false)}>Cancelar</Button>
              <Button type="submit" disabled={createFornecedor.isPending}>{createFornecedor.isPending ? "Criando..." : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[92vh] sm:max-h-[90vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0"><DialogTitle>{editing ? "Editar Despesa" : "Nova Despesa"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-2"><Label>Descrição</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} required /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select value={etapaId} onValueChange={(v) => { setEtapaId(v); setSubetapaId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{etapas?.map(et => <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <SubetapaSelect etapaId={etapaId || undefined} value={subetapaId} onChange={setSubetapaId} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Select value={fornecedorId} onValueChange={setFornecedorId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{fornecedores?.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowNewFornecedor(true)} title="Cadastrar fornecedor">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="equipamento">Equipamento</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="administrativo">Administrativo</SelectItem>
                    <SelectItem value="projeto">Projeto</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Valor Previsto</Label><Input type="number" step="0.01" value={valorPrev} onChange={e => setValorPrev(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Valor Real</Label><Input type="number" step="0.01" value={valorReal} onChange={e => setValorReal(e.target.value)} /></div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Condição Pgto</Label><Input value={condicaoPagamento} onChange={e => setCondicaoPagamento(e.target.value)} placeholder="Ex: 30/60/90" /></div>
              <div className="space-y-2"><Label>Vencimento</Label><Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} /></div>
              <div className="space-y-2"><Label>Parcelas</Label><Input type="number" min="1" value={parcelas} onChange={e => setParcelas(e.target.value)} /></div>
            </div>
            {Number(parcelas) > 1 && dataVencimento && (
              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                Serão geradas {parcelas} parcelas de R$ {fmt(Number(valorReal || 0) / Number(parcelas))} cada,
                com vencimentos mensais a partir de {new Date(dataVencimento + "T12:00:00").toLocaleDateString("pt-BR")}.
              </p>
            )}
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-3 border-t bg-background shrink-0"><Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancelar</Button><Button type="submit" disabled={createDespesa.isPending || updateDespesa.isPending}>{createDespesa.isPending || updateDespesa.isPending ? "Salvando..." : (editing ? "Salvar" : "Criar")}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Anexos Dialog */}
      <AnexosDialog
        despesaId={anexosDespesaId}
        open={!!anexosDespesaId}
        onOpenChange={(open) => { if (!open) setAnexosDespesaId(null); }}
      />

      <DataToolbar
        searchPlaceholder="Buscar despesa..."
        searchValue={search}
        onSearchChange={setSearch}
      >
        <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas etapas</SelectItem>
            {etapas?.map(et => <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="material">Material</SelectItem>
            <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
            <SelectItem value="servico">Serviço</SelectItem>
          </SelectContent>
        </Select>
      </DataToolbar>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>
        ) : !sorted.length ? (
          <p className="text-center text-muted-foreground py-8 text-sm">{search ? "Nenhum resultado" : "Nenhuma despesa"}</p>
        ) : (
          <>
            {sorted.map((d: any) => {
              const children = getChildren(d.id);
              const hasChildren = children.length > 0;
              const overBudget = d.valor_real > d.valor_previsto;
              return (
                <div key={d.id} className="bg-card border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{d.descricao}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR")}
                        {d.etapas?.nome && ` • ${d.etapas.nome}`}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{categoriaLabel[d.categoria]}</Badge>
                  </div>
                  {d.fornecedores?.nome && <p className="text-xs text-muted-foreground">{d.fornecedores.nome}</p>}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t">
                    <div className="text-xs">
                      <span className="text-muted-foreground">Prev:</span> <span className="font-mono">R$ {fmt(d.valor_previsto)}</span>
                      {d.valor_real > 0 && (
                        <> <span className="text-muted-foreground ml-2">Real:</span> <span className={`font-mono ${overBudget ? "text-destructive font-semibold" : ""}`}>R$ {fmt(d.valor_real)}</span></>
                      )}
                    </div>
                    {(d.parcelas > 1 || hasChildren) && (
                      <Badge variant="secondary" className="text-[10px]">{d.parcelas || children.length}x</Badge>
                    )}
                  </div>
                  {d.data_vencimento && (
                    <p className="text-xs text-muted-foreground">Venc: {new Date(d.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs">
                      <Switch checked={d.pago} onCheckedChange={() => handleTogglePago(d)} />
                      <span className="text-muted-foreground">{d.pago ? "Pago" : "Não pago"}</span>
                    </label>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setAnexosDespesaId(d.id)}>
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteDespesa(d)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="bg-muted/40 border rounded-lg p-3 text-sm font-semibold flex justify-between">
              <span>Total ({sorted.length})</span>
              <span className="font-mono">R$ {fmt(totalReal || totalPrevisto)}</span>
            </div>
          </>
        )}
      </div>

      <div className="hidden md:block bg-card rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="w-24"><SortableHeader label="Data" field="data" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead><SortableHeader label="Descrição" field="descricao" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead><SortableHeader label="Etapa" field="etapas.nome" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead><SortableHeader label="Fornecedor" field="fornecedores.nome" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead className="w-28"><SortableHeader label="Categoria" field="categoria" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead className="w-32"><SortableHeader label="Previsto" field="valor_previsto" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead className="w-32"><SortableHeader label="Real" field="valor_real" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead className="w-28"><SortableHeader label="Vencimento" field="data_vencimento" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead className="w-20"><SortableHeader label="Parcelas" field="parcelas" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead className="w-20"><SortableHeader label="Pago" field="pago" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : !sorted.length ? (
              <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">{search ? "Nenhum resultado" : "Nenhuma despesa"}</TableCell></TableRow>
            ) : agrupado ? (
              <>
                {groups.map(group => {
                  const isCollapsed = collapsedGroups.has(group.key);
                  const totalPagas = group.items.filter((d: any) => d.pago).length;
                  return (
                    <>
                      {/* Group header */}
                      <TableRow
                        key={`gh-${group.key}`}
                        className="bg-muted/40 cursor-pointer hover:bg-muted/60"
                        onClick={() => toggleGroup(group.key)}
                      >
                        <TableCell className="py-2 px-2">
                          {isCollapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </TableCell>
                        <TableCell colSpan={5} className="py-2 font-semibold">{group.label}</TableCell>
                        <TableCell className="py-2 font-semibold whitespace-nowrap">R$ {fmt(group.totalPrev)}</TableCell>
                        <TableCell className="py-2 font-semibold whitespace-nowrap">R$ {fmt(group.totalReal)}</TableCell>
                        <TableCell className="py-2" colSpan={2}>
                          <Badge variant="secondary" className="text-xs">{totalPagas}/{group.items.length} pagas</Badge>
                        </TableCell>
                        <TableCell colSpan={2} />
                      </TableRow>
                      {/* Group rows */}
                      {!isCollapsed && group.items.map((d: any) => {
                        const children = getChildren(d.id);
                        const hasChildren = children.length > 0;
                        const hasParcelas = (d.parcelas && d.parcelas > 1);
                        const canExpand = hasChildren || hasParcelas;
                        const isExpanded = expandedRows.has(d.id);
                        return (
                          <ExpandableRow
                            key={d.id}
                            d={d}
                            children={children}
                            canExpand={canExpand}
                            hasChildren={hasChildren}
                            isExpanded={isExpanded}
                            onToggleExpand={() => toggleExpand(d.id)}
                            onTogglePago={handleTogglePago}
                            onEdit={openEdit}
                            onDelete={() => handleDeleteDespesa(d)}
                            onAnexos={(id) => setAnexosDespesaId(id)}
                          />
                        );
                      })}
                    </>
                  );
                })}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell />
                  <TableCell colSpan={5} className="text-right">Total Geral</TableCell>
                  <TableCell className="whitespace-nowrap">R$ {fmt(totalPrevisto)}</TableCell>
                  <TableCell className="whitespace-nowrap">R$ {fmt(totalReal)}</TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
              </>
            ) : (
              <>
                {sorted.map((d: any) => {
                  const children = getChildren(d.id);
                  const hasChildren = children.length > 0;
                  const hasParcelas = (d.parcelas && d.parcelas > 1);
                  const canExpand = hasChildren || hasParcelas;
                  const isExpanded = expandedRows.has(d.id);
                  return (
                    <ExpandableRow
                      key={d.id}
                      d={d}
                      children={children}
                      canExpand={canExpand}
                      hasChildren={hasChildren}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleExpand(d.id)}
                      onTogglePago={handleTogglePago}
                      onEdit={openEdit}
                      onDelete={() => handleDeleteDespesa(d)}
                      onAnexos={(id) => setAnexosDespesaId(id)}
                    />
                  );
                })}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell />
                  <TableCell colSpan={5} className="text-right">Total</TableCell>
                  <TableCell className="whitespace-nowrap">R$ {fmt(totalPrevisto)}</TableCell>
                  <TableCell className="whitespace-nowrap">R$ {fmt(totalReal)}</TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
              </>
            )}
          </TableBody>

        </Table>
      </div>
    </div>
  );
};

const ExpandableRow = ({ d, children, canExpand, hasChildren, isExpanded, onToggleExpand, onTogglePago, onEdit, onDelete, onAnexos }: {
  d: any; children: any[]; canExpand: boolean; hasChildren: boolean; isExpanded: boolean;
  onToggleExpand: () => void; onTogglePago: (d: any) => void; onEdit: (d: any) => void; onDelete: () => void; onAnexos: (id: string) => void;
}) => {
  const virtualParcelas = !hasChildren && d.parcelas > 1 ? Array.from({ length: d.parcelas }, (_, i) => {
    const valorParcela = Math.round(d.valor_real / d.parcelas * 100) / 100;
    const valorPrevParcela = Math.round(d.valor_previsto / d.parcelas * 100) / 100;
    const baseDate = d.data_vencimento ? new Date(d.data_vencimento + "T12:00:00") : null;
    const vencimento = baseDate ? new Date(baseDate) : null;
    if (vencimento) vencimento.setMonth(vencimento.getMonth() + i);
    return {
      id: `virtual-${d.id}-${i}`, parcela_numero: i + 1,
      descricao: `${d.descricao} (${i + 1}/${d.parcelas})`, data: d.data,
      valor_previsto: valorPrevParcela, valor_real: valorParcela,
      data_vencimento: vencimento ? vencimento.toISOString().split("T")[0] : null,
      pago: false, virtual: true,
    };
  }) : [];

  const expandedItems = hasChildren ? children : virtualParcelas;

  return (
    <>
      <TableRow>
        <TableCell className="px-1">
          {canExpand ? (
            <button onClick={onToggleExpand} className="p-0.5 hover:bg-muted rounded">
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : null}
        </TableCell>
        <TableCell className="whitespace-nowrap">{new Date(d.data + "T12:00:00").toLocaleDateString("pt-BR")}</TableCell>
        <TableCell className="font-medium">{d.descricao}</TableCell>
        <TableCell>{d.etapas?.nome || "—"}</TableCell>
        <TableCell>{d.fornecedores?.nome || "—"}</TableCell>
        <TableCell><Badge variant="outline" className="text-xs whitespace-nowrap">{categoriaLabel[d.categoria]}</Badge></TableCell>
        <TableCell className="whitespace-nowrap">R$ {fmt(d.valor_previsto)}</TableCell>
        <TableCell className={`whitespace-nowrap ${d.valor_real > d.valor_previsto ? "text-destructive font-medium" : ""}`}>
          {d.valor_real > 0 ? `R$ ${fmt(d.valor_real)}` : "—"}
        </TableCell>
        <TableCell className="whitespace-nowrap">{d.data_vencimento ? new Date(d.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
        <TableCell className="text-center font-mono">
          {canExpand ? <Badge variant="secondary" className="text-xs cursor-pointer" onClick={onToggleExpand}>{d.parcelas || children.length}x</Badge> : (d.parcelas || 1)}
        </TableCell>
        <TableCell>
          <Switch checked={d.pago} onCheckedChange={() => onTogglePago(d)} />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAnexos(d.id)} title="Anexos">
              <Paperclip className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && expandedItems.map((c: any) => (
        <TableRow key={c.id} className="bg-muted/20">
          <TableCell></TableCell>
          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{new Date(c.data + "T12:00:00").toLocaleDateString("pt-BR")}</TableCell>
          <TableCell className="text-sm pl-6">{c.descricao}</TableCell>
          <TableCell className="text-sm">{c.etapas?.nome || "—"}</TableCell>
          <TableCell className="text-sm">{c.fornecedores?.nome || "—"}</TableCell>
          <TableCell></TableCell>
          <TableCell className="text-sm whitespace-nowrap">R$ {fmt(c.valor_previsto)}</TableCell>
          <TableCell className="text-sm whitespace-nowrap">R$ {fmt(c.valor_real)}</TableCell>
          <TableCell className="text-sm whitespace-nowrap">{c.data_vencimento ? new Date(c.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</TableCell>
          <TableCell className="text-center text-sm font-mono">{c.parcela_numero || "—"}</TableCell>
          <TableCell>
            {!c.virtual && <Switch checked={c.pago} onCheckedChange={() => onTogglePago(c)} />}
            {c.virtual && <span className="text-xs text-muted-foreground">—</span>}
          </TableCell>
          <TableCell></TableCell>
        </TableRow>
      ))}
    </>
  );
};

// Anexos Dialog Component
const AnexosDialog = ({ despesaId, open, onOpenChange }: { despesaId: string | null; open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { data: anexos, isLoading } = useDespesaAnexos(despesaId || undefined);
  const uploadAnexo = useUploadDespesaAnexo();
  const deleteAnexo = useDeleteDespesaAnexo();
  const downloadAnexo = useDownloadDespesaAnexo();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [lightboxItems, setLightboxItems] = useState<LightboxItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Preload signed URLs for image previews/thumbs
  useMemo(() => {
    if (!anexos) return;
    anexos.forEach(async (a: any) => {
      if (signedUrls[a.id]) return;
      try {
        const url = await getDespesaAnexoSignedUrl(a.url, 3600);
        setSignedUrls((prev) => ({ ...prev, [a.id]: url }));
      } catch {/* ignore */}
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anexos]);

  const isImage = (t: string | null) => !!t?.startsWith("image/");
  const isPdf = (t: string | null) => t === "application/pdf";

  const handleUpload = async (files: FileList) => {
    if (!despesaId) return;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: `${file.name} excede 10MB`, variant: "destructive" });
        continue;
      }
      try {
        await uploadAnexo.mutateAsync({ despesaId, file });
        toast({ title: `${file.name} anexado!` });
      } catch (err: any) {
        toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
      }
    }
  };

  const handleDelete = async (anexo: any) => {
    if (!await confirm({
      title: "Excluir anexo?",
      description: `O arquivo "${anexo.nome}" será removido permanentemente.`,
    })) return;
    try {
      await deleteAnexo.mutateAsync({ id: anexo.id, despesaId: anexo.despesa_id, url: anexo.url });
      toast({ title: "Anexo removido" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleOpen = async (anexo: any) => {
    try {
      const url = signedUrls[anexo.id] || await getDespesaAnexoSignedUrl(anexo.url, 3600);
      if (isImage(anexo.tipo_arquivo)) {
        const imgs = (anexos || []).filter((x: any) => isImage(x.tipo_arquivo));
        const items = await Promise.all(imgs.map(async (x: any) => ({
          id: x.id,
          url: signedUrls[x.id] || await getDespesaAnexoSignedUrl(x.url, 3600),
          tipo: "foto" as const,
          descricao: x.nome,
        })));
        setLightboxItems(items);
        setLightboxIndex(Math.max(0, imgs.findIndex((x: any) => x.id === anexo.id)));
        setLightboxOpen(true);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err: any) {
      toast({ title: "Erro ao abrir arquivo", description: err.message, variant: "destructive" });
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (tipo: string | null) => {
    if (tipo?.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-primary" />;
    return <FileText className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Anexos da Despesa</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Upload area */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors">
              <Paperclip className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Clique ou arraste arquivos</span>
              <span className="text-xs text-muted-foreground mt-1">Comprovantes, notas fiscais, etc. (máx. 10MB)</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </label>

            {/* Loading */}
            {uploadAnexo.isPending && (
              <p className="text-sm text-muted-foreground text-center">Enviando...</p>
            )}

            {/* File list */}
            {isLoading ? (
              <p className="text-sm text-muted-foreground text-center">Carregando anexos...</p>
            ) : !anexos?.length ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum anexo</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {anexos.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-3 p-2 rounded-md border bg-muted/20">
                    {isImage(a.tipo_arquivo) && signedUrls[a.id] ? (
                      <button
                        type="button"
                        onClick={() => handleOpen(a)}
                        className="h-10 w-10 rounded overflow-hidden border bg-muted shrink-0"
                        title="Visualizar"
                      >
                        <img src={signedUrls[a.id]} alt="" className="h-full w-full object-cover" />
                      </button>
                    ) : (
                      <div className="h-10 w-10 rounded border bg-muted/50 flex items-center justify-center shrink-0">
                        {getFileIcon(a.tipo_arquivo)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">{formatSize(a.tamanho)}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => handleOpen(a)}
                        title={isImage(a.tipo_arquivo) ? "Visualizar" : "Abrir em nova aba"}
                      >
                        {isImage(a.tipo_arquivo) ? <Eye className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadAnexo(a.url, a.nome)} title="Baixar">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(a)} title="Excluir">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <MediaLightbox
        items={lightboxItems}
        startIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

export default DespesasTab;
