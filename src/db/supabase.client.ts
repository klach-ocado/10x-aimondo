import { createClient, SupabaseClient as SupabaseClientGeneric } from '@supabase/supabase-js';

import type { Database } from './database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export type SupabaseClient = SupabaseClientGeneric<Database>;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
