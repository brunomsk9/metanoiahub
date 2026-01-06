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
          perguntas: Json | null
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
          perguntas?: Json | null
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
          perguntas?: Json | null
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
      ministries: {
        Row: {
          church_id: string
          cor: string | null
          created_at: string
          descricao: string | null
          icone: string | null
          id: string
          is_active: boolean
          lider_principal_id: string | null
          lider_secundario_id: string | null
          nome: string
          updated_at: string
        }
        Insert: {
          church_id: string
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          is_active?: boolean
          lider_principal_id?: string | null
          lider_secundario_id?: string | null
          nome: string
          updated_at?: string
        }
        Update: {
          church_id?: string
          cor?: string | null
          created_at?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          is_active?: boolean
          lider_principal_id?: string | null
          lider_secundario_id?: string | null
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      ministry_positions: {
        Row: {
          church_id: string
          created_at: string
          descricao: string | null
          genero_restrito: Database["public"]["Enums"]["gender_type"] | null
          id: string
          is_active: boolean
          ministry_id: string
          nome: string
          ordem: number
          quantidade_minima: number
        }
        Insert: {
          church_id: string
          created_at?: string
          descricao?: string | null
          genero_restrito?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          is_active?: boolean
          ministry_id: string
          nome: string
          ordem?: number
          quantidade_minima?: number
        }
        Update: {
          church_id?: string
          created_at?: string
          descricao?: string | null
          genero_restrito?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          is_active?: boolean
          ministry_id?: string
          nome?: string
          ordem?: number
          quantidade_minima?: number
        }
        Relationships: [
          {
            foreignKeyName: "ministry_positions_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ministry_positions_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      ministry_volunteers: {
        Row: {
          church_id: string
          created_at: string
          funcao: string | null
          id: string
          ministry_id: string
          user_id: string
        }
        Insert: {
          church_id: string
          created_at?: string
          funcao?: string | null
          id?: string
          ministry_id: string
          user_id: string
        }
        Update: {
          church_id?: string
          created_at?: string
          funcao?: string | null
          id?: string
          ministry_id?: string
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          church_id: string
          created_at: string
          email: string
          id: string
          is_subscribed: boolean
          nome: string | null
          unsubscribed_at: string | null
          user_id: string | null
        }
        Insert: {
          church_id: string
          created_at?: string
          email: string
          id?: string
          is_subscribed?: boolean
          nome?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Update: {
          church_id?: string
          created_at?: string
          email?: string
          id?: string
          is_subscribed?: boolean
          nome?: string | null
          unsubscribed_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_subscribers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletters: {
        Row: {
          church_id: string
          conteudo: string
          created_at: string
          created_by: string
          id: string
          recipients_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          church_id: string
          conteudo: string
          created_at?: string
          created_by: string
          id?: string
          recipients_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          church_id?: string
          conteudo?: string
          created_at?: string
          created_by?: string
          id?: string
          recipients_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletters_church_id_fkey"
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
          batizou_na_igreja: boolean | null
          church_id: string | null
          created_at: string
          current_streak: number
          data_batismo: string | null
          genero: Database["public"]["Enums"]["gender_type"] | null
          id: string
          is_batizado: boolean | null
          is_novo_convertido: boolean | null
          is_transferido: boolean | null
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
          batizou_na_igreja?: boolean | null
          church_id?: string | null
          created_at?: string
          current_streak?: number
          data_batismo?: string | null
          genero?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          is_batizado?: boolean | null
          is_novo_convertido?: boolean | null
          is_transferido?: boolean | null
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
          batizou_na_igreja?: boolean | null
          church_id?: string | null
          created_at?: string
          current_streak?: number
          data_batismo?: string | null
          genero?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          is_batizado?: boolean | null
          is_novo_convertido?: boolean | null
          is_transferido?: boolean | null
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
      quiz_responses: {
        Row: {
          acertos: number
          completed_at: string
          created_at: string
          id: string
          lesson_id: string
          porcentagem_acerto: number
          respostas: Json
          total_perguntas: number
          user_id: string
        }
        Insert: {
          acertos?: number
          completed_at?: string
          created_at?: string
          id?: string
          lesson_id: string
          porcentagem_acerto?: number
          respostas?: Json
          total_perguntas?: number
          user_id: string
        }
        Update: {
          acertos?: number
          completed_at?: string
          created_at?: string
          id?: string
          lesson_id?: string
          porcentagem_acerto?: number
          respostas?: Json
          total_perguntas?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
          ministry_id: string | null
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
          ministry_id?: string | null
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
          ministry_id?: string | null
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
          {
            foreignKeyName: "resources_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          church_id: string
          confirmed_at: string | null
          created_at: string
          created_by: string
          id: string
          ministry_id: string
          notes: string | null
          position_id: string
          service_id: string
          status: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          church_id: string
          confirmed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          ministry_id: string
          notes?: string | null
          position_id: string
          service_id: string
          status?: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          church_id?: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          ministry_id?: string
          notes?: string | null
          position_id?: string
          service_id?: string
          status?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "ministry_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_attendance: {
        Row: {
          adultos: number
          church_id: string
          created_at: string
          criancas: number
          id: string
          notas: string | null
          registered_by: string
          service_id: string
          total_geral: number | null
          updated_at: string
          voluntarios: number
        }
        Insert: {
          adultos?: number
          church_id: string
          created_at?: string
          criancas?: number
          id?: string
          notas?: string | null
          registered_by: string
          service_id: string
          total_geral?: number | null
          updated_at?: string
          voluntarios?: number
        }
        Update: {
          adultos?: number
          church_id?: string
          created_at?: string
          criancas?: number
          id?: string
          notas?: string | null
          registered_by?: string
          service_id?: string
          total_geral?: number | null
          updated_at?: string
          voluntarios?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_attendance_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_attendance_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_type_ministries: {
        Row: {
          church_id: string
          created_at: string
          id: string
          ministry_id: string
          service_type_id: string
        }
        Insert: {
          church_id: string
          created_at?: string
          id?: string
          ministry_id: string
          service_type_id: string
        }
        Update: {
          church_id?: string
          created_at?: string
          id?: string
          ministry_id?: string
          service_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_type_ministries_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_type_ministries_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_type_ministries_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      service_type_positions: {
        Row: {
          church_id: string
          created_at: string
          id: string
          position_id: string
          quantidade_minima: number
          service_type_id: string
        }
        Insert: {
          church_id: string
          created_at?: string
          id?: string
          position_id: string
          quantidade_minima?: number
          service_type_id: string
        }
        Update: {
          church_id?: string
          created_at?: string
          id?: string
          position_id?: string
          quantidade_minima?: number
          service_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_type_positions_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_type_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "ministry_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_type_positions_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      service_types: {
        Row: {
          church_id: string
          created_at: string
          descricao: string | null
          dia_semana: number | null
          horario: string | null
          id: string
          is_active: boolean
          is_recurring: boolean
          nome: string
          updated_at: string
        }
        Insert: {
          church_id: string
          created_at?: string
          descricao?: string | null
          dia_semana?: number | null
          horario?: string | null
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          nome: string
          updated_at?: string
        }
        Update: {
          church_id?: string
          created_at?: string
          descricao?: string | null
          dia_semana?: number | null
          horario?: string | null
          id?: string
          is_active?: boolean
          is_recurring?: boolean
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_types_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          church_id: string
          created_at: string
          data_hora: string
          descricao: string | null
          id: string
          is_special_event: boolean
          nome: string
          service_type_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          church_id: string
          created_at?: string
          data_hora: string
          descricao?: string | null
          id?: string
          is_special_event?: boolean
          nome: string
          service_type_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          church_id?: string
          created_at?: string
          data_hora?: string
          descricao?: string | null
          id?: string
          is_special_event?: boolean
          nome?: string
          service_type_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_service_type_id_fkey"
            columns: ["service_type_id"]
            isOneToOne: false
            referencedRelation: "service_types"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
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
      volunteer_availability: {
        Row: {
          church_id: string
          created_at: string
          id: string
          is_available: boolean
          notes: string | null
          service_id: string
          updated_at: string
          volunteer_id: string
        }
        Insert: {
          church_id: string
          created_at?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          service_id: string
          updated_at?: string
          volunteer_id: string
        }
        Update: {
          church_id?: string
          created_at?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          service_id?: string
          updated_at?: string
          volunteer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_availability_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_availability_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_availability_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      v_user_auth_details: {
        Row: {
          created_at: string | null
          email: string | null
          email_confirmed_at: string | null
          id: string | null
          last_sign_in_at: string | null
        }
        Relationships: []
      }
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
      get_all_disciples_for_discipulador: {
        Args: never
        Returns: {
          academia_nivel_1: boolean
          academia_nivel_2: boolean
          academia_nivel_3: boolean
          academia_nivel_4: boolean
          alicerce_completed_at: string
          alicerce_completed_presencial: boolean
          avatar_url: string
          batizou_na_igreja: boolean
          church_id: string
          conexao_inicial_1: boolean
          conexao_inicial_2: boolean
          current_streak: number
          data_batismo: string
          genero: Database["public"]["Enums"]["gender_type"]
          id: string
          is_batizado: boolean
          is_novo_convertido: boolean
          is_transferido: boolean
          nome: string
          onboarding_completed: boolean
          relationship_id: string
          relationship_started_at: string
          relationship_status: string
          role: Database["public"]["Enums"]["app_role"]
          xp_points: number
        }[]
      }
      get_all_ministry_volunteers_for_leader: {
        Args: never
        Returns: {
          avatar_url: string
          church_id: string
          current_streak: number
          funcao: string
          genero: Database["public"]["Enums"]["gender_type"]
          id: string
          is_batizado: boolean
          ministry_id: string
          ministry_name: string
          nome: string
          role: Database["public"]["Enums"]["app_role"]
          xp_points: number
        }[]
      }
      get_church_member_profile: {
        Args: { member_id: string }
        Returns: {
          avatar_url: string
          batizou_na_igreja: boolean
          church_id: string
          created_at: string
          current_streak: number
          data_batismo: string
          genero: Database["public"]["Enums"]["gender_type"]
          id: string
          is_batizado: boolean
          is_novo_convertido: boolean
          is_transferido: boolean
          needs_password_change: boolean
          nome: string
          onboarding_completed: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          xp_points: number
        }[]
      }
      get_church_member_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          batizou_na_igreja: boolean
          church_id: string
          created_at: string
          current_streak: number
          data_batismo: string
          genero: Database["public"]["Enums"]["gender_type"]
          id: string
          is_batizado: boolean
          is_novo_convertido: boolean
          is_transferido: boolean
          needs_password_change: boolean
          nome: string
          onboarding_completed: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          xp_points: number
        }[]
      }
      get_church_member_stats: {
        Args: never
        Returns: {
          total_batizados: number
          total_by_gender: Json
          total_by_role: Json
          total_members: number
          total_novos_convertidos: number
          total_onboarding_completed: number
          total_transferidos: number
        }[]
      }
      get_disciple_profile: {
        Args: { discipulo_id_param: string }
        Returns: {
          avatar_url: string
          batizou_na_igreja: boolean
          church_id: string
          created_at: string
          current_streak: number
          data_batismo: string
          genero: Database["public"]["Enums"]["gender_type"]
          id: string
          is_batizado: boolean
          is_novo_convertido: boolean
          is_transferido: boolean
          nome: string
          onboarding_completed: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          xp_points: number
        }[]
      }
      get_max_disciples_limit: { Args: { _church_id: string }; Returns: number }
      get_ministry_volunteer_profiles: {
        Args: { ministry_id_param: string }
        Returns: {
          avatar_url: string
          church_id: string
          current_streak: number
          funcao: string
          genero: Database["public"]["Enums"]["gender_type"]
          id: string
          is_batizado: boolean
          nome: string
          role: Database["public"]["Enums"]["app_role"]
          xp_points: number
        }[]
      }
      get_public_churches: {
        Args: never
        Returns: {
          id: string
          logo_url: string
          nome: string
          slug: string
        }[]
      }
      get_user_auth_details: {
        Args: never
        Returns: {
          created_at: string
          email: string
          email_confirmed_at: string
          id: string
          last_sign_in_at: string
        }[]
      }
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
      is_lider_ministerial: { Args: { _user_id: string }; Returns: boolean }
      is_ministry_leader: {
        Args: { _ministry_id: string; _user_id: string }
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
        | "lider_ministerial"
      gender_type: "masculino" | "feminino" | "unissex"
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
        | "playbook"
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
        "lider_ministerial",
      ],
      gender_type: ["masculino", "feminino", "unissex"],
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
        "playbook",
      ],
    },
  },
} as const
