import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { asistenciaId } = await req.json();

    if (!asistenciaId) {
      return new Response("asistenciaId requerido", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🔍 Obtener datos de asistencia
    const { data: asistencia, error } = await supabase
      .from("asistencias")
      .select("nombre_asistente, apellido_propietario, created_at")
      .eq("id", asistenciaId)
      .single();

    if (error || !asistencia) {
      return new Response("Asistencia no encontrada", { status: 404 });
    }

    // 📄 Crear PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const fecha = new Date(asistencia.created_at).toLocaleDateString("es-CO");

    page.drawText("CERTIFICADO DE ASISTENCIA", {
      x: 120,
      y: 700,
      size: 22,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(
      `Se certifica que ${asistencia.nombre_asistente} ${asistencia.apellido_propietario}`,
      {
        x: 80,
        y: 620,
        size: 14,
        font,
      }
    );

    page.drawText(
      "participó en la asamblea realizada en la fecha:",
      {
        x: 80,
        y: 580,
        size: 14,
        font,
      }
    );

    page.drawText(fecha, {
      x: 80,
      y: 540,
      size: 16,
      font,
    });

    page.drawText("Este documento se expide como constancia de asistencia.", {
      x: 80,
      y: 480,
      size: 12,
      font,
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=certificado_asistencia.pdf",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Error interno", { status: 500 });
  }
});
