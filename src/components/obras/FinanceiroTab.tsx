import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { useDespesas } from "@/hooks/useDespesas";
import { useEtapas } from "@/hooks/useEtapas";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

interface Props { obraId: string; }

const FinanceiroTab = ({ obraId }: Props) => {
  const { data: despesas, isLoading: loadingDespesas } = useDespesas(obraId);
  const { data: etapas, isLoading: loadingEtapas } = useEtapas(obraId);

  if (loadingDespesas || loadingEtapas) return <div className="text-center text-muted-foreground py-8">Carregando...</div>;

  // Group despesas by etapa
  const byEtapa = new Map<string, { nome: string; previsto: number; realizado: number }>();
  
  etapas?.forEach(et => {
    byEtapa.set(et.id, { nome: et.nome, previsto: 0, realizado: 0 });
  });

  // "Sem etapa" bucket
  let semEtapaPrev = 0, semEtapaReal = 0;

  despesas?.forEach(d => {
    if (d.etapa_id && byEtapa.has(d.etapa_id)) {
      const entry = byEtapa.get(d.etapa_id)!;
      entry.previsto += d.valor_previsto;
      entry.realizado += d.valor_real;
    } else {
      semEtapaPrev += d.valor_previsto;
      semEtapaReal += d.valor_real;
    }
  });

  const rows = Array.from(byEtapa.values());
  if (semEtapaPrev > 0 || semEtapaReal > 0) {
    rows.push({ nome: "Sem etapa", previsto: semEtapaPrev, realizado: semEtapaReal });
  }

  const totalPrevisto = rows.reduce((s, r) => s + r.previsto, 0);
  const totalRealizado = rows.reduce((s, r) => s + r.realizado, 0);
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
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma despesa registrada</TableCell></TableRow>
            ) : (
              rows.map((row) => {
                const diff = row.previsto - row.realizado;
                const pct = row.previsto > 0 ? Math.round((row.realizado / row.previsto) * 100) : 0;
                return (
                  <TableRow key={row.nome}>
                    <TableCell className="font-medium">{row.nome}</TableCell>
                    <TableCell>{fmt(row.previsto)}</TableCell>
                    <TableCell>{row.realizado > 0 ? fmt(row.realizado) : "—"}</TableCell>
                    <TableCell className={diff < 0 ? "text-destructive font-medium" : ""}>
                      {row.realizado > 0 ? fmt(diff) : "—"}
                    </TableCell>
                    <TableCell><span className="font-mono text-sm">{pct}%</span></TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
          {rows.length > 0 && (
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
          )}
        </Table>
      </div>
    </div>
  );
};

export default FinanceiroTab;
