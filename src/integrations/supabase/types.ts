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
      behavior_taxonomy: {
        Row: {
          aliases: string[]
          behavior_key: string
          behavior_label: string
          category: string
          created_at: string
          data_type: string
          id: string
          prompt_example: string
          sort_order: number
          unit: string | null
        }
        Insert: {
          aliases?: string[]
          behavior_key: string
          behavior_label: string
          category: string
          created_at?: string
          data_type: string
          id?: string
          prompt_example: string
          sort_order?: number
          unit?: string | null
        }
        Update: {
          aliases?: string[]
          behavior_key?: string
          behavior_label?: string
          category?: string
          created_at?: string
          data_type?: string
          id?: string
          prompt_example?: string
          sort_order?: number
          unit?: string | null
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
      daily_behaviors: {
        Row: {
          behavior_key: string
          created_at: string
          date: string
          extraction_confidence: number | null
          id: string
          journal_entry_id: string | null
          user_corrected: boolean
          user_id: string
          value: Json
        }
        Insert: {
          behavior_key: string
          created_at?: string
          date: string
          extraction_confidence?: number | null
          id?: string
          journal_entry_id?: string | null
          user_corrected?: boolean
          user_id: string
          value: Json
        }
        Update: {
          behavior_key?: string
          created_at?: string
          date?: string
          extraction_confidence?: number | null
          id?: string
          journal_entry_id?: string | null
          user_corrected?: boolean
          user_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "daily_behaviors_behavior_key_fkey"
            columns: ["behavior_key"]
            isOneToOne: false
            referencedRelation: "behavior_taxonomy"
            referencedColumns: ["behavior_key"]
          },
          {
            foreignKeyName: "daily_behaviors_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          ai_extracted: Json | null
          ai_summary: string | null
          ai_tags: string[]
          archived_at: string | null
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
          archived_at?: string | null
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
          archived_at?: string | null
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
          amount: number | null
          created_at: string
          id: string
          medication_id: string
          notes: string | null
          scheduled_at: string
          status: string
          taken_at: string | null
          unit: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          id?: string
          medication_id: string
          notes?: string | null
          scheduled_at: string
          status?: string
          taken_at?: string | null
          unit?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          id?: string
          medication_id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          taken_at?: string | null
          unit?: string | null
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
      medication_side_effects: {
        Row: {
          id: string
          medication_id: string
          noted_at: string
          severity: number | null
          side_effect: string
          user_id: string
        }
        Insert: {
          id?: string
          medication_id: string
          noted_at?: string
          severity?: number | null
          side_effect: string
          user_id: string
        }
        Update: {
          id?: string
          medication_id?: string
          noted_at?: string
          severity?: number | null
          side_effect?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_side_effects_medication_id_fkey"
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
          dosage_amount: number | null
          dosage_form: string | null
          dosage_unit: string | null
          end_date: string | null
          id: string
          is_rescue: boolean
          kind: string
          name: string
          notes: string | null
          pharmacy_name: string | null
          pills_remaining: number | null
          prescriber: string | null
          prescriber_name: string | null
          prescription_number: string | null
          refill_date: string | null
          refill_threshold: number | null
          schedule: Json
          side_effects_tracked: string[] | null
          start_date: string | null
          times_of_day: string[]
          updated_at: string
          user_id: string
          with_food: boolean | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          dosage_amount?: number | null
          dosage_form?: string | null
          dosage_unit?: string | null
          end_date?: string | null
          id?: string
          is_rescue?: boolean
          kind?: string
          name: string
          notes?: string | null
          pharmacy_name?: string | null
          pills_remaining?: number | null
          prescriber?: string | null
          prescriber_name?: string | null
          prescription_number?: string | null
          refill_date?: string | null
          refill_threshold?: number | null
          schedule?: Json
          side_effects_tracked?: string[] | null
          start_date?: string | null
          times_of_day?: string[]
          updated_at?: string
          user_id: string
          with_food?: boolean | null
        }
        Update: {
          active?: boolean
          created_at?: string
          dosage?: string | null
          dosage_amount?: number | null
          dosage_form?: string | null
          dosage_unit?: string | null
          end_date?: string | null
          id?: string
          is_rescue?: boolean
          kind?: string
          name?: string
          notes?: string | null
          pharmacy_name?: string | null
          pills_remaining?: number | null
          prescriber?: string | null
          prescriber_name?: string | null
          prescription_number?: string | null
          refill_date?: string | null
          refill_threshold?: number | null
          schedule?: Json
          side_effects_tracked?: string[] | null
          start_date?: string | null
          times_of_day?: string[]
          updated_at?: string
          user_id?: string
          with_food?: boolean | null
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
      research_sources: {
        Row: {
          abstract: string
          authors: string | null
          content: string
          created_at: string
          embedding: string | null
          evidence_grade: string | null
          id: string
          publication: string | null
          source_type: string | null
          title: string
          url: string
          year: number | null
        }
        Insert: {
          abstract: string
          authors?: string | null
          content: string
          created_at?: string
          embedding?: string | null
          evidence_grade?: string | null
          id?: string
          publication?: string | null
          source_type?: string | null
          title: string
          url: string
          year?: number | null
        }
        Update: {
          abstract?: string
          authors?: string | null
          content?: string
          created_at?: string
          embedding?: string | null
          evidence_grade?: string | null
          id?: string
          publication?: string | null
          source_type?: string | null
          title?: string
          url?: string
          year?: number | null
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
      match_research_library: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          abstract: string
          authors: string
          content: string
          evidence_grade: string
          id: string
          publication: string
          similarity: number
          source_type: string
          title: string
          url: string
          year: number
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
