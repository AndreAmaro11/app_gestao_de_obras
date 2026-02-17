
-- 1. Tabela obra_imagens
CREATE TABLE public.obra_imagens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_capa BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.obra_imagens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage obra_imagens"
ON public.obra_imagens FOR ALL
USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = obra_imagens.obra_id AND obras.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = obra_imagens.obra_id AND obras.user_id = auth.uid()));

-- 2. Tabela pastas
CREATE TABLE public.pastas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  pasta_pai_id UUID DEFAULT NULL REFERENCES public.pastas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.pastas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage pastas"
ON public.pastas FOR ALL
USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = pastas.obra_id AND obras.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = pastas.obra_id AND obras.user_id = auth.uid()));

-- 3. Tabela documentos
CREATE TABLE public.documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  pasta_id UUID DEFAULT NULL REFERENCES public.pastas(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo_arquivo TEXT DEFAULT NULL,
  tamanho BIGINT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage documentos"
ON public.documentos FOR ALL
USING (EXISTS (SELECT 1 FROM obras WHERE obras.id = documentos.obra_id AND obras.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM obras WHERE obras.id = documentos.obra_id AND obras.user_id = auth.uid()));

-- 4. Storage bucket: obra-imagens (público)
INSERT INTO storage.buckets (id, name, public) VALUES ('obra-imagens', 'obra-imagens', true);

CREATE POLICY "Users can upload obra images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'obra-imagens' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view obra images"
ON storage.objects FOR SELECT
USING (bucket_id = 'obra-imagens');

CREATE POLICY "Users can delete own obra images"
ON storage.objects FOR DELETE
USING (bucket_id = 'obra-imagens' AND auth.role() = 'authenticated');

-- 5. Storage bucket: obra-documentos (privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('obra-documentos', 'obra-documentos', false);

CREATE POLICY "Users can upload obra docs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'obra-documentos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view obra docs"
ON storage.objects FOR SELECT
USING (bucket_id = 'obra-documentos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete obra docs"
ON storage.objects FOR DELETE
USING (bucket_id = 'obra-documentos' AND auth.role() = 'authenticated');
