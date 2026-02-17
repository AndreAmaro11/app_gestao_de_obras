ALTER TABLE fornecedores
  ADD COLUMN etapa_id uuid REFERENCES etapas(id),
  ADD COLUMN subetapa_id uuid REFERENCES subetapas(id);