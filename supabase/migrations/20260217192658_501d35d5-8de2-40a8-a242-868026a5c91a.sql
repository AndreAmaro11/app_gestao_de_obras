
-- Add new columns to fornecedores
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS nome_fantasia text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS endereco text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS observacao text;

-- Add arquivo_url to cotacoes
ALTER TABLE public.cotacoes ADD COLUMN IF NOT EXISTS arquivo_url text;
