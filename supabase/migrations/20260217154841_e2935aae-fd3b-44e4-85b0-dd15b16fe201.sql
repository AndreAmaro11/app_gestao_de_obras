
-- Add subetapa_id to despesas
ALTER TABLE public.despesas ADD COLUMN subetapa_id uuid REFERENCES public.subetapas(id);

-- Add subetapa_id to orcamento_itens
ALTER TABLE public.orcamento_itens ADD COLUMN subetapa_id uuid REFERENCES public.subetapas(id);

-- RLS policies already cover these tables via obra ownership chain
