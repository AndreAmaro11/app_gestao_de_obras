import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export const useDespesas = (obraId: string | undefined) => {
  return useQuery({
    queryKey: ["despesas", obraId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("despesas")
        .select("*, etapas(nome), subetapas(nome), fornecedores(nome)")
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
    mutationFn: async (d: TablesInsert<"despesas"> & { parcelas?: number; data_vencimento?: string | null }) => {
      const numParcelas = d.parcelas && d.parcelas > 1 ? d.parcelas : 1;

      if (numParcelas > 1 && d.data_vencimento) {
        // Create parent despesa (full value, no parcela_numero)
        const parentPayload = { ...d, parcelas: numParcelas };
        // Remove extra fields not in the table
        delete (parentPayload as any).parcelas_list;
        
        const { data: parent, error: parentErr } = await supabase
          .from("despesas")
          .insert(parentPayload as any)
          .select()
          .single();
        if (parentErr) throw parentErr;

        // Generate child parcelas one by one to avoid batch RLS issues
        const valorParcela = Math.round((d.valor_real || 0) / numParcelas * 100) / 100;
        const valorPrevParcela = Math.round((d.valor_previsto || 0) / numParcelas * 100) / 100;
        const baseDate = new Date(d.data_vencimento + "T12:00:00");

        for (let i = 0; i < numParcelas; i++) {
          const vencimento = new Date(baseDate);
          vencimento.setMonth(vencimento.getMonth() + i);

          const childPayload = {
            obra_id: d.obra_id,
            descricao: `${d.descricao} (${i + 1}/${numParcelas})`,
            etapa_id: d.etapa_id || null,
            subetapa_id: d.subetapa_id || null,
            fornecedor_id: d.fornecedor_id || null,
            categoria: d.categoria || "material",
            valor_previsto: valorPrevParcela,
            valor_real: valorParcela,
            data: d.data || new Date().toISOString().split("T")[0],
            data_vencimento: vencimento.toISOString().split("T")[0],
            condicao_pagamento: d.condicao_pagamento || null,
            parcelas: 1,
            parcela_numero: i + 1,
            despesa_pai_id: parent.id,
            pago: false,
            origem: d.origem || "manual",
          };

          const { error: childErr } = await supabase.from("despesas").insert(childPayload as any);
          if (childErr) {
            console.error(`Error creating parcela ${i + 1}:`, childErr);
            throw childErr;
          }
        }

        return parent;
      } else {
        // Single despesa, no installments
        const { data, error } = await supabase.from("despesas").insert(d as any).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["despesas", v.obra_id] }),
  });
};

export const useUpdateDespesa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"despesas"> & { id: string; obra_id: string }) => {
      const { error } = await supabase.from("despesas").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => qc.invalidateQueries({ queryKey: ["despesas", v.obra_id] }),
  });
};

export const useDeleteDespesa = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, obra_id }: { id: string; obra_id: string }) => {
      // Also soft-delete child parcelas
      await supabase.from("despesas").update({ deleted_at: new Date().toISOString() }).eq("despesa_pai_id", id);
      const { error } = await supabase.from("despesas").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      return obra_id;
    },
    onSuccess: (obra_id) => qc.invalidateQueries({ queryKey: ["despesas", obra_id] }),
  });
};
