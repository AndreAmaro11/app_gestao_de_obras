import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const useSubetapas = (etapaId: string | undefined) => {
  return useQuery({
    queryKey: ["subetapas", etapaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subetapas")
        .select("*")
        .eq("etapa_id", etapaId!)
        .is("deleted_at", null)
        .order("ordem");
      if (error) throw error;
      return data;
    },
    enabled: !!etapaId,
  });
};

export const useCreateSubetapa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sub: TablesInsert<"subetapas">) => {
      const { data, error } = await supabase.from("subetapas").insert(sub).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["subetapas", v.etapa_id] }),
  });
};

export const useUpdateSubetapa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"subetapas"> & { id: string; etapa_id: string }) => {
      const { error } = await supabase.from("subetapas").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["subetapas", v.etapa_id] }),
  });
};

export const useDeleteSubetapa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, etapa_id }: { id: string; etapa_id: string }) => {
      const { error } = await supabase.from("subetapas").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return etapa_id;
    },
    onSuccess: (etapa_id) => qc.invalidateQueries({ queryKey: ["subetapas", etapa_id] }),
  });
};
