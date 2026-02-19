

# Redesign UX da Tela de Obra

## Problema Atual

A tela de detalhes da obra tem uma hierarquia confusa:
- Banner com gradiente no topo
- 4 cards de KPIs logo abaixo
- Abas (Cronograma, Orcamento, etc.) depois dos cards
- Dentro do Cronograma, o Gantt fica misturado com a tabela de etapas
- O usuario precisa rolar bastante para chegar ao conteudo real
- A sidebar so tem "Obras" e "Fornecedores" -- os itens de navegacao da obra (Cronograma, Orcamento, Despesas, etc.) ja estao definidos no codigo mas nunca sao usados

## Solucao Proposta

Reorganizar a pagina com foco em produtividade, usando a sidebar como navegacao principal da obra e simplificando o conteudo visivel.

### 1. Sidebar Contextual para a Obra

Quando o usuario estiver dentro de uma obra (`/obra/:id`), a sidebar mostra:
- Link "Voltar para Obras" no topo
- Nome da obra como titulo
- Mini barra de progresso
- Itens de navegacao: **Dashboard, Cronograma, Orcamento, Despesas, Financeiro, Checklist, Documentos**
- Cada item navega via query param ou sub-rota (ex: `/obra/:id?tab=cronograma`)

Os itens `obraNavItems` ja existem no `AppLayout.tsx` mas nao sao renderizados -- vamos ativa-los.

### 2. Nova Aba "Dashboard" (Visao Geral)

Criar uma aba dedicada de Dashboard que concentra:
- Header compacto (nome + badge de status + progresso em uma linha)
- 4 KPI cards (como estao, porem menores e em uma unica faixa)
- 3 graficos em grid 2 colunas:
  - Barras: Orcado vs Realizado por etapa
  - Linha: Evolucao financeira mensal
  - Donut: Distribuicao por categoria
- Resumo rapido de atividades recentes

Isso separa a "visao gerencial" do "trabalho operacional" (Cronograma, Despesas, etc.)

### 3. Header Simplificado nas Abas Operacionais

Quando o usuario esta em Cronograma, Despesas, etc.:
- Header compacto: nome da obra + progresso inline (sem banner grande)
- O conteudo da aba ocupa toda a area visivel
- Sem KPI cards repetidos

### 4. Cronograma - Separar Tabela e Gantt

Dentro do Cronograma, adicionar sub-visualizacoes:
- Toggle "Tabela | Gantt" (botoes de alternancia, nao ambos ao mesmo tempo)
- Na visao Tabela: a tabela de etapas como esta
- Na visao Gantt: o grafico Gantt em tela cheia com mais espaco

### 5. Melhorias Visuais Gerais

- Transicao suave ao trocar de aba (fade-in no conteudo)
- Cards de KPI mais compactos com micro-graficos (sparklines opcionais)
- Breadcrumb atualizado: Obras > Nome da Obra > Aba Atual

---

## Detalhes Tecnicos

### Arquivos a modificar:

1. **`src/components/AppLayout.tsx`**
   - Detectar se a rota e `/obra/:id` usando `useLocation`
   - Quando dentro de uma obra, renderizar os `obraNavItems` na sidebar (ja definidos mas nao usados)
   - Passar a tab ativa via search params (`?tab=cronograma`)
   - Adicionar link "Voltar" e nome da obra no topo da secao

2. **`src/pages/ObraDetailPage.tsx`**
   - Ler a tab ativa de `searchParams` em vez de estado interno do componente Tabs
   - Remover o banner grande e KPIs do topo de todas as abas
   - Adicionar header compacto (uma linha: nome + progresso + badge)
   - Criar nova tab "dashboard" como defaultValue
   - Remover o componente `TabsList` visivel (a navegacao agora vem da sidebar)

3. **`src/components/ObraDashboardHeader.tsx`** (renomear para `ObraDashboardTab.tsx`)
   - Transformar em aba completa de Dashboard
   - Manter KPI cards
   - Adicionar 3 graficos usando Recharts (ja instalado):
     - `BarChart`: Orcado vs Realizado por etapa
     - `LineChart`: Evolucao financeira mensal
     - `PieChart` (donut): Distribuicao por categoria de despesa
   - Layout em grid responsivo

4. **`src/components/obras/CronogramaTab.tsx`**
   - Adicionar toggle "Tabela | Gantt" no topo
   - Mostrar apenas uma visualizacao por vez
   - Dar mais espaco ao Gantt quando selecionado

5. **`src/components/obras/GanttChart.tsx`**
   - Ajustar para modo "full-width" quando exibido sozinho
   - Melhorar legibilidade com barras maiores

### Fluxo de navegacao:

```text
Sidebar (dentro de /obra/:id)
+----------------------------+
| <- Voltar para Obras       |
| [Nome da Obra]             |
| [====== 65% ======]        |
|                            |
| * Dashboard        (ativo) |
|   Cronograma               |
|   Orcamento                |
|   Despesas                 |
|   Financeiro               |
|   Checklist                |
|   Documentos               |
+----------------------------+
```

### Dependencias:
- Recharts (ja instalado) para os graficos do Dashboard
- Nenhuma nova dependencia necessaria

