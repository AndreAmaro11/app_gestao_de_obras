import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useReceitas, useCreateReceita, useUpdateReceita, useDeleteReceita, type Receita } from "@/hooks/useReceitas";
import { useToast } from "@/hooks/use-toast";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const tipoLabel: Record<string, string> = {
  pagamento_cliente: "Pagamento Cliente",
  financiamento: "Financiamento",
  aporte: "Aporte",
  outros: "Outros",
};

interface Props { obraId: string; }

const ReceitasTab = ({ obraId }: Props) => {
  const { data: receitas, isLoading } = useReceitas(obraId);
  const createReceita = useCreateReceita();
  const updateReceita = useUpdateReceita();
  const deleteReceita = useDeleteReceita();
  const { toast } = useToast();

  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Receita | null>(null);

  // Form state
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("pagamento_cliente");
  const [valor, setValor] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [recorrente, setRecorrente] = useState(false);
  const [mesesRepeticao, setMesesRepeticao] = useState("1");
  const [observacao, setObservacao] = useState("");

  const resetForm = () => {
    setDescricao(""); setTipo("pagamento_cliente"); setValor(""); setDataInicio("");
    setRecorrente(false); setMesesRepeticao("1"); setObservacao(""); setEditing(null);
  };

  const openEdit = (r: Receita) => {
    setEditing(r);
    setDescricao(r.descricao);
    setTipo(r.tipo);
    setValor(String(r.valor));
    setDataInicio(r.data_inicio);
    setRecorrente(r.recorrente);
    setMesesRepeticao(String(r.meses_repeticao));
    setObservacao(r.observacao || "");
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      obra_id: obraId,
      descricao,
      tipo,
      valor: Number(valor),
      data_inicio: dataInicio,
      recorrente,
      meses_repeticao: recorrente ? Number(mesesRepeticao) : 1,
      observacao: observacao || null,
    };
    try {
      if (editing) {
        await updateReceita.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createReceita.mutateAsync(payload);
      }
      setShowDialog(false); resetForm();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReceita.mutateAsync({ id, obra_id: obraId });
      toast({ title: "Receita excluída" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const totalMensal = (receitas || []).reduce((s, r) => s + r.valor, 0);
  const totalProjetado = (receitas || []).reduce((s, r) => s + r.valor * (r.recorrente ? r.meses_repeticao : 1), 0);

  if (isLoading) return <div className="text-center text-muted-foreground py-8">Carregando...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Receitas</h2>
        <Button size="sm" onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1" />Nova Receita
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border rounded-md p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Mensal (entradas únicas)</p>
          <p className="text-xl font-bold mt-1 text-success">{fmt(totalMensal)}</p>
        </div>
        <div className="bg-card border rounded-md p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Projetado</p>
          <p className="text-xl font-bold mt-1">{fmt(totalProjetado)}</p>
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={(v) => { setShowDialog(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Receita" : "Nova Receita"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={descricao} onChange={e => setDescricao(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoLabel).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} required />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={recorrente} onCheckedChange={setRecorrente} />
              <Label>Recorrente</Label>
            </div>
            {recorrente && (
              <div className="space-y-2">
                <Label>Repetir por quantos meses?</Label>
                <Input type="number" min="1" value={mesesRepeticao} onChange={e => setMesesRepeticao(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Observação</Label>
              <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} rows={2} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowDialog(false); resetForm(); }}>Cancelar</Button>
              <Button type="submit">{editing ? "Salvar" : "Criar"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-36">Tipo</TableHead>
              <TableHead className="w-32">Valor</TableHead>
              <TableHead className="w-32">Data Início</TableHead>
              <TableHead className="w-28">Recorrente</TableHead>
              <TableHead className="w-24">Meses</TableHead>
              <TableHead className="w-32">Total Projetado</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!receitas?.length ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma receita cadastrada</TableCell></TableRow>
            ) : receitas.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.descricao}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs whitespace-nowrap">{tipoLabel[r.tipo] || r.tipo}</Badge></TableCell>
                <TableCell className="font-mono whitespace-nowrap">{fmt(r.valor)}</TableCell>
                <TableCell className="whitespace-nowrap">{new Date(r.data_inicio + "T12:00:00").toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>{r.recorrente ? "Sim" : "Não"}</TableCell>
                <TableCell className="font-mono text-center">{r.recorrente ? r.meses_repeticao : "—"}</TableCell>
                <TableCell className="font-mono whitespace-nowrap font-semibold">{fmt(r.valor * (r.recorrente ? r.meses_repeticao : 1))}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {receitas && receitas.length > 0 && (
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell colSpan={2}>Total</TableCell>
                <TableCell className="font-mono whitespace-nowrap">{fmt(totalMensal)}</TableCell>
                <TableCell colSpan={3} />
                <TableCell className="font-mono whitespace-nowrap">{fmt(totalProjetado)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
};

export default ReceitasTab;
