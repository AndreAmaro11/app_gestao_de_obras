import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDespesas } from "@/hooks/useDespesas";
import { useEtapas } from "@/hooks/useEtapas";
import { ChevronDown, ChevronRight } from "lucide-react";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

interface Props { obraId: string; }

const FinanceiroTab = ({ obraId }: Props) => {
  const { data: despesas, isLoading: loadingDespesas } = useDespesas(obraId);
  const { data: etapas, isLoading: loadingEtapas } = useEtapas(obraId);
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  const [showFluxo, setShowFluxo] = useState(true);
  const [showMatrix, setShowMatrix] = useState(true);

  if (loadingDespesas || loadingEtapas) return <div className="text-center text-muted-foreground py-8">Carregando...</div>;

  // Summary by etapa
  const byEtapa = new Map<string, { nome: string; previsto: number; realizado: number }>();
  etapas?.forEach(et => byEtapa.set(et.id, { nome: et.nome, previsto: 0, realizado: 0 }));
  let semEtapaPrev = 0, semEtapaReal = 0;

  const parentDespesas = (despesas || []).filter((d: any) => !d.despesa_pai_id);
  const childDespesas = (despesas || []).filter((d: any) => !!d.despesa_pai_id);

  parentDespesas.forEach((d: any) => {
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
  if (semEtapaPrev > 0 || semEtapaReal > 0) rows.push({ nome: "Sem etapa", previsto: semEtapaPrev, realizado: semEtapaReal });
  const totalPrevisto = rows.reduce((s, r) => s + r.previsto, 0);
  const totalRealizado = rows.reduce((s, r) => s + r.realizado, 0);
  const saldo = totalPrevisto - totalRealizado;

  // Fluxo de Caixa
  const singleDespesasWithVenc = parentDespesas.filter((d: any) => d.data_vencimento && childDespesas.filter((c: any) => c.despesa_pai_id === d.id).length === 0 && (!d.parcelas || d.parcelas <= 1));
  
  const virtualParcelas: any[] = [];
  parentDespesas.forEach((d: any) => {
    if (d.data_vencimento && d.parcelas > 1 && childDespesas.filter((c: any) => c.despesa_pai_id === d.id).length === 0) {
      const baseDate = new Date(d.data_vencimento + "T12:00:00");
      const valorParcela = Math.round((d.valor_real || d.valor_previsto) / d.parcelas * 100) / 100;
      for (let i = 0; i < d.parcelas; i++) {
        const vencimento = new Date(baseDate);
        vencimento.setMonth(vencimento.getMonth() + i);
        virtualParcelas.push({
          ...d,
          id: `${d.id}_virtual_${i}`,
          descricao: `${d.descricao} (${i + 1}/${d.parcelas})`,
          data_vencimento: vencimento.toISOString().split("T")[0],
          valor_real: valorParcela,
          valor_previsto: Math.round((d.valor_previsto) / d.parcelas * 100) / 100,
          parcela_numero: i + 1,
        });
      }
    }
  });
  
  const fluxoCaixa = [...singleDespesasWithVenc, ...childDespesas.filter((d: any) => d.data_vencimento), ...virtualParcelas]
    .sort((a: any, b: any) => a.data_vencimento.localeCompare(b.data_vencimento));

  // Matrix
  const allWithVenc = fluxoCaixa;
  const months = new Set<string>();
  allWithVenc.forEach((d: any) => {
    const date = new Date(d.data_vencimento);
    months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  });
  const sortedMonths = Array.from(months).sort();

  type MatrixRow = { label: string; level: number; values: Record<string, number>; total: number };
  const matrixRows: MatrixRow[] = [];

  const etapaMap = new Map<string, string>();
  etapas?.forEach(et => etapaMap.set(et.id, et.nome));

  const byEtapaId = new Map<string, any[]>();
  allWithVenc.forEach((d: any) => {
    const key = d.etapa_id || "__sem__";
    if (!byEtapaId.has(key)) byEtapaId.set(key, []);
    byEtapaId.get(key)!.push(d);
  });

  const toggleEtapa = (id: string) => {
    const next = new Set(expandedEtapas);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedEtapas(next);
  };

  byEtapaId.forEach((items, etapaId) => {
    const etapaNome = etapaId === "__sem__" ? "Sem etapa" : (etapaMap.get(etapaId) || "Etapa desconhecida");
    const etapaValues: Record<string, number> = {};
    let etapaTotal = 0;
    items.forEach((d: any) => {
      const m = `${new Date(d.data_vencimento).getFullYear()}-${String(new Date(d.data_vencimento).getMonth() + 1).padStart(2, "0")}`;
      etapaValues[m] = (etapaValues[m] || 0) + (d.valor_real || d.valor_previsto);
      etapaTotal += (d.valor_real || d.valor_previsto);
    });
    matrixRows.push({ label: etapaNome, level: 0, values: etapaValues, total: etapaTotal });

    if (expandedEtapas.has(etapaId)) {
      const byForn = new Map<string, any[]>();
      items.forEach((d: any) => {
        const key = d.fornecedor_id || "__sem__";
        if (!byForn.has(key)) byForn.set(key, []);
        byForn.get(key)!.push(d);
      });
      byForn.forEach((fitems, fornId) => {
        const fornNome = fornId === "__sem__" ? "Sem fornecedor" : (fitems[0]?.fornecedores?.nome || "Fornecedor");
        const fornValues: Record<string, number> = {};
        let fornTotal = 0;
        fitems.forEach((d: any) => {
          const m = `${new Date(d.data_vencimento).getFullYear()}-${String(new Date(d.data_vencimento).getMonth() + 1).padStart(2, "0")}`;
          fornValues[m] = (fornValues[m] || 0) + (d.valor_real || d.valor_previsto);
          fornTotal += (d.valor_real || d.valor_previsto);
        });
        matrixRows.push({ label: fornNome, level: 1, values: fornValues, total: fornTotal });
      });
    }
  });

  const monthTotals: Record<string, number> = {};
  allWithVenc.forEach((d: any) => {
    const m = `${new Date(d.data_vencimento).getFullYear()}-${String(new Date(d.data_vencimento).getMonth() + 1).padStart(2, "0")}`;
    monthTotals[m] = (monthTotals[m] || 0) + (d.valor_real || d.valor_previsto);
  });
  const grandTotal = Object.values(monthTotals).reduce((s, v) => s + v, 0);

  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${monthNames[parseInt(mo) - 1]}/${y}`;
  };

  return (
    <div className="space-y-6">
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

      {/* Resumo por etapa */}
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
            ) : rows.map((row) => {
              const diff = row.previsto - row.realizado;
              const pct = row.previsto > 0 ? Math.round((row.realizado / row.previsto) * 100) : 0;
              return (
                <TableRow key={row.nome}>
                  <TableCell className="font-medium">{row.nome}</TableCell>
                  <TableCell>{fmt(row.previsto)}</TableCell>
                  <TableCell>{row.realizado > 0 ? fmt(row.realizado) : "—"}</TableCell>
                  <TableCell className={diff < 0 ? "text-destructive font-medium" : ""}>{row.realizado > 0 ? fmt(diff) : "—"}</TableCell>
                  <TableCell><span className="font-mono text-sm">{pct}%</span></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell>Total</TableCell>
                <TableCell>{fmt(totalPrevisto)}</TableCell>
                <TableCell>{fmt(totalRealizado)}</TableCell>
                <TableCell className={saldo < 0 ? "text-destructive" : ""}>{fmt(saldo)}</TableCell>
                <TableCell><span className="font-mono">{totalPrevisto > 0 ? Math.round((totalRealizado / totalPrevisto) * 100) : 0}%</span></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Relatório Matricial - FIRST */}
      <Collapsible open={showMatrix} onOpenChange={setShowMatrix}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
              {showMatrix ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <h3 className="text-md font-semibold">Relatório Matricial de Fluxo de Caixa</h3>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-3">
          {sortedMonths.length > 0 ? (
            <div className="bg-card rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px] sticky left-0 bg-card z-10">Etapa / Fornecedor</TableHead>
                    {sortedMonths.map(m => (
                      <TableHead key={m} className="w-28 text-center">{formatMonth(m)}</TableHead>
                    ))}
                    <TableHead className="w-32 text-center font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matrixRows.map((row, idx) => (
                    <TableRow key={idx} className={row.level === 0 ? "bg-muted/20 font-semibold" : ""}>
                      <TableCell className={`sticky left-0 bg-card z-10 ${row.level === 0 ? "bg-muted/20" : ""}`}>
                        <div className="flex items-center gap-1" style={{ paddingLeft: row.level * 20 }}>
                          {row.level === 0 && (
                            <button onClick={() => {
                              const etapaId = [...byEtapaId.keys()].find(k => {
                                const nome = k === "__sem__" ? "Sem etapa" : (etapaMap.get(k) || "Etapa desconhecida");
                                return nome === row.label;
                              });
                              if (etapaId) toggleEtapa(etapaId);
                            }} className="p-0.5 hover:bg-muted rounded">
                              {expandedEtapas.has([...byEtapaId.keys()].find(k => (k === "__sem__" ? "Sem etapa" : (etapaMap.get(k) || "")) === row.label) || "") 
                                ? <ChevronDown className="h-3.5 w-3.5" /> 
                                : <ChevronRight className="h-3.5 w-3.5" />}
                            </button>
                          )}
                          {row.label}
                        </div>
                      </TableCell>
                      {sortedMonths.map(m => (
                        <TableCell key={m} className="text-center font-mono text-sm">
                          {row.values[m] ? fmt(row.values[m]) : "—"}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-mono font-semibold">{fmt(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-bold">
                    <TableCell className="sticky left-0 bg-card z-10">Total Geral</TableCell>
                    {sortedMonths.map(m => (
                      <TableCell key={m} className="text-center font-mono">{monthTotals[m] ? fmt(monthTotals[m]) : "—"}</TableCell>
                    ))}
                    <TableCell className="text-center font-mono">{fmt(grandTotal)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma despesa com vencimento para exibir no relatório matricial.</p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Fluxo de Caixa - SECOND */}
      <Collapsible open={showFluxo} onOpenChange={setShowFluxo}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
              {showFluxo ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <h3 className="text-md font-semibold">Fluxo de Caixa (por vencimento)</h3>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-3">
          <div className="bg-card rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="w-28">Valor</TableHead>
                  <TableHead className="w-20">Parcela</TableHead>
                  <TableHead className="w-20">Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fluxoCaixa.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma despesa com vencimento</TableCell></TableRow>
                ) : fluxoCaixa.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell>{new Date(d.data_vencimento).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-medium">{d.descricao}</TableCell>
                    <TableCell>{d.fornecedores?.nome || "—"}</TableCell>
                    <TableCell>{fmt(d.valor_real || d.valor_previsto)}</TableCell>
                    <TableCell className="text-center font-mono">{d.parcela_numero ? `${d.parcela_numero}` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={d.pago ? "default" : "outline"} className={d.pago ? "bg-success text-success-foreground" : ""}>{d.pago ? "Sim" : "Não"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FinanceiroTab;
