
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS contato text;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS indicacao boolean NOT NULL DEFAULT false;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS rede_social text;
