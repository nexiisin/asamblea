-- =====================================================
-- TABLA: cronometro_debate
-- Cronómetro sincronizado en tiempo real para debates
-- =====================================================
CREATE TABLE IF NOT EXISTS cronometro_debate (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asamblea_id UUID NOT NULL REFERENCES asambleas(id) ON DELETE CASCADE,
  propuesta_id UUID REFERENCES propuestas(id) ON DELETE SET NULL,
  duracion_segundos INTEGER NOT NULL,
  tiempo_transcurrido INTEGER NOT NULL DEFAULT 0,
  estado VARCHAR(20) NOT NULL DEFAULT 'DETENIDO' CHECK (estado IN ('ACTIVO', 'PAUSADO', 'DETENIDO')),
  timestamp_inicio TIMESTAMP WITH TIME ZONE,
  timestamp_pausa TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(asamblea_id)
);

-- Índices para consultas rápidas
CREATE INDEX idx_cronometro_asamblea ON cronometro_debate(asamblea_id);
CREATE INDEX idx_cronometro_estado ON cronometro_debate(estado);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_cronometro_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cronometro_updated_at
BEFORE UPDATE ON cronometro_debate
FOR EACH ROW
EXECUTE FUNCTION update_cronometro_timestamp();

-- Habilitar RLS
ALTER TABLE cronometro_debate ENABLE ROW LEVEL SECURITY;

-- Política permisiva para desarrollo
CREATE POLICY "Enable all access for all users" ON cronometro_debate FOR ALL USING (true);
