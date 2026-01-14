import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';

export async function generarActaPDF(asambleaId: string) {
  // Cargar datos principales
  const { data: asambleaData } = await supabase
    .from('asambleas')
    .select('*')
    .eq('id', asambleaId)
    .maybeSingle();

  const { data: propuestas } = await supabase
    .from('propuestas')
    .select('*')
    .eq('asamblea_id', asambleaId)
    .order('orden', { ascending: true });

  const { count: totalCasas } = await supabase
    .from('viviendas')
    .select('*', { count: 'exact', head: true });

  const { count: totalAsistentes } = await supabase
    .from('asistencias')
    .select('*', { count: 'exact', head: true })
    .eq('asamblea_id', asambleaId);

  // Construir HTML del reporte
  const fecha = new Date().toLocaleString();
  const htmlParts: string[] = [];

  htmlParts.push(`
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Acta Asamblea</title>
      <style>
        body{font-family: Arial, Helvetica, sans-serif; padding:20px; color:#111}
        h1{color:#1e40af}
        .meta{margin-bottom:20px}
        .summary{display:flex; gap:12px; margin-bottom:24px}
        .card{padding:12px;border-radius:8px;background:#f3f4f6}
        .propuesta{border:1px solid #e5e7eb;padding:12px;border-radius:8px;margin-bottom:12px}
        .chart{height:24px;background:#e6e7f2;border-radius:6px;overflow:hidden}
        .bar{height:100%;display:block}
        .bar.si{background:#10b981}
        .bar.no{background:#ef4444}
        .bar.novoto{background:#94a3b8}
        .meta small{color:#64748b}
      </style>
    </head>
    <body>
      <h1>Acta y Historial de Asamblea</h1>
      <div class="meta">
        <div><strong>Asamblea:</strong> ${asambleaData?.id || ''}</div>
        <div><strong>Generado:</strong> ${fecha}</div>
      </div>
      <div class="summary">
        <div class="card"><strong>Total casas</strong><div>${totalCasas || 0}</div></div>
        <div class="card"><strong>Total asistentes</strong><div>${totalAsistentes || 0}</div></div>
        <div class="card"><strong>Total propuestas</strong><div>${propuestas?.length || 0}</div></div>
      </div>
      <hr />
  `);

  // Por cada propuesta, mostrar estadística
  (propuestas || []).forEach((p: any) => {
    const votosSi = p.votos_si || 0;
    const votosNo = p.votos_no || 0;
    const totalVotos = p.total_votos || 0;
    const noVoto = (totalCasas || 0) - totalVotos;
    const porcentajeSi = totalVotos > 0 ? Math.round((votosSi / totalVotos) * 100) : 0;
    const porcentajeNo = totalVotos > 0 ? Math.round((votosNo / totalVotos) * 100) : 0;
    const porcentajeNoVoto = Math.max(0, 100 - porcentajeSi - porcentajeNo);

    htmlParts.push(`
      <div class="propuesta">
        <h2>${p.titulo}</h2>
        <div><small>${p.descripcion || ''}</small></div>
        <div style="margin-top:8px">Resultado: <strong>${p.resultado_aprobada ? 'APROBADA' : (p.estado === 'CERRADA' ? 'RECHAZADA' : p.estado)}</strong></div>
        <div style="margin-top:8px">✓ SI: ${votosSi} | ✗ NO: ${votosNo} | Total votos: ${totalVotos} | No votaron: ${noVoto}</div>

        <div style="margin-top:8px">
          <div class="chart">
            <span class="bar si" style="width:${porcentajeSi}%;"></span>
            <span class="bar no" style="width:${porcentajeNo}%;"></span>
            <span class="bar novoto" style="width:${porcentajeNoVoto}%;"></span>
          </div>
          <div style="font-size:12px;margin-top:6px;color:#475569">${porcentajeSi}% SI • ${porcentajeNo}% NO • ${porcentajeNoVoto}% No votó</div>
        </div>
      </div>
    `);
  });

  htmlParts.push(`</body></html>`);

  const html = htmlParts.join('\n');

  // Generar PDF
  const file = await Print.printToFileAsync({ html });

  // Compartir / descargar
  if (file.uri) {
    try {
      await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Error compartiendo PDF', error);
    }
  }

  return file.uri;
}
