import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const useEtapas = (obraId: string | undefined) => {
  return useQuery({
    queryKey: ["etapas", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("etapas")
        .select("*")
        .eq("obra_id", obraId!)
        .is("deleted_at", null)
        .order("ordem");
      if (error) throw error;
      return data;
    },
    enabled: !!obraId,
  });
};

export const useCreateEtapa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (etapa: TablesInsert<"etapas">) => {
      const { data, error } = await supabase.from("etapas").insert(etapa).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["etapas", v.obra_id] }),
  });
};

export const useUpdateEtapa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"etapas"> & { id: string; obra_id: string }) => {
      const { error } = await supabase.from("etapas").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["etapas", v.obra_id] }),
  });
};

export const useDeleteEtapa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obra_id }: { id: string; obra_id: string }) => {
      const { error } = await supabase.from("etapas").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return obra_id;
    },
    onSuccess: (obra_id) => qc.invalidateQueries({ queryKey: ["etapas", obra_id] }),
  });
};
