-- =====================================================
-- ESQUEMA DE BASE DE DATOS PARA ASAMBLEA DIGITAL
-- Supabase (PostgreSQL)
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: viviendas
-- Todas las casas del conjunto residencial
-- =====================================================
CREATE TABLE IF NOT EXISTS viviendas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_casa VARCHAR(20) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_viviendas_numero_casa ON viviendas(numero_casa);

-- =====================================================
-- TABLA: propietarios
-- Datos de los propietarios de cada vivienda
-- =====================================================
CREATE TABLE IF NOT EXISTS propietarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vivienda_id UUID NOT NULL REFERENCES viviendas(id) ON DELETE CASCADE,
  primer_nombre VARCHAR(100) NOT NULL,
  primer_apellido VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(vivienda_id) -- Una vivienda tiene un solo propietario principal
);

-- Índices para validación rápida
CREATE INDEX idx_propietarios_vivienda ON propietarios(vivienda_id);
CREATE INDEX idx_propietarios_nombre ON propietarios(primer_nombre, primer_apellido);

-- =====================================================
-- TABLA: asambleas
-- Registro de asambleas
-- =====================================================
CREATE TABLE IF NOT EXISTS asambleas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo_acceso VARCHAR(10) NOT NULL UNIQUE,
  estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTA' CHECK (estado IN ('ABIERTA', 'CERRADA')),
  fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  fecha_fin TIMESTAMP WITH TIME ZONE,
  regla_aprobacion DECIMAL(3,2) NOT NULL DEFAULT 0.51, -- 51%
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índice para búsqueda por código
CREATE INDEX idx_asambleas_codigo ON asambleas(codigo_acceso);
CREATE INDEX idx_asambleas_estado ON asambleas(estado);

-- =====================================================
-- TABLA: asistencias
-- Registro de asistentes por casa
-- Solo se crea cuando una casa ingresa a la asamblea
-- =====================================================
CREATE TABLE IF NOT EXISTS asistencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asamblea_id UUID NOT NULL REFERENCES asambleas(id) ON DELETE CASCADE,
  vivienda_id UUID NOT NULL REFERENCES viviendas(id) ON DELETE CASCADE,
  nombre_asistente VARCHAR(200) NOT NULL,
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(asamblea_id, vivienda_id) -- Una casa solo puede registrarse una vez
);

-- Índices
CREATE INDEX idx_asistencias_asamblea ON asistencias(asamblea_id);
CREATE INDEX idx_asistencias_vivienda ON asistencias(vivienda_id);

-- =====================================================
-- TABLA: propuestas
-- Preguntas para votar en la asamblea
-- =====================================================
CREATE TABLE IF NOT EXISTS propuestas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asamblea_id UUID NOT NULL REFERENCES asambleas(id) ON DELETE CASCADE,
  titulo VARCHAR(500) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR' CHECK (estado IN ('BORRADOR', 'ABIERTA', 'CERRADA')),
  resultado_aprobada BOOLEAN,
  votos_si INTEGER DEFAULT 0,
  votos_no INTEGER DEFAULT 0,
  total_votos INTEGER DEFAULT 0,
  porcentaje_si DECIMAL(5,2),
  fecha_apertura TIMESTAMP WITH TIME ZONE,
  fecha_cierre TIMESTAMP WITH TIME ZONE,
  orden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Índices
CREATE INDEX idx_propuestas_asamblea ON propuestas(asamblea_id);
CREATE INDEX idx_propuestas_estado ON propuestas(estado);
CREATE INDEX idx_propuestas_orden ON propuestas(orden);

-- =====================================================
-- TABLA: votos
-- Solo almacena votos SI o NO
-- NO_VOTO y NO_ASISTIO se calculan
-- =====================================================
CREATE TABLE IF NOT EXISTS votos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  propuesta_id UUID NOT NULL REFERENCES propuestas(id) ON DELETE CASCADE,
  vivienda_id UUID NOT NULL REFERENCES viviendas(id) ON DELETE CASCADE,
  asistencia_id UUID NOT NULL REFERENCES asistencias(id) ON DELETE CASCADE,
  tipo_voto VARCHAR(2) NOT NULL CHECK (tipo_voto IN ('SI', 'NO')),
  fecha_voto TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(propuesta_id, vivienda_id) -- Un voto por casa por propuesta
);

-- Índices
CREATE INDEX idx_votos_propuesta ON votos(propuesta_id);
CREATE INDEX idx_votos_vivienda ON votos(vivienda_id);
CREATE INDEX idx_votos_tipo ON votos(tipo_voto);

-- =====================================================
-- TRIGGERS Y FUNCIONES
-- =====================================================

-- Función para actualizar contadores de votos
CREATE OR REPLACE FUNCTION actualizar_contadores_votos()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar contadores en la propuesta
  UPDATE propuestas
  SET 
    votos_si = (SELECT COUNT(*) FROM votos WHERE propuesta_id = NEW.propuesta_id AND tipo_voto = 'SI'),
    votos_no = (SELECT COUNT(*) FROM votos WHERE propuesta_id = NEW.propuesta_id AND tipo_voto = 'NO'),
    total_votos = (SELECT COUNT(*) FROM votos WHERE propuesta_id = NEW.propuesta_id)
  WHERE id = NEW.propuesta_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar contadores cuando se inserta un voto
CREATE TRIGGER trigger_actualizar_contadores
AFTER INSERT ON votos
FOR EACH ROW
EXECUTE FUNCTION actualizar_contadores_votos();

-- Función para calcular resultado al cerrar propuesta
CREATE OR REPLACE FUNCTION calcular_resultado_propuesta()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'CERRADA' AND OLD.estado = 'ABIERTA' THEN
    -- Calcular porcentaje de SI
    IF (NEW.votos_si + NEW.votos_no) > 0 THEN
      NEW.porcentaje_si := (NEW.votos_si::DECIMAL / (NEW.votos_si + NEW.votos_no)) * 100;
      
      -- Determinar si se aprueba (regla 51%)
      NEW.resultado_aprobada := (NEW.votos_si::DECIMAL / (NEW.votos_si + NEW.votos_no)) >= 0.51;
    ELSE
      NEW.porcentaje_si := 0;
      NEW.resultado_aprobada := FALSE;
    END IF;
    
    NEW.fecha_cierre := TIMEZONE('utc', NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular resultado
CREATE TRIGGER trigger_calcular_resultado
BEFORE UPDATE ON propuestas
FOR EACH ROW
EXECUTE FUNCTION calcular_resultado_propuesta();

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para obtener estadísticas de propuestas en tiempo real
CREATE OR REPLACE VIEW vista_estadisticas_propuestas AS
SELECT 
  p.id AS propuesta_id,
  p.asamblea_id,
  p.titulo,
  p.descripcion,
  p.estado,
  p.votos_si,
  p.votos_no,
  p.total_votos,
  p.resultado_aprobada,
  p.porcentaje_si,
  (SELECT COUNT(*) FROM viviendas) AS total_casas,
  (SELECT COUNT(*) FROM asistencias WHERE asamblea_id = p.asamblea_id) AS total_asistentes,
  (SELECT COUNT(*) FROM asistencias WHERE asamblea_id = p.asamblea_id) - p.total_votos AS no_voto,
  (SELECT COUNT(*) FROM viviendas) - (SELECT COUNT(*) FROM asistencias WHERE asamblea_id = p.asamblea_id) AS no_asistio
FROM propuestas p;

-- =====================================================
-- POLÍTICAS RLS (Row Level Security)
-- Habilitar después de configurar autenticación si es necesario
-- =====================================================

-- Por ahora, permitir acceso público para desarrollo
ALTER TABLE viviendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE propietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE asambleas ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE propuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo
CREATE POLICY "Enable read access for all users" ON viviendas FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON propietarios FOR SELECT USING (true);
CREATE POLICY "Enable all access for all users" ON asambleas FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON asistencias FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON propuestas FOR ALL USING (true);
CREATE POLICY "Enable all access for all users" ON votos FOR ALL USING (true);

-- =====================================================
-- DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Insertar viviendas de ejemplo (comentar si no se desea)
INSERT INTO viviendas (numero_casa) VALUES
  ('101'), ('102'), ('103'), ('104'), ('105'),
  ('201'), ('202'), ('203'), ('204'), ('205'),
  ('301'), ('302'), ('303'), ('304'), ('305');

-- Insertar propietarios de ejemplo
INSERT INTO propietarios (vivienda_id, primer_nombre, primer_apellido)
SELECT id, 
  (ARRAY['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Laura', 'José', 'Isabel', 'Miguel', 'Rosa', 'Antonio', 'Elena', 'Francisco'])[floor(random() * 15 + 1)],
  (ARRAY['García', 'Rodríguez', 'Martínez', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Reyes'])[floor(random() * 15 + 1)]
FROM viviendas;

-- =====================================================
-- FIN DEL ESQUEMA
-- =====================================================
