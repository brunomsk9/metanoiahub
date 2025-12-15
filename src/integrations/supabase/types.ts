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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      courses: {
        Row: {
          created_at: string
          descricao: string | null
          duracao_minutos: number | null
          id: string
          ordem: number
          thumbnail: string | null
          titulo: string
          track_id: string
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          ordem?: number
          thumbnail?: string | null
          titulo: string
          track_id: string
        }
        Update: {
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          ordem?: number
          thumbnail?: string | null
          titulo?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_habits: {
        Row: {
          completed_date: string
          created_at: string
          habit_type: string
          id: string
          user_id: string
        }
        Insert: {
          completed_date?: string
          created_at?: string
          habit_type: string
          id?: string
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          habit_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          checklist_items: Json | null
          course_id: string
          created_at: string
          duracao_minutos: number | null
          id: string
          material_url: string | null
          ordem: number
          texto_apoio: string | null
          tipo: Database["public"]["Enums"]["lesson_type"]
          titulo: string
          video_url: string | null
        }
        Insert: {
          checklist_items?: Json | null
          course_id: string
          created_at?: string
          duracao_minutos?: number | null
          id?: string
          material_url?: string | null
          ordem?: number
          texto_apoio?: string | null
          tipo?: Database["public"]["Enums"]["lesson_type"]
          titulo: string
          video_url?: string | null
        }
        Update: {
          checklist_items?: Json | null
          course_id?: string
          created_at?: string
          duracao_minutos?: number | null
          id?: string
          material_url?: string | null
          ordem?: number
          texto_apoio?: string | null
          tipo?: Database["public"]["Enums"]["lesson_type"]
          titulo?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          current_streak: number
          id: string
          nome: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          xp_points: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          id: string
          nome?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          xp_points?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          current_streak?: number
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          xp_points?: number
        }
        Relationships: []
      }
      resources: {
        Row: {
          categoria: Database["public"]["Enums"]["resource_category"]
          created_at: string
          descricao: string | null
          id: string
          tags: string[] | null
          titulo: string
          url_pdf: string | null
          video_url: string | null
        }
        Insert: {
          categoria?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          descricao?: string | null
          id?: string
          tags?: string[] | null
          titulo: string
          url_pdf?: string | null
          video_url?: string | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["resource_category"]
          created_at?: string
          descricao?: string | null
          id?: string
          tags?: string[] | null
          titulo?: string
          url_pdf?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      tracks: {
        Row: {
          categoria: string
          cover_image: string | null
          created_at: string
          descricao: string | null
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          categoria: string
          cover_image?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo: string
        }
        Update: {
          categoria?: string
          cover_image?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          checklist_progress: Json | null
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          checklist_progress?: Json | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          checklist_progress?: Json | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "discipulo" | "discipulador" | "admin"
      lesson_type: "video" | "texto" | "checklist_interativo"
      resource_category: "sos" | "devocional" | "estudo" | "apoio"
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
      app_role: ["discipulo", "discipulador", "admin"],
      lesson_type: ["video", "texto", "checklist_interativo"],
      resource_category: ["sos", "devocional", "estudo", "apoio"],
    },
  },
} as const
