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
      clubs: {
        Row: {
          address: string | null
          business_status: string | null
          city: string
          country: string | null
          created_at: string | null
          google_maps_uri: string | null
          google_place_id: string
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          last_updated: string | null
          latitude: number
          longitude: number
          name: string
          opening_hours: Json | null
          photos: string[] | null
          price_level: number | null
          rating: number | null
          venue_type: string | null
        }
        Insert: {
          address?: string | null
          business_status?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          google_maps_uri?: string | null
          google_place_id: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          last_updated?: string | null
          latitude: number
          longitude: number
          name: string
          opening_hours?: Json | null
          photos?: string[] | null
          price_level?: number | null
          rating?: number | null
          venue_type?: string | null
        }
        Update: {
          address?: string | null
          business_status?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          google_maps_uri?: string | null
          google_place_id?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          last_updated?: string | null
          latitude?: number
          longitude?: number
          name?: string
          opening_hours?: Json | null
          photos?: string[] | null
          price_level?: number | null
          rating?: number | null
          venue_type?: string | null
        }
        Relationships: []
      }
      event_answers: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_host_answer: boolean | null
          question_id: string
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_host_answer?: boolean | null
          question_id: string
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_host_answer?: boolean | null
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "event_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_cohosts: {
        Row: {
          added_at: string
          added_by: string
          event_id: string
          host_id: string
          id: string
          role: string
        }
        Insert: {
          added_at?: string
          added_by: string
          event_id: string
          host_id: string
          id?: string
          role?: string
        }
        Update: {
          added_at?: string
          added_by?: string
          event_id?: string
          host_id?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_cohosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cohosts_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_cohosts_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "public_host_info"
            referencedColumns: ["id"]
          },
        ]
      }
      event_messages: {
        Row: {
          created_at: string
          event_id: string
          id: string
          is_host_message: boolean | null
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          is_host_message?: boolean | null
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          is_host_message?: boolean | null
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_questions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          question: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          question: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          actual_rsvp: number | null
          age_limit: number | null
          city: string
          country: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          expected_attendance: number | null
          host_id: string
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string
          max_attendees: number | null
          name: string
          photos: string[] | null
          price: number | null
          report_count: number | null
          safety_rules: string | null
          start_time: string
          type: Database["public"]["Enums"]["event_type"]
          updated_at: string | null
        }
        Insert: {
          actual_rsvp?: number | null
          age_limit?: number | null
          city?: string
          country?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          expected_attendance?: number | null
          host_id: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name: string
          max_attendees?: number | null
          name: string
          photos?: string[] | null
          price?: number | null
          report_count?: number | null
          safety_rules?: string | null
          start_time: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string | null
        }
        Update: {
          actual_rsvp?: number | null
          age_limit?: number | null
          city?: string
          country?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          expected_attendance?: number | null
          host_id?: string
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string
          max_attendees?: number | null
          name?: string
          photos?: string[] | null
          price?: number | null
          report_count?: number | null
          safety_rules?: string | null
          start_time?: string
          type?: Database["public"]["Enums"]["event_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "public_host_info"
            referencedColumns: ["id"]
          },
        ]
      }
      hosts: {
        Row: {
          created_at: string | null
          events_hosted: number | null
          id: string
          rating: number | null
          user_id: string
          verification_documents: string[] | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          events_hosted?: number | null
          id?: string
          rating?: number | null
          user_id: string
          verification_documents?: string[] | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          events_hosted?: number | null
          id?: string
          rating?: number | null
          user_id?: string
          verification_documents?: string[] | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_verified: boolean | null
          age_verified_at: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string | null
          date_of_birth: string | null
          didit_session_id: string | null
          display_name: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          age_verified?: boolean | null
          age_verified_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          didit_session_id?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          age_verified?: boolean | null
          age_verified_at?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          didit_session_id?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string | null
          device_id: string | null
          id: string
          is_active: boolean | null
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_active?: boolean | null
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string | null
          description: string | null
          event_id: string
          id: string
          reason: string
          reporter_id: string
          severity: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_id: string
          id?: string
          reason: string
          reporter_id: string
          severity?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_id?: string
          id?: string
          reason?: string
          reporter_id?: string
          severity?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_events: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interactions: {
        Row: {
          city: string | null
          club_id: string | null
          created_at: string
          event_id: string | null
          event_type: string | null
          id: string
          interaction_type: string
          user_id: string
        }
        Insert: {
          city?: string | null
          club_id?: string | null
          created_at?: string
          event_id?: string | null
          event_type?: string | null
          id?: string
          interaction_type: string
          user_id: string
        }
        Update: {
          city?: string | null
          club_id?: string | null
          created_at?: string
          event_id?: string | null
          event_type?: string | null
          id?: string
          interaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          avg_price_preference: number | null
          created_at: string
          id: string
          pref_club: number | null
          pref_festival: number | null
          pref_house_party: number | null
          pref_public: number | null
          pref_university: number | null
          preferred_cities: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_price_preference?: number | null
          created_at?: string
          id?: string
          pref_club?: number | null
          pref_festival?: number | null
          pref_house_party?: number | null
          pref_public?: number | null
          pref_university?: number | null
          preferred_cities?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_price_preference?: number | null
          created_at?: string
          id?: string
          pref_club?: number | null
          pref_festival?: number | null
          pref_house_party?: number | null
          pref_public?: number | null
          pref_university?: number | null
          preferred_cities?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_host_info: {
        Row: {
          created_at: string | null
          events_hosted: number | null
          id: string | null
          rating: number | null
          user_id: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          events_hosted?: number | null
          id?: string | null
          rating?: number | null
          user_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          events_hosted?: number | null
          id?: string | null
          rating?: number | null
          user_id?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          _action: string
          _max_requests?: number
          _user_id: string
          _window_minutes?: number
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      event_type: "club" | "house_party" | "university" | "festival" | "public"
      verification_status: "pending" | "verified" | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      event_type: ["club", "house_party", "university", "festival", "public"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
