import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

/** Cuentas activadas: acceso con email y código y datos guardados en Supabase */
export const ACCOUNTS_ENABLED = import.meta.env.VITE_ACCOUNTS === 'on' && !!url && !!key;

export const supabase: SupabaseClient | null = ACCOUNTS_ENABLED
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Entramos con código, no con enlaces: no hay que leer la sesión de la URL
        detectSessionInUrl: false,
        storageKey: 'diario-trading-auth'
      }
    })
  : null;
