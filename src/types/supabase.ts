// ============================================================================
// Tipos TypeScript do banco Supabase (RepFit).
// ----------------------------------------------------------------------------
// Escritos à mão para espelhar exatamente supabase/migrations/*.sql.
// Assim que houver acesso ao projeto (supabase CLI), rode:
//   supabase gen types typescript --project-id <ref> --schema public > src/types/supabase.ts
// e substitua este arquivo (o gerado é a fonte de verdade).
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      // ---------------------------------------------------------------- profiles
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      // -------------------------------------------------------------- app_config
      app_config: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ----------------------------------------------------------- subscriptions
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          provider: string | null;
          external_customer_id: string | null;
          external_subscription_id: string | null;
          plan_name: string | null;
          plan_id: string | null;
          /** active | trial | past_due | canceled | expired | pending | lifetime */
          status: string;
          amount: number | null;
          currency: string;
          started_at: string | null;
          current_period_start: string | null;
          /** NULL = vitalício (nunca expira) */
          current_period_end: string | null;
          canceled_at: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider?: string | null;
          external_customer_id?: string | null;
          external_subscription_id?: string | null;
          plan_name?: string | null;
          plan_id?: string | null;
          status?: string;
          amount?: number | null;
          currency?: string;
          started_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: string | null;
          external_customer_id?: string | null;
          external_subscription_id?: string | null;
          plan_name?: string | null;
          plan_id?: string | null;
          status?: string;
          amount?: number | null;
          currency?: string;
          started_at?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          canceled_at?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      // ---------------------------------------------------------------- payments
      payments: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string | null;
          provider: string | null;
          external_payment_id: string | null;
          amount: number;
          currency: string;
          /** pending | paid | failed | refunded | canceled */
          status: string;
          payment_method: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id?: string | null;
          provider?: string | null;
          external_payment_id?: string | null;
          amount: number;
          currency?: string;
          status?: string;
          payment_method?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subscription_id?: string | null;
          provider?: string | null;
          external_payment_id?: string | null;
          amount?: number;
          currency?: string;
          status?: string;
          payment_method?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payments_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };

      // ------------------------------------------------------ subscription_events
      subscription_events: {
        Row: {
          id: string;
          user_id: string | null;
          subscription_id: string | null;
          provider: string | null;
          event_type: string;
          external_event_id: string | null;
          payload: Json;
          processed: boolean;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          subscription_id?: string | null;
          provider?: string | null;
          event_type: string;
          external_event_id?: string | null;
          payload?: Json;
          processed?: boolean;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          subscription_id?: string | null;
          provider?: string | null;
          event_type?: string;
          external_event_id?: string | null;
          payload?: Json;
          processed?: boolean;
          processed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscription_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'subscription_events_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: false;
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          },
        ];
      };

      // ---------------------------------------------------------------- workouts
      workouts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          /** tipo do treino (ex.: 'Push', 'Full Body') */
          type: string | null;
          workout_date: string;
          started_at: string | null;
          finished_at: string | null;
          duration_seconds: number | null;
          notes: string | null;
          effort_level: number | null;
          /** academia | calistenia (espelha o campo do app) */
          mode: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type?: string | null;
          workout_date: string;
          started_at?: string | null;
          finished_at?: string | null;
          duration_seconds?: number | null;
          notes?: string | null;
          effort_level?: number | null;
          mode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string | null;
          workout_date?: string;
          started_at?: string | null;
          finished_at?: string | null;
          duration_seconds?: number | null;
          notes?: string | null;
          effort_level?: number | null;
          mode?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workouts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      // --------------------------------------------------------------- exercises
      exercises: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          muscle_group: string | null;
          category: string | null;
          /** NULL = exercício padrão (global); preenchido = personalizado */
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          muscle_group?: string | null;
          category?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          muscle_group?: string | null;
          category?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercises_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      // -------------------------------------------------------- workout_exercises
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string | null;
          /** snapshot do nome (preserva o histórico mesmo se o catálogo mudar) */
          exercise_name: string;
          order_index: number;
          notes: string | null;
          effort_level: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id?: string | null;
          exercise_name: string;
          order_index?: number;
          notes?: string | null;
          effort_level?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_id?: string;
          exercise_id?: string | null;
          exercise_name?: string;
          order_index?: number;
          notes?: string | null;
          effort_level?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_exercises_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
        ];
      };

      // -------------------------------------------------------------- workout_sets
      workout_sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          repetitions: number | null;
          weight: number | null;
          weight_unit: string;
          duration_seconds: number | null;
          distance: number | null;
          rest_seconds: number | null;
          effort_level: number | null;
          completed: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          set_number: number;
          repetitions?: number | null;
          weight?: number | null;
          weight_unit?: string;
          duration_seconds?: number | null;
          distance?: number | null;
          rest_seconds?: number | null;
          effort_level?: number | null;
          completed?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          workout_exercise_id?: string;
          set_number?: number;
          repetitions?: number | null;
          weight?: number | null;
          weight_unit?: string;
          duration_seconds?: number | null;
          distance?: number | null;
          rest_seconds?: number | null;
          effort_level?: number | null;
          completed?: boolean;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_sets_workout_exercise_id_fkey';
            columns: ['workout_exercise_id'];
            isOneToOne: false;
            referencedRelation: 'workout_exercises';
            referencedColumns: ['id'];
          },
        ];
      };

      // --------------------------------------------------------- body_measurements
      body_measurements: {
        Row: {
          id: string;
          user_id: string;
          measured_at: string;
          weight: number | null;
          body_fat_percentage: number | null;
          chest: number | null;
          waist: number | null;
          arm: number | null;
          thigh: number | null;
          calf: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          measured_at?: string;
          weight?: number | null;
          body_fat_percentage?: number | null;
          chest?: number | null;
          waist?: number | null;
          arm?: number | null;
          thigh?: number | null;
          calf?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          measured_at?: string;
          weight?: number | null;
          body_fat_percentage?: number | null;
          chest?: number | null;
          waist?: number | null;
          arm?: number | null;
          thigh?: number | null;
          calf?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'body_measurements_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };

      // ---------------------------------------------------------- personal_records
      personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string | null;
          /** max_weight | max_reps | max_volume */
          record_type: string;
          value: number;
          repetitions: number | null;
          weight: number | null;
          workout_id: string | null;
          achieved_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id?: string | null;
          record_type: string;
          value: number;
          repetitions?: number | null;
          weight?: number | null;
          workout_id?: string | null;
          achieved_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string | null;
          record_type?: string;
          value?: number;
          repetitions?: number | null;
          weight?: number | null;
          workout_id?: string | null;
          achieved_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'personal_records_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'personal_records_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'personal_records_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
        ];
      };
      // ------------------------------------------------------ device_link_codes
      device_link_codes: {
        Row: {
          id: string;
          user_id: string;
          /** SHA-256 do código + pepper — nunca o código em texto puro */
          code_hash: string;
          expires_at: string;
          used_at: string | null;
          revoked_at: string | null;
          attempts: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          code_hash: string;
          expires_at: string;
          used_at?: string | null;
          revoked_at?: string | null;
          attempts?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          code_hash?: string;
          expires_at?: string;
          used_at?: string | null;
          revoked_at?: string | null;
          attempts?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'device_link_codes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: 'trigger';
      };
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: 'trigger';
      };
      claim_device_link_code: {
        Args: {
          p_code_hash: string;
          p_max_attempts: number;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

// ---------------------------------------------------------------------------
// Tipos utilitários para o app (não vêm do gerador, mas usam o banco tipado).
// ---------------------------------------------------------------------------

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
export type PaymentRow = Database['public']['Tables']['payments']['Row'];
export type SubscriptionEventRow = Database['public']['Tables']['subscription_events']['Row'];
export type WorkoutRow = Database['public']['Tables']['workouts']['Row'];
export type ExerciseRow = Database['public']['Tables']['exercises']['Row'];
export type WorkoutExerciseRow = Database['public']['Tables']['workout_exercises']['Row'];
export type WorkoutSetRow = Database['public']['Tables']['workout_sets']['Row'];
export type BodyMeasurementRow = Database['public']['Tables']['body_measurements']['Row'];
export type PersonalRecordRow = Database['public']['Tables']['personal_records']['Row'];
