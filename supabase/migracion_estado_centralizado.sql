-- =====================================================
-- MIGRACIÓN: Estado Centralizado en Asambleas
-- Sincronización en Tiempo Real Admin ↔ Invitados
-- =====================================================

-- 1. Agregar columnas de estado centralizado a asambleas
ALTER TABLE asambleas 
ADD COLUMN IF NOT EXISTS estado_actual VARCHAR(20) DEFAULT 'ESPERA' 
  CHECK (estado_actual IN ('ESPERA', 'DEBATE', 'VOTACION', 'RESULTADOS')),
ADD COLUMN IF NOT EXISTS propuesta_activa_id UUID REFERENCES propuestas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS cronometro_activo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cronometro_inicio TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cronometro_duracion_segundos INTEGER DEFAULT 0;

-- 2. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_asambleas_estado_actual ON asambleas(estado_actual);
CREATE INDEX IF NOT EXISTS idx_asambleas_propuesta_activa ON asambleas(propuesta_activa_id);

-- =====================================================
-- FUNCIÓN: Calcular estadísticas de propuesta en tiempo real
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_estadisticas_propuesta(propuesta_uuid UUID)
RETURNS TABLE (
  votos_si INTEGER,
  votos_no INTEGER,
  total_votos INTEGER,
  porcentaje_si DECIMAL(5,2),
  porcentaje_no DECIMAL(5,2),
  total_asistentes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE v.tipo_voto = 'SI')::INTEGER AS votos_si,
    COUNT(*) FILTER (WHERE v.tipo_voto = 'NO')::INTEGER AS votos_no,
    COUNT(*)::INTEGER AS total_votos,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE v.tipo_voto = 'SI')::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 0
    END AS porcentaje_si,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE v.tipo_voto = 'NO')::DECIMAL / COUNT(*)) * 100, 2)
      ELSE 0
    END AS porcentaje_no,
    (
      SELECT COUNT(*)::INTEGER 
      FROM asistencias 
      WHERE asamblea_id = (SELECT asamblea_id FROM propuestas WHERE id = propuesta_uuid)
    ) AS total_asistentes
  FROM votos v
  WHERE v.propuesta_id = propuesta_uuid;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Actualizar estadísticas al insertar voto
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_actualizar_estadisticas_voto()
RETURNS TRIGGER AS $$
DECLARE
  stats RECORD;
BEGIN
  -- Calcular estadísticas
  SELECT * INTO stats FROM calcular_estadisticas_propuesta(NEW.propuesta_id);
  
  -- Actualizar propuesta
  UPDATE propuestas
  SET 
    votos_si = stats.votos_si,
    votos_no = stats.votos_no,
    total_votos = stats.total_votos,
    porcentaje_si = stats.porcentaje_si
  WHERE id = NEW.propuesta_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trigger_voto_actualizar_stats ON votos;
CREATE TRIGGER trigger_voto_actualizar_stats
AFTER INSERT ON votos
FOR EACH ROW
EXECUTE FUNCTION trigger_actualizar_estadisticas_voto();

-- =====================================================
-- FUNCIÓN: Iniciar cronómetro de debate
-- =====================================================
CREATE OR REPLACE FUNCTION iniciar_cronometro_debate(
  p_asamblea_id UUID,
  p_duracion_segundos INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE asambleas
  SET 
    estado_actual = 'DEBATE',
    cronometro_activo = true,
    cronometro_inicio = TIMEZONE('utc', NOW()),
    cronometro_duracion_segundos = p_duracion_segundos
  WHERE id = p_asamblea_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Detener cronómetro
-- =====================================================
CREATE OR REPLACE FUNCTION detener_cronometro(p_asamblea_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE asambleas
  SET 
    cronometro_activo = false,
    cronometro_inicio = NULL,
    cronometro_duracion_segundos = 0,
    estado_actual = 'ESPERA'
  WHERE id = p_asamblea_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Iniciar votación
-- =====================================================
CREATE OR REPLACE FUNCTION iniciar_votacion(
  p_asamblea_id UUID,
  p_propuesta_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Cerrar propuesta anterior si existe
  UPDATE propuestas
  SET estado = 'CERRADA',
      fecha_cierre = TIMEZONE('utc', NOW())
  WHERE asamblea_id = p_asamblea_id 
    AND estado = 'ABIERTA'
    AND id != p_propuesta_id;
  
  -- Abrir nueva propuesta
  UPDATE propuestas
  SET estado = 'ABIERTA',
      fecha_apertura = TIMEZONE('utc', NOW())
  WHERE id = p_propuesta_id;
  
  -- Actualizar estado de asamblea
  UPDATE asambleas
  SET 
    estado_actual = 'VOTACION',
    propuesta_activa_id = p_propuesta_id,
    cronometro_activo = false
  WHERE id = p_asamblea_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Cerrar votación
-- =====================================================
CREATE OR REPLACE FUNCTION cerrar_votacion(p_asamblea_id UUID)
RETURNS VOID AS $$
DECLARE
  v_propuesta_id UUID;
BEGIN
  -- Obtener propuesta activa
  SELECT propuesta_activa_id INTO v_propuesta_id
  FROM asambleas
  WHERE id = p_asamblea_id;
  
  IF v_propuesta_id IS NOT NULL THEN
    -- Cerrar propuesta
    UPDATE propuestas
    SET estado = 'CERRADA',
        fecha_cierre = TIMEZONE('utc', NOW())
    WHERE id = v_propuesta_id;
    
    -- Actualizar estado
    UPDATE asambleas
    SET 
      estado_actual = 'RESULTADOS',
      propuesta_activa_id = NULL
    WHERE id = p_asamblea_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Regresar a sala de espera
-- =====================================================
CREATE OR REPLACE FUNCTION regresar_a_espera(p_asamblea_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE asambleas
  SET 
    estado_actual = 'ESPERA',
    propuesta_activa_id = NULL,
    cronometro_activo = false
  WHERE id = p_asamblea_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTA: Estado completo de asamblea en tiempo real
-- =====================================================
CREATE OR REPLACE VIEW vista_estado_asamblea AS
SELECT 
  a.id AS asamblea_id,
  a.codigo_acceso,
  a.estado AS estado_asamblea,
  a.estado_actual,
  a.propuesta_activa_id,
  a.cronometro_activo,
  a.cronometro_inicio,
  a.cronometro_duracion_segundos,
  CASE 
    WHEN a.cronometro_activo THEN
      GREATEST(0, a.cronometro_duracion_segundos - 
        EXTRACT(EPOCH FROM (TIMEZONE('utc', NOW()) - a.cronometro_inicio))::INTEGER)
    ELSE 0
  END AS cronometro_segundos_restantes,
  p.id AS propuesta_id,
  p.titulo AS propuesta_titulo,
  p.descripcion AS propuesta_descripcion,
  p.estado AS propuesta_estado,
  p.votos_si,
  p.votos_no,
  p.total_votos,
  p.porcentaje_si,
  (SELECT COUNT(*) FROM asistencias WHERE asamblea_id = a.id) AS total_asistentes
FROM asambleas a
LEFT JOIN propuestas p ON a.propuesta_activa_id = p.id;

-- =====================================================
-- PERMISOS para desarrollo
-- =====================================================
CREATE POLICY "Enable all access for all users" ON asambleas FOR ALL USING (true);

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
