export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      artists: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      artist_platform_ids: {
        Row: {
          id: string;
          artist_id: string;
          platform: string;
          platform_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          platform: string;
          platform_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          artist_id?: string;
          platform?: string;
          platform_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      artist_metrics: {
        Row: {
          id: string;
          artist_id: string;
          platform: string;
          metric_type: string;
          value: number;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          artist_id: string;
          platform: string;
          metric_type: string;
          value: number;
          timestamp: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          artist_id?: string;
          platform?: string;
          metric_type?: string;
          value?: number;
          timestamp?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
