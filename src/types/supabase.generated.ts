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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      daily_log_status: {
        Row: {
          created_at: string | null
          id: string
          is_day_complete: boolean | null
          log_date: string
          meal_count: number | null
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_protein_g: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_day_complete?: boolean | null
          log_date: string
          meal_count?: number | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_protein_g?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_day_complete?: boolean | null
          log_date?: string
          meal_count?: number | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_protein_g?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_log_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_aliases: {
        Row: {
          alias: string
          country_code: string | null
          created_at: string | null
          food_id: string
          id: string
          is_primary: boolean | null
        }
        Insert: {
          alias: string
          country_code?: string | null
          created_at?: string | null
          food_id: string
          id?: string
          is_primary?: boolean | null
        }
        Update: {
          alias?: string
          country_code?: string | null
          created_at?: string | null
          food_id?: string
          id?: string
          is_primary?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "food_aliases_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      food_log_entries: {
        Row: {
          ai_confidence: number | null
          ai_raw_response: Json | null
          calories_kcal: number | null
          carbs_g: number | null
          created_at: string | null
          custom_description: string | null
          deleted_at: string | null
          fat_g: number | null
          fiber_g: number | null
          food_id: string | null
          id: string
          log_date: string
          logged_at: string | null
          logging_method: Database["public"]["Enums"]["logging_method"]
          meal_type: Database["public"]["Enums"]["meal_type"]
          photo_storage_path: string | null
          protein_g: number | null
          quantity_grams: number
          serving_id: string | null
          serving_quantity: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_raw_response?: Json | null
          calories_kcal?: number | null
          carbs_g?: number | null
          created_at?: string | null
          custom_description?: string | null
          deleted_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_id?: string | null
          id?: string
          log_date: string
          logged_at?: string | null
          logging_method?: Database["public"]["Enums"]["logging_method"]
          meal_type: Database["public"]["Enums"]["meal_type"]
          photo_storage_path?: string | null
          protein_g?: number | null
          quantity_grams: number
          serving_id?: string | null
          serving_quantity?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_raw_response?: Json | null
          calories_kcal?: number | null
          carbs_g?: number | null
          created_at?: string | null
          custom_description?: string | null
          deleted_at?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          food_id?: string | null
          id?: string
          log_date?: string
          logged_at?: string | null
          logging_method?: Database["public"]["Enums"]["logging_method"]
          meal_type?: Database["public"]["Enums"]["meal_type"]
          photo_storage_path?: string | null
          protein_g?: number | null
          quantity_grams?: number
          serving_id?: string | null
          serving_quantity?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_log_entries_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_log_entries_serving_id_fkey"
            columns: ["serving_id"]
            isOneToOne: false
            referencedRelation: "food_servings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "food_log_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      food_servings: {
        Row: {
          created_at: string | null
          food_id: string
          id: string
          is_default: boolean | null
          serving_grams: number
          serving_name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          food_id: string
          id?: string
          is_default?: boolean | null
          serving_grams: number
          serving_name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          food_id?: string
          id?: string
          is_default?: boolean | null
          serving_grams?: number
          serving_name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "food_servings_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      foods: {
        Row: {
          barcode: string | null
          brand: string | null
          calcium_mg: number | null
          calories_kcal: number
          carbs_g: number | null
          category: Database["public"]["Enums"]["food_category"]
          contributed_by: string | null
          created_at: string | null
          data_source: string | null
          embedding: string | null
          fat_g: number | null
          fiber_g: number | null
          folate_mcg: number | null
          food_source: Database["public"]["Enums"]["food_source_type"] | null
          id: string
          image_url: string | null
          iron_mg: number | null
          is_active: boolean | null
          is_verified: boolean | null
          magnesium_mg: number | null
          moderation_status:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          name: string
          omega3_g: number | null
          origin_country: string | null
          origin_region: string | null
          potassium_mg: number | null
          protein_g: number | null
          sodium_mg: number | null
          sugar_g: number | null
          updated_at: string | null
          verified_by: string | null
          vitamin_b12_mcg: number | null
          vitamin_c_mg: number | null
          vitamin_d_mcg: number | null
          zinc_mg: number | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          calcium_mg?: number | null
          calories_kcal: number
          carbs_g?: number | null
          category: Database["public"]["Enums"]["food_category"]
          contributed_by?: string | null
          created_at?: string | null
          data_source?: string | null
          embedding?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          folate_mcg?: number | null
          food_source?: Database["public"]["Enums"]["food_source_type"] | null
          id?: string
          image_url?: string | null
          iron_mg?: number | null
          is_active?: boolean | null
          is_verified?: boolean | null
          magnesium_mg?: number | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          name: string
          omega3_g?: number | null
          origin_country?: string | null
          origin_region?: string | null
          potassium_mg?: number | null
          protein_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          updated_at?: string | null
          verified_by?: string | null
          vitamin_b12_mcg?: number | null
          vitamin_c_mg?: number | null
          vitamin_d_mcg?: number | null
          zinc_mg?: number | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          calcium_mg?: number | null
          calories_kcal?: number
          carbs_g?: number | null
          category?: Database["public"]["Enums"]["food_category"]
          contributed_by?: string | null
          created_at?: string | null
          data_source?: string | null
          embedding?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          folate_mcg?: number | null
          food_source?: Database["public"]["Enums"]["food_source_type"] | null
          id?: string
          image_url?: string | null
          iron_mg?: number | null
          is_active?: boolean | null
          is_verified?: boolean | null
          magnesium_mg?: number | null
          moderation_status?:
            | Database["public"]["Enums"]["moderation_status"]
            | null
          name?: string
          omega3_g?: number | null
          origin_country?: string | null
          origin_region?: string | null
          potassium_mg?: number | null
          protein_g?: number | null
          sodium_mg?: number | null
          sugar_g?: number | null
          updated_at?: string | null
          verified_by?: string | null
          vitamin_b12_mcg?: number | null
          vitamin_c_mg?: number | null
          vitamin_d_mcg?: number | null
          zinc_mg?: number | null
        }
        Relationships: []
      }
      meal_plan_days: {
        Row: {
          day_label: string | null
          day_number: number
          id: string
          plan_id: string
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_protein_g: number | null
        }
        Insert: {
          day_label?: string | null
          day_number: number
          id?: string
          plan_id: string
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_protein_g?: number | null
        }
        Update: {
          day_label?: string | null
          day_number?: number
          id?: string
          plan_id?: string
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_protein_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_meals: {
        Row: {
          day_id: string
          id: string
          meal_type: string
          order_index: number | null
          recipe_id: string | null
        }
        Insert: {
          day_id: string
          id?: string
          meal_type: string
          order_index?: number | null
          recipe_id?: string | null
        }
        Update: {
          day_id?: string
          id?: string
          meal_type?: string
          order_index?: number | null
          recipe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_meals_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_meals_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          goal_type: string
          id: string
          is_premium: boolean
          is_sample: boolean
          target_calories: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days?: number
          goal_type: string
          id?: string
          is_premium?: boolean
          is_sample?: boolean
          target_calories: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          goal_type?: string
          id?: string
          is_premium?: boolean
          is_sample?: boolean
          target_calories?: number
          title?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          body: string | null
          id: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          opened_at: string | null
          push_token_used: string | null
          sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          id?: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          opened_at?: string | null
          push_token_used?: string | null
          sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          id?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          opened_at?: string | null
          push_token_used?: string | null
          sent_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          id: string
          is_enabled: boolean | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          preferred_time: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          notification_type: Database["public"]["Enums"]["notification_type"]
          preferred_time?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          notification_type?: Database["public"]["Enums"]["notification_type"]
          preferred_time?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychological_flags: {
        Row: {
          consecutive_days: number | null
          created_at: string | null
          details: Json | null
          detected_at: string | null
          flag_type: Database["public"]["Enums"]["psych_flag_type"]
          id: string
          trigger_text: string | null
          user_id: string
        }
        Insert: {
          consecutive_days?: number | null
          created_at?: string | null
          details?: Json | null
          detected_at?: string | null
          flag_type: Database["public"]["Enums"]["psych_flag_type"]
          id?: string
          trigger_text?: string | null
          user_id: string
        }
        Update: {
          consecutive_days?: number | null
          created_at?: string | null
          details?: Json | null
          detected_at?: string | null
          flag_type?: Database["public"]["Enums"]["psych_flag_type"]
          id?: string
          trigger_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "psychological_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      psychological_responses: {
        Row: {
          created_at: string | null
          dismissed_at: string | null
          flag_id: string | null
          id: string
          message_content: string | null
          message_key: string
          shown_at: string | null
          user_id: string
          was_helpful: boolean | null
        }
        Insert: {
          created_at?: string | null
          dismissed_at?: string | null
          flag_id?: string | null
          id?: string
          message_content?: string | null
          message_key: string
          shown_at?: string | null
          user_id: string
          was_helpful?: boolean | null
        }
        Update: {
          created_at?: string | null
          dismissed_at?: string | null
          flag_id?: string | null
          id?: string
          message_content?: string | null
          message_key?: string
          shown_at?: string | null
          user_id?: string
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "psychological_responses_flag_id_fkey"
            columns: ["flag_id"]
            isOneToOne: false
            referencedRelation: "psychological_flags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "psychological_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          id: string
          ingredient_name: string
          notes: string | null
          order_index: number
          quantity: number | null
          recipe_id: string
          unit: string | null
        }
        Insert: {
          id?: string
          ingredient_name: string
          notes?: string | null
          order_index?: number
          quantity?: number | null
          recipe_id: string
          unit?: string | null
        }
        Update: {
          id?: string
          ingredient_name?: string
          notes?: string | null
          order_index?: number
          quantity?: number | null
          recipe_id?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_steps: {
        Row: {
          duration_min: number | null
          id: string
          instruction: string
          recipe_id: string
          step_number: number
        }
        Insert: {
          duration_min?: number | null
          id?: string
          instruction: string
          recipe_id: string
          step_number: number
        }
        Update: {
          duration_min?: number | null
          id?: string
          instruction?: string
          recipe_id?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_steps_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          calories_kcal: number | null
          carbs_g: number | null
          cook_time_min: number | null
          created_at: string
          cuisine: string | null
          description: string | null
          fat_g: number | null
          fiber_g: number | null
          id: string
          image_url: string | null
          meal_type: string | null
          prep_time_min: number | null
          protein_g: number | null
          ready_in_min: number | null
          servings: number | null
          source_url: string | null
          spoonacular_id: number | null
          tags: string[] | null
          title: string
        }
        Insert: {
          calories_kcal?: number | null
          carbs_g?: number | null
          cook_time_min?: number | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          meal_type?: string | null
          prep_time_min?: number | null
          protein_g?: number | null
          ready_in_min?: number | null
          servings?: number | null
          source_url?: string | null
          spoonacular_id?: number | null
          tags?: string[] | null
          title: string
        }
        Update: {
          calories_kcal?: number | null
          carbs_g?: number | null
          cook_time_min?: number | null
          created_at?: string
          cuisine?: string | null
          description?: string | null
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          image_url?: string | null
          meal_type?: string | null
          prep_time_min?: number | null
          protein_g?: number | null
          ready_in_min?: number | null
          servings?: number | null
          source_url?: string | null
          spoonacular_id?: number | null
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          created_at: string
          event_type: string
          last_error: string | null
          processed_at: string | null
          status: string
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          last_error?: string | null
          processed_at?: string | null
          status?: string
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          last_error?: string | null
          processed_at?: string | null
          status?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      tdee_weekly_snapshots: {
        Row: {
          adjustment_kcal: number | null
          adjustment_reason: string | null
          avg_calories_day: number | null
          avg_weight_kg: number | null
          complete_days: number
          created_at: string | null
          expected_weight_delta_kg: number | null
          id: string
          tdee_after_adjustment: number | null
          tdee_before_adjustment: number | null
          total_days: number
          user_id: string
          week_end: string
          week_start: string
          weight_delta_kg: number | null
        }
        Insert: {
          adjustment_kcal?: number | null
          adjustment_reason?: string | null
          avg_calories_day?: number | null
          avg_weight_kg?: number | null
          complete_days?: number
          created_at?: string | null
          expected_weight_delta_kg?: number | null
          id?: string
          tdee_after_adjustment?: number | null
          tdee_before_adjustment?: number | null
          total_days?: number
          user_id: string
          week_end: string
          week_start: string
          weight_delta_kg?: number | null
        }
        Update: {
          adjustment_kcal?: number | null
          adjustment_reason?: string | null
          avg_calories_day?: number | null
          avg_weight_kg?: number | null
          complete_days?: number
          created_at?: string | null
          expected_weight_delta_kg?: number | null
          id?: string
          tdee_after_adjustment?: number | null
          tdee_before_adjustment?: number | null
          total_days?: number
          user_id?: string
          week_end?: string
          week_start?: string
          weight_delta_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tdee_weekly_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_context: {
        Row: {
          ai_tone_preference: string | null
          allergies: string[] | null
          biggest_challenge: string | null
          biggest_challenges: string[] | null
          commitment_time: string | null
          cooking_frequency: string | null
          created_at: string | null
          diet_restrictions: string[] | null
          eating_triggers: string[] | null
          eats_out_frequency: string | null
          emotional_eating_frequency: string | null
          food_relationship: string | null
          household_support: string | null
          id: string
          living_situation: string | null
          meals_per_day: number | null
          motivation_level: string | null
          notification_time: string | null
          onboarding_completed_at: string | null
          past_diets: string[] | null
          progress_tracking: string[] | null
          restriction_history: boolean | null
          secondary_goals: string[] | null
          sleep_quality: string | null
          snacking_frequency: string | null
          stress_level: string | null
          tca_answer: string | null
          tca_flagged: boolean | null
          updated_at: string | null
          user_id: string
          wants_daily_tips: boolean | null
          water_intake: string | null
          weight_loss_experience: string | null
        }
        Insert: {
          ai_tone_preference?: string | null
          allergies?: string[] | null
          biggest_challenge?: string | null
          biggest_challenges?: string[] | null
          commitment_time?: string | null
          cooking_frequency?: string | null
          created_at?: string | null
          diet_restrictions?: string[] | null
          eating_triggers?: string[] | null
          eats_out_frequency?: string | null
          emotional_eating_frequency?: string | null
          food_relationship?: string | null
          household_support?: string | null
          id?: string
          living_situation?: string | null
          meals_per_day?: number | null
          motivation_level?: string | null
          notification_time?: string | null
          onboarding_completed_at?: string | null
          past_diets?: string[] | null
          progress_tracking?: string[] | null
          restriction_history?: boolean | null
          secondary_goals?: string[] | null
          sleep_quality?: string | null
          snacking_frequency?: string | null
          stress_level?: string | null
          tca_answer?: string | null
          tca_flagged?: boolean | null
          updated_at?: string | null
          user_id: string
          wants_daily_tips?: boolean | null
          water_intake?: string | null
          weight_loss_experience?: string | null
        }
        Update: {
          ai_tone_preference?: string | null
          allergies?: string[] | null
          biggest_challenge?: string | null
          biggest_challenges?: string[] | null
          commitment_time?: string | null
          cooking_frequency?: string | null
          created_at?: string | null
          diet_restrictions?: string[] | null
          eating_triggers?: string[] | null
          eats_out_frequency?: string | null
          emotional_eating_frequency?: string | null
          food_relationship?: string | null
          household_support?: string | null
          id?: string
          living_situation?: string | null
          meals_per_day?: number | null
          motivation_level?: string | null
          notification_time?: string | null
          onboarding_completed_at?: string | null
          past_diets?: string[] | null
          progress_tracking?: string[] | null
          restriction_history?: boolean | null
          secondary_goals?: string[] | null
          sleep_quality?: string | null
          snacking_frequency?: string | null
          stress_level?: string | null
          tca_answer?: string | null
          tca_flagged?: boolean | null
          updated_at?: string | null
          user_id?: string
          wants_daily_tips?: boolean | null
          water_intake?: string | null
          weight_loss_experience?: string | null
        }
        Relationships: []
      }
      user_meal_plans: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          plan_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          plan_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          plan_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_meal_plans_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          avatar_url: string | null
          biological_sex: Database["public"]["Enums"]["biological_sex"] | null
          cooking_frequency: string | null
          cooking_skill: string | null
          country_code: string | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string | null
          goal: Database["public"]["Enums"]["user_goal"] | null
          health_conditions: string[] | null
          height_cm: number | null
          id: string
          is_premium: boolean | null
          language: string | null
          onboarding_completed: boolean | null
          premium_expires_at: string | null
          tca_screening:
            | Database["public"]["Enums"]["tca_screening_answer"]
            | null
          timezone: string | null
          unit_energy: Database["public"]["Enums"]["unit_energy"] | null
          unit_weight: Database["public"]["Enums"]["unit_weight"] | null
          updated_at: string | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          avatar_url?: string | null
          biological_sex?: Database["public"]["Enums"]["biological_sex"] | null
          cooking_frequency?: string | null
          cooking_skill?: string | null
          country_code?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          goal?: Database["public"]["Enums"]["user_goal"] | null
          health_conditions?: string[] | null
          height_cm?: number | null
          id: string
          is_premium?: boolean | null
          language?: string | null
          onboarding_completed?: boolean | null
          premium_expires_at?: string | null
          tca_screening?:
            | Database["public"]["Enums"]["tca_screening_answer"]
            | null
          timezone?: string | null
          unit_energy?: Database["public"]["Enums"]["unit_energy"] | null
          unit_weight?: Database["public"]["Enums"]["unit_weight"] | null
          updated_at?: string | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          avatar_url?: string | null
          biological_sex?: Database["public"]["Enums"]["biological_sex"] | null
          cooking_frequency?: string | null
          cooking_skill?: string | null
          country_code?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string | null
          goal?: Database["public"]["Enums"]["user_goal"] | null
          health_conditions?: string[] | null
          height_cm?: number | null
          id?: string
          is_premium?: boolean | null
          language?: string | null
          onboarding_completed?: boolean | null
          premium_expires_at?: string | null
          tca_screening?:
            | Database["public"]["Enums"]["tca_screening_answer"]
            | null
          timezone?: string | null
          unit_energy?: Database["public"]["Enums"]["unit_energy"] | null
          unit_weight?: Database["public"]["Enums"]["unit_weight"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_tdee_state: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          current_bmr_kcal: number | null
          current_tdee_kcal: number
          id: string
          initial_tdee_kcal: number | null
          last_adjusted_at: string | null
          updated_at: string | null
          user_id: string
          weeks_of_data: number | null
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          current_bmr_kcal?: number | null
          current_tdee_kcal: number
          id?: string
          initial_tdee_kcal?: number | null
          last_adjusted_at?: string | null
          updated_at?: string | null
          user_id: string
          weeks_of_data?: number | null
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          current_bmr_kcal?: number | null
          current_tdee_kcal?: number
          id?: string
          initial_tdee_kcal?: number | null
          last_adjusted_at?: string | null
          updated_at?: string | null
          user_id?: string
          weeks_of_data?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_tdee_state_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      water_log: {
        Row: {
          amount_ml: number
          created_at: string | null
          id: string
          log_date: string
          logged_at: string | null
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string | null
          id?: string
          log_date: string
          logged_at?: string | null
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string | null
          id?: string
          log_date?: string
          logged_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_entries: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          recorded_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          recorded_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_meal_plan_atomic: {
        Args: { p_plan_id: string; p_started_at?: string }
        Returns: undefined
      }
      can_show_psych_message: {
        Args: {
          p_cooldown_days?: number
          p_message_key: string
          p_user_id: string
        }
        Returns: boolean
      }
      complete_onboarding_atomic: {
        Args: {
          p_activity_level: string
          p_ai_tone_preference?: string
          p_allergies?: string[]
          p_biggest_challenges?: string[]
          p_biological_sex: string
          p_carbs_g?: number
          p_commitment_time?: string
          p_cooking_frequency?: string
          p_country_code: string
          p_date_of_birth: string
          p_diet_restrictions?: string[]
          p_display_name: string
          p_eating_triggers?: string[]
          p_eats_out_frequency?: string
          p_emotional_eating_frequency?: string
          p_fat_g?: number
          p_food_relationship?: string
          p_goal: string
          p_goal_kcal?: number
          p_height_cm: number
          p_household_support?: string
          p_living_situation?: string
          p_meals_per_day?: number
          p_past_diets?: string[]
          p_progress_tracking?: string[]
          p_protein_g?: number
          p_secondary_goals?: string[]
          p_sleep_quality?: string
          p_snacking_frequency?: string
          p_stress_level?: string
          p_tca_answer?: string
          p_tca_flagged?: boolean
          p_tdee?: number
          p_timezone: string
          p_unit_energy: string
          p_unit_weight: string
          p_wants_daily_tips?: boolean
          p_water_intake?: string
          p_weight_kg: number
          p_weight_loss_experience?: string
        }
        Returns: undefined
      }
      get_active_user_ids: {
        Args: { since_date: string }
        Returns: {
          user_id: string
        }[]
      }
      get_daily_summary: {
        Args: { p_date: string; p_user_id: string }
        Returns: {
          entry_count: number
          meal: Database["public"]["Enums"]["meal_type"]
          total_calories: number
          total_carbs: number
          total_fat: number
          total_fiber: number
          total_protein: number
        }[]
      }
      get_tdee_weekly_data: {
        Args: { p_user_id: string; p_week_end: string; p_week_start: string }
        Returns: {
          avg_calories_day: number
          avg_weight_kg: number
          complete_days: number
          weight_end: number
          weight_start: number
        }[]
      }
      search_foods: {
        Args: {
          p_category?: Database["public"]["Enums"]["food_category"]
          p_country?: string
          p_embedding?: string
          p_limit?: number
          p_query: string
        }
        Returns: {
          brand: string
          calories_kcal: number
          carbs_g: number
          category: Database["public"]["Enums"]["food_category"]
          combined_rank: number
          fat_g: number
          food_id: string
          food_name: string
          is_verified: boolean
          origin_country: string
          protein_g: number
          text_rank: number
          vector_rank: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "lightly_active"
        | "moderately_active"
        | "very_active"
        | "extra_active"
      biological_sex: "male" | "female"
      food_category:
        | "fruit"
        | "vegetable"
        | "grain"
        | "legume"
        | "dairy"
        | "meat"
        | "poultry"
        | "fish_seafood"
        | "egg"
        | "nut_seed"
        | "oil_fat"
        | "sweet"
        | "beverage"
        | "condiment"
        | "prepared_meal"
        | "supplement"
        | "other"
      food_source_type: "homemade" | "restaurant" | "packaged"
      logging_method: "photo" | "natural_text" | "manual" | "barcode"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      moderation_status: "pending" | "approved" | "rejected"
      notification_type:
        | "meal_reminder"
        | "positive_achievement"
        | "weight_checkin"
        | "nutrition_suggestion"
      psych_flag_type:
        | "consecutive_low_logging"
        | "consecutive_zero_logging"
        | "restrictive_language"
      tca_screening_answer:
        | "very_positive"
        | "positive"
        | "neutral"
        | "complicated"
        | "prefer_not_to_say"
      unit_energy: "kcal" | "kJ"
      unit_weight: "kg" | "lb"
      user_goal: "lose_weight" | "maintain" | "gain_muscle"
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
      activity_level: [
        "sedentary",
        "lightly_active",
        "moderately_active",
        "very_active",
        "extra_active",
      ],
      biological_sex: ["male", "female"],
      food_category: [
        "fruit",
        "vegetable",
        "grain",
        "legume",
        "dairy",
        "meat",
        "poultry",
        "fish_seafood",
        "egg",
        "nut_seed",
        "oil_fat",
        "sweet",
        "beverage",
        "condiment",
        "prepared_meal",
        "supplement",
        "other",
      ],
      food_source_type: ["homemade", "restaurant", "packaged"],
      logging_method: ["photo", "natural_text", "manual", "barcode"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      moderation_status: ["pending", "approved", "rejected"],
      notification_type: [
        "meal_reminder",
        "positive_achievement",
        "weight_checkin",
        "nutrition_suggestion",
      ],
      psych_flag_type: [
        "consecutive_low_logging",
        "consecutive_zero_logging",
        "restrictive_language",
      ],
      tca_screening_answer: [
        "very_positive",
        "positive",
        "neutral",
        "complicated",
        "prefer_not_to_say",
      ],
      unit_energy: ["kcal", "kJ"],
      unit_weight: ["kg", "lb"],
      user_goal: ["lose_weight", "maintain", "gain_muscle"],
    },
  },
} as const
