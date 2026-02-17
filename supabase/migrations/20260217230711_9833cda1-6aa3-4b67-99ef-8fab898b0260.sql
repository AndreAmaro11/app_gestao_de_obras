-- Add more expense categories
ALTER TYPE public.categoria_despesa ADD VALUE IF NOT EXISTS 'equipamento';
ALTER TYPE public.categoria_despesa ADD VALUE IF NOT EXISTS 'transporte';
ALTER TYPE public.categoria_despesa ADD VALUE IF NOT EXISTS 'administrativo';
ALTER TYPE public.categoria_despesa ADD VALUE IF NOT EXISTS 'projeto';
ALTER TYPE public.categoria_despesa ADD VALUE IF NOT EXISTS 'outros';