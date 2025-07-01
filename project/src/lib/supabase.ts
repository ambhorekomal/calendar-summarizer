import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users1: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          google_access_token: string | null;
          refresh_token: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          google_access_token?: string | null;
          refresh_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          google_access_token?: string | null;
          refresh_token?: string | null;
          created_at?: string;
        };
      };
      events1: {
        Row: {
          id: string;
          user_id: string | null;
          event_id: string | null;
          title: string | null;
          description: string | null;
          start_time: string | null;
          end_time: string | null;
          gpt_summary: string | null;
          gpt_suggestions: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          event_id?: string | null;
          title?: string | null;
          description?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          gpt_summary?: string | null;
          gpt_suggestions?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          event_id?: string | null;
          title?: string | null;
          description?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          gpt_summary?: string | null;
          gpt_suggestions?: string | null;
          created_at?: string;
        };
      };
    };
  };
};