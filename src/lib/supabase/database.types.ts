// Generated from the live `staydesk` Supabase project (ref znieiphiixdzjrkaozlb)
// via the Supabase MCP `generate_typescript_types` tool. Regenerate after
// every schema migration — do not hand-edit.

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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      booking_charges: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          description: string
          id: string
          taxable: boolean
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          description: string
          id?: string
          taxable?: boolean
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          description?: string
          id?: string
          taxable?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "booking_charges_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          check_in_actual: string | null
          check_in_planned: string
          check_out_actual: string | null
          check_out_planned: string
          created_at: string
          created_by: string | null
          discount: number
          guest_id: string
          id: string
          property_id: string
          rate_override: number | null
          room_id: string
          status: Database["public"]["Enums"]["booking_status"]
          stay_range: unknown
        }
        Insert: {
          check_in_actual?: string | null
          check_in_planned: string
          check_out_actual?: string | null
          check_out_planned: string
          created_at?: string
          created_by?: string | null
          discount?: number
          guest_id: string
          id?: string
          property_id: string
          rate_override?: number | null
          room_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          stay_range?: unknown
        }
        Update: {
          check_in_actual?: string | null
          check_in_planned?: string
          check_out_actual?: string | null
          check_out_planned?: string
          created_at?: string
          created_by?: string | null
          discount?: number
          guest_id?: string
          id?: string
          property_id?: string
          rate_override?: number | null
          room_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          stay_range?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      guests: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          id_proof_number: string | null
          id_proof_type: string | null
          name: string
          nationality: string | null
          notes: string | null
          phone: string | null
          property_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          id_proof_number?: string | null
          id_proof_type?: string | null
          name: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          property_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          id_proof_number?: string | null
          id_proof_type?: string | null
          name?: string
          nationality?: string | null
          notes?: string | null
          phone?: string | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_counters: {
        Row: {
          next_number: number
          property_id: string
        }
        Insert: {
          next_number?: number
          property_id: string
        }
        Update: {
          next_number?: number
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_counters_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          booking_id: string
          cgst: number
          id: string
          igst: number
          invoice_number: string
          issued_at: string
          pdf_url: string | null
          property_id: string
          sgst: number
          taxable_value: number
          total: number
        }
        Insert: {
          booking_id: string
          cgst?: number
          id?: string
          igst?: number
          invoice_number: string
          issued_at?: string
          pdf_url?: string | null
          property_id: string
          sgst?: number
          taxable_value: number
          total: number
        }
        Update: {
          booking_id?: string
          cgst?: number
          id?: string
          igst?: number
          invoice_number?: string
          issued_at?: string
          pdf_url?: string | null
          property_id?: string
          sgst?: number
          taxable_value?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          id: string
          mode: Database["public"]["Enums"]["payment_mode"]
          received_at: string
          received_by: string | null
          reference: string | null
        }
        Insert: {
          amount: number
          booking_id: string
          id?: string
          mode: Database["public"]["Enums"]["payment_mode"]
          received_at?: string
          received_by?: string | null
          reference?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string
          id?: string
          mode?: Database["public"]["Enums"]["payment_mode"]
          received_at?: string
          received_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          created_at: string
          currency: string
          gstin: string | null
          id: string
          name: string
          org_id: string
          state_code: string | null
          timezone: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          currency?: string
          gstin?: string | null
          id?: string
          name: string
          org_id: string
          state_code?: string | null
          timezone?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          currency?: string
          gstin?: string | null
          id?: string
          name?: string
          org_id?: string
          state_code?: string | null
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      property_users: {
        Row: {
          created_at: string
          property_id: string
          role: Database["public"]["Enums"]["property_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          property_id: string
          role: Database["public"]["Enums"]["property_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          property_id?: string
          role?: Database["public"]["Enums"]["property_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_users_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      room_status_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: Database["public"]["Enums"]["room_status"] | null
          id: string
          room_id: string
          to_status: Database["public"]["Enums"]["room_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["room_status"] | null
          id?: string
          room_id: string
          to_status: Database["public"]["Enums"]["room_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: Database["public"]["Enums"]["room_status"] | null
          id?: string
          room_id?: string
          to_status?: Database["public"]["Enums"]["room_status"]
        }
        Relationships: [
          {
            foreignKeyName: "room_status_log_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          base_rate: number
          created_at: string
          extra_bed_rate: number
          id: string
          max_occupancy: number
          name: string
          property_id: string
        }
        Insert: {
          base_rate: number
          created_at?: string
          extra_bed_rate?: number
          id?: string
          max_occupancy?: number
          name: string
          property_id: string
        }
        Update: {
          base_rate?: number
          created_at?: string
          extra_bed_rate?: number
          id?: string
          max_occupancy?: number
          name?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          floor: string | null
          id: string
          notes: string | null
          number: string
          property_id: string
          room_type_id: string
          status: Database["public"]["Enums"]["room_status"]
        }
        Insert: {
          created_at?: string
          floor?: string | null
          id?: string
          notes?: string | null
          number: string
          property_id: string
          room_type_id: string
          status?: Database["public"]["Enums"]["room_status"]
        }
        Update: {
          created_at?: string
          floor?: string | null
          id?: string
          notes?: string | null
          number?: string
          property_id?: string
          room_type_id?: string
          status?: Database["public"]["Enums"]["room_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rooms_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_settings: {
        Row: {
          gst_enabled: boolean
          id: string
          intra_state_split: boolean
          property_id: string
          rate_band_1_rate: number
          rate_band_1_threshold: number
          rate_band_2_rate: number
          rounding_mode: Database["public"]["Enums"]["rounding_mode"]
          updated_at: string
        }
        Insert: {
          gst_enabled?: boolean
          id?: string
          intra_state_split?: boolean
          property_id: string
          rate_band_1_rate?: number
          rate_band_1_threshold?: number
          rate_band_2_rate?: number
          rounding_mode?: Database["public"]["Enums"]["rounding_mode"]
          updated_at?: string
        }
        Update: {
          gst_enabled?: boolean
          id?: string
          intra_state_split?: boolean
          property_id?: string
          rate_band_1_rate?: number
          rate_band_1_threshold?: number
          rate_band_2_rate?: number
          rounding_mode?: Database["public"]["Enums"]["rounding_mode"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_settings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_property: {
        Args: {
          p_gstin?: string
          p_org_name: string
          p_property_name: string
          p_state_code?: string
        }
        Returns: string
      }
      next_invoice_number: { Args: { p_property_id: string }; Returns: number }
    }
    Enums: {
      booking_status: "reserved" | "checked_in" | "checked_out" | "cancelled"
      payment_mode: "cash" | "upi" | "card" | "bank_transfer"
      property_role: "owner" | "admin" | "front_desk" | "housekeeping"
      room_status:
        | "available"
        | "occupied"
        | "reserved"
        | "cleaning"
        | "maintenance"
      rounding_mode: "none" | "nearest" | "up" | "down"
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
      booking_status: ["reserved", "checked_in", "checked_out", "cancelled"],
      payment_mode: ["cash", "upi", "card", "bank_transfer"],
      property_role: ["owner", "admin", "front_desk", "housekeeping"],
      room_status: [
        "available",
        "occupied",
        "reserved",
        "cleaning",
        "maintenance",
      ],
      rounding_mode: ["none", "nearest", "up", "down"],
    },
  },
} as const
