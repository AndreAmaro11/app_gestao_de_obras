
# Plano Geral: Melhorias no Sistema de Gestao de Obras

Este e um plano extenso dividido em 5 fases para implementacao gradual. Cada fase pode ser aprovada e implementada separadamente.

---

## FASE 1: Obras - Cards, Edicao e Imagens

### 1.1 Tela inicial em Cards (Index.tsx)
- Remover tabela atual
- Criar grid de cards responsivos (3 colunas desktop, 2 tablet, 1 mobile)
- Cada card exibe: imagem de capa (ou placeholder), nome, status/padrao, percentual de execucao (barra de progresso), botoes editar/excluir

### 1.2 Editar Obra
- Criar componente `EditarObraDialog` com todos os campos existentes (nome, metragem, padrao, datas)
- Adicionar hook `useUpdateObra` em `useObras.ts`

### 1.3 Upload de Imagens da Obra
- **Migracao**: Criar tabela `obra_imagens` (id, obra_id, url, is_capa boolean default false, created_at, deleted_at)
- **Storage**: Criar bucket `obra-imagens` (publico) com RLS para INSERT/SELECT/DELETE pelo owner
- Hook `useObraImagens` para CRUD
- Na tela de edicao: area de upload multiplo, galeria com opcao de definir capa
- Na listagem: exibir imagem de capa no card

### 1.4 Modulo Documentacoes da Obra
- **Migracao**: Criar tabela `documentos` (id, obra_id, pasta_id nullable, nome, url, tipo_arquivo, tamanho, created_at, deleted_at)
- **Migracao**: Criar tabela `pastas` (id, obra_id, pasta_pai_id nullable, nome, created_at, deleted_at)
- **Storage**: Criar bucket `obra-documentos` (privado) com RLS
- Nova aba "Documentos" em ObraDetailPage
- Componente com navegacao em arvore de pastas, upload de arquivos, download, exclusao
- RLS: apenas o dono da obra acessa

---

## FASE 2: Cronograma - Correcao do Gantt

### 2.1 Corrigir calculo do Gantt
- Incluir subetapas na visualizacao Gantt (barras menores/indentadas)
- Corrigir calculo de `obraStart`/`obraEnd` para considerar tambem datas de subetapas
- Tratar etapas sem datas (nao renderizar barra, ou exibir aviso)

### 2.2 Dependencias
- Atualmente o campo `dependencia` existe na tabela `etapas` mas nao e usado na UI
- Adicionar select de dependencia no formulario de etapa
- No Gantt, desenhar setas/linhas conectando etapas dependentes

### 2.3 Atualizacao automatica
- Ao alterar percentual/status de etapa, recalcular percentual geral da obra
- Sincronizar datas com orcamento: ao aprovar orcamento, atualizar status da etapa vinculada

---

## FASE 3: Orcamento - Melhorias Completas

### 3.1 Lista de Orcamentos
- Adicionar coluna "Valor Estimado Total" (soma dos itens)
- Adicionar botao de deletar orcamento (ja existe `useDeleteOrcamento`)

### 3.2 Itens do Orcamento
- Adicionar colunas: Valor Selecionado (da cotacao vencedora), Fornecedor Escolhido
- Totalizador geral: soma estimado, soma selecionado

### 3.3 Cotacoes - Melhorias
- Adicionar colunas na tabela: Observacao, Telefone do fornecedor
- Botao de deletar cotacao (soft delete)
- Upload de arquivo anexo na cotacao:
  - **Migracao**: Adicionar coluna `arquivo_url` em `cotacoes`
  - **Storage**: Usar bucket `obra-documentos` ou criar `cotacao-arquivos`

### 3.4 Selecao de Cotacao gera Despesa automaticamente
- Ao clicar "Selecionar" em uma cotacao, gerar despesa automaticamente
- Exibir toast: "Despesa gerada com sucesso."
- Remover botao "Aprovar Orcamento" (a geracao e por item agora)

### 3.5 Cadastro Rapido de Fornecedor - Campos Completos
- Expandir o dialog de cadastro rapido para incluir: Razao Social (nome), Nome Fantasia, CNPJ/CPF, Telefone, E-mail, Endereco, Observacao, Categoria
- **Migracao**: Adicionar colunas em `fornecedores`: `nome_fantasia`, `endereco`, `observacao`

---

## FASE 4: Fluxo de Caixa - Parcelamento e Relatorio

### 4.1 Logica de parcelamento automatico
- Ao criar/editar despesa com parcelas > 1 e data_vencimento definida:
  - Gerar N registros de parcela automaticamente
  - Cada parcela = valor_real / N
  - Datas incrementais mensais (mesmo dia)
- **Migracao**: Adicionar coluna `parcela_numero` e `despesa_pai_id` em `despesas` para rastrear parcelas filhas
- No fluxo de caixa, exibir cada parcela individualmente

### 4.2 Relatorio estruturado de Fluxo de Caixa
- Criar componente `RelatorioFluxoCaixa`
- Estrutura matricial: Colunas = Meses/Anos, Linhas = Etapa > Subetapa > Fornecedor
- Totais por mes, ano, fornecedor e etapa
- Exibir no FinanceiroTab como nova secao

---

## FASE 5: Padronizacao do Sistema

### 5.1 Componente reutilizavel de filtros
- Criar `DataToolbar` com: busca rapida (texto), filtros por campo, ordenacao crescente/decrescente
- Aplicar em: Obras, Fornecedores, Despesas, Orcamentos, Fluxo de Caixa

### 5.2 Ordenacao de colunas
- Ao clicar no cabecalho da tabela, ordenar asc/desc
- Indicador visual (seta) na coluna ativa

### 5.3 Melhor organizacao visual
- Padding e espacamento consistentes
- Cores de status uniformes em todos os modulos

---

## Detalhes Tecnicos

### Migracoes SQL necessarias (resumo)

```text
1. Tabela obra_imagens (id, obra_id FK, url, is_capa, created_at, deleted_at)
2. Tabela pastas (id, obra_id FK, pasta_pai_id FK self, nome, created_at, deleted_at)
3. Tabela documentos (id, obra_id FK, pasta_id FK, nome, url, tipo_arquivo, tamanho, created_at, deleted_at)
4. Storage bucket: obra-imagens (publico)
5. Storage bucket: obra-documentos (privado)
6. Coluna arquivo_url em cotacoes
7. Colunas nome_fantasia, endereco, observacao em fornecedores
8. Colunas parcela_numero, despesa_pai_id em despesas
```

### Novos arquivos
- `src/components/EditarObraDialog.tsx`
- `src/components/obras/DocumentosTab.tsx`
- `src/components/DataToolbar.tsx`
- `src/hooks/useObraImagens.ts`
- `src/hooks/useDocumentos.ts`

### Arquivos modificados
- `src/pages/Index.tsx` -- cards em vez de tabela
- `src/pages/ObraDetailPage.tsx` -- nova aba Documentos
- `src/hooks/useObras.ts` -- useUpdateObra
- `src/components/obras/CronogramaTab.tsx` -- correcao Gantt
- `src/components/obras/OrcamentoTab.tsx` -- totais, delete, selecao gera despesa
- `src/components/obras/FinanceiroTab.tsx` -- relatorio matricial
- `src/components/obras/DespesasTab.tsx` -- logica parcelas
- `src/pages/FornecedoresPage.tsx` -- novos campos, toolbar
- `src/hooks/useFornecedores.ts` -- novos campos
- `src/hooks/useDespesas.ts` -- parcelas
- `src/hooks/useOrcamentos.ts` -- selecao gera despesa

### Ordem de implementacao sugerida
1. Fase 1 (Obras) -- base visual e storage
2. Fase 3 (Orcamento) -- melhorias de fluxo
3. Fase 4 (Fluxo de Caixa) -- parcelamento
4. Fase 2 (Cronograma) -- correcoes Gantt
5. Fase 5 (Padronizacao) -- polimento final

**Nota**: Devido ao tamanho, recomendo implementar uma fase por vez para garantir estabilidade. Ao aprovar, iniciarei pela Fase 1.
