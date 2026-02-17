
# Plano: Conectar Supabase e Implementar Funcionalidades Completas

## Resumo
Remover todos os dados mock e conectar cada componente ao Supabase real. Implementar autenticacao, CRUD completo em todos os modulos, subetapas, fornecedores e logica de negocio (aprovacao de orcamento gerando despesas).

---

## Pre-requisito: Autenticacao

Antes de qualquer operacao funcionar (RLS exige `auth.uid()`), criar:

1. **Pagina de Login/Cadastro** (`src/pages/AuthPage.tsx`) com Supabase Auth (email/senha)
2. **Rota protegida** - redirecionar para `/auth` se nao logado
3. **Hook `useAuth`** para acessar sessao e user_id
4. **AppLayout** - botao "Sair" funcional com `supabase.auth.signOut()`

---

## Modulo 1: Obras (Index + NovaObraDialog)

- **Index.tsx**: Substituir `mockObras` por query Supabase:
  ```
  supabase.from('obras').select('*').is('deleted_at', null).order('created_at')
  ```
- **NovaObraDialog**: Form controlado que faz `insert` na tabela `obras` com `user_id = auth.uid()`
- **Soft delete**: Botao de lixeira faz `update` com `deleted_at = now()`
- Calcular status da obra com base nas etapas (todas concluidas = concluida, alguma em andamento = em andamento, etc.)

---

## Modulo 2: Detalhe da Obra (ObraDetailPage)

- Carregar obra real por `id` via Supabase
- Passar `obraId` como prop para todas as tabs

---

## Modulo 3: Cronograma + Subetapas

### Etapas
- Query: `supabase.from('etapas').select('*').eq('obra_id', obraId).is('deleted_at', null).order('ordem')`
- CRUD completo com dialogs para criar/editar etapa
- Soft delete

### Subetapas (NOVO)
- Ao clicar em uma etapa, expandir (collapsible ou drill-down) mostrando subetapas
- Query: `supabase.from('subetapas').select('*').eq('etapa_id', etapaId).is('deleted_at', null).order('ordem')`
- CRUD completo: criar, editar, excluir (soft delete)
- Campos: nome, ordem, inicio/fim previsto/real, percentual, status
- Gantt atualizado para incluir subetapas aninhadas

---

## Modulo 4: Fornecedores (NOVO)

Criar tela/pagina de fornecedores acessivel pelo menu:

1. **Pagina `FornecedoresPage.tsx`** com rota `/fornecedores`
2. Tabela: Nome | CNPJ | Telefone | Email | Tipo | Acoes
3. Dialog para criar/editar fornecedor
4. Soft delete
5. Query filtrada por `user_id = auth.uid()`
6. Adicionar link "Fornecedores" no header do AppLayout

---

## Modulo 5: Orcamento

- **Lista de orcamentos**: Query real de `orcamentos` filtrado por `obra_id`
- **Itens do orcamento**: Query de `orcamento_itens` por `orcamento_id`, com join em `etapas` para nome da etapa
- **Cotacoes**: Query de `cotacoes` por `orcamento_item_id`, com join em `fornecedores` para nome
- CRUD completo em cada nivel (dialogs para criar/editar)
- **Selecionar fornecedor**: Ao selecionar uma cotacao, desmarcar as demais do mesmo item (`selecionado = false` nas outras, `true` na escolhida)
- **Aprovar orcamento**: Ao aprovar, mudar status para `aprovado` e criar despesas automaticamente a partir dos itens com cotacao selecionada

---

## Modulo 6: Despesas

- Query real de `despesas` por `obra_id`, com joins em `etapas` e `fornecedores`
- Filtros funcionais por etapa, categoria (ja existem selects, conectar a dados reais)
- CRUD com dialog
- Soft delete

---

## Modulo 7: Financeiro

- Substituir mock por query agregada:
  - Agrupar despesas por etapa
  - Somar `valor_previsto` e `valor_real`
  - Calcular diferenca e percentual
- Sem mock, tudo calculado dos dados reais

---

## Modulo 8: Checklist

- Query real de `checklist` por etapas da obra (join etapas -> obra_id)
- Toggle de `concluido` faz update direto
- CRUD com dialog
- Soft delete

---

## Detalhes Tecnicos

### Estrutura de hooks (React Query)
Criar hooks reutilizaveis em `src/hooks/`:
- `useObras()` - listar obras do usuario
- `useObra(id)` - detalhe de uma obra
- `useEtapas(obraId)` - etapas de uma obra
- `useSubetapas(etapaId)` - subetapas de uma etapa
- `useFornecedores()` - fornecedores do usuario
- `useOrcamentos(obraId)` - orcamentos de uma obra
- `useOrcamentoItens(orcamentoId)` - itens de um orcamento
- `useCotacoes(itemId)` - cotacoes de um item
- `useDespesas(obraId)` - despesas de uma obra
- `useChecklist(obraId)` - checklist de uma obra

Cada hook usando `useQuery` para leitura e `useMutation` + `invalidateQueries` para escrita.

### Arquivos novos
- `src/pages/AuthPage.tsx`
- `src/pages/FornecedoresPage.tsx`
- `src/hooks/useAuth.ts`
- `src/hooks/useObras.ts`
- `src/hooks/useEtapas.ts`
- `src/hooks/useSubetapas.ts`
- `src/hooks/useFornecedores.ts`
- `src/hooks/useOrcamentos.ts`
- `src/hooks/useDespesas.ts`
- `src/hooks/useChecklist.ts`
- Dialogs de CRUD para cada modulo

### Arquivos modificados
- `src/App.tsx` - novas rotas + protecao de rota
- `src/components/AppLayout.tsx` - nav com link para Fornecedores + logout funcional
- Todas as tabs em `src/components/obras/` - remover mocks, usar hooks
- `src/components/NovaObraDialog.tsx` - form funcional com Supabase
- `src/pages/Index.tsx` - dados reais
- `src/pages/ObraDetailPage.tsx` - carregar obra real

### Soft delete
Todas as queries incluem `.is('deleted_at', null)`. Exclusoes fazem `.update({ deleted_at: new Date().toISOString() })`.

### Ordem de implementacao
1. Auth (sem isso nada funciona por causa do RLS)
2. Hooks de dados
3. Obras (listagem + criacao)
4. Etapas + Subetapas
5. Fornecedores
6. Orcamento + Cotacoes + logica de aprovacao
7. Despesas
8. Financeiro
9. Checklist
