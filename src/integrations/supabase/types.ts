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
      ai_prompts: {
        Row: {
          created_at: string | null
          created_by: string | null
          feature_page: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          prompt_category: string
          prompt_description: string | null
          prompt_name: string
          prompt_template: string
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          feature_page?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          prompt_category: string
          prompt_description?: string | null
          prompt_name: string
          prompt_template: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          feature_page?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          prompt_category?: string
          prompt_description?: string | null
          prompt_name?: string
          prompt_template?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: []
      }
      attention_heatmap_data: {
        Row: {
          created_at: string
          date_snapshot: string
          density_score: number
          engagement_score: number | null
          id: string
          keyword: string
          location_latitude: number
          location_longitude: number
          post_count: number | null
          profile_count: number | null
          sentiment_avg: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_snapshot?: string
          density_score?: number
          engagement_score?: number | null
          id?: string
          keyword: string
          location_latitude: number
          location_longitude: number
          post_count?: number | null
          profile_count?: number | null
          sentiment_avg?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_snapshot?: string
          density_score?: number
          engagement_score?: number | null
          id?: string
          keyword?: string
          location_latitude?: number
          location_longitude?: number
          post_count?: number | null
          profile_count?: number | null
          sentiment_avg?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      content_campaigns: {
        Row: {
          campaign_name: string
          content_prompt: string | null
          content_status: string | null
          content_type: string
          created_at: string | null
          created_by: string | null
          critical_thinking_concepts: Json | null
          generated_content: string | null
          id: string
          performance_metrics: Json | null
          published_at: string | null
          scheduled_publish_at: string | null
          target_audience_analysis: Json | null
          target_location_id: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_name: string
          content_prompt?: string | null
          content_status?: string | null
          content_type: string
          created_at?: string | null
          created_by?: string | null
          critical_thinking_concepts?: Json | null
          generated_content?: string | null
          id?: string
          performance_metrics?: Json | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          target_audience_analysis?: Json | null
          target_location_id?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_name?: string
          content_prompt?: string | null
          content_status?: string | null
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          critical_thinking_concepts?: Json | null
          generated_content?: string | null
          id?: string
          performance_metrics?: Json | null
          published_at?: string | null
          scheduled_publish_at?: string | null
          target_audience_analysis?: Json | null
          target_location_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_campaigns_target_location_id_fkey"
            columns: ["target_location_id"]
            isOneToOne: false
            referencedRelation: "targeted_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          context_seed: string | null
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
          context_seed?: string | null
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
          context_seed?: string | null
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
      instagram_carousels: {
        Row: {
          additional_instructions: string | null
          caption_text: string | null
          carousel_name: string
          created_at: string
          created_by: string | null
          critical_thinking_concepts: Json | null
          error_message: string | null
          generated_images: Json | null
          hashtags: Json | null
          id: string
          image_prompts: Json | null
          progress: number | null
          research_content: string
          status: string | null
          target_audiences: Json | null
          updated_at: string
        }
        Insert: {
          additional_instructions?: string | null
          caption_text?: string | null
          carousel_name: string
          created_at?: string
          created_by?: string | null
          critical_thinking_concepts?: Json | null
          error_message?: string | null
          generated_images?: Json | null
          hashtags?: Json | null
          id?: string
          image_prompts?: Json | null
          progress?: number | null
          research_content: string
          status?: string | null
          target_audiences?: Json | null
          updated_at?: string
        }
        Update: {
          additional_instructions?: string | null
          caption_text?: string | null
          carousel_name?: string
          created_at?: string
          created_by?: string | null
          critical_thinking_concepts?: Json | null
          error_message?: string | null
          generated_images?: Json | null
          hashtags?: Json | null
          id?: string
          image_prompts?: Json | null
          progress?: number | null
          research_content?: string
          status?: string | null
          target_audiences?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      keywords_analytics: {
        Row: {
          created_at: string
          frequency: number | null
          id: string
          industry_tags: Json | null
          keyword: string
          location_latitude: number | null
          location_longitude: number | null
          location_name: string | null
          sentiment_score: number | null
          source_id: string
          source_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          frequency?: number | null
          id?: string
          industry_tags?: Json | null
          keyword: string
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          sentiment_score?: number | null
          source_id: string
          source_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          frequency?: number | null
          id?: string
          industry_tags?: Json | null
          keyword?: string
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          sentiment_score?: number | null
          source_id?: string
          source_type?: string
          updated_at?: string
        }
        Relationships: []
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
      linkedin_posts: {
        Row: {
          analyzed: boolean | null
          author_full_name: string | null
          author_headline: string | null
          author_profile_id: string | null
          author_profile_url: string | null
          author_type: string | null
          comments: Json | null
          created_at: string | null
          id: string
          images: Json | null
          is_repost: boolean | null
          last_analyzed_at: string | null
          linkedin_post_urn: string | null
          num_comments: number | null
          num_likes: number | null
          num_shares: number | null
          post_type: string | null
          post_url: string | null
          posted_at_iso: string | null
          posted_at_timestamp: number | null
          raw_data: Json | null
          reactions: Json | null
          reanalyze_requested: boolean | null
          text_content: string | null
          time_since_posted: string | null
          updated_at: string | null
          upload_batch_id: string | null
        }
        Insert: {
          analyzed?: boolean | null
          author_full_name?: string | null
          author_headline?: string | null
          author_profile_id?: string | null
          author_profile_url?: string | null
          author_type?: string | null
          comments?: Json | null
          created_at?: string | null
          id?: string
          images?: Json | null
          is_repost?: boolean | null
          last_analyzed_at?: string | null
          linkedin_post_urn?: string | null
          num_comments?: number | null
          num_likes?: number | null
          num_shares?: number | null
          post_type?: string | null
          post_url?: string | null
          posted_at_iso?: string | null
          posted_at_timestamp?: number | null
          raw_data?: Json | null
          reactions?: Json | null
          reanalyze_requested?: boolean | null
          text_content?: string | null
          time_since_posted?: string | null
          updated_at?: string | null
          upload_batch_id?: string | null
        }
        Update: {
          analyzed?: boolean | null
          author_full_name?: string | null
          author_headline?: string | null
          author_profile_id?: string | null
          author_profile_url?: string | null
          author_type?: string | null
          comments?: Json | null
          created_at?: string | null
          id?: string
          images?: Json | null
          is_repost?: boolean | null
          last_analyzed_at?: string | null
          linkedin_post_urn?: string | null
          num_comments?: number | null
          num_likes?: number | null
          num_shares?: number | null
          post_type?: string | null
          post_url?: string | null
          posted_at_iso?: string | null
          posted_at_timestamp?: number | null
          raw_data?: Json | null
          reactions?: Json | null
          reanalyze_requested?: boolean | null
          text_content?: string | null
          time_since_posted?: string | null
          updated_at?: string | null
          upload_batch_id?: string | null
        }
        Relationships: []
      }
      linkedin_profiles: {
        Row: {
          analyzed: boolean | null
          certifications: Json | null
          company_linkedin_url: string | null
          company_name: string | null
          country_code: string | null
          cover_image_url: string | null
          created_at: string | null
          educations: Json | null
          first_name: string | null
          full_name: string | null
          geo_location_name: string | null
          headline: string | null
          id: string
          industry_name: string | null
          languages: Json | null
          last_analyzed_at: string | null
          last_name: string | null
          linkedin_profile_id: string | null
          location: string | null
          occupation: string | null
          picture_url: string | null
          positions: Json | null
          profile_url: string | null
          public_id: string | null
          raw_data: Json | null
          reanalyze_requested: boolean | null
          skills: Json | null
          summary: string | null
          updated_at: string | null
          upload_batch_id: string | null
        }
        Insert: {
          analyzed?: boolean | null
          certifications?: Json | null
          company_linkedin_url?: string | null
          company_name?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          educations?: Json | null
          first_name?: string | null
          full_name?: string | null
          geo_location_name?: string | null
          headline?: string | null
          id?: string
          industry_name?: string | null
          languages?: Json | null
          last_analyzed_at?: string | null
          last_name?: string | null
          linkedin_profile_id?: string | null
          location?: string | null
          occupation?: string | null
          picture_url?: string | null
          positions?: Json | null
          profile_url?: string | null
          public_id?: string | null
          raw_data?: Json | null
          reanalyze_requested?: boolean | null
          skills?: Json | null
          summary?: string | null
          updated_at?: string | null
          upload_batch_id?: string | null
        }
        Update: {
          analyzed?: boolean | null
          certifications?: Json | null
          company_linkedin_url?: string | null
          company_name?: string | null
          country_code?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          educations?: Json | null
          first_name?: string | null
          full_name?: string | null
          geo_location_name?: string | null
          headline?: string | null
          id?: string
          industry_name?: string | null
          languages?: Json | null
          last_analyzed_at?: string | null
          last_name?: string | null
          linkedin_profile_id?: string | null
          location?: string | null
          occupation?: string | null
          picture_url?: string | null
          positions?: Json | null
          profile_url?: string | null
          public_id?: string | null
          raw_data?: Json | null
          reanalyze_requested?: boolean | null
          skills?: Json | null
          summary?: string | null
          updated_at?: string | null
          upload_batch_id?: string | null
        }
        Relationships: []
      }
      location_social_mapping: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          distance_km: number | null
          id: string
          linkedin_profile_id: string | null
          location_id: string
          mapping_type: string
          notes: string | null
          social_account_id: string | null
          updated_at: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          distance_km?: number | null
          id?: string
          linkedin_profile_id?: string | null
          location_id: string
          mapping_type: string
          notes?: string | null
          social_account_id?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          distance_km?: number | null
          id?: string
          linkedin_profile_id?: string | null
          location_id?: string
          mapping_type?: string
          notes?: string | null
          social_account_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_social_mapping_linkedin_profile_id_fkey"
            columns: ["linkedin_profile_id"]
            isOneToOne: false
            referencedRelation: "linkedin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_social_mapping_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "targeted_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_social_mapping_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
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
      prompt_history: {
        Row: {
          change_reason: string | null
          changed_by: string | null
          created_at: string | null
          id: string
          old_template: string
          old_variables: Json | null
          prompt_id: string
        }
        Insert: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          old_template: string
          old_variables?: Json | null
          prompt_id: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string | null
          created_at?: string | null
          id?: string
          old_template?: string
          old_variables?: Json | null
          prompt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_history_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "ai_prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_variables: {
        Row: {
          created_at: string | null
          default_value: string | null
          description: string | null
          id: string
          is_global: boolean | null
          possible_values: Json | null
          updated_at: string | null
          variable_name: string
          variable_type: string
        }
        Insert: {
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          id?: string
          is_global?: boolean | null
          possible_values?: Json | null
          updated_at?: string | null
          variable_name: string
          variable_type: string
        }
        Update: {
          created_at?: string | null
          default_value?: string | null
          description?: string | null
          id?: string
          is_global?: boolean | null
          possible_values?: Json | null
          updated_at?: string | null
          variable_name?: string
          variable_type?: string
        }
        Relationships: []
      }
      public_game_leads: {
        Row: {
          analytics_data: Json | null
          completion_score: number | null
          completion_time_seconds: number | null
          created_at: string
          email: string
          game_template_id: string
          game_title: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          analytics_data?: Json | null
          completion_score?: number | null
          completion_time_seconds?: number | null
          created_at?: string
          email: string
          game_template_id: string
          game_title: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          analytics_data?: Json | null
          completion_score?: number | null
          completion_time_seconds?: number | null
          created_at?: string
          email?: string
          game_template_id?: string
          game_title?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      reddit_analytics: {
        Row: {
          additional_data: Json | null
          content_type: string
          created_at: string
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          subreddit_id: string | null
          subreddit_name: string
          time_period: string
        }
        Insert: {
          additional_data?: Json | null
          content_type: string
          created_at?: string
          id?: string
          metric_name: string
          metric_type: string
          metric_value: number
          subreddit_id?: string | null
          subreddit_name: string
          time_period: string
        }
        Update: {
          additional_data?: Json | null
          content_type?: string
          created_at?: string
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          subreddit_id?: string | null
          subreddit_name?: string
          time_period?: string
        }
        Relationships: [
          {
            foreignKeyName: "reddit_analytics_subreddit_id_fkey"
            columns: ["subreddit_id"]
            isOneToOne: false
            referencedRelation: "reddit_subreddits"
            referencedColumns: ["id"]
          },
        ]
      }
      reddit_comments: {
        Row: {
          ai_summary: string | null
          analyzed_at: string | null
          author: string | null
          content: string
          created_at: string
          created_utc: string | null
          depth: number | null
          id: string
          is_submitter: boolean | null
          keywords: Json | null
          parent_comment_id: string | null
          permalink: string | null
          post_id: string | null
          reddit_comment_id: string
          reddit_post_id: string
          score: number | null
          sentiment_label: string | null
          sentiment_score: number | null
          topics: Json | null
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          analyzed_at?: string | null
          author?: string | null
          content: string
          created_at?: string
          created_utc?: string | null
          depth?: number | null
          id?: string
          is_submitter?: boolean | null
          keywords?: Json | null
          parent_comment_id?: string | null
          permalink?: string | null
          post_id?: string | null
          reddit_comment_id: string
          reddit_post_id: string
          score?: number | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          topics?: Json | null
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          analyzed_at?: string | null
          author?: string | null
          content?: string
          created_at?: string
          created_utc?: string | null
          depth?: number | null
          id?: string
          is_submitter?: boolean | null
          keywords?: Json | null
          parent_comment_id?: string | null
          permalink?: string | null
          post_id?: string | null
          reddit_comment_id?: string
          reddit_post_id?: string
          score?: number | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          topics?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reddit_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "reddit_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reddit_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "reddit_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      reddit_my_comments: {
        Row: {
          created_at: string
          created_by: string | null
          entry_point_used: string | null
          final_response: string | null
          generated_response: string
          id: string
          parent_comment_id: string | null
          post_id: string | null
          reddit_comment_id: string | null
          reddit_parent_id: string | null
          reddit_post_id: string
          status: string | null
          submission_response: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entry_point_used?: string | null
          final_response?: string | null
          generated_response: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string | null
          reddit_comment_id?: string | null
          reddit_parent_id?: string | null
          reddit_post_id: string
          status?: string | null
          submission_response?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entry_point_used?: string | null
          final_response?: string | null
          generated_response?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string | null
          reddit_comment_id?: string | null
          reddit_parent_id?: string | null
          reddit_post_id?: string
          status?: string | null
          submission_response?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reddit_my_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "reddit_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reddit_my_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "reddit_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      reddit_posts: {
        Row: {
          ai_summary: string | null
          analyzed_at: string | null
          author: string | null
          content: string | null
          created_at: string
          created_utc: string | null
          entry_points: Json | null
          id: string
          is_monitored: boolean | null
          is_self: boolean | null
          keywords: Json | null
          num_comments: number | null
          permalink: string | null
          post_type: string | null
          reddit_post_id: string
          score: number | null
          sentiment_label: string | null
          sentiment_score: number | null
          subreddit_id: string | null
          subreddit_name: string
          title: string
          topics: Json | null
          updated_at: string
          upvote_ratio: number | null
          url: string | null
        }
        Insert: {
          ai_summary?: string | null
          analyzed_at?: string | null
          author?: string | null
          content?: string | null
          created_at?: string
          created_utc?: string | null
          entry_points?: Json | null
          id?: string
          is_monitored?: boolean | null
          is_self?: boolean | null
          keywords?: Json | null
          num_comments?: number | null
          permalink?: string | null
          post_type?: string | null
          reddit_post_id: string
          score?: number | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          subreddit_id?: string | null
          subreddit_name: string
          title: string
          topics?: Json | null
          updated_at?: string
          upvote_ratio?: number | null
          url?: string | null
        }
        Update: {
          ai_summary?: string | null
          analyzed_at?: string | null
          author?: string | null
          content?: string | null
          created_at?: string
          created_utc?: string | null
          entry_points?: Json | null
          id?: string
          is_monitored?: boolean | null
          is_self?: boolean | null
          keywords?: Json | null
          num_comments?: number | null
          permalink?: string | null
          post_type?: string | null
          reddit_post_id?: string
          score?: number | null
          sentiment_label?: string | null
          sentiment_score?: number | null
          subreddit_id?: string | null
          subreddit_name?: string
          title?: string
          topics?: Json | null
          updated_at?: string
          upvote_ratio?: number | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reddit_posts_subreddit_id_fkey"
            columns: ["subreddit_id"]
            isOneToOne: false
            referencedRelation: "reddit_subreddits"
            referencedColumns: ["id"]
          },
        ]
      }
      reddit_subreddits: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_name: string | null
          id: string
          is_active: boolean | null
          last_scraped_at: string | null
          subreddit_name: string
          subscribers: number | null
          tracking_keywords: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          subreddit_name: string
          subscribers?: number | null
          tracking_keywords?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_name?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          subreddit_name?: string
          subscribers?: number | null
          tracking_keywords?: Json | null
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
      social_accounts: {
        Row: {
          access_token_encrypted: string | null
          account_display_name: string | null
          account_metadata: Json | null
          account_profile_url: string | null
          account_username: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_connected: boolean | null
          last_sync_at: string | null
          phyllo_account_id: string | null
          phyllo_user_id: string | null
          platform: string
          sync_status: string | null
          updated_at: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          account_display_name?: string | null
          account_metadata?: Json | null
          account_profile_url?: string | null
          account_username?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          phyllo_account_id?: string | null
          phyllo_user_id?: string | null
          platform: string
          sync_status?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          account_display_name?: string | null
          account_metadata?: Json | null
          account_profile_url?: string | null
          account_username?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_connected?: boolean | null
          last_sync_at?: string | null
          phyllo_account_id?: string | null
          phyllo_user_id?: string | null
          platform?: string
          sync_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      social_analytics: {
        Row: {
          additional_data: Json | null
          campaign_id: string | null
          created_at: string | null
          id: string
          location_id: string | null
          metric_date: string | null
          metric_type: string
          metric_value: number | null
          social_account_id: string | null
        }
        Insert: {
          additional_data?: Json | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          metric_date?: string | null
          metric_type: string
          metric_value?: number | null
          social_account_id?: string | null
        }
        Update: {
          additional_data?: Json | null
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          metric_date?: string | null
          metric_type?: string
          metric_value?: number | null
          social_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_analytics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "content_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_analytics_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "targeted_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_analytics_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
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
      targeted_locations: {
        Row: {
          city: string | null
          company_name: string
          country: string | null
          created_at: string | null
          created_by: string | null
          custom_boundaries: Json | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          office_address: string
          predefined_zone: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          company_name: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_boundaries?: Json | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          office_address: string
          predefined_zone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_boundaries?: Json | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          office_address?: string
          predefined_zone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      upload_batches: {
        Row: {
          batch_name: string
          created_at: string | null
          created_by: string | null
          data_source: string
          error_log: Json | null
          failed_records: number | null
          file_name: string | null
          id: string
          metadata: Json | null
          processed_records: number | null
          status: string | null
          total_records: number | null
          updated_at: string | null
        }
        Insert: {
          batch_name: string
          created_at?: string | null
          created_by?: string | null
          data_source: string
          error_log?: Json | null
          failed_records?: number | null
          file_name?: string | null
          id?: string
          metadata?: Json | null
          processed_records?: number | null
          status?: string | null
          total_records?: number | null
          updated_at?: string | null
        }
        Update: {
          batch_name?: string
          created_at?: string | null
          created_by?: string | null
          data_source?: string
          error_log?: Json | null
          failed_records?: number | null
          file_name?: string | null
          id?: string
          metadata?: Json | null
          processed_records?: number | null
          status?: string | null
          total_records?: number | null
          updated_at?: string | null
        }
        Relationships: []
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
