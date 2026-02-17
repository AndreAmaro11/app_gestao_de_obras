ALTER TABLE despesas
  ADD COLUMN IF NOT EXISTS condicao_pagamento text,
  ADD COLUMN IF NOT EXISTS data_vencimento date,
  ADD COLUMN IF NOT EXISTS parcelas integer DEFAULT 1;

ALTER TABLE fornecedores
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';