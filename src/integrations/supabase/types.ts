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
      bartender_availability: {
        Row: {
          bartender_profile_id: string
          created_at: string | null
          date: string
          id: string
          is_available: boolean | null
          notes: string | null
        }
        Insert: {
          bartender_profile_id: string
          created_at?: string | null
          date: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
        }
        Update: {
          bartender_profile_id?: string
          created_at?: string | null
          date?: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bartender_availability_bartender_profile_id_fkey"
            columns: ["bartender_profile_id"]
            isOneToOne: false
            referencedRelation: "bartender_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bartender_booking_requests: {
        Row: {
          bartender_profile_id: string
          bartender_response: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          currency: string | null
          event_date: string
          event_description: string | null
          event_location: string | null
          event_type: string
          id: string
          message: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bartender_profile_id: string
          bartender_response?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          currency?: string | null
          event_date: string
          event_description?: string | null
          event_location?: string | null
          event_type: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bartender_profile_id?: string
          bartender_response?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          currency?: string | null
          event_date?: string
          event_description?: string | null
          event_location?: string | null
          event_type?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bartender_booking_requests_bartender_profile_id_fkey"
            columns: ["bartender_profile_id"]
            isOneToOne: false
            referencedRelation: "bartender_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bartender_profiles: {
        Row: {
          bartender_name: string
          bio: string | null
          city: string
          created_at: string | null
          currency: string | null
          experience_level: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          preferred_event_types: string[] | null
          price_max: number | null
          price_min: number | null
          profile_photo: string | null
          rating: number | null
          review_count: number | null
          skills: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bartender_name: string
          bio?: string | null
          city?: string
          created_at?: string | null
          currency?: string | null
          experience_level?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          preferred_event_types?: string[] | null
          price_max?: number | null
          price_min?: number | null
          profile_photo?: string | null
          rating?: number | null
          review_count?: number | null
          skills?: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bartender_name?: string
          bio?: string | null
          city?: string
          created_at?: string | null
          currency?: string | null
          experience_level?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          preferred_event_types?: string[] | null
          price_max?: number | null
          price_min?: number | null
          profile_photo?: string | null
          rating?: number | null
          review_count?: number | null
          skills?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bartender_reviews: {
        Row: {
          bartender_profile_id: string
          booking_id: string | null
          created_at: string | null
          id: string
          rating: number
          review: string | null
          user_id: string
        }
        Insert: {
          bartender_profile_id: string
          booking_id?: string | null
          created_at?: string | null
          id?: string
          rating: number
          review?: string | null
          user_id: string
        }
        Update: {
          bartender_profile_id?: string
          booking_id?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bartender_reviews_bartender_profile_id_fkey"
            columns: ["bartender_profile_id"]
            isOneToOne: false
            referencedRelation: "bartender_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bartender_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bartender_booking_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      bartender_subscriptions: {
        Row: {
          auto_renew: boolean | null
          bartender_profile_id: string
          created_at: string | null
          currency: string
          expires_at: string | null
          id: string
          price_cents: number
          started_at: string | null
          status: string
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          bartender_profile_id: string
          created_at?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          price_cents?: number
          started_at?: string | null
          status?: string
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          bartender_profile_id?: string
          created_at?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          price_cents?: number
          started_at?: string | null
          status?: string
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bartender_subscriptions_bartender_profile_id_fkey"
            columns: ["bartender_profile_id"]
            isOneToOne: true
            referencedRelation: "bartender_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      close_friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      club_analytics: {
        Row: {
          clicks: number | null
          club_id: string
          created_at: string | null
          date: string
          directions_clicks: number | null
          id: string
          shares: number | null
          views: number | null
        }
        Insert: {
          clicks?: number | null
          club_id: string
          created_at?: string | null
          date?: string
          directions_clicks?: number | null
          id?: string
          shares?: number | null
          views?: number | null
        }
        Update: {
          clicks?: number | null
          club_id?: string
          created_at?: string | null
          date?: string
          directions_clicks?: number | null
          id?: string
          shares?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "club_analytics_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_analytics_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "public_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_claims: {
        Row: {
          admin_notes: string | null
          business_email_encrypted: string | null
          business_name: string
          business_phone_encrypted: string | null
          club_id: string
          created_at: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["club_verification_status"]
          user_id: string
          verification_documents: string[] | null
        }
        Insert: {
          admin_notes?: string | null
          business_email_encrypted?: string | null
          business_name: string
          business_phone_encrypted?: string | null
          club_id: string
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["club_verification_status"]
          user_id: string
          verification_documents?: string[] | null
        }
        Update: {
          admin_notes?: string | null
          business_email_encrypted?: string | null
          business_name?: string
          business_phone_encrypted?: string | null
          club_id?: string
          created_at?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["club_verification_status"]
          user_id?: string
          verification_documents?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "club_claims_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_claims_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "public_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          address: string | null
          business_status: string | null
          city: string
          country: string | null
          created_at: string | null
          crowd_info: Json | null
          description: string | null
          google_maps_uri: string | null
          google_place_id: string
          highlights: string[] | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          last_updated: string | null
          latitude: number
          longitude: number
          music_genres: string[] | null
          name: string
          opening_hours: Json | null
          owner_id: string | null
          photos: string[] | null
          price_level: number | null
          rating: number | null
          services: string[] | null
          venue_type: string | null
        }
        Insert: {
          address?: string | null
          business_status?: string | null
          city: string
          country?: string | null
          created_at?: string | null
          crowd_info?: Json | null
          description?: string | null
          google_maps_uri?: string | null
          google_place_id: string
          highlights?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          last_updated?: string | null
          latitude: number
          longitude: number
          music_genres?: string[] | null
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          photos?: string[] | null
          price_level?: number | null
          rating?: number | null
          services?: string[] | null
          venue_type?: string | null
        }
        Update: {
          address?: string | null
          business_status?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          crowd_info?: Json | null
          description?: string | null
          google_maps_uri?: string | null
          google_place_id?: string
          highlights?: string[] | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          last_updated?: string | null
          latitude?: number
          longitude?: number
          music_genres?: string[] | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          photos?: string[] | null
          price_level?: number | null
          rating?: number | null
          services?: string[] | null
          venue_type?: string | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          conversation_id: string
          created_at: string
          edited_at: string | null
          encrypted_content_recipient: string
          encrypted_content_sender: string
          file_mime_type: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_deleted: boolean
          message_type: string
          nonce_recipient: string
          nonce_sender: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          edited_at?: string | null
          encrypted_content_recipient: string
          encrypted_content_sender: string
          file_mime_type?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean
          message_type?: string
          nonce_recipient: string
          nonce_sender: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          edited_at?: string | null
          encrypted_content_recipient?: string
          encrypted_content_sender?: string
          file_mime_type?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_deleted?: boolean
          message_type?: string
          nonce_recipient?: string
          nonce_sender?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_availability: {
        Row: {
          created_at: string | null
          date: string
          dj_profile_id: string
          id: string
          is_available: boolean | null
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          dj_profile_id: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          dj_profile_id?: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_availability_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_booking_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          currency: string | null
          dj_profile_id: string
          dj_response: string | null
          event_date: string
          event_description: string | null
          event_location: string | null
          event_type: string
          id: string
          message: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          currency?: string | null
          dj_profile_id: string
          dj_response?: string | null
          event_date: string
          event_description?: string | null
          event_location?: string | null
          event_type: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          currency?: string | null
          dj_profile_id?: string
          dj_response?: string | null
          event_date?: string
          event_description?: string | null
          event_location?: string | null
          event_type?: string
          id?: string
          message?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dj_booking_requests_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_profiles: {
        Row: {
          bio: string | null
          city: string
          created_at: string | null
          currency: string | null
          dj_name: string
          experience_level: string | null
          genres: string[]
          id: string
          instagram_url: string | null
          is_active: boolean | null
          mixcloud_url: string | null
          preferred_event_types: string[] | null
          price_max: number | null
          price_min: number | null
          profile_photo: string | null
          rating: number | null
          review_count: number | null
          soundcloud_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          city?: string
          created_at?: string | null
          currency?: string | null
          dj_name: string
          experience_level?: string | null
          genres?: string[]
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          mixcloud_url?: string | null
          preferred_event_types?: string[] | null
          price_max?: number | null
          price_min?: number | null
          profile_photo?: string | null
          rating?: number | null
          review_count?: number | null
          soundcloud_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          city?: string
          created_at?: string | null
          currency?: string | null
          dj_name?: string
          experience_level?: string | null
          genres?: string[]
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          mixcloud_url?: string | null
          preferred_event_types?: string[] | null
          price_max?: number | null
          price_min?: number | null
          profile_photo?: string | null
          rating?: number | null
          review_count?: number | null
          soundcloud_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dj_reviews: {
        Row: {
          booking_id: string | null
          created_at: string | null
          dj_profile_id: string
          id: string
          rating: number
          review: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          dj_profile_id: string
          id?: string
          rating: number
          review?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          dj_profile_id?: string
          id?: string
          rating?: number
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dj_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "dj_booking_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_reviews_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: false
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          currency: string
          dj_profile_id: string
          expires_at: string | null
          id: string
          price_cents: number
          started_at: string | null
          status: string
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          currency?: string
          dj_profile_id: string
          expires_at?: string | null
          id?: string
          price_cents?: number
          started_at?: string | null
          status?: string
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          currency?: string
          dj_profile_id?: string
          expires_at?: string | null
          id?: string
          price_cents?: number
          started_at?: string | null
          status?: string
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_subscriptions_dj_profile_id_fkey"
            columns: ["dj_profile_id"]
            isOneToOne: true
            referencedRelation: "dj_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_conversations: {
        Row: {
          created_at: string
          id: string
          participant_1: string
          participant_2: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_1: string
          participant_2: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_1?: string
          participant_2?: string
          updated_at?: string
        }
        Relationships: []
      }
      dm_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "direct_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_typing_indicators: {
        Row: {
          conversation_id: string
          id: string
          is_typing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_typing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_typing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_analytics: {
        Row: {
          clicks: number | null
          created_at: string | null
          date: string
          event_id: string
          id: string
          revenue_cents: number | null
          rsvps: number | null
          shares: number | null
          ticket_sales: number | null
          views: number | null
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          date?: string
          event_id: string
          id?: string
          revenue_cents?: number | null
          rsvps?: number | null
          shares?: number | null
          ticket_sales?: number | null
          views?: number | null
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          date?: string
          event_id?: string
          id?: string
          revenue_cents?: number | null
          rsvps?: number | null
          shares?: number | null
          ticket_sales?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_analytics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_privacy"
            referencedColumns: ["id"]
          },
        ]
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
      event_boosts: {
        Row: {
          boost_type: string
          clicks: number | null
          created_at: string | null
          currency: string
          ends_at: string
          event_id: string
          id: string
          impressions: number | null
          price_cents: number
          starts_at: string
          status: Database["public"]["Enums"]["boost_status"]
          stripe_payment_id: string | null
        }
        Insert: {
          boost_type?: string
          clicks?: number | null
          created_at?: string | null
          currency?: string
          ends_at: string
          event_id: string
          id?: string
          impressions?: number | null
          price_cents: number
          starts_at: string
          status?: Database["public"]["Enums"]["boost_status"]
          stripe_payment_id?: string | null
        }
        Update: {
          boost_type?: string
          clicks?: number | null
          created_at?: string | null
          currency?: string
          ends_at?: string
          event_id?: string
          id?: string
          impressions?: number | null
          price_cents?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["boost_status"]
          stripe_payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_boosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_boosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_privacy"
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
            foreignKeyName: "event_cohosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_privacy"
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
          {
            foreignKeyName: "event_messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_privacy"
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
          {
            foreignKeyName: "event_questions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_privacy"
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
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_privacy"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tickets: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          event_id: string
          id: string
          name: string
          price_cents: number
          quantity_sold: number | null
          quantity_total: number
          sale_ends_at: string | null
          sale_starts_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          name: string
          price_cents: number
          quantity_sold?: number | null
          quantity_total: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          price_cents?: number
          quantity_sold?: number | null
          quantity_total?: number
          sale_ends_at?: string | null
          sale_starts_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_privacy"
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
      friend_activity: {
        Row: {
          activity_type: string
          club_id: string | null
          created_at: string
          event_id: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          club_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          club_id?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friend_activity_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_activity_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "public_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friend_activity_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_privacy"
            referencedColumns: ["id"]
          },
        ]
      }
      host_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          currency: string
          expires_at: string | null
          host_id: string
          id: string
          price_cents: number
          started_at: string | null
          status: string
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          currency?: string
          expires_at?: string | null
          host_id: string
          id?: string
          price_cents?: number
          started_at?: string | null
          status?: string
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          currency?: string
          expires_at?: string | null
          host_id?: string
          id?: string
          price_cents?: number
          started_at?: string | null
          status?: string
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "host_subscriptions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: true
            referencedRelation: "hosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "host_subscriptions_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: true
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
      notification_preferences: {
        Row: {
          created_at: string
          friend_activity_enabled: boolean | null
          id: string
          tonights_picks_enabled: boolean | null
          tonights_picks_time: string | null
          updated_at: string
          user_id: string
          weekly_recap_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          friend_activity_enabled?: boolean | null
          id?: string
          tonights_picks_enabled?: boolean | null
          tonights_picks_time?: string | null
          updated_at?: string
          user_id: string
          weekly_recap_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          friend_activity_enabled?: boolean | null
          id?: string
          tonights_picks_enabled?: boolean | null
          tonights_picks_time?: string | null
          updated_at?: string
          user_id?: string
          weekly_recap_enabled?: boolean | null
        }
        Relationships: []
      }
      party_group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          invited_by: string | null
          joined_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "party_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "party_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      party_groups: {
        Row: {
          cover_image: string | null
          created_at: string
          created_by: string
          description: string | null
          event_id: string | null
          genres: string[] | null
          id: string
          is_active: boolean | null
          name: string
          preferred_venue_id: string | null
          updated_at: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          event_id?: string | null
          genres?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          preferred_venue_id?: string | null
          updated_at?: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          event_id?: string | null
          genres?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          preferred_venue_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "party_groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_groups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_privacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_groups_preferred_venue_id_fkey"
            columns: ["preferred_venue_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "party_groups_preferred_venue_id_fkey"
            columns: ["preferred_venue_id"]
            isOneToOne: false
            referencedRelation: "public_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_availability: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_available: boolean | null
          notes: string | null
          professional_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          professional_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_available?: boolean | null
          notes?: string | null
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_bookings: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string | null
          currency: string | null
          event_date: string
          event_description: string | null
          event_location: string | null
          event_type: string
          id: string
          message: string | null
          professional_id: string
          professional_response: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          currency?: string | null
          event_date: string
          event_description?: string | null
          event_location?: string | null
          event_type: string
          id?: string
          message?: string | null
          professional_id: string
          professional_response?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string | null
          currency?: string | null
          event_date?: string
          event_description?: string | null
          event_location?: string | null
          event_type?: string
          id?: string
          message?: string | null
          professional_id?: string
          professional_response?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_bookings_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_reviews: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          professional_id: string
          rating: number
          review: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          professional_id: string
          rating: number
          review?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          professional_id?: string
          rating?: number
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "professional_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          currency: string
          expires_at: string | null
          id: string
          price_cents: number
          professional_id: string
          started_at: string | null
          status: string
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          price_cents?: number
          professional_id: string
          started_at?: string | null
          status?: string
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          currency?: string
          expires_at?: string | null
          id?: string
          price_cents?: number
          professional_id?: string
          started_at?: string | null
          status?: string
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professional_subscriptions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          bio: string | null
          city: string
          country: string | null
          created_at: string | null
          currency: string | null
          display_name: string
          experience_level: string | null
          genres: string[] | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          is_verified: boolean | null
          mixcloud_url: string | null
          preferred_event_types: string[] | null
          price_max: number | null
          price_min: number | null
          profession_type: Database["public"]["Enums"]["profession_type"]
          profile_photo: string | null
          rating: number | null
          review_count: number | null
          skills: string[] | null
          soundcloud_url: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          bio?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          display_name: string
          experience_level?: string | null
          genres?: string[] | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          mixcloud_url?: string | null
          preferred_event_types?: string[] | null
          price_max?: number | null
          price_min?: number | null
          profession_type: Database["public"]["Enums"]["profession_type"]
          profile_photo?: string | null
          rating?: number | null
          review_count?: number | null
          skills?: string[] | null
          soundcloud_url?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          bio?: string | null
          city?: string
          country?: string | null
          created_at?: string | null
          currency?: string | null
          display_name?: string
          experience_level?: string | null
          genres?: string[] | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          mixcloud_url?: string | null
          preferred_event_types?: string[] | null
          price_max?: number | null
          price_min?: number | null
          profession_type?: Database["public"]["Enums"]["profession_type"]
          profile_photo?: string | null
          rating?: number | null
          review_count?: number | null
          skills?: string[] | null
          soundcloud_url?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
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
          id: string
          is_verified: boolean | null
          show_city: boolean | null
          show_connections: boolean | null
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
          id: string
          is_verified?: boolean | null
          show_city?: boolean | null
          show_connections?: boolean | null
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
          id?: string
          is_verified?: boolean | null
          show_city?: boolean | null
          show_connections?: boolean | null
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
          {
            foreignKeyName: "reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_privacy"
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
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_privacy"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_notifications: {
        Row: {
          event_ids: string[] | null
          id: string
          metadata: Json | null
          notification_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          event_ids?: string[] | null
          id?: string
          metadata?: Json | null
          notification_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          event_ids?: string[] | null
          id?: string
          metadata?: Json | null
          notification_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          text_animation: string | null
          text_background: string | null
          text_color: string | null
          text_font: string | null
          text_overlay: string | null
          text_position: string | null
          text_size: string | null
          user_id: string
          view_count: number | null
          visibility: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          text_animation?: string | null
          text_background?: string | null
          text_color?: string | null
          text_font?: string | null
          text_overlay?: string | null
          text_position?: string | null
          text_size?: string | null
          user_id: string
          view_count?: number | null
          visibility?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          text_animation?: string | null
          text_background?: string | null
          text_color?: string | null
          text_font?: string | null
          text_overlay?: string | null
          text_position?: string | null
          text_size?: string | null
          user_id?: string
          view_count?: number | null
          visibility?: string
        }
        Relationships: []
      }
      story_hidden_from: {
        Row: {
          created_at: string | null
          hidden_user_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hidden_user_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          hidden_user_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      story_highlight_items: {
        Row: {
          created_at: string | null
          highlight_id: string
          id: string
          media_url: string
          story_id: string
          text_color: string | null
          text_font: string | null
          text_overlay: string | null
          text_position: string | null
        }
        Insert: {
          created_at?: string | null
          highlight_id: string
          id?: string
          media_url: string
          story_id: string
          text_color?: string | null
          text_font?: string | null
          text_overlay?: string | null
          text_position?: string | null
        }
        Update: {
          created_at?: string | null
          highlight_id?: string
          id?: string
          media_url?: string
          story_id?: string
          text_color?: string | null
          text_font?: string | null
          text_overlay?: string | null
          text_position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_highlight_items_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "story_highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_highlight_items_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_highlights: {
        Row: {
          cover_image: string | null
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      story_replies: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          message: string
          recipient_id: string
          sender_id: string
          story_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          recipient_id: string
          sender_id: string
          story_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          recipient_id?: string
          sender_id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_replies_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_replies_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_stickers: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          position_x: number
          position_y: number
          rotation: number | null
          scale: number | null
          sticker_type: string
          story_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          position_x?: number
          position_y?: number
          rotation?: number | null
          scale?: number | null
          sticker_type: string
          story_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          position_x?: number
          position_y?: number
          rotation?: number | null
          scale?: number | null
          sticker_type?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_stickers_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_purchases: {
        Row: {
          commission_cents: number
          id: string
          price_paid_cents: number
          purchased_at: string | null
          qr_code: string | null
          scanned_at: string | null
          scanned_by: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          stripe_payment_id: string | null
          ticket_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          commission_cents: number
          id?: string
          price_paid_cents: number
          purchased_at?: string | null
          qr_code?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          stripe_payment_id?: string | null
          ticket_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          commission_cents?: number
          id?: string
          price_paid_cents?: number
          purchased_at?: string | null
          qr_code?: string | null
          scanned_at?: string | null
          scanned_by?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          stripe_payment_id?: string | null
          ticket_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_purchases_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "event_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connections: {
        Row: {
          connection_type: string
          created_at: string
          follower_id: string
          following_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          connection_type?: string
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          connection_type?: string
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_encryption_keys: {
        Row: {
          id: string
          key_created_at: string
          public_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          key_created_at?: string
          public_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          key_created_at?: string
          public_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
            foreignKeyName: "user_interactions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "public_clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events_with_privacy"
            referencedColumns: ["id"]
          },
        ]
      }
      user_milestones: {
        Row: {
          achieved_at: string
          id: string
          milestone_type: string
          milestone_value: number
          notified: boolean | null
          user_id: string
        }
        Insert: {
          achieved_at?: string
          id?: string
          milestone_type: string
          milestone_value: number
          notified?: boolean | null
          user_id: string
        }
        Update: {
          achieved_at?: string
          id?: string
          milestone_type?: string
          milestone_value?: number
          notified?: boolean | null
          user_id?: string
        }
        Relationships: []
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
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number | null
          events_this_month: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          month_reset_date: string | null
          total_events_attended: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          events_this_month?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          month_reset_date?: string | null
          total_events_attended?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          events_this_month?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          month_reset_date?: string | null
          total_events_attended?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      venue_subscriptions: {
        Row: {
          auto_renew: boolean | null
          club_id: string
          created_at: string | null
          currency: string
          expires_at: string
          id: string
          price_cents: number
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          club_id: string
          created_at?: string | null
          currency?: string
          expires_at: string
          id?: string
          price_cents: number
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          club_id?: string
          created_at?: string | null
          currency?: string
          expires_at?: string
          id?: string
          price_cents?: number
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_subscriptions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_subscriptions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: true
            referencedRelation: "public_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_recaps: {
        Row: {
          created_at: string
          events_attended: number | null
          friends_met: number | null
          highlights: Json | null
          id: string
          streak_at_week_end: number | null
          top_event_type: string | null
          top_venue_id: string | null
          total_rsvps: number | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          events_attended?: number | null
          friends_met?: number | null
          highlights?: Json | null
          id?: string
          streak_at_week_end?: number | null
          top_event_type?: string | null
          top_venue_id?: string | null
          total_rsvps?: number | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          events_attended?: number | null
          friends_met?: number | null
          highlights?: Json | null
          id?: string
          streak_at_week_end?: number | null
          top_event_type?: string | null
          top_venue_id?: string | null
          total_rsvps?: number | null
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_recaps_top_venue_id_fkey"
            columns: ["top_venue_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_recaps_top_venue_id_fkey"
            columns: ["top_venue_id"]
            isOneToOne: false
            referencedRelation: "public_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      events_with_privacy: {
        Row: {
          actual_rsvp: number | null
          age_limit: number | null
          city: string | null
          country: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          end_time: string | null
          expected_attendance: number | null
          host_id: string | null
          id: string | null
          is_active: boolean | null
          is_featured: boolean | null
          location_address: string | null
          location_hidden: boolean | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          max_attendees: number | null
          name: string | null
          photos: string[] | null
          price: number | null
          safety_rules: string | null
          start_time: string | null
          type: Database["public"]["Enums"]["event_type"] | null
          updated_at: string | null
        }
        Insert: {
          actual_rsvp?: number | null
          age_limit?: number | null
          city?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          expected_attendance?: number | null
          host_id?: string | null
          id?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location_address?: never
          location_hidden?: never
          location_lat?: never
          location_lng?: never
          location_name?: never
          max_attendees?: number | null
          name?: string | null
          photos?: string[] | null
          price?: number | null
          safety_rules?: string | null
          start_time?: string | null
          type?: Database["public"]["Enums"]["event_type"] | null
          updated_at?: string | null
        }
        Update: {
          actual_rsvp?: number | null
          age_limit?: number | null
          city?: string | null
          country?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          end_time?: string | null
          expected_attendance?: number | null
          host_id?: string | null
          id?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          location_address?: never
          location_hidden?: never
          location_lat?: never
          location_lng?: never
          location_name?: never
          max_attendees?: number | null
          name?: string | null
          photos?: string[] | null
          price?: number | null
          safety_rules?: string | null
          start_time?: string | null
          type?: Database["public"]["Enums"]["event_type"] | null
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
      public_clubs: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          google_maps_uri: string | null
          id: string | null
          is_featured: boolean | null
          latitude: number | null
          longitude: number | null
          music_genres: string[] | null
          name: string | null
          opening_hours: Json | null
          photos: string[] | null
          rating: number | null
          venue_type: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          google_maps_uri?: string | null
          id?: string | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          music_genres?: string[] | null
          name?: string | null
          opening_hours?: Json | null
          photos?: string[] | null
          rating?: number | null
          venue_type?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          google_maps_uri?: string | null
          id?: string | null
          is_featured?: boolean | null
          latitude?: number | null
          longitude?: number | null
          music_genres?: string[] | null
          name?: string | null
          opening_hours?: Json | null
          photos?: string[] | null
          rating?: number | null
          venue_type?: string | null
        }
        Relationships: []
      }
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
      safe_profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          display_name: string | null
          id: string | null
          is_verified: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          city?: never
          display_name?: string | null
          id?: string | null
          is_verified?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          city?: never
          display_name?: string | null
          id?: string | null
          is_verified?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_event_location: {
        Args: { event_row: Database["public"]["Tables"]["events"]["Row"] }
        Returns: boolean
      }
      can_view_event_rsvps: { Args: { p_event_id: string }; Returns: boolean }
      can_view_story: {
        Args: { story_user_id: string; story_visibility: string }
        Returns: boolean
      }
      check_rate_limit:
        | {
            Args: { _action: string; _max_per_hour?: number; _user_id: string }
            Returns: boolean
          }
        | {
            Args: {
              _action: string
              _max_requests?: number
              _user_id: string
              _window_minutes?: number
            }
            Returns: boolean
          }
      cleanup_expired_stories: { Args: never; Returns: undefined }
      delete_bartender_profile: {
        Args: { profile_id: string }
        Returns: boolean
      }
      delete_dj_profile: { Args: { profile_id: string }; Returns: boolean }
      delete_user_account: {
        Args: { user_id_to_delete: string }
        Returns: Json
      }
      get_user_bartender_profile_id: { Args: { uid: string }; Returns: string }
      get_user_dj_profile_id: { Args: { uid: string }; Returns: string }
      get_user_professional_id: { Args: { uid: string }; Returns: string }
      has_active_bartender_subscription: {
        Args: { profile_id: string }
        Returns: boolean
      }
      has_active_dj_subscription: {
        Args: { profile_id: string }
        Returns: boolean
      }
      has_active_professional_subscription: {
        Args: { profile_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_club_analytics: {
        Args: { p_club_id: string; p_field: string }
        Returns: undefined
      }
      increment_event_analytics: {
        Args: { p_event_id: string; p_field: string }
        Returns: undefined
      }
      increment_story_view_count: {
        Args: { p_story_id: string }
        Returns: undefined
      }
      is_dev_user: { Args: { _user_id: string }; Returns: boolean }
      scan_ticket: {
        Args: { p_qr_code: string; p_scanner_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "dev"
      boost_status: "pending" | "active" | "completed" | "cancelled"
      club_verification_status: "pending" | "verified" | "rejected"
      event_type: "club" | "house_party" | "university" | "festival" | "public"
      profession_type: "dj" | "bartender" | "photographer" | "security"
      subscription_status: "active" | "cancelled" | "expired" | "trial"
      subscription_tier: "basic" | "boost" | "ultimate"
      ticket_status: "available" | "sold" | "used" | "refunded" | "cancelled"
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
      app_role: ["admin", "moderator", "user", "dev"],
      boost_status: ["pending", "active", "completed", "cancelled"],
      club_verification_status: ["pending", "verified", "rejected"],
      event_type: ["club", "house_party", "university", "festival", "public"],
      profession_type: ["dj", "bartender", "photographer", "security"],
      subscription_status: ["active", "cancelled", "expired", "trial"],
      subscription_tier: ["basic", "boost", "ultimate"],
      ticket_status: ["available", "sold", "used", "refunded", "cancelled"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
