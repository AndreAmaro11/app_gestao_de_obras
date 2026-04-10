import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const sanitizeFilename = (name: string) =>
  name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");

export const useDespesaAnexos = (despesaId: string | undefined) => {
  return useQuery({
    queryKey: ["despesa_anexos", despesaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesa_anexos")
        .select("*")
        .eq("despesa_id", despesaId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!despesaId,
  });
};

export const useUploadDespesaAnexo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ despesaId, file }: { despesaId: string; file: File }) => {
      const safeName = sanitizeFilename(file.name);
      const path = `${despesaId}/${crypto.randomUUID()}-${safeName}`;
      const { error: upErr } = await supabase.storage.from("despesa-anexos").upload(path, file);
      if (upErr) throw upErr;
      const { data, error } = await supabase
        .from("despesa_anexos")
        .insert({
          despesa_id: despesaId,
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
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["despesa_anexos", data.despesa_id] }),
  });
};

export const useDeleteDespesaAnexo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, despesaId, url }: { id: string; despesaId: string; url: string }) => {
      await supabase.storage.from("despesa-anexos").remove([url]);
      const { error } = await supabase
        .from("despesa_anexos")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      return despesaId;
    },
    onSuccess: (despesaId) => qc.invalidateQueries({ queryKey: ["despesa_anexos", despesaId] }),
  });
};

export const useDownloadDespesaAnexo = () => {
  return async (url: string, nome: string) => {
    const { data, error } = await supabase.storage.from("despesa-anexos").download(url);
    if (error) throw error;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(data);
    a.download = nome;
    a.click();
    URL.revokeObjectURL(a.href);
  };
};
