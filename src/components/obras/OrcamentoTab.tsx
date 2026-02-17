import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { Plus, ArrowLeft, Check, ChevronRight } from "lucide-react";

const mockOrcamentos = [
  { id: "1", nome: "Orçamento Principal", status: "em_cotacao" as const, total_estimado: 285000, total_aprovado: 0 },
  { id: "2", nome: "Orçamento Acabamento", status: "rascunho" as const, total_estimado: 95000, total_aprovado: 0 },
];

const mockItens = [
  { id: "1", etapa: "Fundação", descricao: "Concreto Usinado FCK 25", unidade: "m³", quantidade: 45, valor_estimado_unitario: 380, valor_estimado_total: 17100 },
  { id: "2", etapa: "Fundação", descricao: "Aço CA-50 10mm", unidade: "kg", quantidade: 2800, valor_estimado_unitario: 6.5, valor_estimado_total: 18200 },
  { id: "3", etapa: "Estrutura", descricao: "Forma de madeira", unidade: "m²", quantidade: 320, valor_estimado_unitario: 85, valor_estimado_total: 27200 },
];

const mockCotacoes = [
  { id: "1", fornecedor: "Concreteira ABC", valor_unitario: 365, prazo: "3 dias", selecionado: true },
  { id: "2", fornecedor: "Concreto Mix", valor_unitario: 390, prazo: "5 dias", selecionado: false },
  { id: "3", fornecedor: "Super Concreto", valor_unitario: 410, prazo: "2 dias", selecionado: false },
];

type View = "list" | "items" | "cotacoes";

const OrcamentoTab = () => {
  const [view, setView] = useState<View>("list");
  const [selectedOrcamento, setSelectedOrcamento] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const menorValor = Math.min(...mockCotacoes.map(c => c.valor_unitario));

  if (view === "cotacoes") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView("items")}>
            <ArrowLeft className="h-4 w-4 mr-1" />Voltar
          </Button>
          <h2 className="text-lg font-semibold">Cotações — Concreto Usinado FCK 25</h2>
        </div>
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fornecedor</TableHead>
                <TableHead className="w-28">Valor Unit.</TableHead>
                <TableHead className="w-24">Prazo</TableHead>
                <TableHead className="w-28">Diferença %</TableHead>
                <TableHead className="w-28">Selecionado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockCotacoes.map((cot) => {
                const diff = ((cot.valor_unitario - menorValor) / menorValor * 100).toFixed(1);
                const isMenor = cot.valor_unitario === menorValor;
                return (
                  <TableRow key={cot.id} className={isMenor ? "bg-success/5" : ""}>
                    <TableCell className="font-medium">{cot.fornecedor}</TableCell>
                    <TableCell className={isMenor ? "text-success font-semibold" : ""}>
                      R$ {cot.valor_unitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{cot.prazo}</TableCell>
                    <TableCell>{isMenor ? "Menor" : `+${diff}%`}</TableCell>
                    <TableCell>
                      <Button
                        variant={cot.selecionado ? "default" : "outline"}
                        size="sm"
                        className="h-7"
                      >
                        {cot.selecionado && <Check className="h-3 w-3 mr-1" />}
                        {cot.selecionado ? "Selecionado" : "Selecionar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (view === "items") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setView("list")}>
              <ArrowLeft className="h-4 w-4 mr-1" />Voltar
            </Button>
            <h2 className="text-lg font-semibold">Itens — Orçamento Principal</h2>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />Novo Item</Button>
            <Button size="sm">Aprovar Orçamento</Button>
          </div>
        </div>
        <div className="bg-card rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Etapa</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-20">Unidade</TableHead>
                <TableHead className="w-20">Qtde</TableHead>
                <TableHead className="w-28">Estimado Unit.</TableHead>
                <TableHead className="w-28">Total</TableHead>
                <TableHead className="w-20">Cotações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockItens.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedItem(item.id); setView("cotacoes"); }}>
                  <TableCell className="text-muted-foreground">{item.etapa}</TableCell>
                  <TableCell className="font-medium">{item.descricao}</TableCell>
                  <TableCell>{item.unidade}</TableCell>
                  <TableCell className="font-mono">{item.quantidade}</TableCell>
                  <TableCell>R$ {item.valor_estimado_unitario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="font-semibold">R$ {item.valor_estimado_total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Orçamentos</h2>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo Orçamento</Button>
      </div>
      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-32">Total Estimado</TableHead>
              <TableHead className="w-32">Total Aprovado</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockOrcamentos.map((orc) => (
              <TableRow key={orc.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedOrcamento(orc.id); setView("items"); }}>
                <TableCell className="font-medium">{orc.nome}</TableCell>
                <TableCell><StatusBadge status={orc.status} /></TableCell>
                <TableCell>R$ {orc.total_estimado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                <TableCell>R$ {orc.total_aprovado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                <TableCell><ChevronRight className="h-4 w-4 text-muted-foreground" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default OrcamentoTab;
