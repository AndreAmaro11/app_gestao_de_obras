import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const useFornecedores = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["fornecedores", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*, etapas(nome, obra_id), subetapas(nome)")
        .is("deleted_at", null)
        .order("nome");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateFornecedor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (f: Omit<TablesInsert<"fornecedores">, "user_id"> & { nome_fantasia?: string | null; endereco?: string | null; observacao?: string | null; contato?: string | null; indicacao?: boolean; rede_social?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.from("fornecedores").insert({ ...f, user_id: user.id } as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fornecedores"] }),
  });
};

export const useUpdateFornecedor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"fornecedores"> & { id: string; nome_fantasia?: string | null; endereco?: string | null; observacao?: string | null; contato?: string | null; indicacao?: boolean; rede_social?: string | null }) => {
      const { error } = await supabase.from("fornecedores").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fornecedores"] }),
  });
};

export const useDeleteFornecedor = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fornecedores").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["fornecedores"] }),
  });
};
