import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants/config';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // No necesitamos autenticación de usuarios
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
