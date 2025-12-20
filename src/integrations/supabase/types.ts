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
      ai_prompt_history: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          new_value: string
          old_value: string | null
          setting_key: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          new_value: string
          old_value?: string | null
          setting_key: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          new_value?: string
          old_value?: string | null
          setting_key?: string
        }
        Relationships: []
      }
      ai_settings: {
        Row: {
          church_id: string | null
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          church_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          church_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_settings_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      churches: {
        Row: {
          configuracoes: Json | null
          cor_primaria: string | null
          cor_secundaria: string | null
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          nome: string
          slug: string
          updated_at: string
        }
        Insert: {
          configuracoes?: Json | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          nome: string
          slug: string
          updated_at?: string
        }
        Update: {
          configuracoes?: Json | null
          cor_primaria?: string | null
          cor_secundaria?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          nome?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          church_id: string | null
          created_at: string
          descricao: string | null
          duracao_minutos: number | null
          id: string
          ordem: number
          publico_alvo: Database["public"]["Enums"]["app_role"][]
          thumbnail: string | null
          titulo: string
          track_id: string
        }
        Insert: {
          church_id?: string | null
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          ordem?: number
          publico_alvo?: Database["public"]["Enums"]["app_role"][]
          thumbnail?: string | null
          titulo: string
          track_id: string
        }
        Update: {
          church_id?: string | null
          created_at?: string
          descricao?: string | null
          duracao_minutos?: number | null
          id?: string
          ordem?: number
          publico_alvo?: Database["public"]["Enums"]["app_role"][]
          thumbnail?: string | null
          titulo?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
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
      discipleship_history: {
        Row: {
          change_type: string
          changed_by: string
          church_id: string | null
          created_at: string
          discipulo_id: string
          id: string
          new_discipulador_id: string | null
          notes: string | null
          old_discipulador_id: string | null
        }
        Insert: {
          change_type: string
          changed_by: string
          church_id?: string | null
          created_at?: string
          discipulo_id: string
          id?: string
          new_discipulador_id?: string | null
          notes?: string | null
          old_discipulador_id?: string | null
        }
        Update: {
          change_type?: string
          changed_by?: string
          church_id?: string | null
          created_at?: string
          discipulo_id?: string
          id?: string
          new_discipulador_id?: string | null
          notes?: string | null
          old_discipulador_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipleship_history_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      discipleship_notes: {
        Row: {
          created_at: string
          discipulador_id: string
          id: string
          notes: string | null
          relationship_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discipulador_id: string
          id?: string
          notes?: string | null
          relationship_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discipulador_id?: string
          id?: string
          notes?: string | null
          relationship_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipleship_notes_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: true
            referencedRelation: "discipleship_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      discipleship_relationships: {
        Row: {
          academia_nivel_1: boolean | null
          academia_nivel_2: boolean | null
          academia_nivel_3: boolean | null
          academia_nivel_4: boolean | null
          alicerce_completed_at: string | null
          alicerce_completed_presencial: boolean | null
          church_id: string | null
          completed_at: string | null
          conexao_inicial_1: boolean | null
          conexao_inicial_2: boolean | null
          created_at: string
          discipulador_id: string
          discipulo_id: string
          id: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          academia_nivel_1?: boolean | null
          academia_nivel_2?: boolean | null
          academia_nivel_3?: boolean | null
          academia_nivel_4?: boolean | null
          alicerce_completed_at?: string | null
          alicerce_completed_presencial?: boolean | null
          church_id?: string | null
          completed_at?: string | null
          conexao_inicial_1?: boolean | null
          conexao_inicial_2?: boolean | null
          created_at?: string
          discipulador_id: string
          discipulo_id: string
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          academia_nivel_1?: boolean | null
          academia_nivel_2?: boolean | null
          academia_nivel_3?: boolean | null
          academia_nivel_4?: boolean | null
          alicerce_completed_at?: string | null
          alicerce_completed_presencial?: boolean | null
          church_id?: string | null
          completed_at?: string | null
          conexao_inicial_1?: boolean | null
          conexao_inicial_2?: boolean | null
          created_at?: string
          discipulador_id?: string
          discipulo_id?: string
          id?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discipleship_relationships_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_achievements: {
        Row: {
          achieved_at: string
          achievement_type: string
          id: string
          streak_days: number
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_type: string
          id?: string
          streak_days: number
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_type?: string
          id?: string
          streak_days?: number
          user_id?: string
        }
        Relationships: []
      }
      habit_definitions: {
        Row: {
          church_id: string | null
          color: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          name: string
          ordem: number
        }
        Insert: {
          church_id?: string | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          ordem?: number
        }
        Update: {
          church_id?: string | null
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "habit_definitions_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_streaks: {
        Row: {
          best_streak: number
          current_streak: number
          id: string
          last_completed_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          best_streak?: number
          current_streak?: number
          id?: string
          last_completed_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          best_streak?: number
          current_streak?: number
          id?: string
          last_completed_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          checklist_items: Json | null
          church_id: string | null
          course_id: string
          created_at: string
          duracao_minutos: number | null
          id: string
          materiais: Json | null
          ordem: number
          texto_apoio: string | null
          tipo: Database["public"]["Enums"]["lesson_type"]
          tipo_material: string | null
          titulo: string
          url_pdf: string | null
          video_url: string | null
        }
        Insert: {
          checklist_items?: Json | null
          church_id?: string | null
          course_id: string
          created_at?: string
          duracao_minutos?: number | null
          id?: string
          materiais?: Json | null
          ordem?: number
          texto_apoio?: string | null
          tipo?: Database["public"]["Enums"]["lesson_type"]
          tipo_material?: string | null
          titulo: string
          url_pdf?: string | null
          video_url?: string | null
        }
        Update: {
          checklist_items?: Json | null
          church_id?: string | null
          course_id?: string
          created_at?: string
          duracao_minutos?: number | null
          id?: string
          materiais?: Json | null
          ordem?: number
          texto_apoio?: string | null
          tipo?: Database["public"]["Enums"]["lesson_type"]
          tipo_material?: string | null
          titulo?: string
          url_pdf?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendance: {
        Row: {
          created_at: string
          discipulo_id: string
          id: string
          meeting_id: string
          presente: boolean
        }
        Insert: {
          created_at?: string
          discipulo_id: string
          id?: string
          meeting_id: string
          presente?: boolean
        }
        Update: {
          created_at?: string
          discipulo_id?: string
          id?: string
          meeting_id?: string
          presente?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          church_id: string | null
          created_at: string
          data_encontro: string
          discipulador_id: string
          discipulo_id: string | null
          id: string
          local: string | null
          notas: string | null
          tipo: Database["public"]["Enums"]["meeting_type"]
        }
        Insert: {
          church_id?: string | null
          created_at?: string
          data_encontro?: string
          discipulador_id: string
          discipulo_id?: string | null
          id?: string
          local?: string | null
          notas?: string | null
          tipo?: Database["public"]["Enums"]["meeting_type"]
        }
        Update: {
          church_id?: string | null
          created_at?: string
          data_encontro?: string
          discipulador_id?: string
          discipulo_id?: string | null
          id?: string
          local?: string | null
          notas?: string | null
          tipo?: Database["public"]["Enums"]["meeting_type"]
        }
        Relationships: [
          {
            foreignKeyName: "meetings_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          church_id: string | null
          created_at: string
          current_streak: number
          id: string
          needs_password_change: boolean
          nome: string
          onboarding_completed: boolean
          role: Database["public"]["Enums"]["app_role"]
          telefone: string | null
          updated_at: string
          xp_points: number
        }
        Insert: {
          avatar_url?: string | null
          church_id?: string | null
          created_at?: string
          current_streak?: number
          id: string
          needs_password_change?: boolean
          nome?: string
          onboarding_completed?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          telefone?: string | null
          updated_at?: string
          xp_points?: number
        }
        Update: {
          avatar_url?: string | null
          church_id?: string | null
          created_at?: string
          current_streak?: number
          id?: string
          needs_password_change?: boolean
          nome?: string
          onboarding_completed?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          telefone?: string | null
          updated_at?: string
          xp_points?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plan_days: {
        Row: {
          church_id: string | null
          conteudo: string | null
          created_at: string
          dia: number
          id: string
          plan_id: string
          titulo: string
          versiculo_referencia: string | null
        }
        Insert: {
          church_id?: string | null
          conteudo?: string | null
          created_at?: string
          dia: number
          id?: string
          plan_id: string
          titulo: string
          versiculo_referencia?: string | null
        }
        Update: {
          church_id?: string | null
          conteudo?: string | null
          created_at?: string
          dia?: number
          id?: string
          plan_id?: string
          titulo?: string
          versiculo_referencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_plan_days_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plans: {
        Row: {
          categoria: string
          church_id: string | null
          cover_image: string | null
          created_at: string
          descricao: string | null
          duracao_dias: number
          id: string
          titulo: string
        }
        Insert: {
          categoria?: string
          church_id?: string | null
          cover_image?: string | null
          created_at?: string
          descricao?: string | null
          duracao_dias?: number
          id?: string
          titulo: string
        }
        Update: {
          categoria?: string
          church_id?: string | null
          cover_image?: string | null
          created_at?: string
          descricao?: string | null
          duracao_dias?: number
          id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_plans_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_embeddings: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          resource_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          resource_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          resource_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_embeddings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: true
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          autor: string | null
          categoria: Database["public"]["Enums"]["resource_category"]
          church_id: string | null
          created_at: string
          descricao: string | null
          id: string
          imagem_capa: string | null
          link_externo: string | null
          tags: string[] | null
          titulo: string
          url_pdf: string | null
          video_url: string | null
        }
        Insert: {
          autor?: string | null
          categoria?: Database["public"]["Enums"]["resource_category"]
          church_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_capa?: string | null
          link_externo?: string | null
          tags?: string[] | null
          titulo: string
          url_pdf?: string | null
          video_url?: string | null
        }
        Update: {
          autor?: string | null
          categoria?: Database["public"]["Enums"]["resource_category"]
          church_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_capa?: string | null
          link_externo?: string | null
          tags?: string[] | null
          titulo?: string
          url_pdf?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          categoria: string
          church_id: string | null
          cover_image: string | null
          created_at: string
          descricao: string | null
          id: string
          is_base: boolean
          ordem: number
          publico_alvo: Database["public"]["Enums"]["app_role"][]
          titulo: string
        }
        Insert: {
          categoria: string
          church_id?: string | null
          cover_image?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          is_base?: boolean
          ordem?: number
          publico_alvo?: Database["public"]["Enums"]["app_role"][]
          titulo: string
        }
        Update: {
          categoria?: string
          church_id?: string | null
          cover_image?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          is_base?: boolean
          ordem?: number
          publico_alvo?: Database["public"]["Enums"]["app_role"][]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
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
      user_reading_progress: {
        Row: {
          completed_at: string | null
          completed_days: number[] | null
          current_day: number
          id: string
          plan_id: string
          reminder_enabled: boolean | null
          reminder_time: string | null
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_days?: number[] | null
          current_day?: number
          id?: string
          plan_id: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_days?: number[] | null
          current_day?: number
          id?: string
          plan_id?: string
          reminder_enabled?: boolean | null
          reminder_time?: string | null
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reading_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_checklist_items: {
        Row: {
          ativo: boolean
          church_id: string | null
          created_at: string
          descricao: string | null
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          ativo?: boolean
          church_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo: string
        }
        Update: {
          ativo?: boolean
          church_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_checklist_items_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_checklist_responses: {
        Row: {
          created_at: string
          discipulador_id: string
          id: string
          responses: Json
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          discipulador_id: string
          id?: string
          responses?: Json
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          discipulador_id?: string
          id?: string
          responses?: Json
          updated_at?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manage_church_content: {
        Args: { _church_id: string; _user_id: string }
        Returns: boolean
      }
      count_active_disciples: {
        Args: { _discipulador_id: string }
        Returns: number
      }
      get_max_disciples_limit: { Args: { _church_id: string }; Returns: number }
      get_user_church_id: { Args: { _user_id: string }; Returns: string }
      get_user_emails: {
        Args: never
        Returns: {
          email: string
          id: string
        }[]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_of_own_church: { Args: { _user_id: string }; Returns: boolean }
      is_church_admin: {
        Args: { _church_id: string; _user_id: string }
        Returns: boolean
      }
      is_discipulador_of: {
        Args: { _discipulador_id: string; _discipulo_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      match_resources: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          resource_id: string
          similarity: number
        }[]
      }
      user_belongs_to_church: {
        Args: { _church_id: string; _user_id: string }
        Returns: boolean
      }
      user_can_access_content: {
        Args: {
          _publico_alvo: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      user_completed_base_track: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "discipulo"
        | "discipulador"
        | "admin"
        | "super_admin"
        | "church_admin"
      lesson_type: "video" | "texto" | "checklist_interativo"
      meeting_type: "individual" | "celula"
      resource_category:
        | "sos"
        | "devocional"
        | "estudo"
        | "apoio"
        | "livro"
        | "musica"
        | "pregacao"
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
      app_role: [
        "discipulo",
        "discipulador",
        "admin",
        "super_admin",
        "church_admin",
      ],
      lesson_type: ["video", "texto", "checklist_interativo"],
      meeting_type: ["individual", "celula"],
      resource_category: [
        "sos",
        "devocional",
        "estudo",
        "apoio",
        "livro",
        "musica",
        "pregacao",
      ],
    },
  },
} as const
