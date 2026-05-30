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
      admin_message_reads: {
        Row: {
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "admin_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_broadcast: boolean
          recipient_id: string | null
          sender_id: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_broadcast?: boolean
          recipient_id?: string | null
          sender_id: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_broadcast?: boolean
          recipient_id?: string | null
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
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
      care_audit_log: {
        Row: {
          action: string
          actor_id: string
          at: string
          id: string
          metadata: Json
          owner_id: string
          relationship_id: string | null
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          action: string
          actor_id: string
          at?: string
          id?: string
          metadata?: Json
          owner_id: string
          relationship_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          at?: string
          id?: string
          metadata?: Json
          owner_id?: string
          relationship_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_audit_log_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "care_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      care_relationships: {
        Row: {
          accepted_at: string | null
          caregiver_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          invite_email: string
          invite_token: string
          owner_id: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["care_role"]
          status: Database["public"]["Enums"]["care_relationship_status"]
        }
        Insert: {
          accepted_at?: string | null
          caregiver_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_email: string
          invite_token: string
          owner_id: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["care_role"]
          status?: Database["public"]["Enums"]["care_relationship_status"]
        }
        Update: {
          accepted_at?: string | null
          caregiver_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          invite_email?: string
          invite_token?: string
          owner_id?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["care_role"]
          status?: Database["public"]["Enums"]["care_relationship_status"]
        }
        Relationships: []
      }
      care_scopes: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          relationship_id: string
          scope: string
        }
        Insert: {
          created_at?: string
          granted?: boolean
          id?: string
          relationship_id: string
          scope: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          relationship_id?: string
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_scopes_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "care_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          body: string
          created_at: string
          hidden: boolean
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          hidden?: boolean
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          hidden?: boolean
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          body: string
          created_at: string
          hidden: boolean
          id: string
          image_url: string | null
          pinned: boolean
          title: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          hidden?: boolean
          id?: string
          image_url?: string | null
          pinned?: boolean
          title: string
          topic?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          hidden?: boolean
          id?: string
          image_url?: string | null
          pinned?: boolean
          title?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_reactions: {
        Row: {
          created_at: string
          kind: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          kind: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          kind?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reports: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          reason: string
          reporter_id: string
          resolved: boolean
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason: string
          reporter_id: string
          resolved?: boolean
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id?: string
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_resources: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          sort_order: number
          title: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          sort_order?: number
          title: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          title?: string
          url?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          handled: boolean
          handled_at: string | null
          handled_by: string | null
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          handled?: boolean
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          handled?: boolean
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message?: string
          name?: string
          subject?: string | null
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          message: string
          resolved: boolean
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          message: string
          resolved?: boolean
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          message?: string
          resolved?: boolean
          user_id?: string
        }
        Relationships: []
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
          alarm_sound: string | null
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
          reminder_style: string
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
          alarm_sound?: string | null
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
          reminder_style?: string
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
          alarm_sound?: string | null
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
          reminder_style?: string
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
      metric_dictionary: {
        Row: {
          aliases: string[]
          category: string
          created_at: string
          default_ref_high: number | null
          default_ref_low: number | null
          default_unit: string | null
          display_name: string
          hints: string | null
          id: string
          metric_key: string
        }
        Insert: {
          aliases?: string[]
          category: string
          created_at?: string
          default_ref_high?: number | null
          default_ref_low?: number | null
          default_unit?: string | null
          display_name: string
          hints?: string | null
          id?: string
          metric_key: string
        }
        Update: {
          aliases?: string[]
          category?: string
          created_at?: string
          default_ref_high?: number | null
          default_ref_low?: number | null
          default_unit?: string | null
          display_name?: string
          hints?: string | null
          id?: string
          metric_key?: string
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
      pending_changes: {
        Row: {
          caregiver_id: string
          created_at: string
          decided_at: string | null
          decision_note: string | null
          id: string
          owner_id: string
          payload: Json
          relationship_id: string
          status: Database["public"]["Enums"]["pending_change_status"]
          target_id: string | null
          target_table: string | null
          type: string
        }
        Insert: {
          caregiver_id: string
          created_at?: string
          decided_at?: string | null
          decision_note?: string | null
          id?: string
          owner_id: string
          payload?: Json
          relationship_id: string
          status?: Database["public"]["Enums"]["pending_change_status"]
          target_id?: string | null
          target_table?: string | null
          type: string
        }
        Update: {
          caregiver_id?: string
          created_at?: string
          decided_at?: string | null
          decision_note?: string | null
          id?: string
          owner_id?: string
          payload?: Json
          relationship_id?: string
          status?: Database["public"]["Enums"]["pending_change_status"]
          target_id?: string | null
          target_table?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_changes_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "care_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      phi_access_log: {
        Row: {
          action: string
          actor_id: string
          at: string
          id: string
          ip_address: string | null
          metadata: Json
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor_id: string
          at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_model_preference: string
          caregiver_emails: string[]
          community_bio: string | null
          community_display_name: string | null
          community_opted_in: boolean
          consent_research: boolean
          consent_share_with_caregivers: boolean
          created_at: string
          date_of_birth: string | null
          default_alarm_sound: string
          diagnosis: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          floating_ask_enabled: boolean
          id: string
          idle_timeout_minutes: number
          last_name: string | null
          onboarded_at: string | null
          sleep_time: string
          snooze_minutes: number
          suspended_at: string | null
          timezone: string | null
          updated_at: string
          wake_time: string
        }
        Insert: {
          ai_model_preference?: string
          caregiver_emails?: string[]
          community_bio?: string | null
          community_display_name?: string | null
          community_opted_in?: boolean
          consent_research?: boolean
          consent_share_with_caregivers?: boolean
          created_at?: string
          date_of_birth?: string | null
          default_alarm_sound?: string
          diagnosis?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          floating_ask_enabled?: boolean
          id: string
          idle_timeout_minutes?: number
          last_name?: string | null
          onboarded_at?: string | null
          sleep_time?: string
          snooze_minutes?: number
          suspended_at?: string | null
          timezone?: string | null
          updated_at?: string
          wake_time?: string
        }
        Update: {
          ai_model_preference?: string
          caregiver_emails?: string[]
          community_bio?: string | null
          community_display_name?: string | null
          community_opted_in?: boolean
          consent_research?: boolean
          consent_share_with_caregivers?: boolean
          created_at?: string
          date_of_birth?: string | null
          default_alarm_sound?: string
          diagnosis?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          floating_ask_enabled?: boolean
          id?: string
          idle_timeout_minutes?: number
          last_name?: string | null
          onboarded_at?: string | null
          sleep_time?: string
          snooze_minutes?: number
          suspended_at?: string | null
          timezone?: string | null
          updated_at?: string
          wake_time?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_documents: {
        Row: {
          created_at: string
          error_message: string | null
          file_mime: string
          file_path: string
          id: string
          ocr_text: string | null
          report_date: string | null
          report_type: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_mime: string
          file_path: string
          id?: string
          ocr_text?: string | null
          report_date?: string | null
          report_type?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_mime?: string
          file_path?: string
          id?: string
          ocr_text?: string | null
          report_date?: string | null
          report_type?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_metrics: {
        Row: {
          created_at: string
          display_name: string | null
          flag: string | null
          id: string
          measured_at: string | null
          metric_key: string
          reference_high: number | null
          reference_low: number | null
          report_id: string
          unit: string | null
          user_corrected: boolean
          user_id: string
          value: number | null
          value_text: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          flag?: string | null
          id?: string
          measured_at?: string | null
          metric_key: string
          reference_high?: number | null
          reference_low?: number | null
          report_id: string
          unit?: string | null
          user_corrected?: boolean
          user_id: string
          value?: number | null
          value_text?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          flag?: string | null
          id?: string
          measured_at?: string | null
          metric_key?: string
          reference_high?: number | null
          reference_low?: number | null
          report_id?: string
          unit?: string | null
          user_corrected?: boolean
          user_id?: string
          value?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_metrics_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "report_documents"
            referencedColumns: ["id"]
          },
        ]
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          created_at: string
          depart_at: string
          destination_tz: string
          id: string
          label: string | null
          return_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          depart_at: string
          destination_tz: string
          id?: string
          label?: string | null
          return_at: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          depart_at?: string
          destination_tz?: string
          id?: string
          label?: string | null
          return_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
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
      community_profiles: {
        Row: {
          community_bio: string | null
          community_display_name: string | null
          community_opted_in: boolean | null
          id: string | null
        }
        Insert: {
          community_bio?: string | null
          community_display_name?: string | null
          community_opted_in?: boolean | null
          id?: string | null
        }
        Update: {
          community_bio?: string | null
          community_display_name?: string | null
          community_opted_in?: boolean | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_stuck_journal_entries: { Args: never; Returns: number }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_care_scope: {
        Args: { _caregiver_id: string; _owner_id: string; _scope: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
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
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      regenerate_today_pending_doses: {
        Args: { _user_id: string }
        Returns: undefined
      }
      seed_daily_medication_doses: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "user" | "admin" | "super_admin"
      care_relationship_status: "pending" | "active" | "revoked"
      care_role: "emergency" | "caregiver" | "provider" | "viewer"
      pending_change_status: "pending" | "approved" | "rejected"
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
      app_role: ["user", "admin", "super_admin"],
      care_relationship_status: ["pending", "active", "revoked"],
      care_role: ["emergency", "caregiver", "provider", "viewer"],
      pending_change_status: ["pending", "approved", "rejected"],
    },
  },
} as const
