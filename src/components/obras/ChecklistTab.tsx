import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2 } from "lucide-react";

const mockChecklist = [
  { id: "1", etapa: "Fundação", item: "Verificar nivelamento do terreno", concluido: true, observacao: "OK — Verificado em 05/03" },
  { id: "2", etapa: "Fundação", item: "Teste de compactação do solo", concluido: true, observacao: "" },
  { id: "3", etapa: "Fundação", item: "Conferir armação das sapatas", concluido: true, observacao: "Aprovado pelo engenheiro" },
  { id: "4", etapa: "Estrutura", item: "Verificar prumo dos pilares", concluido: false, observacao: "" },
  { id: "5", etapa: "Estrutura", item: "Conferir escoramento das lajes", concluido: false, observacao: "" },
  { id: "6", etapa: "Estrutura", item: "Teste de estanqueidade", concluido: false, observacao: "" },
];

const ChecklistTab = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Checklist</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Item</Button>
      </div>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Etapa</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="w-24 text-center">Concluído</TableHead>
              <TableHead>Observação</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockChecklist.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-muted-foreground">{item.etapa}</TableCell>
                <TableCell className={`font-medium ${item.concluido ? "line-through text-muted-foreground" : ""}`}>
                  {item.item}
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={item.concluido} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{item.observacao || "—"}</TableCell>
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

export default ChecklistTab;
