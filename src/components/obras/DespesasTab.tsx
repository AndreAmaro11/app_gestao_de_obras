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
import { useFornecedores, useCreateFornecedor } from "@/hooks/useFornecedores";
import { useToast } from "@/hooks/use-toast";
import { DataToolbar, SortableHeader, useSort, useSearch } from "@/components/DataToolbar";
import { Textarea } from "@/components/ui/textarea";

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

      <Dialog open={showNewFornecedor} onOpenChange={setShowNewFornecedor}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Cadastrar Fornecedor</DialogTitle></DialogHeader>
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
          }} className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Razão Social *</Label><Input value={newForn.nome} onChange={e => setNewForn({ ...newForn, nome: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Nome Fantasia</Label><Input value={newForn.nome_fantasia} onChange={e => setNewForn({ ...newForn, nome_fantasia: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Telefone</Label><Input value={newForn.telefone} onChange={e => setNewForn({ ...newForn, telefone: e.target.value })} /></div>
              <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={newForn.email} onChange={e => setNewForn({ ...newForn, email: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Endereço</Label><Input value={newForn.endereco} onChange={e => setNewForn({ ...newForn, endereco: e.target.value })} /></div>
            <div className="space-y-2"><Label>Observação</Label><Textarea value={newForn.observacao} onChange={e => setNewForn({ ...newForn, observacao: e.target.value })} rows={2} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNewFornecedor(false)}>Cancelar</Button>
              <Button type="submit">Criar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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

      <div className="bg-card rounded-md border overflow-x-auto">
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
                      onDelete={() => deleteDespesa.mutate({ id: d.id, obra_id: obraId })}
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

const ExpandableRow = ({ d, children, canExpand, hasChildren, isExpanded, onToggleExpand, onTogglePago, onEdit, onDelete }: {
  d: any; children: any[]; canExpand: boolean; hasChildren: boolean; isExpanded: boolean;
  onToggleExpand: () => void; onTogglePago: (d: any) => void; onEdit: (d: any) => void; onDelete: () => void;
}) => {
  // Generate virtual parcelas if parent has parcelas > 1 but no children yet
  const virtualParcelas = !hasChildren && d.parcelas > 1 ? Array.from({ length: d.parcelas }, (_, i) => {
    const valorParcela = Math.round(d.valor_real / d.parcelas * 100) / 100;
    const valorPrevParcela = Math.round(d.valor_previsto / d.parcelas * 100) / 100;
    const baseDate = d.data_vencimento ? new Date(d.data_vencimento + "T12:00:00") : null;
    const vencimento = baseDate ? new Date(baseDate) : null;
    if (vencimento) vencimento.setMonth(vencimento.getMonth() + i);
    return {
      id: `virtual-${d.id}-${i}`,
      parcela_numero: i + 1,
      descricao: `${d.descricao} (${i + 1}/${d.parcelas})`,
      data: d.data,
      valor_previsto: valorPrevParcela,
      valor_real: valorParcela,
      data_vencimento: vencimento ? vencimento.toISOString().split("T")[0] : null,
      pago: false,
      virtual: true,
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
        <TableCell className="whitespace-nowrap">{new Date(d.data).toLocaleDateString("pt-BR")}</TableCell>
        <TableCell className="font-medium">{d.descricao}</TableCell>
        <TableCell>{d.etapas?.nome || "—"}</TableCell>
        <TableCell>{d.fornecedores?.nome || "—"}</TableCell>
        <TableCell><Badge variant="outline" className="text-xs whitespace-nowrap">{categoriaLabel[d.categoria]}</Badge></TableCell>
        <TableCell className="whitespace-nowrap">R$ {fmt(d.valor_previsto)}</TableCell>
        <TableCell className={`whitespace-nowrap ${d.valor_real > d.valor_previsto ? "text-destructive font-medium" : ""}`}>
          {d.valor_real > 0 ? `R$ ${fmt(d.valor_real)}` : "—"}
        </TableCell>
        <TableCell className="whitespace-nowrap">{d.data_vencimento ? new Date(d.data_vencimento).toLocaleDateString("pt-BR") : "—"}</TableCell>
        <TableCell className="text-center font-mono">
          {canExpand ? <Badge variant="secondary" className="text-xs cursor-pointer" onClick={onToggleExpand}>{d.parcelas || children.length}x</Badge> : (d.parcelas || 1)}
        </TableCell>
        <TableCell>
          <Switch checked={d.pago} onCheckedChange={() => onTogglePago(d)} />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
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
          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">{new Date(c.data).toLocaleDateString("pt-BR")}</TableCell>
          <TableCell className="text-sm pl-6">{c.descricao}</TableCell>
          <TableCell className="text-sm">{c.etapas?.nome || "—"}</TableCell>
          <TableCell className="text-sm">{c.fornecedores?.nome || "—"}</TableCell>
          <TableCell></TableCell>
          <TableCell className="text-sm whitespace-nowrap">R$ {fmt(c.valor_previsto)}</TableCell>
          <TableCell className="text-sm whitespace-nowrap">R$ {fmt(c.valor_real)}</TableCell>
          <TableCell className="text-sm whitespace-nowrap">{c.data_vencimento ? new Date(c.data_vencimento).toLocaleDateString("pt-BR") : "—"}</TableCell>
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

export default DespesasTab;
