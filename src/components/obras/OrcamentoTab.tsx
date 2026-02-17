import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { Plus, ArrowLeft, Check, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useOrcamentos, useCreateOrcamento, useOrcamentoItens, useCreateOrcamentoItem, useUpdateOrcamentoItem, useDeleteOrcamentoItem, useCotacoes, useCreateCotacao, useUpdateCotacao, useSelectCotacao, useAprovarOrcamento } from "@/hooks/useOrcamentos";
import { useEtapas } from "@/hooks/useEtapas";
import { useSubetapas } from "@/hooks/useSubetapas";
import { useFornecedores, useCreateFornecedor } from "@/hooks/useFornecedores";
import { useToast } from "@/hooks/use-toast";

interface Props { obraId: string; }

type View = "list" | "items" | "cotacoes";

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

const OrcamentoTab = ({ obraId }: Props) => {
  const { data: orcamentos, isLoading } = useOrcamentos(obraId);
  const createOrcamento = useCreateOrcamento();
  const aprovarOrcamento = useAprovarOrcamento();
  const { toast } = useToast();

  const [view, setView] = useState<View>("list");
  const [selectedOrcamentoId, setSelectedOrcamentoId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showNewOrc, setShowNewOrc] = useState(false);
  const [orcNome, setOrcNome] = useState("");

  const selectedOrcamento = orcamentos?.find(o => o.id === selectedOrcamentoId);

  const handleCreateOrc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrcamento.mutateAsync({ obra_id: obraId, nome: orcNome });
      setShowNewOrc(false); setOrcNome("");
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const handleAprovar = async () => {
    if (!selectedOrcamentoId) return;
    try {
      await aprovarOrcamento.mutateAsync({ orcamentoId: selectedOrcamentoId, obraId });
      toast({ title: "Orçamento aprovado! Despesas geradas automaticamente." });
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  if (view === "cotacoes" && selectedItemId) {
    return <CotacoesView itemId={selectedItemId} obraId={obraId} onBack={() => setView("items")} />;
  }

  if (view === "items" && selectedOrcamentoId) {
    return <ItensView orcamentoId={selectedOrcamentoId} obraId={obraId} orcNome={selectedOrcamento?.nome || ""} orcStatus={selectedOrcamento?.status || "rascunho"} onBack={() => setView("list")} onSelectItem={(id) => { setSelectedItemId(id); setView("cotacoes"); }} onAprovar={handleAprovar} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Orçamentos</h2>
        <Button size="sm" onClick={() => setShowNewOrc(true)}><Plus className="h-4 w-4 mr-1" />Novo Orçamento</Button>
      </div>
      <Dialog open={showNewOrc} onOpenChange={setShowNewOrc}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Orçamento</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateOrc} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={orcNome} onChange={e => setOrcNome(e.target.value)} required /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowNewOrc(false)}>Cancelar</Button><Button type="submit">Criar</Button></div>
          </form>
        </DialogContent>
      </Dialog>
      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead className="w-32">Status</TableHead><TableHead className="w-20">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : !orcamentos?.length ? (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum orçamento</TableCell></TableRow>
            ) : (
              orcamentos.map(orc => (
                <TableRow key={orc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedOrcamentoId(orc.id); setView("items"); }}>
                  <TableCell className="font-medium">{orc.nome}</TableCell>
                  <TableCell><StatusBadge status={orc.status} /></TableCell>
                  <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Items sub-view
const ItensView = ({ orcamentoId, obraId, orcNome, orcStatus, onBack, onSelectItem, onAprovar }: { orcamentoId: string; obraId: string; orcNome: string; orcStatus: string; onBack: () => void; onSelectItem: (id: string) => void; onAprovar: () => void }) => {
  const { data: itens, isLoading } = useOrcamentoItens(orcamentoId);
  const { data: etapas } = useEtapas(obraId);
  const createItem = useCreateOrcamentoItem();
  const updateItem = useUpdateOrcamentoItem();
  const deleteItem = useDeleteOrcamentoItem();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [descricao, setDescricao] = useState("");
  const [etapaId, setEtapaId] = useState("");
  const [subetapaId, setSubetapaId] = useState("");
  const [unidade, setUnidade] = useState("un");
  const [quantidade, setQuantidade] = useState("1");
  const [valorUnit, setValorUnit] = useState("0");

  const resetForm = () => { setDescricao(""); setEtapaId(""); setSubetapaId(""); setUnidade("un"); setQuantidade("1"); setValorUnit("0"); setEditingItem(null); };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setDescricao(item.descricao);
    setEtapaId(item.etapa_id || "");
    setSubetapaId(item.subetapa_id || "");
    setUnidade(item.unidade);
    setQuantidade(String(item.quantidade));
    setValorUnit(String(item.valor_estimado_unitario));
    setShowAdd(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const subId = subetapaId && subetapaId !== "__none__" ? subetapaId : null;
    try {
      if (editingItem) {
        await updateItem.mutateAsync({
          id: editingItem.id, orcamento_id: orcamentoId,
          descricao, etapa_id: etapaId || null, subetapa_id: subId,
          unidade, quantidade: Number(quantidade), valor_estimado_unitario: Number(valorUnit),
        });
      } else {
        await createItem.mutateAsync({
          orcamento_id: orcamentoId, descricao, etapa_id: etapaId || null,
          subetapa_id: subId, unidade, quantidade: Number(quantidade),
          valor_estimado_unitario: Number(valorUnit),
        } as any);
      }
      setShowAdd(false); resetForm();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
          <h2 className="text-lg font-semibold">Itens — {orcNome}</h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { resetForm(); setShowAdd(true); }}><Plus className="h-4 w-4 mr-1" />Novo Item</Button>
          {orcStatus !== "aprovado" && <Button size="sm" onClick={onAprovar}>Aprovar Orçamento</Button>}
        </div>
      </div>
      <Dialog open={showAdd} onOpenChange={(v) => { setShowAdd(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Descrição</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select value={etapaId} onValueChange={(v) => { setEtapaId(v); setSubetapaId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione (opcional)" /></SelectTrigger>
                  <SelectContent>{etapas?.map(et => <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <SubetapaSelect etapaId={etapaId || undefined} value={subetapaId} onChange={setSubetapaId} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Unidade</Label><Input value={unidade} onChange={e => setUnidade(e.target.value)} /></div>
              <div className="space-y-2"><Label>Qtde</Label><Input type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} /></div>
              <div className="space-y-2"><Label>Valor Unit. Est.</Label><Input type="number" step="0.01" value={valorUnit} onChange={e => setValorUnit(e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancelar</Button><Button type="submit">{editingItem ? "Salvar" : "Criar"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>Etapa</TableHead><TableHead>Descrição</TableHead><TableHead className="w-20">Unidade</TableHead><TableHead className="w-20">Qtde</TableHead><TableHead className="w-28">Estimado Unit.</TableHead><TableHead className="w-28">Total</TableHead><TableHead className="w-24 text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : !itens?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum item</TableCell></TableRow>
            ) : (
              itens.map(item => {
                const total = item.quantidade * item.valor_estimado_unitario;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="text-muted-foreground">{(item.etapas as any)?.nome || "—"}</TableCell>
                    <TableCell className="font-medium">{item.descricao}</TableCell>
                    <TableCell>{item.unidade}</TableCell>
                    <TableCell className="font-mono">{item.quantidade}</TableCell>
                    <TableCell>R$ {item.valor_estimado_unitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="font-semibold">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onSelectItem(item.id)}><ChevronRight className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteItem.mutate({ id: item.id, orcamento_id: orcamentoId })}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// Cotacoes sub-view with inline fornecedor creation
const CotacoesView = ({ itemId, obraId, onBack }: { itemId: string; obraId: string; onBack: () => void }) => {
  const { data: cotacoes, isLoading } = useCotacoes(itemId);
  const { data: fornecedores } = useFornecedores();
  const createCotacao = useCreateCotacao();
  const updateCotacao = useUpdateCotacao();
  const selectCotacao = useSelectCotacao();
  const createFornecedor = useCreateFornecedor();
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editingCot, setEditingCot] = useState<any>(null);
  const [fornecedorId, setFornecedorId] = useState("");
  const [valorUnit, setValorUnit] = useState("");
  const [prazo, setPrazo] = useState("");
  const [observacao, setObservacao] = useState("");

  // Inline fornecedor creation
  const [showNewFornecedor, setShowNewFornecedor] = useState(false);
  const [newFornNome, setNewFornNome] = useState("");
  const [newFornTipo, setNewFornTipo] = useState("misto");
  const [newFornTelefone, setNewFornTelefone] = useState("");

  const menorValor = cotacoes?.length ? Math.min(...cotacoes.map(c => c.valor_unitario)) : 0;

  const resetForm = () => { setFornecedorId(""); setValorUnit(""); setPrazo(""); setObservacao(""); setEditingCot(null); };

  const openEdit = (cot: any) => {
    setEditingCot(cot);
    setFornecedorId(cot.fornecedor_id || "");
    setValorUnit(String(cot.valor_unitario));
    setPrazo(cot.prazo_entrega || "");
    setObservacao(cot.observacao || "");
    setShowAdd(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCot) {
        await updateCotacao.mutateAsync({
          id: editingCot.id, orcamento_item_id: itemId,
          fornecedor_id: fornecedorId || null, valor_unitario: Number(valorUnit),
          prazo_entrega: prazo || null, observacao: observacao || null,
        });
      } else {
        await createCotacao.mutateAsync({
          orcamento_item_id: itemId, fornecedor_id: fornecedorId || null,
          valor_unitario: Number(valorUnit), prazo_entrega: prazo || null,
          observacao: observacao || null,
        } as any);
      }
      setShowAdd(false); resetForm();
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const handleSelect = async (id: string) => {
    try {
      await selectCotacao.mutateAsync({ id, orcamento_item_id: itemId });
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  const handleCreateFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createFornecedor.mutateAsync({
        nome: newFornNome,
        tipo: newFornTipo as any,
        telefone: newFornTelefone || null,
      });
      setFornecedorId(created.id);
      setShowNewFornecedor(false);
      setNewFornNome(""); setNewFornTipo("misto"); setNewFornTelefone("");
      toast({ title: "Fornecedor criado!" });
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" />Voltar</Button>
          <h2 className="text-lg font-semibold">Cotações</h2>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowAdd(true); }}><Plus className="h-4 w-4 mr-1" />Nova Cotação</Button>
      </div>

      {/* Dialog novo fornecedor inline */}
      <Dialog open={showNewFornecedor} onOpenChange={setShowNewFornecedor}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cadastro Rápido de Fornecedor</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateFornecedor} className="space-y-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={newFornNome} onChange={e => setNewFornNome(e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={newFornTipo} onValueChange={setNewFornTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                    <SelectItem value="misto">Misto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={newFornTelefone} onChange={e => setNewFornTelefone(e.target.value)} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNewFornecedor(false)}>Cancelar</Button>
              <Button type="submit">Criar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdd} onOpenChange={(v) => { setShowAdd(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCot ? "Editar Cotação" : "Nova Cotação"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Valor Unitário</Label><Input type="number" step="0.01" value={valorUnit} onChange={e => setValorUnit(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Prazo Entrega</Label><Input value={prazo} onChange={e => setPrazo(e.target.value)} placeholder="Ex: 3 dias" /></div>
            </div>
            <div className="space-y-2"><Label>Observação</Label><Input value={observacao} onChange={e => setObservacao(e.target.value)} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setShowAdd(false); resetForm(); }}>Cancelar</Button><Button type="submit">{editingCot ? "Salvar" : "Criar"}</Button></div>
          </form>
        </DialogContent>
      </Dialog>
      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader><TableRow><TableHead>Fornecedor</TableHead><TableHead className="w-28">Valor Unit.</TableHead><TableHead className="w-24">Prazo</TableHead><TableHead className="w-28">Diferença %</TableHead><TableHead className="w-28">Selecionado</TableHead><TableHead className="w-20 text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : !cotacoes?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma cotação</TableCell></TableRow>
            ) : (
              cotacoes.map(cot => {
                const diff = menorValor > 0 ? ((cot.valor_unitario - menorValor) / menorValor * 100).toFixed(1) : "0";
                const isMenor = cot.valor_unitario === menorValor;
                return (
                  <TableRow key={cot.id} className={isMenor ? "bg-success/5" : ""}>
                    <TableCell className="font-medium">{(cot.fornecedores as any)?.nome || "—"}</TableCell>
                    <TableCell className={isMenor ? "text-success font-semibold" : ""}>R$ {cot.valor_unitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{cot.prazo_entrega || "—"}</TableCell>
                    <TableCell>{isMenor ? "Menor" : `+${diff}%`}</TableCell>
                    <TableCell>
                      <Button variant={cot.selecionado ? "default" : "outline"} size="sm" className="h-7" onClick={() => handleSelect(cot.id)}>
                        {cot.selecionado && <Check className="h-3 w-3 mr-1" />}
                        {cot.selecionado ? "Selecionado" : "Selecionar"}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cot)}><Pencil className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrcamentoTab;
