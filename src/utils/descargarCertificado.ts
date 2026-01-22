import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';

const SUPABASE_FUNCTION_URL =
  'https://dfjsrwzauickvhfffloe.supabase.co/functions/v1/certificado-asistencia';

const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmanNyd3phdWlja3ZoZmZmbG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTQwMDAsImV4cCI6MjA4MTY3MDAwMH0.1Jb2veoU4-_nIKkdYrcQDOG_kcDZG7joXP5C4EENfvc';

export const descargarCertificado = async (asistenciaId: string) => {
  try {
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ asistenciaId }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[CERTIFICADO] Error response:', text);
      throw new Error('No se pudo generar el certificado');
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // ✅ FIX DE TIPOS (AQUÍ)
    const {
      documentDirectory,
      writeAsStringAsync,
      EncodingType,
    } = FileSystem as any;

    if (!documentDirectory) {
      throw new Error('documentDirectory no disponible');
    }

    const fileUri = documentDirectory + 'certificado_asistencia.pdf';

    await writeAsStringAsync(fileUri, base64, {
      encoding: EncodingType.Base64,
    });

    await Sharing.shareAsync(fileUri);
  } catch (error) {
    console.error('[CERTIFICADO]', error);
    throw error;
  }
};
