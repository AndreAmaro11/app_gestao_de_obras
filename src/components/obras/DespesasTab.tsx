import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

const mockDespesas = [
  { id: "1", data: "2024-03-15", etapa: "Fundação", fornecedor: "Concreteira ABC", categoria: "material", valor_previsto: 17100, valor_real: 16425, pago: true },
  { id: "2", data: "2024-03-20", etapa: "Fundação", fornecedor: "Ferro & Aço Ltda", categoria: "material", valor_previsto: 18200, valor_real: 19500, pago: true },
  { id: "3", data: "2024-04-01", etapa: "Fundação", fornecedor: "João Pedreiro ME", categoria: "mao_de_obra", valor_previsto: 8000, valor_real: 8000, pago: false },
  { id: "4", data: "2024-05-10", etapa: "Estrutura", fornecedor: "Madeireira Central", categoria: "material", valor_previsto: 27200, valor_real: 0, pago: false },
  { id: "5", data: "2024-05-15", etapa: "Estrutura", fornecedor: "Carlos Engenharia", categoria: "servico", valor_previsto: 15000, valor_real: 0, pago: false },
];

const categoriaLabel: Record<string, string> = { material: "Material", mao_de_obra: "Mão de Obra", servico: "Serviço" };

const DespesasTab = () => {
  const [filtroEtapa, setFiltroEtapa] = useState("todas");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");

  const filtered = mockDespesas.filter((d) => {
    if (filtroEtapa !== "todas" && d.etapa !== filtroEtapa) return false;
    if (filtroCategoria !== "todas" && d.categoria !== filtroCategoria) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Despesas</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Despesa</Button>
      </div>

      <div className="flex gap-3">
        <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as etapas</SelectItem>
            <SelectItem value="Fundação">Fundação</SelectItem>
            <SelectItem value="Estrutura">Estrutura</SelectItem>
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
            {filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{new Date(d.data).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>{d.etapa}</TableCell>
                <TableCell className="font-medium">{d.fornecedor}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{categoriaLabel[d.categoria]}</Badge>
                </TableCell>
                <TableCell>R$ {d.valor_previsto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className={d.valor_real > d.valor_previsto ? "text-destructive font-medium" : ""}>
                  {d.valor_real > 0 ? `R$ ${d.valor_real.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={d.pago ? "default" : "outline"} className={d.pago ? "bg-success text-success-foreground" : ""}>
                    {d.pago ? "Sim" : "Não"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DespesasTab;
