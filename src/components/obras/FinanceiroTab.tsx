import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDespesas } from "@/hooks/useDespesas";
import { useReceitas } from "@/hooks/useReceitas";
import { useEtapas } from "@/hooks/useEtapas";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import * as XLSX from "xlsx";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const categoriaLabel: Record<string, string> = {
  material: "Material", mao_de_obra: "Mão de Obra", servico: "Serviço",
  equipamento: "Equipamento", transporte: "Transporte", administrativo: "Administrativo",
  projeto: "Projeto", outros: "Outros",
};

interface Props { obraId: string; }

const FinanceiroTab = ({ obraId }: Props) => {
  const { data: despesas, isLoading: loadingDespesas } = useDespesas(obraId);
  const { data: receitas, isLoading: loadingReceitas } = useReceitas(obraId);
  const { data: etapas, isLoading: loadingEtapas } = useEtapas(obraId);
  const [expandedEtapas, setExpandedEtapas] = useState<Set<string>>(new Set());
  const [showFluxo, setShowFluxo] = useState(true);
  const [showMatrix, setShowMatrix] = useState(true);
  const [showEntradasSaidas, setShowEntradasSaidas] = useState(true);

  // Filters
  const [filtroAno, setFiltroAno] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos"); // Q1, Q2, Q3, Q4, S1, S2
  const [filtroPago, setFiltroPago] = useState("todos"); // todos, pago, nao_pago
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [filtroEtapa, setFiltroEtapa] = useState("todos");

  // Available years (must be before early return)
  const availableYears = useMemo(() => {
    if (!despesas) return [];
    const years = new Set<string>();
    despesas.forEach((d: any) => {
      if (d.data_vencimento) years.add(String(new Date(d.data_vencimento + "T12:00:00").getFullYear()));
      if (d.data) years.add(String(new Date(d.data + "T12:00:00").getFullYear()));
    });
    return Array.from(years).sort();
  }, [despesas]);

  if (loadingDespesas || loadingEtapas || loadingReceitas) return <div className="text-center text-muted-foreground py-8">Carregando...</div>;

  const parentDespesas = (despesas || []).filter((d: any) => !d.despesa_pai_id);
  const childDespesas = (despesas || []).filter((d: any) => !!d.despesa_pai_id);

  // Build fluxo data first (unfiltered) to extract available years
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

  const parentMap = new Map<string, any>();
  parentDespesas.forEach((d: any) => parentMap.set(d.id, d));
  const childDespesasWithEtapa = childDespesas
    .filter((d: any) => d.data_vencimento)
    .map((d: any) => {
      if (d.etapa_id) return d;
      const parent = d.despesa_pai_id ? parentMap.get(d.despesa_pai_id) : null;
      if (!parent) return d;
      return {
        ...d,
        etapa_id: d.etapa_id ?? parent.etapa_id ?? null,
        subetapa_id: d.subetapa_id ?? parent.subetapa_id ?? null,
        categoria: d.categoria ?? parent.categoria,
        fornecedor_id: d.fornecedor_id ?? parent.fornecedor_id,
      };
    });
  const allFluxoItems = [...singleDespesasWithVenc, ...childDespesasWithEtapa, ...virtualParcelas]
    .sort((a: any, b: any) => a.data_vencimento.localeCompare(b.data_vencimento));

  // Filter helper
  const matchesDateFilter = (dateStr: string | null) => {
    if (!dateStr) return filtroAno === "todos";
    const date = new Date(dateStr + "T12:00:00");
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (filtroAno !== "todos" && String(year) !== filtroAno) return false;
    if (filtroPeriodo !== "todos") {
      if (filtroPeriodo === "Q1" && (month < 1 || month > 3)) return false;
      if (filtroPeriodo === "Q2" && (month < 4 || month > 6)) return false;
      if (filtroPeriodo === "Q3" && (month < 7 || month > 9)) return false;
      if (filtroPeriodo === "Q4" && (month < 10 || month > 12)) return false;
      if (filtroPeriodo === "S1" && month > 6) return false;
      if (filtroPeriodo === "S2" && month <= 6) return false;
    }
    return true;
  };

  const matchesFilters = (d: any) => {
    if (filtroPago === "pago" && !d.pago) return false;
    if (filtroPago === "nao_pago" && d.pago) return false;
    if (filtroCategoria !== "todos" && d.categoria !== filtroCategoria) return false;
    if (filtroEtapa !== "todos" && d.etapa_id !== filtroEtapa) return false;
    return true;
  };

  // Filtered parent despesas for summary
  const filteredParents = parentDespesas.filter((d: any) => {
    if (!matchesDateFilter(d.data_vencimento || d.data)) return false;
    return matchesFilters(d);
  });

  // Summary by etapa
  const byEtapa = new Map<string, { nome: string; previsto: number; realizado: number }>();
  etapas?.forEach(et => byEtapa.set(et.id, { nome: et.nome, previsto: 0, realizado: 0 }));
  let semEtapaPrev = 0, semEtapaReal = 0;

  filteredParents.forEach((d: any) => {
    if (d.etapa_id && byEtapa.has(d.etapa_id)) {
      const entry = byEtapa.get(d.etapa_id)!;
      entry.previsto += d.valor_previsto;
      entry.realizado += d.valor_real;
    } else {
      semEtapaPrev += d.valor_previsto;
      semEtapaReal += d.valor_real;
    }
  });

  const rows = Array.from(byEtapa.values()).filter(r => r.previsto > 0 || r.realizado > 0);
  if (semEtapaPrev > 0 || semEtapaReal > 0) rows.push({ nome: "Sem etapa", previsto: semEtapaPrev, realizado: semEtapaReal });
  const totalPrevisto = rows.reduce((s, r) => s + r.previsto, 0);
  const totalRealizado = rows.reduce((s, r) => s + r.realizado, 0);
  const saldo = totalPrevisto - totalRealizado;

  // Filtered fluxo
  const fluxoCaixa = allFluxoItems.filter((d: any) => {
    if (!matchesDateFilter(d.data_vencimento)) return false;
    return matchesFilters(d);
  });

  // Matrix data
  const months = new Set<string>();
  fluxoCaixa.forEach((d: any) => {
    const date = new Date(d.data_vencimento + "T12:00:00");
    months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  });
  const sortedMonths = Array.from(months).sort();

  type MatrixRow = { label: string; level: number; values: Record<string, number>; total: number };
  const matrixRows: MatrixRow[] = [];

  const etapaMap = new Map<string, string>();
  etapas?.forEach(et => etapaMap.set(et.id, et.nome));

  const byEtapaId = new Map<string, any[]>();
  fluxoCaixa.forEach((d: any) => {
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
      const m = `${new Date(d.data_vencimento + "T12:00:00").getFullYear()}-${String(new Date(d.data_vencimento + "T12:00:00").getMonth() + 1).padStart(2, "0")}`;
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
          const m = `${new Date(d.data_vencimento + "T12:00:00").getFullYear()}-${String(new Date(d.data_vencimento + "T12:00:00").getMonth() + 1).padStart(2, "0")}`;
          fornValues[m] = (fornValues[m] || 0) + (d.valor_real || d.valor_previsto);
          fornTotal += (d.valor_real || d.valor_previsto);
        });
        matrixRows.push({ label: fornNome, level: 1, values: fornValues, total: fornTotal });
      });
    }
  });

  const monthTotals: Record<string, number> = {};
  fluxoCaixa.forEach((d: any) => {
    const m = `${new Date(d.data_vencimento + "T12:00:00").getFullYear()}-${String(new Date(d.data_vencimento + "T12:00:00").getMonth() + 1).padStart(2, "0")}`;
    monthTotals[m] = (monthTotals[m] || 0) + (d.valor_real || d.valor_previsto);
  });
  const grandTotal = Object.values(monthTotals).reduce((s, v) => s + v, 0);

  const formatMonth = (m: string) => {
    const [y, mo] = m.split("-");
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return `${monthNames[parseInt(mo) - 1]}/${y}`;
  };

  // Counts for filter badges
  const totalPago = fluxoCaixa.filter((d: any) => d.pago).length;
  const totalNaoPago = fluxoCaixa.filter((d: any) => !d.pago).length;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Financeiro</h2>

      {/* Filters - scroll horizontal no mobile */}
      <div className="flex gap-2 sm:flex-wrap sm:gap-3 items-center overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-1">
        <Select value={filtroAno} onValueChange={setFiltroAno}>
          <SelectTrigger className="w-28 sm:w-32 h-9 shrink-0"><SelectValue placeholder="Ano" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os anos</SelectItem>
            {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
          <SelectTrigger className="w-32 sm:w-36 h-9 shrink-0"><SelectValue placeholder="Período" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo período</SelectItem>
            <SelectItem value="S1">1º Semestre</SelectItem>
            <SelectItem value="S2">2º Semestre</SelectItem>
            <SelectItem value="Q1">1º Trimestre</SelectItem>
            <SelectItem value="Q2">2º Trimestre</SelectItem>
            <SelectItem value="Q3">3º Trimestre</SelectItem>
            <SelectItem value="Q4">4º Trimestre</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroPago} onValueChange={setFiltroPago}>
          <SelectTrigger className="w-32 sm:w-36 h-9 shrink-0"><SelectValue placeholder="Pagamento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pago">Pago ({totalPago})</SelectItem>
            <SelectItem value="nao_pago">Não pago ({totalNaoPago})</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-36 sm:w-40 h-9 shrink-0"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas categorias</SelectItem>
            {Object.entries(categoriaLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filtroEtapa} onValueChange={setFiltroEtapa}>
          <SelectTrigger className="w-36 sm:w-40 h-9 shrink-0"><SelectValue placeholder="Etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas etapas</SelectItem>
            {etapas?.map(et => <SelectItem key={et.id} value={et.id}>{et.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        {(filtroAno !== "todos" || filtroPeriodo !== "todos" || filtroPago !== "todos" || filtroCategoria !== "todos" || filtroEtapa !== "todos") && (
          <Button variant="ghost" size="sm" className="shrink-0" onClick={() => { setFiltroAno("todos"); setFiltroPeriodo("todos"); setFiltroPago("todos"); setFiltroCategoria("todos"); setFiltroEtapa("todos"); }}>
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-card border rounded-md p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Previsto</p>
          <p className="text-xl font-bold mt-1">{fmt(totalPrevisto)}</p>
        </div>
        <div className="bg-card border rounded-md p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Realizado</p>
          <p className="text-xl font-bold mt-1">{fmt(totalRealizado)}</p>
        </div>
        <div className="bg-card border rounded-md p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Receitas</p>
          <p className="text-xl font-bold mt-1 text-success">{fmt((receitas || []).reduce((s, r: any) => s + r.valor * (r.recorrente ? r.meses_repeticao : 1), 0))}</p>
        </div>
        <div className="bg-card border rounded-md p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo</p>
          <p className={`text-xl font-bold mt-1 ${saldo >= 0 ? "text-success" : "text-destructive"}`}>{fmt(saldo)}</p>
        </div>
      </div>

      {/* Resumo por etapa */}
      <div className="bg-card rounded-md border overflow-x-auto">
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
                  <TableCell className="whitespace-nowrap">{fmt(row.previsto)}</TableCell>
                  <TableCell className="whitespace-nowrap">{row.realizado > 0 ? fmt(row.realizado) : "—"}</TableCell>
                  <TableCell className={`whitespace-nowrap ${diff < 0 ? "text-destructive font-medium" : ""}`}>{row.realizado > 0 ? fmt(diff) : "—"}</TableCell>
                  <TableCell><span className="font-mono text-sm">{pct}%</span></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          {rows.length > 0 && (
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell>Total</TableCell>
                <TableCell className="whitespace-nowrap">{fmt(totalPrevisto)}</TableCell>
                <TableCell className="whitespace-nowrap">{fmt(totalRealizado)}</TableCell>
                <TableCell className={`whitespace-nowrap ${saldo < 0 ? "text-destructive" : ""}`}>{fmt(saldo)}</TableCell>
                <TableCell><span className="font-mono">{totalPrevisto > 0 ? Math.round((totalRealizado / totalPrevisto) * 100) : 0}%</span></TableCell>
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* Relatório Matricial */}
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
                      <TableHead key={m} className="w-28 text-center whitespace-nowrap">{formatMonth(m)}</TableHead>
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
                        <TableCell key={m} className="text-center font-mono text-sm whitespace-nowrap">
                          {row.values[m] ? fmt(row.values[m]) : "—"}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-mono font-semibold whitespace-nowrap">{fmt(row.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="font-bold">
                    <TableCell className="sticky left-0 bg-card z-10">Total Geral</TableCell>
                    {sortedMonths.map(m => (
                      <TableCell key={m} className="text-center font-mono whitespace-nowrap">{monthTotals[m] ? fmt(monthTotals[m]) : "—"}</TableCell>
                    ))}
                    <TableCell className="text-center font-mono whitespace-nowrap">{fmt(grandTotal)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma despesa com vencimento para exibir no relatório matricial.</p>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Fluxo de Caixa */}
      <Collapsible open={showFluxo} onOpenChange={setShowFluxo}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
              {showFluxo ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <h3 className="text-md font-semibold">Fluxo de Caixa (por vencimento)</h3>
            </Button>
          </CollapsibleTrigger>
          {fluxoCaixa.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
              const wsData = [["Vencimento", "Descrição", "Etapa", "Fornecedor", "Categoria", "Valor", "Parcela", "Pago"]];
              fluxoCaixa.forEach((d: any) => {
                wsData.push([
                  new Date(d.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR"),
                  d.descricao,
                  d.etapa_id ? (etapaMap.get(d.etapa_id) || "—") : "—",
                  d.fornecedores?.nome || "",
                  categoriaLabel[d.categoria] || d.categoria,
                  d.valor_real || d.valor_previsto,
                  d.parcela_numero ? String(d.parcela_numero) : "",
                  d.pago ? "Sim" : "Não",
                ]);
              });
              wsData.push(["Total", "", "", "", "", fluxoCaixa.reduce((s: number, d: any) => s + (d.valor_real || d.valor_previsto), 0), "", ""]);
              const ws = XLSX.utils.aoa_to_sheet(wsData);
              ws["!cols"] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 8 }, { wch: 6 }];
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, "Fluxo de Caixa");
              XLSX.writeFile(wb, "fluxo_de_caixa.xlsx");
            }}>
              <Download className="h-4 w-4" />Exportar Excel
            </Button>
          )}
        </div>
        <CollapsibleContent className="mt-3">
          <div className="bg-card rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Vencimento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead className="w-24">Categoria</TableHead>
                  <TableHead className="w-28">Valor</TableHead>
                  <TableHead className="w-20">Parcela</TableHead>
                  <TableHead className="w-20">Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fluxoCaixa.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhuma despesa com vencimento</TableCell></TableRow>
                ) : fluxoCaixa.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="whitespace-nowrap">{new Date(d.data_vencimento + "T12:00:00").toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="font-medium">{d.descricao}</TableCell>
                    <TableCell>{d.etapa_id ? (etapaMap.get(d.etapa_id) || "—") : "—"}</TableCell>
                    <TableCell>{d.fornecedores?.nome || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs whitespace-nowrap">{categoriaLabel[d.categoria] || d.categoria}</Badge></TableCell>
                    <TableCell className="whitespace-nowrap">{fmt(d.valor_real || d.valor_previsto)}</TableCell>
                    <TableCell className="text-center font-mono">{d.parcela_numero ? `${d.parcela_numero}` : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={d.pago ? "default" : "outline"} className={d.pago ? "bg-success text-success-foreground" : ""}>{d.pago ? "Sim" : "Não"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {fluxoCaixa.length > 0 && (
                <TableFooter>
                  <TableRow className="font-semibold">
                    <TableCell colSpan={5}>Total</TableCell>
                    <TableCell className="whitespace-nowrap">{fmt(fluxoCaixa.reduce((s: number, d: any) => s + (d.valor_real || d.valor_previsto), 0))}</TableCell>
                    <TableCell colSpan={3} />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Entradas vs Saídas */}
      <Collapsible open={showEntradasSaidas} onOpenChange={setShowEntradasSaidas}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 p-0 h-auto hover:bg-transparent">
              {showEntradasSaidas ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <h3 className="text-md font-semibold">Fluxo de Caixa — Entradas vs Saídas</h3>
            </Button>
          </CollapsibleTrigger>
        </div>
        {showEntradasSaidas && fluxoRows.length > 0 && (
          <Button variant="outline" size="sm" className="gap-1.5 mt-2" onClick={() => {
            const wsData = [["Mês", "Entradas", "Saídas", "Saldo Mensal", "Saldo Acumulado"]];
            fluxoRows.forEach(row => {
              wsData.push([
                formatMonth(row.mes),
                row.entradas,
                row.saidas,
                row.saldoMensal,
                row.acumulado,
              ]);
            });
            wsData.push(["Total", totalEntradas, totalSaidas, totalEntradas - totalSaidas, ""]);
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            ws["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 16 }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Entradas vs Saidas");
            XLSX.writeFile(wb, "fluxo_entradas_vs_saidas.xlsx");
          }}>
            <Download className="h-4 w-4" />Exportar Excel
          </Button>
        )}
        <CollapsibleContent className="mt-3">
          {(() => {
            // Expand receitas into monthly entries
            const receitasMensais: { mes: string; valor: number }[] = [];
            (receitas || []).forEach((r: any) => {
              const meses = r.recorrente ? r.meses_repeticao : 1;
              const baseDate = new Date(r.data_inicio + "T12:00:00");
              for (let i = 0; i < meses; i++) {
                const d = new Date(baseDate);
                d.setMonth(d.getMonth() + i);
                const mesKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                receitasMensais.push({ mes: mesKey, valor: r.valor });
              }
            });

            // Aggregate entradas by month
            const entradasPorMes: Record<string, number> = {};
            receitasMensais.forEach(({ mes, valor }) => {
              entradasPorMes[mes] = (entradasPorMes[mes] || 0) + valor;
            });

            // Aggregate saídas by month (from fluxoCaixa - despesas with vencimento)
            const saidasPorMes: Record<string, number> = {};
            allFluxoItems.forEach((d: any) => {
              const date = new Date(d.data_vencimento + "T12:00:00");
              const mesKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
              saidasPorMes[mesKey] = (saidasPorMes[mesKey] || 0) + (d.valor_real || d.valor_previsto);
            });

            // Collect all months
            const allMonths = new Set([...Object.keys(entradasPorMes), ...Object.keys(saidasPorMes)]);
            const sortedMeses = Array.from(allMonths).sort();

            if (sortedMeses.length === 0) return <p className="text-sm text-muted-foreground">Nenhuma receita ou despesa com vencimento para comparar.</p>;

            let acumulado = 0;
            const fluxoRows = sortedMeses.map(mes => {
              const entradas = entradasPorMes[mes] || 0;
              const saidas = saidasPorMes[mes] || 0;
              const saldoMensal = entradas - saidas;
              acumulado += saldoMensal;
              return { mes, entradas, saidas, saldoMensal, acumulado };
            });

            const totalEntradas = fluxoRows.reduce((s, r) => s + r.entradas, 0);
            const totalSaidas = fluxoRows.reduce((s, r) => s + r.saidas, 0);


            return (
                <div className="bg-card rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-28">Mês</TableHead>
                        <TableHead className="w-32">Entradas</TableHead>
                        <TableHead className="w-32">Saídas</TableHead>
                        <TableHead className="w-32">Saldo Mensal</TableHead>
                        <TableHead className="w-32">Saldo Acumulado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fluxoRows.map(row => (
                        <TableRow key={row.mes}>
                          <TableCell className="whitespace-nowrap font-medium">{formatMonth(row.mes)}</TableCell>
                          <TableCell className="font-mono whitespace-nowrap text-success">{fmt(row.entradas)}</TableCell>
                          <TableCell className="font-mono whitespace-nowrap text-destructive">{fmt(row.saidas)}</TableCell>
                          <TableCell className={`font-mono whitespace-nowrap ${row.saldoMensal >= 0 ? "text-success" : "text-destructive"}`}>{fmt(row.saldoMensal)}</TableCell>
                          <TableCell className={`font-mono whitespace-nowrap font-semibold ${row.acumulado >= 0 ? "text-success" : "text-destructive"}`}>{fmt(row.acumulado)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="font-semibold">
                        <TableCell>Total</TableCell>
                        <TableCell className="font-mono whitespace-nowrap text-success">{fmt(totalEntradas)}</TableCell>
                        <TableCell className="font-mono whitespace-nowrap text-destructive">{fmt(totalSaidas)}</TableCell>
                        <TableCell className={`font-mono whitespace-nowrap ${totalEntradas - totalSaidas >= 0 ? "text-success" : "text-destructive"}`}>{fmt(totalEntradas - totalSaidas)}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
            );
          })()}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default FinanceiroTab;
