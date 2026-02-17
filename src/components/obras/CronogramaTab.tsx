import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { differenceInDays } from "date-fns";

const mockEtapas = [
  { id: "1", ordem: 1, nome: "Fundação", inicio_previsto: "2024-03-01", fim_previsto: "2024-04-15", percentual: 100, status: "concluida" as const },
  { id: "2", ordem: 2, nome: "Estrutura", inicio_previsto: "2024-04-16", fim_previsto: "2024-06-30", percentual: 75, status: "em_andamento" as const },
  { id: "3", ordem: 3, nome: "Alvenaria", inicio_previsto: "2024-07-01", fim_previsto: "2024-08-30", percentual: 0, status: "nao_iniciada" as const },
  { id: "4", ordem: 4, nome: "Instalações Elétricas", inicio_previsto: "2024-08-01", fim_previsto: "2024-09-15", percentual: 0, status: "nao_iniciada" as const },
  { id: "5", ordem: 5, nome: "Instalações Hidráulicas", inicio_previsto: "2024-08-15", fim_previsto: "2024-09-30", percentual: 0, status: "nao_iniciada" as const },
  { id: "6", ordem: 6, nome: "Acabamento", inicio_previsto: "2024-10-01", fim_previsto: "2024-12-15", percentual: 0, status: "nao_iniciada" as const },
];

const obraStart = new Date("2024-03-01");
const obraEnd = new Date("2024-12-15");
const totalDays = differenceInDays(obraEnd, obraStart);

const CronogramaTab = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Etapas</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Nova Etapa</Button>
      </div>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Ordem</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead className="w-28">Início Prev.</TableHead>
              <TableHead className="w-28">Fim Prev.</TableHead>
              <TableHead className="w-16">%</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockEtapas.map((etapa) => (
              <TableRow key={etapa.id}>
                <TableCell className="text-center font-mono">{etapa.ordem}</TableCell>
                <TableCell className="font-medium">{etapa.nome}</TableCell>
                <TableCell>{new Date(etapa.inicio_previsto).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>{new Date(etapa.fim_previsto).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{etapa.percentual}%</span>
                </TableCell>
                <TableCell><StatusBadge status={etapa.status} /></TableCell>
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

      {/* Gantt Simples */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Gantt</h3>
        <div className="bg-card rounded-md border p-4 space-y-2">
          {mockEtapas.map((etapa) => {
            const start = differenceInDays(new Date(etapa.inicio_previsto), obraStart);
            const duration = differenceInDays(new Date(etapa.fim_previsto), new Date(etapa.inicio_previsto));
            const leftPct = (start / totalDays) * 100;
            const widthPct = (duration / totalDays) * 100;

            return (
              <div key={etapa.id} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-40 truncate shrink-0">{etapa.nome}</span>
                <div className="flex-1 h-6 bg-muted rounded relative">
                  <div
                    className="absolute h-full rounded bg-primary/70 flex items-center justify-center"
                    style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 2)}%` }}
                  >
                    {widthPct > 8 && <span className="text-[10px] text-primary-foreground font-medium">{etapa.percentual}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CronogramaTab;
