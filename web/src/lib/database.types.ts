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
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      assignments: {
        Row: {
          confirm_token: string
          confirmed_at: string | null
          created_at: string
          created_by: string | null
          declined_at: string | null
          event_id: string
          id: string
          reminded_at: string | null
          role_id: string
          status: Database["public"]["Enums"]["assignment_status"]
          team_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          declined_at?: string | null
          event_id: string
          id?: string
          reminded_at?: string | null
          role_id: string
          status?: Database["public"]["Enums"]["assignment_status"]
          team_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          confirm_token?: string
          confirmed_at?: string | null
          created_at?: string
          created_by?: string | null
          declined_at?: string | null
          event_id?: string
          id?: string
          reminded_at?: string | null
          role_id?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          team_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_role_id_team_id_fkey"
            columns: ["role_id", "team_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "assignments_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_cycles: {
        Row: {
          closes_at: string | null
          created_by: string | null
          id: string
          month: number
          opened_at: string
          status: Database["public"]["Enums"]["availability_cycle_status"]
          team_id: string
          year: number
        }
        Insert: {
          closes_at?: string | null
          created_by?: string | null
          id?: string
          month: number
          opened_at?: string
          status?: Database["public"]["Enums"]["availability_cycle_status"]
          team_id: string
          year: number
        }
        Update: {
          closes_at?: string | null
          created_by?: string | null
          id?: string
          month?: number
          opened_at?: string
          status?: Database["public"]["Enums"]["availability_cycle_status"]
          team_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_cycles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_cycles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_dates: {
        Row: {
          available: boolean
          block: Database["public"]["Enums"]["service_block"]
          id: string
          response_id: string
          service_date: string
        }
        Insert: {
          available?: boolean
          block: Database["public"]["Enums"]["service_block"]
          id?: string
          response_id: string
          service_date: string
        }
        Update: {
          available?: boolean
          block?: Database["public"]["Enums"]["service_block"]
          id?: string
          response_id?: string
          service_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_dates_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "availability_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_responses: {
        Row: {
          created_at: string
          cycle_id: string
          id: string
          submitted_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_id: string
          id?: string
          submitted_at?: string | null
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_id?: string
          id?: string
          submitted_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_responses_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "availability_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_info: {
        Row: {
          event_id: string
          groups_participations: string | null
          notes: string | null
          preacher: string | null
          service_order: string | null
          songs: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          event_id: string
          groups_participations?: string | null
          notes?: string | null
          preacher?: string | null
          service_order?: string | null
          songs?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          event_id?: string
          groups_participations?: string | null
          notes?: string | null
          preacher?: string | null
          service_order?: string | null
          songs?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_info_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_info_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_teams: {
        Row: {
          event_id: string
          team_id: string
        }
        Insert: {
          event_id: string
          team_id: string
        }
        Update: {
          event_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      event_template_teams: {
        Row: {
          event_template_id: string
          team_id: string
        }
        Insert: {
          event_template_id: string
          team_id: string
        }
        Update: {
          event_template_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_template_teams_event_template_id_fkey"
            columns: ["event_template_id"]
            isOneToOne: false
            referencedRelation: "event_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_template_teams_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      event_templates: {
        Row: {
          active: boolean
          default_start_time: string | null
          id: string
          key: string
          name: string
          sort_order: number
          weekday: number
        }
        Insert: {
          active?: boolean
          default_start_time?: string | null
          id?: string
          key: string
          name: string
          sort_order?: number
          weekday: number
        }
        Update: {
          active?: boolean
          default_start_time?: string | null
          id?: string
          key?: string
          name?: string
          sort_order?: number
          weekday?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          event_date: string
          id: string
          kind: Database["public"]["Enums"]["event_kind"]
          start_time: string | null
          template_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_date: string
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          start_time?: string | null
          template_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_date?: string
          id?: string
          kind?: Database["public"]["Enums"]["event_kind"]
          start_time?: string | null
          template_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "event_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          active: boolean
          id: string
          key: string
          name: string
          sort_order: number
          team_id: string
        }
        Insert: {
          active?: boolean
          id?: string
          key: string
          name: string
          sort_order?: number
          team_id: string
        }
        Update: {
          active?: boolean
          id?: string
          key?: string
          name?: string
          sort_order?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      swap_requests: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          reason: string | null
          replacement_user_id: string | null
          requested_by: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["swap_status"]
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          reason?: string | null
          replacement_user_id?: string | null
          requested_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["swap_status"]
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          replacement_user_id?: string | null
          requested_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["swap_status"]
        }
        Relationships: [
          {
            foreignKeyName: "swap_requests_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_replacement_user_id_fkey"
            columns: ["replacement_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swap_requests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          active: boolean
          id: string
          is_coordinator: boolean
          joined_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          active?: boolean
          id?: string
          is_coordinator?: boolean
          joined_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          active?: boolean
          id?: string
          is_coordinator?: boolean
          joined_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          key: string
          name: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          key: string
          name: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          active: boolean
          auth_user_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone_e164: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone_e164?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          active?: boolean
          auth_user_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone_e164?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      whatsapp_inbox: {
        Row: {
          from_chat: string | null
          from_phone: string | null
          id: string
          parsed_intent: Database["public"]["Enums"]["wa_intent"]
          processed: boolean
          raw_text: string | null
          received_at: string
          related_assignment_id: string | null
        }
        Insert: {
          from_chat?: string | null
          from_phone?: string | null
          id?: string
          parsed_intent?: Database["public"]["Enums"]["wa_intent"]
          processed?: boolean
          raw_text?: string | null
          received_at?: string
          related_assignment_id?: string | null
        }
        Update: {
          from_chat?: string | null
          from_phone?: string | null
          id?: string
          parsed_intent?: Database["public"]["Enums"]["wa_intent"]
          processed?: boolean
          raw_text?: string | null
          received_at?: string
          related_assignment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_inbox_related_assignment_id_fkey"
            columns: ["related_assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_outbox: {
        Row: {
          attempts: number
          body: string
          created_at: string
          error: string | null
          id: string
          related_assignment_id: string | null
          related_event_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["wa_out_status"]
          target_ref: string | null
          target_type: Database["public"]["Enums"]["wa_target_type"]
          team_id: string | null
        }
        Insert: {
          attempts?: number
          body: string
          created_at?: string
          error?: string | null
          id?: string
          related_assignment_id?: string | null
          related_event_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["wa_out_status"]
          target_ref?: string | null
          target_type: Database["public"]["Enums"]["wa_target_type"]
          team_id?: string | null
        }
        Update: {
          attempts?: number
          body?: string
          created_at?: string
          error?: string | null
          id?: string
          related_assignment_id?: string | null
          related_event_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["wa_out_status"]
          target_ref?: string | null
          target_type?: Database["public"]["Enums"]["wa_target_type"]
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_outbox_related_assignment_id_fkey"
            columns: ["related_assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_outbox_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_outbox_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_targets: {
        Row: {
          active: boolean
          chat_id: string | null
          id: string
          kind: Database["public"]["Enums"]["wa_target_kind"]
          label: string
          team_id: string | null
        }
        Insert: {
          active?: boolean
          chat_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["wa_target_kind"]
          label: string
          team_id?: string | null
        }
        Update: {
          active?: boolean
          chat_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["wa_target_kind"]
          label?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_targets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      confirm_assignment: {
        Args: { p_confirm: boolean; p_reason?: string; p_token: string }
        Returns: undefined
      }
      current_app_user_id: { Args: never; Returns: string }
      generate_recurring_events: {
        Args: { p_month: number; p_year: number }
        Returns: number
      }
      get_availability_form: { Args: { p_token: string }; Returns: Json }
      get_confirm_info: { Args: { p_token: string }; Returns: Json }
      has_app_login: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_any_coordinator: { Args: never; Returns: boolean }
      is_coordinator_of: { Args: { p_team_id: string }; Returns: boolean }
      open_availability_cycle: {
        Args: { p_month: number; p_team_id: string; p_year: number }
        Returns: string
      }
      set_event_teams: {
        Args: { p_event_id: string; p_team_ids: string[] }
        Returns: undefined
      }
      submit_availability: {
        Args: { p_dates: Json; p_token: string }
        Returns: undefined
      }
      sync_event_slots: { Args: { p_event_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin_geral" | "coordenador" | "membro"
      assignment_status: "unfilled" | "pending" | "confirmed" | "declined"
      availability_cycle_status: "open" | "closed"
      event_kind: "recurring" | "extra"
      service_block: "wednesday" | "sunday"
      swap_status: "open" | "resolved" | "cancelled"
      wa_intent: "confirm" | "decline" | "availability" | "unknown"
      wa_out_status: "queued" | "sent" | "failed"
      wa_target_kind: "team" | "leadership"
      wa_target_type: "group_team" | "group_leadership" | "dm"
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
      app_role: ["admin_geral", "coordenador", "membro"],
      assignment_status: ["unfilled", "pending", "confirmed", "declined"],
      availability_cycle_status: ["open", "closed"],
      event_kind: ["recurring", "extra"],
      service_block: ["wednesday", "sunday"],
      swap_status: ["open", "resolved", "cancelled"],
      wa_intent: ["confirm", "decline", "availability", "unknown"],
      wa_out_status: ["queued", "sent", "failed"],
      wa_target_kind: ["team", "leadership"],
      wa_target_type: ["group_team", "group_leadership", "dm"],
    },
  },
} as const
