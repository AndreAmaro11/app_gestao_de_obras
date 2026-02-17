export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checklist: {
        Row: {
          concluido: boolean
          created_at: string
          deleted_at: string | null
          etapa_id: string
          id: string
          item: string
          observacao: string | null
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          deleted_at?: string | null
          etapa_id: string
          id?: string
          item: string
          observacao?: string | null
        }
        Update: {
          concluido?: boolean
          created_at?: string
          deleted_at?: string | null
          etapa_id?: string
          id?: string
          item?: string
          observacao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
        ]
      }
      cotacoes: {
        Row: {
          deleted_at: string | null
          fornecedor_id: string | null
          id: string
          observacao: string | null
          orcamento_item_id: string
          prazo_entrega: string | null
          selecionado: boolean
          valor_unitario: number
        }
        Insert: {
          deleted_at?: string | null
          fornecedor_id?: string | null
          id?: string
          observacao?: string | null
          orcamento_item_id: string
          prazo_entrega?: string | null
          selecionado?: boolean
          valor_unitario?: number
        }
        Update: {
          deleted_at?: string | null
          fornecedor_id?: string | null
          id?: string
          observacao?: string | null
          orcamento_item_id?: string
          prazo_entrega?: string | null
          selecionado?: boolean
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotacoes_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotacoes_orcamento_item_id_fkey"
            columns: ["orcamento_item_id"]
            isOneToOne: false
            referencedRelation: "orcamento_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas: {
        Row: {
          categoria: Database["public"]["Enums"]["categoria_despesa"]
          condicao_pagamento: string | null
          data: string
          data_vencimento: string | null
          deleted_at: string | null
          descricao: string
          etapa_id: string | null
          fornecedor_id: string | null
          id: string
          obra_id: string
          origem: Database["public"]["Enums"]["origem_despesa"]
          pago: boolean
          parcelas: number | null
          subetapa_id: string | null
          valor_previsto: number
          valor_real: number
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["categoria_despesa"]
          condicao_pagamento?: string | null
          data?: string
          data_vencimento?: string | null
          deleted_at?: string | null
          descricao: string
          etapa_id?: string | null
          fornecedor_id?: string | null
          id?: string
          obra_id: string
          origem?: Database["public"]["Enums"]["origem_despesa"]
          pago?: boolean
          parcelas?: number | null
          subetapa_id?: string | null
          valor_previsto?: number
          valor_real?: number
        }
        Update: {
          categoria?: Database["public"]["Enums"]["categoria_despesa"]
          condicao_pagamento?: string | null
          data?: string
          data_vencimento?: string | null
          deleted_at?: string | null
          descricao?: string
          etapa_id?: string | null
          fornecedor_id?: string | null
          id?: string
          obra_id?: string
          origem?: Database["public"]["Enums"]["origem_despesa"]
          pago?: boolean
          parcelas?: number | null
          subetapa_id?: string | null
          valor_previsto?: number
          valor_real?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "despesas_subetapa_id_fkey"
            columns: ["subetapa_id"]
            isOneToOne: false
            referencedRelation: "subetapas"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas: {
        Row: {
          deleted_at: string | null
          dependencia: string | null
          fim_previsto: string | null
          fim_real: string | null
          id: string
          inicio_previsto: string | null
          inicio_real: string | null
          nome: string
          obra_id: string
          ordem: number
          percentual_concluido: number
          status: Database["public"]["Enums"]["status_etapa"]
        }
        Insert: {
          deleted_at?: string | null
          dependencia?: string | null
          fim_previsto?: string | null
          fim_real?: string | null
          id?: string
          inicio_previsto?: string | null
          inicio_real?: string | null
          nome: string
          obra_id: string
          ordem?: number
          percentual_concluido?: number
          status?: Database["public"]["Enums"]["status_etapa"]
        }
        Update: {
          deleted_at?: string | null
          dependencia?: string | null
          fim_previsto?: string | null
          fim_real?: string | null
          id?: string
          inicio_previsto?: string | null
          inicio_real?: string | null
          nome?: string
          obra_id?: string
          ordem?: number
          percentual_concluido?: number
          status?: Database["public"]["Enums"]["status_etapa"]
        }
        Relationships: [
          {
            foreignKeyName: "etapas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          cnpj: string | null
          deleted_at: string | null
          email: string | null
          etapa_id: string | null
          id: string
          nome: string
          subetapa_id: string | null
          tags: string[] | null
          telefone: string | null
          tipo: Database["public"]["Enums"]["tipo_fornecedor"]
          user_id: string
        }
        Insert: {
          cnpj?: string | null
          deleted_at?: string | null
          email?: string | null
          etapa_id?: string | null
          id?: string
          nome: string
          subetapa_id?: string | null
          tags?: string[] | null
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["tipo_fornecedor"]
          user_id: string
        }
        Update: {
          cnpj?: string | null
          deleted_at?: string | null
          email?: string | null
          etapa_id?: string | null
          id?: string
          nome?: string
          subetapa_id?: string | null
          tags?: string[] | null
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["tipo_fornecedor"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fornecedores_subetapa_id_fkey"
            columns: ["subetapa_id"]
            isOneToOne: false
            referencedRelation: "subetapas"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          created_at: string
          data_inicio: string | null
          data_previsao_fim: string | null
          deleted_at: string | null
          id: string
          metragem: number | null
          nome: string
          padrao: Database["public"]["Enums"]["padrao_obra"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data_inicio?: string | null
          data_previsao_fim?: string | null
          deleted_at?: string | null
          id?: string
          metragem?: number | null
          nome: string
          padrao?: Database["public"]["Enums"]["padrao_obra"]
          user_id: string
        }
        Update: {
          created_at?: string
          data_inicio?: string | null
          data_previsao_fim?: string | null
          deleted_at?: string | null
          id?: string
          metragem?: number | null
          nome?: string
          padrao?: Database["public"]["Enums"]["padrao_obra"]
          user_id?: string
        }
        Relationships: []
      }
      orcamento_itens: {
        Row: {
          deleted_at: string | null
          descricao: string
          etapa_id: string | null
          id: string
          orcamento_id: string
          quantidade: number
          subetapa_id: string | null
          unidade: string
          valor_estimado_unitario: number
        }
        Insert: {
          deleted_at?: string | null
          descricao: string
          etapa_id?: string | null
          id?: string
          orcamento_id: string
          quantidade?: number
          subetapa_id?: string | null
          unidade?: string
          valor_estimado_unitario?: number
        }
        Update: {
          deleted_at?: string | null
          descricao?: string
          etapa_id?: string | null
          id?: string
          orcamento_id?: string
          quantidade?: number
          subetapa_id?: string | null
          unidade?: string
          valor_estimado_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_subetapa_id_fkey"
            columns: ["subetapa_id"]
            isOneToOne: false
            referencedRelation: "subetapas"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          nome: string
          obra_id: string
          status: Database["public"]["Enums"]["status_orcamento"]
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome: string
          obra_id: string
          status?: Database["public"]["Enums"]["status_orcamento"]
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          nome?: string
          obra_id?: string
          status?: Database["public"]["Enums"]["status_orcamento"]
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      subetapas: {
        Row: {
          deleted_at: string | null
          etapa_id: string
          fim_previsto: string | null
          fim_real: string | null
          id: string
          inicio_previsto: string | null
          inicio_real: string | null
          nome: string
          ordem: number
          percentual_concluido: number
          status: Database["public"]["Enums"]["status_etapa"]
        }
        Insert: {
          deleted_at?: string | null
          etapa_id: string
          fim_previsto?: string | null
          fim_real?: string | null
          id?: string
          inicio_previsto?: string | null
          inicio_real?: string | null
          nome: string
          ordem?: number
          percentual_concluido?: number
          status?: Database["public"]["Enums"]["status_etapa"]
        }
        Update: {
          deleted_at?: string | null
          etapa_id?: string
          fim_previsto?: string | null
          fim_real?: string | null
          id?: string
          inicio_previsto?: string | null
          inicio_real?: string | null
          nome?: string
          ordem?: number
          percentual_concluido?: number
          status?: Database["public"]["Enums"]["status_etapa"]
        }
        Relationships: [
          {
            foreignKeyName: "subetapas_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categoria_despesa: "material" | "mao_de_obra" | "servico"
      origem_despesa: "manual" | "orcamento"
      padrao_obra: "baixo" | "medio" | "alto"
      status_etapa: "nao_iniciada" | "em_andamento" | "concluida"
      status_orcamento: "rascunho" | "em_cotacao" | "aprovado" | "fechado"
      tipo_fornecedor: "material" | "mao_de_obra" | "misto"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      categoria_despesa: ["material", "mao_de_obra", "servico"],
      origem_despesa: ["manual", "orcamento"],
      padrao_obra: ["baixo", "medio", "alto"],
      status_etapa: ["nao_iniciada", "em_andamento", "concluida"],
      status_orcamento: ["rascunho", "em_cotacao", "aprovado", "fechado"],
      tipo_fornecedor: ["material", "mao_de_obra", "misto"],
    },
  },
} as const
