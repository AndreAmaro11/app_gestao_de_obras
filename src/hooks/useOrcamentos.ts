import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const useOrcamentos = (obraId: string | undefined) => {
  return useQuery({
    queryKey: ["orcamentos", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
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

export const useCreateOrcamento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orc: TablesInsert<"orcamentos">) => {
      const { data, error } = await supabase.from("orcamentos").insert(orc).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["orcamentos", v.obra_id] }),
  });
};

export const useUpdateOrcamento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"orcamentos"> & { id: string; obra_id: string }) => {
      const { error } = await supabase.from("orcamentos").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["orcamentos", v.obra_id] }),
  });
};

export const useDeleteOrcamento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obra_id }: { id: string; obra_id: string }) => {
      const { error } = await supabase.from("orcamentos").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return obra_id;
    },
    onSuccess: (obra_id) => qc.invalidateQueries({ queryKey: ["orcamentos", obra_id] }),
  });
};

export const useOrcamentoItens = (orcamentoId: string | undefined) => {
  return useQuery({
    queryKey: ["orcamento_itens", orcamentoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamento_itens")
        .select("*, etapas(nome)")
        .eq("orcamento_id", orcamentoId!)
        .is("deleted_at", null);
      if (error) throw error;
      return data;
    },
    enabled: !!orcamentoId,
  });
};

export const useCreateOrcamentoItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: TablesInsert<"orcamento_itens">) => {
      const { data, error } = await supabase.from("orcamento_itens").insert(item).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["orcamento_itens", v.orcamento_id] }),
  });
};

export const useUpdateOrcamentoItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orcamento_id, ...updates }: { id: string; orcamento_id: string; [key: string]: any }) => {
      const { error } = await supabase.from("orcamento_itens").update(updates).eq("id", id);
      if (error) throw error;
      return orcamento_id;
    },
    onSuccess: (orcamento_id) => qc.invalidateQueries({ queryKey: ["orcamento_itens", orcamento_id] }),
  });
};

export const useDeleteOrcamentoItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orcamento_id }: { id: string; orcamento_id: string }) => {
      const { error } = await supabase.from("orcamento_itens").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return orcamento_id;
    },
    onSuccess: (orcamento_id) => qc.invalidateQueries({ queryKey: ["orcamento_itens", orcamento_id] }),
  });
};

export const useUpdateCotacao = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orcamento_item_id, ...updates }: { id: string; orcamento_item_id: string; [key: string]: any }) => {
      const { error } = await supabase.from("cotacoes").update(updates).eq("id", id);
      if (error) throw error;
      return orcamento_item_id;
    },
    onSuccess: (orcamento_item_id) => qc.invalidateQueries({ queryKey: ["cotacoes", orcamento_item_id] }),
  });
};

export const useCotacoes = (itemId: string | undefined) => {
  return useQuery({
    queryKey: ["cotacoes", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cotacoes")
        .select("*, fornecedores(nome, telefone)")
        .eq("orcamento_item_id", itemId!)
        .is("deleted_at", null);
      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });
};

export const useCreateCotacao = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cot: TablesInsert<"cotacoes">) => {
      const { data, error } = await supabase.from("cotacoes").insert(cot).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["cotacoes", v.orcamento_item_id] }),
  });
};

export const useDeleteCotacao = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orcamento_item_id }: { id: string; orcamento_item_id: string }) => {
      const { error } = await supabase.from("cotacoes").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return orcamento_item_id;
    },
    onSuccess: (orcamento_item_id) => qc.invalidateQueries({ queryKey: ["cotacoes", orcamento_item_id] }),
  });
};

// Select cotacao AND auto-generate despesa
export const useSelectCotacao = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orcamento_item_id, obraId }: { id: string; orcamento_item_id: string; obraId: string }) => {
      // Deselect all others
      await supabase.from("cotacoes").update({ selecionado: false }).eq("orcamento_item_id", orcamento_item_id);
      // Select chosen
      const { error } = await supabase.from("cotacoes").update({ selecionado: true }).eq("id", id);
      if (error) throw error;

      // Fetch item + cotacao details for despesa generation
      const { data: cotacao } = await supabase.from("cotacoes").select("*, fornecedores(nome)").eq("id", id).single();
      const { data: item } = await supabase.from("orcamento_itens").select("*").eq("id", orcamento_item_id).single();

      if (cotacao && item) {
        // Remove previous auto-generated despesas for this item
        await supabase.from("despesas")
          .update({ deleted_at: new Date().toISOString() })
          .eq("obra_id", obraId)
          .eq("origem", "orcamento")
          .eq("descricao", item.descricao);

        // Create new despesa
        await supabase.from("despesas").insert({
          obra_id: obraId,
          etapa_id: item.etapa_id,
          subetapa_id: item.subetapa_id || null,
          fornecedor_id: cotacao.fornecedor_id,
          descricao: item.descricao,
          categoria: "material" as const,
          valor_previsto: cotacao.valor_unitario * item.quantidade,
          valor_real: 0,
          pago: false,
          origem: "orcamento" as const,
        });
      }

      return { orcamento_item_id, obraId };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["cotacoes", result.orcamento_item_id] });
      qc.invalidateQueries({ queryKey: ["despesas", result.obraId] });
    },
  });
};

// Keep for backwards compatibility but no longer primary flow
export const useAprovarOrcamento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orcamentoId, obraId }: { orcamentoId: string; obraId: string }) => {
      const { error: statusError } = await supabase.from("orcamentos").update({ status: "aprovado" }).eq("id", orcamentoId);
      if (statusError) throw statusError;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["orcamentos", v.obraId] });
    },
  });
};
