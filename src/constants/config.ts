// Configuración de la aplicación
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const APP_CONFIG = {
  APPROVAL_THRESHOLD: 0.51, // 51%
  CODE_LENGTH: 6,
  MAX_RETRIES: 3,
} as const;
