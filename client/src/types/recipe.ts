import { Database } from './supabase';

export type Recipe = Database['public']['Tables']['recipes']['Row'] & {
  Instrucciones: Record<string, string>;
}; 