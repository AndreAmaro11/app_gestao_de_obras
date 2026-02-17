import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useDespesas, useCreateDespesa, useUpdateDespesa, useDeleteDespesa } from "@/hooks/useDespesas";
import { useEtapas } from "@/hooks/useEtapas";
import { useSubetapas } from "@/hooks/useSubetapas";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useToast } from "@/hooks/use-toast";
import { DataToolbar, SortableHeader, useSort, useSearch } from "@/components/DataToolbar";

const categoriaLabel: Record<string, string> = { material: "Material", mao_de_obra: "Mão de Obra", servico: "Serviço" };
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
  const { toast } = useToast();

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

  const resetForm = () => {
    setDescricao(""); setEtapaId(""); setSubetapaId(""); setFornecedorId("");
    setCategoria("material"); setValorPrev(""); setValorReal(""); setData("");
    setCondicaoPagamento(""); setDataVencimento(""); setParcelas("1");
    setEditing(null);
  };

  const openEdit = (d: any) => {
    setEditing(d); setDescricao(d.descricao); setEtapaId(d.etapa_id || "");
    setSubetapaId(d.subetapa_id || ""); setFornecedorId(d.fornecedor_id || "");
    setCategoria(d.categoria); setValorPrev(String(d.valor_previsto));
    setValorReal(String(d.valor_real)); setData(d.data);
    setCondicaoPagamento(d.condicao_pagamento || "");
    setDataVencimento(d.data_vencimento || ""); setParcelas(String(d.parcelas || 1));
    setShowDialog(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Filter: hide child parcelas from main list
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

  const handleTogglePago = async (d: any) => {
    try {
      await updateDespesa.mutateAsync({ id: d.id, obra_id: obraId, pago: !d.pago });
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      obra_id: obraId, descricao,
      etapa_id: etapaId || null,
      subetapa_id: subetapaId && subetapaId !== "__none__" ? subetapaId : null,
      fornecedor_id: fornecedorId || null,
      categoria: categoria as any,
      valor_previsto: Number(valorPrev),
      valor_real: Number(valorReal || 0),
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
      setShowDialog(false); resetForm();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Despesas</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowDialog(true); }}><Plus className="h-4 w-4 mr-1" />Nova Despesa</Button>
      </div>

      <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Editar Despesa" : "Nova Despesa"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Descrição</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select value={etapaId} onValueChange={(v) => { setEtapaId(v); setSubetapaId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{etapas?.map(et => <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <SubetapaSelect etapaId={etapaId || undefined} value={subetapaId} onChange={setSubetapaId} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={fornecedorId} onValueChange={setFornecedorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{fornecedores?.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Valor Previsto</Label><Input type="number" step="0.01" value={valorPrev} onChange={e => setValorPrev(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Valor Real</Label><Input type="number" step="0.01" value={valorReal} onChange={e => setValorReal(e.target.value)} /></div>
              <div className="space-y-2"><Label>Data</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
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
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancelar</Button><Button type="submit">{editing ? "Salvar" : "Criar"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>

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

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="w-24"><SortableHeader label="Data" field="data" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead><SortableHeader label="Descrição" field="descricao" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead><SortableHeader label="Etapa" field="etapas.nome" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead><SortableHeader label="Fornecedor" field="fornecedores.nome" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead className="w-28"><SortableHeader label="Categoria" field="categoria" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead className="w-28"><SortableHeader label="Previsto" field="valor_previsto" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead className="w-28"><SortableHeader label="Real" field="valor_real" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
              <TableHead className="w-24"><SortableHeader label="Vencimento" field="data_vencimento" currentField={sortField} currentDir={sortDir} onSort={toggleSort} /></TableHead>
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
            ) : (
              <>
                {sorted.map((d: any) => {
                  const children = getChildren(d.id);
                  const hasChildren = children.length > 0;
                  const isExpanded = expandedRows.has(d.id);
                  return (
                    <>
                      <TableRow key={d.id}>
                        <TableCell className="px-1">
                          {hasChildren ? (
                            <button onClick={() => toggleExpand(d.id)} className="p-0.5 hover:bg-muted rounded">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          ) : (d.parcelas && d.parcelas > 1) ? (
                            <button onClick={() => toggleExpand(d.id)} className="p-0.5 hover:bg-muted rounded opacity-50">
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          ) : null}
                        </TableCell>
                        <TableCell>{new Date(d.data).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="font-medium">{d.descricao}</TableCell>
                        <TableCell>{d.etapas?.nome || "—"}</TableCell>
                        <TableCell>{d.fornecedores?.nome || "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{categoriaLabel[d.categoria]}</Badge></TableCell>
                        <TableCell>R$ {fmt(d.valor_previsto)}</TableCell>
                        <TableCell className={d.valor_real > d.valor_previsto ? "text-destructive font-medium" : ""}>
                          {d.valor_real > 0 ? `R$ ${fmt(d.valor_real)}` : "—"}
                        </TableCell>
                        <TableCell>{d.data_vencimento ? new Date(d.data_vencimento).toLocaleDateString("pt-BR") : "—"}</TableCell>
                        <TableCell className="text-center font-mono">
                          {hasChildren ? <Badge variant="secondary" className="text-xs">{children.length}x</Badge> : (d.parcelas || 1)}
                        </TableCell>
                        <TableCell>
                          <Switch checked={d.pago} onCheckedChange={() => handleTogglePago(d)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDespesa.mutate({ id: d.id, obra_id: obraId })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && children.map((c: any) => (
                        <TableRow key={c.id} className="bg-muted/20">
                          <TableCell></TableCell>
                          <TableCell className="text-muted-foreground text-sm">{new Date(c.data).toLocaleDateString("pt-BR")}</TableCell>
                          <TableCell className="text-sm pl-6">{c.descricao}</TableCell>
                          <TableCell className="text-sm">{c.etapas?.nome || "—"}</TableCell>
                          <TableCell className="text-sm">{c.fornecedores?.nome || "—"}</TableCell>
                          <TableCell></TableCell>
                          <TableCell className="text-sm">R$ {fmt(c.valor_previsto)}</TableCell>
                          <TableCell className="text-sm">R$ {fmt(c.valor_real)}</TableCell>
                          <TableCell className="text-sm">{c.data_vencimento ? new Date(c.data_vencimento).toLocaleDateString("pt-BR") : "—"}</TableCell>
                          <TableCell className="text-center text-sm font-mono">{c.parcela_numero || "—"}</TableCell>
                          <TableCell>
                            <Switch checked={c.pago} onCheckedChange={() => handleTogglePago(c)} />
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                    </>
                  );
                })}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell />
                  <TableCell colSpan={5} className="text-right">Total</TableCell>
                  <TableCell>R$ {fmt(totalPrevisto)}</TableCell>
                  <TableCell>R$ {fmt(totalReal)}</TableCell>
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

export default DespesasTab;
