
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
  )
  WITH CHECK (
    obra_id IN (SELECT id FROM obras WHERE user_id = auth.uid())
  );
