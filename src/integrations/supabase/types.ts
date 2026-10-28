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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          is_shared: boolean
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_shared?: boolean
          name: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_shared?: boolean
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conditions: {
        Row: {
          category_id: string | null
          created_at: string
          data: string
          history_physical: string
          id: string
          imaging: string
          is_shared: boolean
          labs: string
          position: number
          recommendations: string
          subsection_id: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          data?: string
          history_physical?: string
          id?: string
          imaging?: string
          is_shared?: boolean
          labs?: string
          position?: number
          recommendations?: string
          subsection_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          data?: string
          history_physical?: string
          id?: string
          imaging?: string
          is_shared?: boolean
          labs?: string
          position?: number
          recommendations?: string
          subsection_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conditions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conditions_subsection_id_fkey"
            columns: ["subsection_id"]
            isOneToOne: false
            referencedRelation: "subsections"
            referencedColumns: ["id"]
          },
        ]
      }
      dot_phrases: {
        Row: {
          created_at: string
          expansion: string
          id: string
          is_shared: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expansion?: string
          id?: string
          is_shared?: boolean
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          expansion?: string
          id?: string
          is_shared?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      entries: {
        Row: {
          approach: string | null
          attending: string
          category_id: string | null
          created_at: string
          hospital: string
          id: string
          indications: string
          is_shared: boolean
          key_steps: string
          pearls: string
          performed_month: number | null
          performed_year: number | null
          pitfalls: string
          setup: string
          subsection_id: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approach?: string | null
          attending?: string
          category_id?: string | null
          created_at?: string
          hospital?: string
          id?: string
          indications?: string
          is_shared?: boolean
          key_steps?: string
          pearls?: string
          performed_month?: number | null
          performed_year?: number | null
          pitfalls?: string
          setup?: string
          subsection_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          approach?: string | null
          attending?: string
          category_id?: string | null
          created_at?: string
          hospital?: string
          id?: string
          indications?: string
          is_shared?: boolean
          key_steps?: string
          pearls?: string
          performed_month?: number | null
          performed_year?: number | null
          pitfalls?: string
          setup?: string
          subsection_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_subsection_id_fkey"
            columns: ["subsection_id"]
            isOneToOne: false
            referencedRelation: "subsections"
            referencedColumns: ["id"]
          },
        ]
      }
      op_note_templates: {
        Row: {
          body: string
          category_id: string | null
          created_at: string
          id: string
          is_shared: boolean
          operation_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          category_id?: string | null
          created_at?: string
          id?: string
          is_shared?: boolean
          operation_id?: string | null
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string
          category_id?: string | null
          created_at?: string
          id?: string
          is_shared?: boolean
          operation_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "op_note_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "op_note_templates_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operations"
            referencedColumns: ["id"]
          },
        ]
      }
      operations: {
        Row: {
          approach: string | null
          category_id: string | null
          condition_ids: string[]
          created_at: string
          id: string
          intra_op: string
          is_shared: boolean
          pearls_pitfalls: string
          position: number
          post_op: string
          pre_op: string
          setup: string
          subsection_id: string | null
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approach?: string | null
          category_id?: string | null
          condition_ids?: string[]
          created_at?: string
          id?: string
          intra_op?: string
          is_shared?: boolean
          pearls_pitfalls?: string
          position?: number
          post_op?: string
          pre_op?: string
          setup?: string
          subsection_id?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          approach?: string | null
          category_id?: string | null
          condition_ids?: string[]
          created_at?: string
          id?: string
          intra_op?: string
          is_shared?: boolean
          pearls_pitfalls?: string
          position?: number
          post_op?: string
          pre_op?: string
          setup?: string
          subsection_id?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operations_subsection_id_fkey"
            columns: ["subsection_id"]
            isOneToOne: false
            referencedRelation: "subsections"
            referencedColumns: ["id"]
          },
        ]
      }
      order_sets: {
        Row: {
          activity: string
          category_id: string | null
          created_at: string
          diet: string
          discharge: string
          drains: string
          eras: string
          id: string
          is_shared: boolean
          labs: string
          linked_entry_ids: string[]
          pain: string
          procedure: string
          updated_at: string
          user_id: string
          variations: string
          vte: string
        }
        Insert: {
          activity?: string
          category_id?: string | null
          created_at?: string
          diet?: string
          discharge?: string
          drains?: string
          eras?: string
          id?: string
          is_shared?: boolean
          labs?: string
          linked_entry_ids?: string[]
          pain?: string
          procedure: string
          updated_at?: string
          user_id?: string
          variations?: string
          vte?: string
        }
        Update: {
          activity?: string
          category_id?: string | null
          created_at?: string
          diet?: string
          discharge?: string
          drains?: string
          eras?: string
          id?: string
          is_shared?: boolean
          labs?: string
          linked_entry_ids?: string[]
          pain?: string
          procedure?: string
          updated_at?: string
          user_id?: string
          variations?: string
          vte?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_sets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      popouts: {
        Row: {
          body: string
          created_at: string
          id: string
          is_shared: boolean
          parent_id: string
          parent_type: string
          position: number
          section: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_shared?: boolean
          parent_id: string
          parent_type: string
          position?: number
          section: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_shared?: boolean
          parent_id?: string
          parent_type?: string
          position?: number
          section?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      preference_cards: {
        Row: {
          attending: string
          created_at: string
          custom: Json
          hospital: string
          id: string
          instruments: string
          is_shared: boolean
          notes: string
          operation_id: string
          position: number
          positioning: string
          steps: string
          sutures_drains: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attending?: string
          created_at?: string
          custom?: Json
          hospital?: string
          id?: string
          instruments?: string
          is_shared?: boolean
          notes?: string
          operation_id: string
          position?: number
          positioning?: string
          steps?: string
          sutures_drains?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          attending?: string
          created_at?: string
          custom?: Json
          hospital?: string
          id?: string
          instruments?: string
          is_shared?: boolean
          notes?: string
          operation_id?: string
          position?: number
          positioning?: string
          steps?: string
          sutures_drains?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preference_cards_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "operations"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_links: {
        Row: {
          created_at: string
          id: string
          is_shared: boolean
          note: string
          position: number
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_shared?: boolean
          note?: string
          position?: number
          title: string
          updated_at?: string
          url: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_shared?: boolean
          note?: string
          position?: number
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      subsections: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subsections_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          card_fields: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_fields?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          card_fields?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      seed_default_categories: { Args: { _uid: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
