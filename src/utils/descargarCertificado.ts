import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Buffer } from 'buffer';

export const descargarCertificado = async (asistenciaId: string) => {
  try {
    const response = await fetch(
      'https://dfjsrwzauickvhfffloe.supabase.co/functions/v1/certificado-asistencia',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asistenciaId }),
      }
    );

    if (!response.ok) {
      throw new Error('No se pudo generar el certificado');
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // 👇 AQUÍ SE QUITA EL ROJO
    const { cacheDirectory, writeAsStringAsync } = FileSystem as any;

    if (!cacheDirectory) {
      throw new Error('cacheDirectory no disponible');
    }

    const fileUri = cacheDirectory + 'certificado_asistencia.pdf';

    await writeAsStringAsync(fileUri, base64, {
      encoding: 'base64',
    });

    await Sharing.shareAsync(fileUri);
  } catch (error) {
    console.error('[CERTIFICADO]', error);
    throw error;
  }
};
