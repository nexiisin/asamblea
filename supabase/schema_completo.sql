-- =====================================================
-- MIGRACIÓN COMPLETA: Sistema de Votación con Estado Centralizado
-- Versión: 2.0 Unificada
-- Fecha: Diciembre 2025
-- =====================================================
-- Este script es IDEMPOTENTE (se puede ejecutar múltiples veces sin romper nada)
-- =====================================================

-- =====================================================
-- PASO 1: EXTENSIONES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PASO 2: TABLAS BASE (Si no existen)
-- =====================================================

-- Tabla Asambleas
CREATE TABLE IF NOT EXISTS public.asambleas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_acceso TEXT UNIQUE,
  estado TEXT DEFAULT 'ABIERTA',
  fecha_inicio TIMESTAMPTZ DEFAULT timezone('utc', now()),
  fecha_fin TIMESTAMPTZ,
  regla_aprobacion DECIMAL(3,2) DEFAULT 0.51,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Tabla Propuestas
CREATE TABLE IF NOT EXISTS public.propuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asamblea_id UUID REFERENCES public.asambleas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  orden INTEGER,
  estado VARCHAR(20) DEFAULT 'BORRADOR',
  fecha_apertura TIMESTAMPTZ,
  fecha_cierre TIMESTAMPTZ,
  votos_si INTEGER DEFAULT 0,
  votos_no INTEGER DEFAULT 0,
  total_votos INTEGER DEFAULT 0,
  porcentaje_si DECIMAL(5,2) DEFAULT 0,
  porcentaje_no DECIMAL(5,2) DEFAULT 0,
  resultado_aprobada BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Tabla Votos
CREATE TABLE IF NOT EXISTS public.votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  propuesta_id UUID NOT NULL REFERENCES public.propuestas(id) ON DELETE CASCADE,
  vivienda_id UUID NOT NULL REFERENCES public.viviendas(id) ON DELETE CASCADE,
  asistencia_id UUID NOT NULL REFERENCES public.asistencias(id) ON DELETE CASCADE,
  tipo_voto VARCHAR(2) NOT NULL CHECK (tipo_voto IN ('SI','NO')),
  fecha_voto TIMESTAMPTZ DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  UNIQUE (propuesta_id, vivienda_id)
);

-- Tabla Asistencias
CREATE TABLE IF NOT EXISTS public.asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asamblea_id UUID NOT NULL REFERENCES public.asambleas(id) ON DELETE CASCADE,
  vivienda_id UUID NOT NULL REFERENCES public.viviendas(id) ON DELETE CASCADE,
  nombre_asistente VARCHAR(200) NOT NULL,
  fecha_registro TIMESTAMPTZ DEFAULT timezone('utc', now()),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  UNIQUE (asamblea_id, vivienda_id)
);

-- Tabla Viviendas
CREATE TABLE IF NOT EXISTS public.viviendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_casa VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_viviendas_numero_casa ON public.viviendas(numero_casa);

-- Tabla Propietarios
CREATE TABLE IF NOT EXISTS public.propietarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vivienda_id UUID NOT NULL REFERENCES public.viviendas(id) ON DELETE CASCADE,
  primer_nombre VARCHAR(100) NOT NULL,
  primer_apellido VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  UNIQUE(vivienda_id)
);

-- Índices para validación rápida
CREATE INDEX IF NOT EXISTS idx_propietarios_vivienda ON public.propietarios(vivienda_id);
CREATE INDEX IF NOT EXISTS idx_propietarios_nombre ON public.propietarios(primer_nombre, primer_apellido);

-- =====================================================
-- PASO 3: AGREGAR COLUMNAS DE ESTADO CENTRALIZADO
-- =====================================================

-- Columnas de estado centralizado
ALTER TABLE public.asambleas 
ADD COLUMN IF NOT EXISTS estado_actual VARCHAR(20) DEFAULT 'ESPERA';

-- Agregar constraint si no existe (solo si la columna ya existía sin constraint)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'asambleas_estado_actual_check'
  ) THEN
    ALTER TABLE public.asambleas 
    ADD CONSTRAINT asambleas_estado_actual_check 
    CHECK (estado_actual IN ('ESPERA', 'DEBATE', 'VOTACION', 'RESULTADOS'));
  END IF;
END $$;

-- Propuesta activa
ALTER TABLE public.asambleas 
ADD COLUMN IF NOT EXISTS propuesta_activa_id UUID;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'asambleas_propuesta_activa_fkey'
  ) THEN
    ALTER TABLE public.asambleas 
    ADD CONSTRAINT asambleas_propuesta_activa_fkey 
    FOREIGN KEY (propuesta_activa_id) REFERENCES public.propuestas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Columnas de cronómetro
ALTER TABLE public.asambleas 
ADD COLUMN IF NOT EXISTS cronometro_activo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cronometro_pausado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cronometro_inicio TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cronometro_duracion_segundos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cronometro_tiempo_pausado INTEGER DEFAULT 0;

-- =====================================================
-- PASO 4: ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_asambleas_estado_actual 
ON public.asambleas(estado_actual);

CREATE INDEX IF NOT EXISTS idx_asambleas_propuesta_activa 
ON public.asambleas(propuesta_activa_id);

CREATE INDEX IF NOT EXISTS idx_propuestas_asamblea 
ON public.propuestas(asamblea_id);

CREATE INDEX IF NOT EXISTS idx_propuestas_estado 
ON public.propuestas(estado);

CREATE INDEX IF NOT EXISTS idx_votos_propuesta 
ON public.votos(propuesta_id);

CREATE INDEX IF NOT EXISTS idx_asistencias_asamblea 
ON public.asistencias(asamblea_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_vivienda
ON public.asistencias(vivienda_id);

CREATE INDEX IF NOT EXISTS idx_votos_vivienda
ON public.votos(vivienda_id);

CREATE INDEX IF NOT EXISTS idx_votos_tipo
ON public.votos(tipo_voto);

-- =====================================================
-- PASO 4B: TABLA CRONOMETRO_DEBATE (Opcional)
-- =====================================================
-- NOTA: Esta tabla YA NO SE USA con la arquitectura centralizada
-- Pero se mantiene por compatibilidad si tienes datos antiguos

CREATE TABLE IF NOT EXISTS public.cronometro_debate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asamblea_id UUID NOT NULL REFERENCES public.asambleas(id) ON DELETE CASCADE,
  propuesta_id UUID REFERENCES public.propuestas(id) ON DELETE SET NULL,
  duracion_segundos INTEGER NOT NULL,
  tiempo_transcurrido INTEGER NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'DETENIDO' CHECK (estado IN ('ACTIVO', 'PAUSADO', 'DETENIDO')),
  timestamp_inicio TIMESTAMPTZ,
  timestamp_pausa TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  UNIQUE(asamblea_id)
);

CREATE INDEX IF NOT EXISTS idx_cronometro_asamblea ON public.cronometro_debate(asamblea_id);
CREATE INDEX IF NOT EXISTS idx_cronometro_estado ON public.cronometro_debate(estado);


-- =====================================================
-- PASO 5: FUNCIONES DE NEGOCIO
-- =====================================================

-- Función: Calcular estadísticas de propuesta
CREATE OR REPLACE FUNCTION public.calcular_estadisticas_propuesta(propuesta_uuid UUID)
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
      FROM public.asistencias 
      WHERE asamblea_id = (SELECT asamblea_id FROM public.propuestas WHERE id = propuesta_uuid)
    ) AS total_asistentes
  FROM public.votos v
  WHERE v.propuesta_id = propuesta_uuid;
END;
$$ LANGUAGE plpgsql;

-- Función: Iniciar cronómetro de debate
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

-- Función: Pausar cronómetro
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

-- Función: Reanudar cronómetro
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

-- Función: Detener cronómetro
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

-- Función: Iniciar votación
CREATE OR REPLACE FUNCTION public.iniciar_votacion(
  p_asamblea_id UUID,
  p_propuesta_id UUID
) RETURNS VOID AS $$
BEGIN
  -- Cerrar propuestas anteriores abiertas
  UPDATE public.propuestas
  SET estado = 'CERRADA',
      fecha_cierre = timezone('utc', now())
  WHERE asamblea_id = p_asamblea_id
    AND estado = 'ABIERTA'
    AND id != p_propuesta_id;

  -- Abrir la propuesta seleccionada
  UPDATE public.propuestas
  SET estado = 'ABIERTA',
      fecha_apertura = timezone('utc', now())
  WHERE id = p_propuesta_id;

  -- Actualizar estado de asamblea
  UPDATE public.asambleas
  SET 
    estado_actual = 'VOTACION',
    propuesta_activa_id = p_propuesta_id,
    cronometro_activo = false,
    cronometro_pausado = false
  WHERE id = p_asamblea_id;
END;
$$ LANGUAGE plpgsql;

-- Función: Cerrar votación
CREATE OR REPLACE FUNCTION public.cerrar_votacion(p_asamblea_id UUID)
RETURNS VOID AS $$
DECLARE
  v_propuesta_id UUID;
  v_porcentaje_si DECIMAL(5,2);
  v_regla_aprobacion DECIMAL(3,2);
BEGIN
  -- Obtener propuesta activa
  SELECT propuesta_activa_id, regla_aprobacion
  INTO v_propuesta_id, v_regla_aprobacion
  FROM public.asambleas
  WHERE id = p_asamblea_id;

  IF v_propuesta_id IS NOT NULL THEN
    -- Obtener porcentaje de votos SI
    SELECT porcentaje_si INTO v_porcentaje_si
    FROM public.propuestas
    WHERE id = v_propuesta_id;

    -- Cerrar propuesta y determinar resultado
    UPDATE public.propuestas
    SET estado = 'CERRADA',
        fecha_cierre = timezone('utc', now()),
        resultado_aprobada = (v_porcentaje_si >= (v_regla_aprobacion * 100))
    WHERE id = v_propuesta_id;

    -- Actualizar estado de asamblea
    UPDATE public.asambleas
    SET estado_actual = 'RESULTADOS',
        propuesta_activa_id = NULL
    WHERE id = p_asamblea_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función: Regresar a espera
CREATE OR REPLACE FUNCTION public.regresar_a_espera(p_asamblea_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.asambleas
  SET 
    estado_actual = 'ESPERA',
    propuesta_activa_id = NULL,
    cronometro_activo = false,
    cronometro_pausado = false,
    cronometro_tiempo_pausado = 0
  WHERE id = p_asamblea_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PASO 6: TRIGGERS
-- =====================================================

-- Función trigger: Actualizar estadísticas al insertar voto
CREATE OR REPLACE FUNCTION public.trigger_actualizar_estadisticas_voto()
RETURNS TRIGGER AS $$
DECLARE
  stats RECORD;
BEGIN
  -- Calcular estadísticas
  SELECT * INTO stats FROM public.calcular_estadisticas_propuesta(NEW.propuesta_id);
  
  -- Actualizar propuesta con porcentaje_no incluido
  UPDATE public.propuestas
  SET 
    votos_si = stats.votos_si,
    votos_no = stats.votos_no,
    total_votos = stats.total_votos,
    porcentaje_si = stats.porcentaje_si,
    porcentaje_no = stats.porcentaje_no
  WHERE id = NEW.propuesta_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger (eliminar primero si existe)
DROP TRIGGER IF EXISTS trigger_voto_actualizar_stats ON public.votos;
CREATE TRIGGER trigger_voto_actualizar_stats
AFTER INSERT ON public.votos
FOR EACH ROW
EXECUTE FUNCTION public.trigger_actualizar_estadisticas_voto();

-- =====================================================
-- PASO 7: VISTAS
-- =====================================================

-- Vista: Estado completo de asamblea
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
  a.cronometro_duraviviendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asambleas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cronometro_debate ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo (ajustar para producción)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.viviendas;
CREATE POLICY "Enable read access for all users"
ON public.viviendas
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON public.propietarios;
CREATE POLICY "Enable read access for all users"
ON public.propietarios
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.asambleas;
CREATE POLICY "Enable all access for all users"
ON public.asambleas
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.propuestas;
CREATE POLICY "Enable all access for all users"
ON public.propuestas
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.votos;
CREATE POLICY "Enable all access for all users"
ON public.votos
FOR ALL
USING (true)
WITInsertar viviendas de ejemplo
INSERT INTO public.viviendas (numero_casa) VALUES
  ('101'), ('102'), ('103'), ('104'), ('105'),
  ('201'), ('202'), ('203'), ('204'), ('205'),
  ('301'), ('302'), ('303'), ('304'), ('305')
ON CONFLICT (numero_casa) DO NOTHING;

-- Insertar propietarios de ejemplo
INSERT INTO public.propietarios (vivienda_id, primer_nombre, primer_apellido)
SELECT id, 
  (ARRAY['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Laura', 'José', 'Isabel'])[floor(random() * 10 + 1)],
  (ARRAY['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores'])[floor(random() * 10 + 1)]
FROM public.viviendas
WHERE NOT EXISTS (SELECT 1 FROM public.propietarios LIMIT 1);

-- H CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.asistencias;
CREATE POLICY "Enable all access for all users"
ON public.asistencias
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.cronometro_debate;
CREATE POLICY "Enable all access for all users"
ON public.cronometro_debate===================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.asambleas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (ajustar según tus necesidades de seguridad)
DROP POLICY IF EXISTS "Enable all access for all users" ON public.asambleas;
CREATE POLICY "Enable all access for all users"
ON public.asambleas
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.propuestas;
CREATE POLICY "Enable all access for all users"
ON public.propuestas
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.votos;
CREATE POLICY "Enable all access for all users"
ON public.votos
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for all users" ON public.asistencias;
CREATE POLICY "Enable all access for all users"
ON public.asistencias
FOR ALL
USING (true)
WITH CHECK (true);

-- =====================================================
-- PASO 9: DATOS DE EJEMPLO (OPCIONAL - Comentado)
-- =====================================================

-- DESCOMENTAR SI QUIERES DATOS DE PRUEBA
/*
-- Crear asamblea de ejemplo
INSERT INTO public.asambleas (codigo_acceso, estado, estado_actual)
VALUES ('TEST01', 'ABIERTA', 'ESPERA')
ON CONFLICT (codigo_acceso) DO NOTHING;

-- Crear propuesta de ejemplo
INSERT INTO public.propuestas (
  asamblea_id, 
  titulo, 
  descripcion, 
  orden, 
  estado
)
SELECT 
  id, 
  'Propuesta de Prueba', 
  'Esta es una propuesta de ejemplo para probar el sistema', 
  1, creadas: 7 (viviendas, propietarios, asambleas, asistencias, propuestas, votos, cronometro_debate)';
  RAISE NOTICE '🔧 Funciones creadas: 8';
  RAISE NOTICE '⚡ Triggers activos: 1';
  RAISE NOTICE '👁️ Vistas creadas: 1';
  RAISE NOTICE '🔒 RLS habilitado en todas las tablas';
  RAISE NOTICE '📝 Sistema listo para usar
*/

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================

-- Verificación
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migración completada exitosamente';
  RAISE NOTICE '📊 Tablas verificadas';
  RAISE NOTICE '🔧 Funciones creadas: 7';
  RAISE NOTICE '⚡ Triggers activos: 1';
  RAISE NOTICE '👁️ Vistas creadas: 1';
  RAISE NOTICE '🔒 RLS habilitado en todas las tablas';
END $$;

-- Listar funciones creadas
SELECT 
  'Función: ' || proname as nombre
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'calcular_estadisticas_propuesta',
    'iniciar_cronometro_debate',
    'pausar_cronometro',
    'reanudar_cronometro',
    'detener_cronometro',
    'iniciar_votacion',
    'cerrar_votacion',
    'regresar_a_espera',
    'trigger_actualizar_estadisticas_voto'
  );
