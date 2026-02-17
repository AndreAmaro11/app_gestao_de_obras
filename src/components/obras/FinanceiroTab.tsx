import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";

const mockFinanceiro = [
  { etapa: "Fundação", previsto: 43300, realizado: 43925, percentual: 100 },
  { etapa: "Estrutura", previsto: 42200, realizado: 0, percentual: 0 },
  { etapa: "Alvenaria", previsto: 35000, realizado: 0, percentual: 0 },
  { etapa: "Instalações Elétricas", previsto: 28000, realizado: 0, percentual: 0 },
  { etapa: "Instalações Hidráulicas", previsto: 22000, realizado: 0, percentual: 0 },
  { etapa: "Acabamento", previsto: 95000, realizado: 0, percentual: 0 },
];

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const FinanceiroTab = () => {
  const totalPrevisto = mockFinanceiro.reduce((s, r) => s + r.previsto, 0);
  const totalRealizado = mockFinanceiro.reduce((s, r) => s + r.realizado, 0);
  const saldo = totalPrevisto - totalRealizado;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Financeiro</h2>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-md p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Previsto</p>
          <p className="text-xl font-bold mt-1">{fmt(totalPrevisto)}</p>
        </div>
        <div className="bg-card border rounded-md p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Realizado</p>
          <p className="text-xl font-bold mt-1">{fmt(totalRealizado)}</p>
        </div>
        <div className="bg-card border rounded-md p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo</p>
          <p className={`text-xl font-bold mt-1 ${saldo >= 0 ? "text-success" : "text-destructive"}`}>{fmt(saldo)}</p>
        </div>
      </div>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Etapa</TableHead>
              <TableHead className="w-32">Previsto</TableHead>
              <TableHead className="w-32">Realizado</TableHead>
              <TableHead className="w-32">Diferença</TableHead>
              <TableHead className="w-28">% Executado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockFinanceiro.map((row) => {
              const diff = row.previsto - row.realizado;
              return (
                <TableRow key={row.etapa}>
                  <TableCell className="font-medium">{row.etapa}</TableCell>
                  <TableCell>{fmt(row.previsto)}</TableCell>
                  <TableCell>{row.realizado > 0 ? fmt(row.realizado) : "—"}</TableCell>
                  <TableCell className={diff < 0 ? "text-destructive font-medium" : ""}>
                    {row.realizado > 0 ? fmt(diff) : "—"}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{row.percentual}%</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="font-semibold">
              <TableCell>Total</TableCell>
              <TableCell>{fmt(totalPrevisto)}</TableCell>
              <TableCell>{fmt(totalRealizado)}</TableCell>
              <TableCell className={saldo < 0 ? "text-destructive" : ""}>{fmt(saldo)}</TableCell>
              <TableCell>
                <span className="font-mono">{totalPrevisto > 0 ? Math.round((totalRealizado / totalPrevisto) * 100) : 0}%</span>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};

export default FinanceiroTab;
