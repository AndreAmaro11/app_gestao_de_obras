import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const useDespesas = (obraId: string | undefined) => {
  return useQuery({
    queryKey: ["despesas", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas")
        .select("*, etapas(nome), fornecedores(nome)")
        .eq("obra_id", obraId!)
        .is("deleted_at", null)
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!obraId,
  });
};

export const useCreateDespesa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: TablesInsert<"despesas">) => {
      const { data, error } = await supabase.from("despesas").insert(d).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["despesas", v.obra_id] }),
  });
};

export const useUpdateDespesa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"despesas"> & { id: string; obra_id: string }) => {
      const { error } = await supabase.from("despesas").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["despesas", v.obra_id] }),
  });
};

export const useDeleteDespesa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obra_id }: { id: string; obra_id: string }) => {
      const { error } = await supabase.from("despesas").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return obra_id;
    },
    onSuccess: (obra_id) => qc.invalidateQueries({ queryKey: ["despesas", obra_id] }),
  });
};
