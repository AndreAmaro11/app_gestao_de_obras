import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

export const useChecklist = (obraId: string | undefined) => {
  return useQuery({
    queryKey: ["checklist", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist")
        .select("*, etapas(nome)")
        .eq("etapas.obra_id", obraId!)
        .is("deleted_at", null)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!obraId,
  });
};

// Alternative: fetch checklist by etapa_ids directly
export const useChecklistByObra = (obraId: string | undefined) => {
  return useQuery({
    queryKey: ["checklist", obraId],
    queryFn: async () => {
      // First get etapa ids for this obra
      const { data: etapas } = await supabase
        .from("etapas")
        .select("id")
        .eq("obra_id", obraId!)
        .is("deleted_at", null);
      
      if (!etapas || etapas.length === 0) return [];
      
      const etapaIds = etapas.map(e => e.id);
      const { data, error } = await supabase
        .from("checklist")
        .select("*, etapas(nome)")
        .in("etapa_id", etapaIds)
        .is("deleted_at", null)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!obraId,
  });
};

export const useCreateChecklistItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: TablesInsert<"checklist"> & { obra_id?: string }) => {
      const { obra_id, ...insert } = item;
      const { data, error } = await supabase.from("checklist").insert(insert).select().single();
      if (error) throw error;
      return { ...data, obra_id };
    },
    onSuccess: (d) => qc.invalidateQueries({ queryKey: ["checklist"] }),
  });
};

export const useToggleChecklist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, concluido }: { id: string; concluido: boolean }) => {
      const { error } = await supabase.from("checklist").update({ concluido }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklist"] }),
  });
};

export const useDeleteChecklistItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklist").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checklist"] }),
  });
};
