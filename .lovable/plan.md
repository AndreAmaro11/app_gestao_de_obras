

# Plano: Melhorias em Orcamento, Despesas, Fornecedores e Financeiro

## 1. Corrigir geracao de despesas na aprovacao do orcamento

Atualmente o `useAprovarOrcamento` nao inclui `subetapa_id` na despesa gerada. Corrigir para incluir `subetapa_id` do item do orcamento na despesa criada automaticamente.

## 2. Adicionar condicoes de pagamento nas despesas

### Migracao de banco
Adicionar colunas na tabela `despesas`:
- `condicao_pagamento` (text, nullable) -- Ex: "30/60/90", "a vista", "entrada + 2x"
- `data_vencimento` (date, nullable) -- data de vencimento do pagamento
- `parcelas` (integer, default 1) -- numero de parcelas

### Alteracoes no codigo
- Atualizar formulario de despesas (DespesasTab) com campos de condicao de pagamento, data de vencimento e parcelas
- Atualizar FinanceiroTab para exibir fluxo de caixa baseado nas datas de vencimento: tabela com colunas Data Vencimento | Descricao | Valor | Pago, ordenada por data

## 3. Cadastrar fornecedor inline na tela de cotacao

Na CotacoesView do OrcamentoTab, ao lado do select de fornecedor, adicionar um botao "+" que abre um mini-dialog para cadastrar um novo fornecedor rapidamente (nome, tipo, telefone). Ao salvar, o fornecedor e automaticamente selecionado no campo.

## 4. Campo de Tag em fornecedores

### Migracao de banco
Adicionar coluna na tabela `fornecedores`:
- `tags` (text[], nullable, default '{}') -- array de tags livres

### Alteracoes no codigo
- Atualizar formulario de fornecedores (FornecedoresPage) com campo de tags (input de texto com separacao por virgula ou Enter)
- Exibir tags como badges na tabela de fornecedores

## 5. Associar fornecedor a etapa e subetapa

### Migracao de banco
Adicionar colunas na tabela `fornecedores`:
- `etapa_id` (uuid, nullable, FK para etapas)
- `subetapa_id` (uuid, nullable, FK para subetapas)

**Nota**: como fornecedores sao globais do usuario (nao de uma obra especifica), a associacao sera opcional e servira como referencia de qual etapa/subetapa aquele fornecedor costuma atender.

### Alteracoes no codigo
- Atualizar formulario de fornecedores com selects de etapa e subetapa
- Como fornecedores sao globais, o select de etapa precisara primeiro escolher uma obra. Alternativa mais simples: campo de texto livre "Especialidade/Etapa" em vez de FK, ja que o fornecedor nao pertence a uma obra.

**Pergunta para definir**: Fornecedores sao globais do usuario. A associacao a etapa/subetapa faz sentido como FK (exigindo escolher uma obra) ou como um campo texto livre de especialidade?

---

## Detalhes Tecnicos

### Arquivos modificados
- `src/hooks/useOrcamentos.ts` -- corrigir `useAprovarOrcamento` para incluir `subetapa_id`
- `src/hooks/useDespesas.ts` -- atualizar tipos para novos campos
- `src/components/obras/OrcamentoTab.tsx` -- botao "+" cadastro rapido de fornecedor na cotacao
- `src/components/obras/DespesasTab.tsx` -- campos de condicao de pagamento, vencimento, parcelas
- `src/components/obras/FinanceiroTab.tsx` -- secao de fluxo de caixa por vencimento
- `src/pages/FornecedoresPage.tsx` -- campo de tags e associacao etapa/subetapa
- `src/hooks/useFornecedores.ts` -- atualizar para novos campos

### Migracao SQL (1 unica)
```sql
ALTER TABLE despesas
  ADD COLUMN condicao_pagamento text,
  ADD COLUMN data_vencimento date,
  ADD COLUMN parcelas integer DEFAULT 1;

ALTER TABLE fornecedores
  ADD COLUMN tags text[] DEFAULT '{}';
```

### Ordem de implementacao
1. Migracao de banco
2. Corrigir aprovacao de orcamento (subetapa_id)
3. Campos de pagamento em despesas
4. Fluxo de caixa no financeiro
5. Cadastro rapido de fornecedor na cotacao
6. Tags em fornecedores

