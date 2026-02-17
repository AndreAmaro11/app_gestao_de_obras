import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Sanitize filename for Supabase storage (remove accents and special chars)
const sanitizeFilename = (name: string) => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
};

export const usePastas = (obraId: string, pastaId?: string | null) => {
  return useQuery({
    queryKey: ["pastas", obraId, pastaId ?? "root"],
    queryFn: async () => {
      let q = supabase
        .from("pastas")
        .select("*")
        .eq("obra_id", obraId)
        .is("deleted_at", null)
        .order("nome");
      if (pastaId) {
        q = q.eq("pasta_pai_id", pastaId);
      } else {
        q = q.is("pasta_pai_id", null);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!obraId,
  });
};

export const useCreatePasta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pasta: { obra_id: string; nome: string; pasta_pai_id?: string | null }) => {
      const { data, error } = await supabase.from("pastas").insert(pasta).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["pastas", data.obra_id] }),
  });
};

export const useDeletePasta = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obraId }: { id: string; obraId: string }) => {
      const { error } = await supabase.from("pastas").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return obraId;
    },
    onSuccess: (obraId) => qc.invalidateQueries({ queryKey: ["pastas", obraId] }),
  });
};

export const useDocumentos = (obraId: string, pastaId?: string | null) => {
  return useQuery({
    queryKey: ["documentos", obraId, pastaId ?? "root"],
    queryFn: async () => {
      let q = supabase
        .from("documentos")
        .select("*")
        .eq("obra_id", obraId)
        .is("deleted_at", null)
        .order("nome");
      if (pastaId) {
        q = q.eq("pasta_id", pastaId);
      } else {
        q = q.is("pasta_id", null);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!obraId,
  });
};

export const useUploadDocumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ obraId, pastaId, file }: { obraId: string; pastaId?: string | null; file: File }) => {
      const safeName = sanitizeFilename(file.name);
      const path = `${obraId}/${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("obra-documentos").upload(path, file);
      if (upErr) throw upErr;
      const { data, error } = await supabase
        .from("documentos")
        .insert({
          obra_id: obraId,
          pasta_id: pastaId || null,
          nome: file.name,
          url: path,
          tipo_arquivo: file.type || null,
          tamanho: file.size,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["documentos", data.obra_id] }),
  });
};

export const useDeleteDocumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obraId, url }: { id: string; obraId: string; url: string }) => {
      await supabase.storage.from("obra-documentos").remove([url]);
      const { error } = await supabase.from("documentos").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return obraId;
    },
    onSuccess: (obraId) => qc.invalidateQueries({ queryKey: ["documentos", obraId] }),
  });
};

export const useDownloadDocumento = () => {
  return async (url: string, nome: string) => {
    const { data, error } = await supabase.storage.from("obra-documentos").download(url);
    if (error) throw error;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(data);
    a.download = nome;
    a.click();
    URL.revokeObjectURL(a.href);
  };
};
