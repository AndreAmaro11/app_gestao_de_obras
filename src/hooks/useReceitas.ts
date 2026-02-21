import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Receita {
  id: string;
  obra_id: string;
  descricao: string;
  tipo: string;
  valor: number;
  data_inicio: string;
  recorrente: boolean;
  meses_repeticao: number;
  observacao: string | null;
  created_at: string;
  deleted_at: string | null;
}

export const useReceitas = (obraId: string | undefined) => {
  return useQuery({
    queryKey: ["receitas", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receitas" as any)
        .select("*")
        .eq("obra_id", obraId!)
        .is("deleted_at", null)
        .order("data_inicio", { ascending: true });
      if (error) throw error;
      return data as unknown as Receita[];
    },
    enabled: !!obraId,
  });
};

export const useCreateReceita = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Omit<Receita, "id" | "created_at" | "deleted_at">) => {
      const { data, error } = await supabase
        .from("receitas" as any)
        .insert(r as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["receitas", v.obra_id] }),
  });
};

export const useUpdateReceita = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obra_id, ...updates }: Partial<Receita> & { id: string; obra_id: string }) => {
      const { error } = await supabase
        .from("receitas" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["receitas", v.obra_id] }),
  });
};

export const useDeleteReceita = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obra_id }: { id: string; obra_id: string }) => {
      const { error } = await supabase
        .from("receitas" as any)
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
      return obra_id;
    },
    onSuccess: (obra_id) => qc.invalidateQueries({ queryKey: ["receitas", obra_id] }),
  });
};
