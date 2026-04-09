
-- Tabela de relatórios diários de obra
CREATE TABLE public.rdo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT,
  clima TEXT DEFAULT 'bom',
  etapa_id UUID REFERENCES public.etapas(id),
  subetapa_id UUID REFERENCES public.subetapas(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.rdo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rdo"
ON public.rdo FOR ALL
USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = rdo.obra_id AND obras.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = rdo.obra_id AND obras.user_id = auth.uid()));

-- Tabela de mídias do RDO
CREATE TABLE public.rdo_midias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rdo_id UUID NOT NULL REFERENCES public.rdo(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'foto',
  descricao TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.rdo_midias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own rdo_midias"
ON public.rdo_midias FOR ALL
USING (EXISTS (
  SELECT 1 FROM rdo JOIN obras ON obras.id = rdo.obra_id
  WHERE rdo.id = rdo_midias.rdo_id AND obras.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM rdo JOIN obras ON obras.id = rdo.obra_id
  WHERE rdo.id = rdo_midias.rdo_id AND obras.user_id = auth.uid()
));

-- Bucket para mídias do RDO
INSERT INTO storage.buckets (id, name, public) VALUES ('rdo-midias', 'rdo-midias', true);

-- Policies de storage
CREATE POLICY "Authenticated users can upload rdo media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'rdo-midias');

CREATE POLICY "Anyone can view rdo media"
ON storage.objects FOR SELECT
USING (bucket_id = 'rdo-midias');

CREATE POLICY "Authenticated users can delete rdo media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'rdo-midias');
