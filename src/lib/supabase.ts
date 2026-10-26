// Supabase client for the browser. Only the publishable (anon) key belongs
// here; what a visitor may read or write is decided by the database's row
// level security, see supabase/schema.sql.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = url && key ? createClient(url, key) : null;
