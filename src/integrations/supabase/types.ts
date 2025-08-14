export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_chat_sessions: {
        Row: {
          admin_user_id: string | null
          chat_history: Json | null
          context_type: string | null
          course_id: string | null
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          admin_user_id?: string | null
          chat_history?: Json | null
          context_type?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          admin_user_id?: string | null
          chat_history?: Json | null
          context_type?: string | null
          course_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_chat_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean | null
          overview: string | null
          published_at: string | null
          status: string | null
          title: string
          total_sessions: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          overview?: string | null
          published_at?: string | null
          status?: string | null
          title: string
          total_sessions?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          overview?: string | null
          published_at?: string | null
          status?: string | null
          title?: string
          total_sessions?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          concept_type: string | null
          content: string
          created_at: string
          id: string
          lecture_number: number
          order_index: number | null
          session_number: number
          title: string
          updated_at: string
        }
        Insert: {
          concept_type?: string | null
          content: string
          created_at?: string
          id?: string
          lecture_number: number
          order_index?: number | null
          session_number: number
          title: string
          updated_at?: string
        }
        Update: {
          concept_type?: string | null
          content?: string
          created_at?: string
          id?: string
          lecture_number?: number
          order_index?: number | null
          session_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      game_analytics: {
        Row: {
          completed_at: string | null
          completion_score: number | null
          correct_connections: number | null
          created_at: string
          decision_path: Json | null
          final_solution: Json | null
          hints_used: number | null
          id: string
          incorrect_connections: number | null
          lecture_game_id: string
          started_at: string
          time_spent_seconds: number | null
          total_interactions: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_score?: number | null
          correct_connections?: number | null
          created_at?: string
          decision_path?: Json | null
          final_solution?: Json | null
          hints_used?: number | null
          id?: string
          incorrect_connections?: number | null
          lecture_game_id: string
          started_at?: string
          time_spent_seconds?: number | null
          total_interactions?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_score?: number | null
          correct_connections?: number | null
          created_at?: string
          decision_path?: Json | null
          final_solution?: Json | null
          hints_used?: number | null
          id?: string
          incorrect_connections?: number | null
          lecture_game_id?: string
          started_at?: string
          time_spent_seconds?: number | null
          total_interactions?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_analytics_lecture_game_id_fkey"
            columns: ["lecture_game_id"]
            isOneToOne: false
            referencedRelation: "lecture_games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_templates: {
        Row: {
          category: string
          content_slots: Json
          created_at: string
          created_by: string | null
          description: string | null
          heuristic_targets: Json | null
          id: string
          mechanics: Json
          name: string
          template_data: Json
          updated_at: string
          validation_rules: Json | null
          win_conditions: Json | null
        }
        Insert: {
          category?: string
          content_slots?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          heuristic_targets?: Json | null
          id?: string
          mechanics?: Json
          name: string
          template_data: Json
          updated_at?: string
          validation_rules?: Json | null
          win_conditions?: Json | null
        }
        Update: {
          category?: string
          content_slots?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          heuristic_targets?: Json | null
          id?: string
          mechanics?: Json
          name?: string
          template_data?: Json
          updated_at?: string
          validation_rules?: Json | null
          win_conditions?: Json | null
        }
        Relationships: []
      }
      generation_workflows: {
        Row: {
          course_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          progress_percentage: number | null
          status: string | null
          updated_at: string | null
          workflow_type: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          progress_percentage?: number | null
          status?: string | null
          updated_at?: string | null
          workflow_type: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          progress_percentage?: number | null
          status?: string | null
          updated_at?: string | null
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_workflows_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_games: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          estimated_duration_minutes: number | null
          game_data: Json
          game_template_id: string
          heuristic_targets: Json | null
          hints: Json | null
          id: string
          instructions: string | null
          is_published: boolean
          lecture_number: number
          order_index: number
          session_number: number
          title: string
          updated_at: string
          validation_rules: Json | null
          win_conditions: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          game_data: Json
          game_template_id: string
          heuristic_targets?: Json | null
          hints?: Json | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          lecture_number: number
          order_index?: number
          session_number: number
          title: string
          updated_at?: string
          validation_rules?: Json | null
          win_conditions?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          game_data?: Json
          game_template_id?: string
          heuristic_targets?: Json | null
          hints?: Json | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          lecture_number?: number
          order_index?: number
          session_number?: number
          title?: string
          updated_at?: string
          validation_rules?: Json | null
          win_conditions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lecture_games_game_template_id_fkey"
            columns: ["game_template_id"]
            isOneToOne: false
            referencedRelation: "game_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      lecture_slides: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lecture_id: string | null
          slide_number: number
          slide_type: string | null
          speaker_notes: string | null
          svg_animation: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lecture_id?: string | null
          slide_number: number
          slide_type?: string | null
          speaker_notes?: string | null
          svg_animation?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lecture_id?: string | null
          slide_number?: number
          slide_type?: string | null
          speaker_notes?: string | null
          svg_animation?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lecture_slides_lecture_id_fkey"
            columns: ["lecture_id"]
            isOneToOne: false
            referencedRelation: "lectures_dynamic"
            referencedColumns: ["id"]
          },
        ]
      }
      lectures_dynamic: {
        Row: {
          content: string | null
          created_at: string | null
          estimated_duration_minutes: number | null
          id: string
          lecture_number: number
          order_index: number
          session_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          lecture_number: number
          order_index: number
          session_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          lecture_number?: number
          order_index?: number
          session_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lectures_dynamic_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions_dynamic"
            referencedColumns: ["id"]
          },
        ]
      }
      multiple_choice_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_timestamp: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_timestamp?: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_timestamp?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "multiple_choice_interactions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "multiple_choice_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      multiple_choice_questions: {
        Row: {
          correct_option: string
          created_at: string
          id: string
          lecture_number: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          session_number: number
          updated_at: string
        }
        Insert: {
          correct_option: string
          created_at?: string
          id?: string
          lecture_number: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          session_number: number
          updated_at?: string
        }
        Update: {
          correct_option?: string
          created_at?: string
          id?: string
          lecture_number?: number
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          session_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      reflection_questions: {
        Row: {
          created_at: string
          id: string
          lecture_number: number
          question_number: number
          question_text: string
          session_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lecture_number: number
          question_number: number
          question_text: string
          session_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lecture_number?: number
          question_number?: number
          question_text?: string
          session_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      sessions_dynamic: {
        Row: {
          course_id: string | null
          created_at: string | null
          description: string | null
          id: string
          order_index: number
          session_number: number
          theme: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_index: number
          session_number: number
          theme?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number
          session_number?: number
          theme?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_dynamic_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_game_interactions: {
        Row: {
          id: string
          interaction_data: Json
          interaction_type: string
          lecture_game_id: string
          session_id: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          id?: string
          interaction_data: Json
          interaction_type: string
          lecture_game_id: string
          session_id?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          id?: string
          interaction_data?: Json
          interaction_type?: string
          lecture_game_id?: string
          session_id?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_game_interactions_lecture_game_id_fkey"
            columns: ["lecture_game_id"]
            isOneToOne: false
            referencedRelation: "lecture_games"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_answers: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "multiple_choice_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reflections: {
        Row: {
          created_at: string
          id: string
          lecture_number: number
          reflection_content: string | null
          reflection_question_id: string | null
          session_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lecture_number: number
          reflection_content?: string | null
          reflection_question_id?: string | null
          session_number: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lecture_number?: number
          reflection_content?: string | null
          reflection_question_id?: string | null
          session_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reflections_reflection_question_id_fkey"
            columns: ["reflection_question_id"]
            isOneToOne: false
            referencedRelation: "reflection_questions"
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
    Enums: {},
  },
} as const
