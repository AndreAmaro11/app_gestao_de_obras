import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useDespesas, useCreateDespesa, useDeleteDespesa } from "@/hooks/useDespesas";
import { useEtapas } from "@/hooks/useEtapas";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useToast } from "@/hooks/use-toast";

const categoriaLabel: Record<string, string> = { material: "Material", mao_de_obra: "Mão de Obra", servico: "Serviço" };

interface Props { obraId: string; }

const DespesasTab = ({ obraId }: Props) => {
  const { data: despesas, isLoading } = useDespesas(obraId);
  const { data: etapas } = useEtapas(obraId);
  const { data: fornecedores } = useFornecedores();
  const createDespesa = useCreateDespesa();
  const deleteDespesa = useDeleteDespesa();
  const { toast } = useToast();

  const [filtroEtapa, setFiltroEtapa] = useState("todas");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [showAdd, setShowAdd] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [etapaId, setEtapaId] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [categoria, setCategoria] = useState("material");
  const [valorPrev, setValorPrev] = useState("");
  const [valorReal, setValorReal] = useState("");
  const [data, setData] = useState("");

  const filtered = despesas?.filter((d) => {
    if (filtroEtapa !== "todas" && d.etapa_id !== filtroEtapa) return false;
    if (filtroCategoria !== "todas" && d.categoria !== filtroCategoria) return false;
    return true;
  }) || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDespesa.mutateAsync({
        obra_id: obraId, descricao, etapa_id: etapaId || null, fornecedor_id: fornecedorId || null,
        categoria: categoria as any, valor_previsto: Number(valorPrev), valor_real: Number(valorReal || 0),
        data: data || new Date().toISOString().split("T")[0],
      });
      setShowAdd(false); setDescricao(""); setEtapaId(""); setFornecedorId(""); setCategoria("material"); setValorPrev(""); setValorReal(""); setData("");
    } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Despesas</h2>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Nova Despesa</Button>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Despesa</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2"><Label>Descrição</Label><Input value={descricao} onChange={e => setDescricao(e.target.value)} required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Etapa</Label>
                <Select value={etapaId} onValueChange={setEtapaId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{etapas?.map(et => <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={fornecedorId} onValueChange={setFornecedorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{fornecedores?.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
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
              <div className="space-y-2"><Label>Valor Previsto</Label><Input type="number" step="0.01" value={valorPrev} onChange={e => setValorPrev(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Valor Real</Label><Input type="number" step="0.01" value={valorReal} onChange={e => setValorReal(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Data</Label><Input type="date" value={data} onChange={e => setData(e.target.value)} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancelar</Button><Button type="submit">Criar</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex gap-3">
        <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as etapas</SelectItem>
            {etapas?.map(et => <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            <SelectItem value="material">Material</SelectItem>
            <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
            <SelectItem value="servico">Serviço</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Data</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead className="w-28">Categoria</TableHead>
              <TableHead className="w-28">Previsto</TableHead>
              <TableHead className="w-28">Real</TableHead>
              <TableHead className="w-20">Pago</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : !filtered.length ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma despesa</TableCell></TableRow>
            ) : (
              filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>{new Date(d.data).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{(d.etapas as any)?.nome || "—"}</TableCell>
                  <TableCell className="font-medium">{(d.fornecedores as any)?.nome || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{categoriaLabel[d.categoria]}</Badge></TableCell>
                  <TableCell>R$ {d.valor_previsto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className={d.valor_real > d.valor_previsto ? "text-destructive font-medium" : ""}>
                    {d.valor_real > 0 ? `R$ ${d.valor_real.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.pago ? "default" : "outline"} className={d.pago ? "bg-success text-success-foreground" : ""}>{d.pago ? "Sim" : "Não"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteDespesa.mutate({ id: d.id, obra_id: obraId })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DespesasTab;
