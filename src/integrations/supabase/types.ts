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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_memory: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          recorded_at: string
          source_id: string
          source_table: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          recorded_at?: string
          source_id: string
          source_table: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          recorded_at?: string
          source_id?: string
          source_table?: string
          user_id?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          body: string | null
          created_at: string
          id: string
          kind: string
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      biometrics: {
        Row: {
          active_calories: number | null
          body_temp_deviation_c: number | null
          created_at: string
          cycle_day: number | null
          hr_bpm: number | null
          hrv_rmssd_ms: number | null
          hrv_sdnn_ms: number | null
          id: string
          menstrual_phase: string | null
          oura_activity_score: number | null
          oura_readiness_score: number | null
          oura_resilience_level: string | null
          oura_stress_score: number | null
          raw_payload: Json | null
          recorded_at: string
          respiratory_rate_bpm: number | null
          resting_hr_bpm: number | null
          skin_temp_c: number | null
          sleep_awake_min: number | null
          sleep_deep_min: number | null
          sleep_efficiency_pct: number | null
          sleep_latency_min: number | null
          sleep_light_min: number | null
          sleep_rem_min: number | null
          sleep_score: number | null
          sleep_total_min: number | null
          source: string
          spo2_pct: number | null
          steps: number | null
          user_id: string
          whoop_recovery_pct: number | null
          whoop_sleep_performance_pct: number | null
          whoop_strain: number | null
          workout_minutes: number | null
        }
        Insert: {
          active_calories?: number | null
          body_temp_deviation_c?: number | null
          created_at?: string
          cycle_day?: number | null
          hr_bpm?: number | null
          hrv_rmssd_ms?: number | null
          hrv_sdnn_ms?: number | null
          id?: string
          menstrual_phase?: string | null
          oura_activity_score?: number | null
          oura_readiness_score?: number | null
          oura_resilience_level?: string | null
          oura_stress_score?: number | null
          raw_payload?: Json | null
          recorded_at: string
          respiratory_rate_bpm?: number | null
          resting_hr_bpm?: number | null
          skin_temp_c?: number | null
          sleep_awake_min?: number | null
          sleep_deep_min?: number | null
          sleep_efficiency_pct?: number | null
          sleep_latency_min?: number | null
          sleep_light_min?: number | null
          sleep_rem_min?: number | null
          sleep_score?: number | null
          sleep_total_min?: number | null
          source: string
          spo2_pct?: number | null
          steps?: number | null
          user_id: string
          whoop_recovery_pct?: number | null
          whoop_sleep_performance_pct?: number | null
          whoop_strain?: number | null
          workout_minutes?: number | null
        }
        Update: {
          active_calories?: number | null
          body_temp_deviation_c?: number | null
          created_at?: string
          cycle_day?: number | null
          hr_bpm?: number | null
          hrv_rmssd_ms?: number | null
          hrv_sdnn_ms?: number | null
          id?: string
          menstrual_phase?: string | null
          oura_activity_score?: number | null
          oura_readiness_score?: number | null
          oura_resilience_level?: string | null
          oura_stress_score?: number | null
          raw_payload?: Json | null
          recorded_at?: string
          respiratory_rate_bpm?: number | null
          resting_hr_bpm?: number | null
          skin_temp_c?: number | null
          sleep_awake_min?: number | null
          sleep_deep_min?: number | null
          sleep_efficiency_pct?: number | null
          sleep_latency_min?: number | null
          sleep_light_min?: number | null
          sleep_rem_min?: number | null
          sleep_score?: number | null
          sleep_total_min?: number | null
          source?: string
          spo2_pct?: number | null
          steps?: number | null
          user_id?: string
          whoop_recovery_pct?: number | null
          whoop_sleep_performance_pct?: number | null
          whoop_strain?: number | null
          workout_minutes?: number | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          ai_extracted: Json | null
          ai_summary: string | null
          ai_tags: string[]
          captured_at: string
          created_at: string
          id: string
          kind: string
          linked_medication_dose_id: string | null
          linked_seizure_id: string | null
          media_urls: string[]
          status: string
          text: string | null
          user_id: string
          voice_transcript: string | null
        }
        Insert: {
          ai_extracted?: Json | null
          ai_summary?: string | null
          ai_tags?: string[]
          captured_at?: string
          created_at?: string
          id?: string
          kind?: string
          linked_medication_dose_id?: string | null
          linked_seizure_id?: string | null
          media_urls?: string[]
          status?: string
          text?: string | null
          user_id: string
          voice_transcript?: string | null
        }
        Update: {
          ai_extracted?: Json | null
          ai_summary?: string | null
          ai_tags?: string[]
          captured_at?: string
          created_at?: string
          id?: string
          kind?: string
          linked_medication_dose_id?: string | null
          linked_seizure_id?: string | null
          media_urls?: string[]
          status?: string
          text?: string | null
          user_id?: string
          voice_transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_linked_medication_dose_id_fkey"
            columns: ["linked_medication_dose_id"]
            isOneToOne: false
            referencedRelation: "medication_doses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_linked_seizure_id_fkey"
            columns: ["linked_seizure_id"]
            isOneToOne: false
            referencedRelation: "seizure_events"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_doses: {
        Row: {
          created_at: string
          id: string
          medication_id: string
          notes: string | null
          scheduled_at: string
          status: string
          taken_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medication_id: string
          notes?: string | null
          scheduled_at: string
          status?: string
          taken_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medication_id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_doses_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean
          created_at: string
          dosage: string | null
          end_date: string | null
          id: string
          is_rescue: boolean
          name: string
          notes: string | null
          pills_remaining: number | null
          prescriber: string | null
          refill_date: string | null
          start_date: string | null
          times_of_day: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          id?: string
          is_rescue?: boolean
          name: string
          notes?: string | null
          pills_remaining?: number | null
          prescriber?: string | null
          refill_date?: string | null
          start_date?: string | null
          times_of_day?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          end_date?: string | null
          id?: string
          is_rescue?: boolean
          name?: string
          notes?: string | null
          pills_remaining?: number | null
          prescriber?: string | null
          refill_date?: string | null
          start_date?: string | null
          times_of_day?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      oura_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          refresh_token: string | null
          scope: string | null
          sync_interval_hours: number
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          refresh_token?: string | null
          scope?: string | null
          sync_interval_hours?: number
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          refresh_token?: string | null
          scope?: string | null
          sync_interval_hours?: number
          token_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          caregiver_emails: string[]
          consent_research: boolean
          consent_share_with_caregivers: boolean
          created_at: string
          date_of_birth: string | null
          diagnosis: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarded_at: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          caregiver_emails?: string[]
          consent_research?: boolean
          consent_share_with_caregivers?: boolean
          created_at?: string
          date_of_birth?: string | null
          diagnosis?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          onboarded_at?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          caregiver_emails?: string[]
          consent_research?: boolean
          consent_share_with_caregivers?: boolean
          created_at?: string
          date_of_birth?: string | null
          diagnosis?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarded_at?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      risk_forecasts: {
        Row: {
          ai_narrative: string | null
          band: string
          computed_at: string
          for_date: string
          id: string
          model_version: string | null
          risk_score: number
          top_factors: Json | null
          user_id: string
        }
        Insert: {
          ai_narrative?: string | null
          band: string
          computed_at?: string
          for_date: string
          id?: string
          model_version?: string | null
          risk_score: number
          top_factors?: Json | null
          user_id: string
        }
        Update: {
          ai_narrative?: string | null
          band?: string
          computed_at?: string
          for_date?: string
          id?: string
          model_version?: string | null
          risk_score?: number
          top_factors?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      seizure_events: {
        Row: {
          auto_detected: boolean
          created_at: string
          detection_source: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          injury: boolean
          injury_description: string | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          photo_urls: string[]
          pre_ictal_snapshot: Json | null
          recovery_minutes: number | null
          rescue_med_given: boolean
          rescue_med_name: string | null
          severity: number | null
          started_at: string
          type: string | null
          user_id: string
          video_url: string | null
          witness_name: string | null
          witnessed: boolean
        }
        Insert: {
          auto_detected?: boolean
          created_at?: string
          detection_source?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          injury?: boolean
          injury_description?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          photo_urls?: string[]
          pre_ictal_snapshot?: Json | null
          recovery_minutes?: number | null
          rescue_med_given?: boolean
          rescue_med_name?: string | null
          severity?: number | null
          started_at: string
          type?: string | null
          user_id: string
          video_url?: string | null
          witness_name?: string | null
          witnessed?: boolean
        }
        Update: {
          auto_detected?: boolean
          created_at?: string
          detection_source?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          injury?: boolean
          injury_description?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          photo_urls?: string[]
          pre_ictal_snapshot?: Json | null
          recovery_minutes?: number | null
          rescue_med_given?: boolean
          rescue_med_name?: string | null
          severity?: number | null
          started_at?: string
          type?: string | null
          user_id?: string
          video_url?: string | null
          witness_name?: string | null
          witnessed?: boolean
        }
        Relationships: []
      }
      whoop_tokens: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string | null
          refresh_token: string | null
          scope: string | null
          token_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at?: string | null
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string | null
          refresh_token?: string | null
          scope?: string | null
          token_type?: string | null
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
      match_ai_memory: {
        Args: {
          days_back?: number
          match_count?: number
          match_user_id: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          recorded_at: string
          similarity: number
          source_id: string
          source_table: string
        }[]
      }
      medication_adherence: {
        Args: { days_back?: number; med_id: string }
        Returns: {
          adherence_pct: number
          scheduled_count: number
          taken_count: number
        }[]
      }
      seed_daily_medication_doses: { Args: never; Returns: undefined }
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
