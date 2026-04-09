import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useRdos = (obraId: string) => {
  return useQuery({
    queryKey: ["rdo", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rdo")
        .select("*, rdo_midias(*)")
        .eq("obra_id", obraId)
        .is("deleted_at", null)
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!obraId,
  });
};

export const useCreateRdo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rdo: {
      obra_id: string;
      data: string;
      descricao?: string;
      clima?: string;
      etapa_id?: string | null;
      subetapa_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("rdo")
        .insert(rdo)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["rdo", data.obra_id] }),
  });
};

export const useUpdateRdo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obra_id, ...updates }: { id: string; obra_id: string; [key: string]: any }) => {
      const { error } = await supabase.from("rdo").update(updates).eq("id", id);
      if (error) throw error;
      return obra_id;
    },
    onSuccess: (obraId) => qc.invalidateQueries({ queryKey: ["rdo", obraId] }),
  });
};

export const useDeleteRdo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obra_id }: { id: string; obra_id: string }) => {
      const { error } = await supabase.from("rdo").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return obra_id;
    },
    onSuccess: (obraId) => qc.invalidateQueries({ queryKey: ["rdo", obraId] }),
  });
};

export const useUploadRdoMidia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ rdoId, obraId, file, descricao }: { rdoId: string; obraId: string; file: File; descricao?: string }) => {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
      const tipo = file.type.startsWith("video/") ? "video" : "foto";
      const path = `${obraId}/${rdoId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from("rdo-midias").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("rdo-midias").getPublicUrl(path);

      const { data, error } = await supabase
        .from("rdo_midias")
        .insert({
          rdo_id: rdoId,
          url: urlData.publicUrl,
          tipo,
          descricao: descricao || null,
        })
        .select()
        .single();
      if (error) throw error;
      return { ...data, obra_id: obraId };
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ["rdo", data.obra_id] }),
  });
};

export const useDeleteRdoMidia = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obraId }: { id: string; obraId: string }) => {
      const { error } = await supabase.from("rdo_midias").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return obraId;
    },
    onSuccess: (obraId) => qc.invalidateQueries({ queryKey: ["rdo", obraId] }),
  });
};
