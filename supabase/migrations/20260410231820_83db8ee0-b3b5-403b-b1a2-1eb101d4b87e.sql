
CREATE TABLE public.despesa_anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  despesa_id UUID NOT NULL REFERENCES public.despesas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo_arquivo TEXT,
  tamanho BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.despesa_anexos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage despesa_anexos"
ON public.despesa_anexos
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM despesas
    JOIN obras ON obras.id = despesas.obra_id
    WHERE despesas.id = despesa_anexos.despesa_id
    AND obras.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM despesas
    JOIN obras ON obras.id = despesas.obra_id
    WHERE despesas.id = despesa_anexos.despesa_id
    AND obras.user_id = auth.uid()
  )
);

-- Create storage bucket for expense attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('despesa-anexos', 'despesa-anexos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload despesa anexos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'despesa-anexos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view despesa anexos"
ON storage.objects FOR SELECT
USING (bucket_id = 'despesa-anexos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete despesa anexos"
ON storage.objects FOR DELETE
USING (bucket_id = 'despesa-anexos' AND auth.role() = 'authenticated');
