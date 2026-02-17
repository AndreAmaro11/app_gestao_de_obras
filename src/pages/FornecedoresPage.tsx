import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { useFornecedores, useCreateFornecedor, useUpdateFornecedor, useDeleteFornecedor } from "@/hooks/useFornecedores";
import { useObras } from "@/hooks/useObras";
import { useEtapas } from "@/hooks/useEtapas";
import { useSubetapas } from "@/hooks/useSubetapas";
import { useToast } from "@/hooks/use-toast";

const tipoLabel: Record<string, string> = { material: "Material", mao_de_obra: "Mão de Obra", misto: "Misto" };

const TagsInput = ({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) => {
  const [input, setInput] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Tags</Label>
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs gap-1">
            {tag}
            <button type="button" onClick={() => onChange(value.filter(t => t !== tag))} className="ml-0.5 hover:text-destructive">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder="Digite e pressione Enter"
      />
    </div>
  );
};

const FornecedoresPage = () => {
  const { data: fornecedores, isLoading } = useFornecedores();
  const { data: obras } = useObras();
  const createFornecedor = useCreateFornecedor();
  const updateFornecedor = useUpdateFornecedor();
  const deleteFornecedor = useDeleteFornecedor();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [tipo, setTipo] = useState<string>("misto");
  const [tags, setTags] = useState<string[]>([]);
  const [obraId, setObraId] = useState<string>("");
  const [etapaId, setEtapaId] = useState<string>("");
  const [subetapaId, setSubetapaId] = useState<string>("");

  const { data: etapas } = useEtapas(obraId || undefined);
  const { data: subetapas } = useSubetapas(etapaId || undefined);

  const resetForm = () => {
    setNome(""); setCnpj(""); setTelefone(""); setEmail(""); setTipo("misto"); setTags([]);
    setObraId(""); setEtapaId(""); setSubetapaId(""); setEditing(null);
  };

  const openEdit = (f: any) => {
    setEditing(f);
    setNome(f.nome); setCnpj(f.cnpj || ""); setTelefone(f.telefone || ""); setEmail(f.email || ""); setTipo(f.tipo);
    setTags(f.tags || []);
    // Find the obra for the etapa to pre-fill selects
    if (f.etapa_id && f.etapas?.obra_id) {
      setObraId(f.etapas.obra_id);
      setEtapaId(f.etapa_id);
      setSubetapaId(f.subetapa_id || "");
    } else {
      setObraId(""); setEtapaId(""); setSubetapaId("");
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        nome,
        cnpj: cnpj || null,
        telefone: telefone || null,
        email: email || null,
        tipo: tipo as any,
        tags,
        etapa_id: etapaId || null,
        subetapa_id: subetapaId || null,
      };
      if (editing) {
        await updateFornecedor.mutateAsync({ id: editing.id, ...payload });
      } else {
        await createFornecedor.mutateAsync(payload);
      }
      toast({ title: editing ? "Fornecedor atualizado" : "Fornecedor criado" });
      setOpen(false); resetForm();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFornecedor.mutateAsync(id);
      toast({ title: "Fornecedor excluído" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Fornecedores</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" />Novo Fornecedor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Editar Fornecedor" : "Novo Fornecedor"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input value={cnpj} onChange={e => setCnpj(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
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
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={telefone} onChange={e => setTelefone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              {/* Associação a Obra > Etapa > Subetapa */}
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Associação (opcional)</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Obra</Label>
                    <Select value={obraId} onValueChange={(v) => { setObraId(v); setEtapaId(""); setSubetapaId(""); }}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {obras?.map(o => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Etapa</Label>
                    <Select value={etapaId} onValueChange={(v) => { setEtapaId(v); setSubetapaId(""); }} disabled={!obraId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {etapas?.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Subetapa</Label>
                    <Select value={subetapaId} onValueChange={setSubetapaId} disabled={!etapaId}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {subetapas?.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <TagsInput value={tags} onChange={setTags} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit">{editing ? "Salvar" : "Criar"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-36">CNPJ</TableHead>
              <TableHead className="w-32">Telefone</TableHead>
              <TableHead className="w-44">E-mail</TableHead>
              <TableHead className="w-28">Tipo</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
            ) : !fornecedores?.length ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum fornecedor cadastrado</TableCell></TableRow>
            ) : (
              fornecedores.map((f: any) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nome}</TableCell>
                  <TableCell className="text-sm">{f.cnpj || "—"}</TableCell>
                  <TableCell className="text-sm">{f.telefone || "—"}</TableCell>
                  <TableCell className="text-sm">{f.email || "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{tipoLabel[f.tipo]}</Badge></TableCell>
                  <TableCell className="text-sm">
                    {f.etapas?.nome || "—"}
                    {f.subetapas?.nome ? ` / ${f.subetapas.nome}` : ""}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(f.tags || []).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(f)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(f.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AppLayout>
  );
};

export default FornecedoresPage;