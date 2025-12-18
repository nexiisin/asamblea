-- =====================================================
-- MEJORAS AL CRONÓMETRO Y ESTADO DE ASAMBLEA
-- =====================================================

-- Agregar campo para pausar el cronómetro
ALTER TABLE public.asambleas
ADD COLUMN IF NOT EXISTS cronometro_pausado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cronometro_tiempo_pausado INTEGER DEFAULT 0;

-- =====================================================
-- FUNCIONES MEJORADAS
-- =====================================================

-- Función para pausar el cronómetro
CREATE OR REPLACE FUNCTION public.pausar_cronometro(p_asamblea_id UUID)
RETURNS VOID AS $$
DECLARE
  v_inicio TIMESTAMPTZ;
  v_duracion INTEGER;
  v_tiempo_transcurrido INTEGER;
BEGIN
  SELECT cronometro_inicio, cronometro_duracion_segundos
  INTO v_inicio, v_duracion
  FROM public.asambleas
  WHERE id = p_asamblea_id AND cronometro_activo = true;

  IF v_inicio IS NOT NULL THEN
    -- Calcular tiempo transcurrido hasta ahora
    v_tiempo_transcurrido := EXTRACT(EPOCH FROM (timezone('utc', now()) - v_inicio))::INTEGER;
    
    UPDATE public.asambleas
    SET 
      cronometro_pausado = true,
      cronometro_tiempo_pausado = v_tiempo_transcurrido
    WHERE id = p_asamblea_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para reanudar el cronómetro
CREATE OR REPLACE FUNCTION public.reanudar_cronometro(p_asamblea_id UUID)
RETURNS VOID AS $$
DECLARE
  v_tiempo_pausado INTEGER;
  v_duracion INTEGER;
BEGIN
  SELECT cronometro_tiempo_pausado, cronometro_duracion_segundos
  INTO v_tiempo_pausado, v_duracion
  FROM public.asambleas
  WHERE id = p_asamblea_id;

  -- Reiniciar con tiempo ajustado
  UPDATE public.asambleas
  SET 
    cronometro_pausado = false,
    cronometro_inicio = timezone('utc', now()),
    cronometro_duracion_segundos = v_duracion - v_tiempo_pausado
  WHERE id = p_asamblea_id;
END;
$$ LANGUAGE plpgsql;

-- Actualizar función de iniciar cronómetro
CREATE OR REPLACE FUNCTION public.iniciar_cronometro_debate(
  p_asamblea_id UUID,
  p_duracion_segundos INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE public.asambleas
  SET 
    estado_actual = 'DEBATE',
    cronometro_activo = true,
    cronometro_pausado = false,
    cronometro_tiempo_pausado = 0,
    cronometro_inicio = timezone('utc', now()),
    cronometro_duracion_segundos = p_duracion_segundos
  WHERE id = p_asamblea_id;
END;
$$ LANGUAGE plpgsql;

-- Actualizar función de detener cronómetro
CREATE OR REPLACE FUNCTION public.detener_cronometro(p_asamblea_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.asambleas
  SET 
    cronometro_activo = false,
    cronometro_pausado = false,
    cronometro_tiempo_pausado = 0,
    cronometro_inicio = NULL,
    cronometro_duracion_segundos = 0,
    estado_actual = 'ESPERA'
  WHERE id = p_asamblea_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTA ACTUALIZADA
-- =====================================================
CREATE OR REPLACE VIEW public.vista_estado_asamblea AS
SELECT 
  a.id AS asamblea_id,
  a.codigo_acceso,
  a.estado,
  a.estado_actual,
  a.propuesta_activa_id,
  a.cronometro_activo,
  a.cronometro_pausado,
  a.cronometro_inicio,
  a.cronometro_duracion_segundos,
  a.cronometro_tiempo_pausado,
  CASE 
    WHEN a.cronometro_activo AND NOT a.cronometro_pausado THEN
      GREATEST(
        0,
        a.cronometro_duracion_segundos -
        EXTRACT(EPOCH FROM (timezone('utc', now()) - a.cronometro_inicio))::INTEGER
      )
    WHEN a.cronometro_pausado THEN
      a.cronometro_duracion_segundos - a.cronometro_tiempo_pausado
    ELSE 0
  END AS cronometro_segundos_restantes,
  p.id AS propuesta_id,
  p.titulo,
  p.descripcion,
  p.estado AS propuesta_estado,
  p.votos_si,
  p.votos_no,
  p.total_votos,
  p.porcentaje_si,
  p.porcentaje_no,
  (SELECT COUNT(*) FROM public.asistencias WHERE asamblea_id = a.id) AS total_asistentes
FROM public.asambleas a
LEFT JOIN public.propuestas p ON a.propuesta_activa_id = p.id;

-- =====================================================
-- FIN
-- =====================================================
