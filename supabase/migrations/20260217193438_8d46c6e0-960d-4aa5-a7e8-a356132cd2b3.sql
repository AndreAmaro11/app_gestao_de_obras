
-- Add installment tracking columns to despesas
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS parcela_numero integer;
ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS despesa_pai_id uuid REFERENCES public.despesas(id);
