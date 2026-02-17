import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useObraImagens = (obraId: string | undefined) => {
  return useQuery({
    queryKey: ["obra_imagens", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obra_imagens")
        .select("*")
        .eq("obra_id", obraId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!obraId,
  });
};

export const useObraCapaUrl = (obraId: string | undefined) => {
  return useQuery({
    queryKey: ["obra_capa", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("obra_imagens")
        .select("url")
        .eq("obra_id", obraId!)
        .eq("is_capa", true)
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.url || null;
    },
    enabled: !!obraId,
  });
};

export const useUploadObraImagem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ obraId, file }: { obraId: string; file: File }) => {
      const ext = file.name.split(".").pop();
      const path = `${obraId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("obra-imagens").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("obra-imagens").getPublicUrl(path);
      const { data, error } = await supabase
        .from("obra_imagens")
        .insert({ obra_id: obraId, url: urlData.publicUrl })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["obra_imagens", data.obra_id] });
      qc.invalidateQueries({ queryKey: ["obra_capa", data.obra_id] });
    },
  });
};

export const useSetCapa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ imagemId, obraId }: { imagemId: string; obraId: string }) => {
      // Remove capa from all
      await supabase.from("obra_imagens").update({ is_capa: false }).eq("obra_id", obraId);
      // Set new capa
      const { error } = await supabase.from("obra_imagens").update({ is_capa: true }).eq("id", imagemId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["obra_imagens", vars.obraId] });
      qc.invalidateQueries({ queryKey: ["obra_capa", vars.obraId] });
    },
  });
};

export const useDeleteObraImagem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ imagemId, obraId }: { imagemId: string; obraId: string }) => {
      const { error } = await supabase
        .from("obra_imagens")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", imagemId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["obra_imagens", vars.obraId] });
      qc.invalidateQueries({ queryKey: ["obra_capa", vars.obraId] });
    },
  });
};
