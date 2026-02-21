

# Melhorias: Layout Responsivo, Receitas e Status do Orcamento

## 1. Layout mais largo e responsivo

**Problema**: O conteudo principal esta limitado a `max-w-7xl` (~1280px), deixando muito espaco lateral vazio em telas grandes.

**Solucao**: Remover o `max-w-7xl` e usar padding lateral adequado para que o conteudo ocupe toda a largura disponivel. Isso e especialmente importante para tabelas (Financeiro, Orcamento) que precisam de espaco horizontal.

**Arquivo**: `src/components/AppLayout.tsx`
- Linha 205: trocar `max-w-7xl mx-auto p-6 lg:p-8` por `p-6 lg:p-8` (sem max-width)

---

## 2. Nova funcionalidade: Receitas

Criar uma tabela de **receitas** (entradas de dinheiro do cliente/contratante) vinculada a cada obra, com possibilidade de repetir o valor para meses seguintes.

### 2.1 Tabela no banco (nova migration)

```sql
CREATE TABLE public.receitas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES obras(id),
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'pagamento_cliente',
  valor NUMERIC NOT NULL DEFAULT 0,
  data_inicio DATE NOT NULL,
  recorrente BOOLEAN DEFAULT false,
  meses_repeticao INTEGER DEFAULT 1,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own receitas" ON public.receitas
  FOR ALL USING (
    obra_id IN (SELECT id FROM obras WHERE user_id = auth.uid())
  );
```

### 2.2 Novos arquivos

- **`src/hooks/useReceitas.ts`**: Hook com `useReceitas(obraId)`, `useCreateReceita()`, `useUpdateReceita()`, `useDeleteReceita()`
- **`src/components/obras/ReceitasTab.tsx`**: Nova aba com tabela CRUD
  - Colunas: Descricao, Tipo (pagamento_cliente, financiamento, aporte, outros), Valor, Data Inicio, Recorrente (sim/nao), Meses de repeticao, Acoes
  - Botao "Nova Receita" abre dialog com formulario
  - Quando recorrente = sim, mostrar campo "Repetir por X meses"
  - Totalizar valor mensal e valor total projetado

### 2.3 Integrar na sidebar e na pagina

- **`src/components/AppLayout.tsx`**: Adicionar item "Receitas" com icone `TrendingUp` na lista `obraNavItems`, entre Despesas e Financeiro
- **`src/pages/ObraDetailPage.tsx`**: Adicionar rota `receitas` renderizando `<ReceitasTab />`

### 2.4 Integrar no Financeiro

- **`src/components/obras/FinanceiroTab.tsx`**:
  - Buscar receitas da obra via `useReceitas(obraId)`
  - Expandir receitas recorrentes em entradas mensais virtuais (mesma logica das parcelas virtuais de despesas)
  - Adicionar secao "Fluxo de Caixa - Entradas vs Saidas" com tabela mensal:
    - Colunas: Mes, Entradas (receitas), Saidas (despesas), Saldo Mensal, Saldo Acumulado
  - Nos cards resumo, adicionar "Total Receitas" como 4o card

---

## 3. Status do Orcamento editavel

**Problema**: O badge de status (Rascunho, Em Cotacao, Aprovado, Fechado) aparece mas nao pode ser alterado pelo usuario.

**Solucao**: Na view de itens do orcamento (`ItensView` dentro de `OrcamentoTab.tsx`), transformar o status em um `Select` dropdown que permite mudar entre os 4 estados.

**Arquivo**: `src/components/obras/OrcamentoTab.tsx`
- Na `ItensView`, adicionar um `Select` ao lado do titulo com os valores do enum `status_orcamento`
- Ao mudar, chamar `useUpdateOrcamento` para persistir o novo status
- Tambem adicionar opcao de mudar status na lista de orcamentos (click no badge abre dropdown)

---

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/AppLayout.tsx` | Remover max-width, adicionar item "Receitas" na sidebar |
| `src/pages/ObraDetailPage.tsx` | Adicionar tab `receitas` |
| `src/hooks/useReceitas.ts` | **Criar** - hooks CRUD para receitas |
| `src/components/obras/ReceitasTab.tsx` | **Criar** - aba de receitas com tabela e formulario |
| `src/components/obras/FinanceiroTab.tsx` | Integrar receitas no fluxo de caixa (entradas vs saidas) |
| `src/components/obras/OrcamentoTab.tsx` | Adicionar Select para mudar status do orcamento |
| `supabase/migrations/` | **Criar** - migration para tabela `receitas` |

