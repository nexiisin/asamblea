// Tipos de la base de datos
export type EstadoAsamblea = 'ABIERTA' | 'CERRADA';
export type EstadoActualAsamblea = 'ESPERA' | 'DEBATE' | 'VOTACION' | 'RESULTADOS';
export type EstadoPropuesta = 'BORRADOR' | 'ABIERTA' | 'CERRADA';
export type TipoVoto = 'SI' | 'NO';
export type EstadoCasa = 'SI' | 'NO' | 'NO_VOTO' | 'NO_ASISTIO';
export type EstadoCronometro = 'ACTIVO' | 'PAUSADO' | 'DETENIDO';

// Tablas de la base de datos
export interface Vivienda {
  id: string;
  numero_casa: string;
  created_at: string;
}

export interface Propietario {
  id: string;
  vivienda_id: string;
  primer_nombre: string;
  primer_apellido: string;
  created_at: string;
}

export interface Asamblea {
  id: string;
  codigo_acceso: string;
  estado: EstadoAsamblea;
  estado_actual: EstadoActualAsamblea;
  propuesta_activa_id: string | null;
  cronometro_activo: boolean;
  cronometro_pausado: boolean;
  cronometro_inicio: string | null;
  cronometro_duracion_segundos: number;
  cronometro_tiempo_pausado: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  regla_aprobacion: number; // 0.51 por defecto
  created_at: string;
}

export interface Asistencia {
  id: string;
  asamblea_id: string;
  vivienda_id: string;
  nombre_asistente: string;
  fecha_registro: string;
  created_at: string;
}

export interface Propuesta {
  id: string;
  asamblea_id: string;
  titulo: string;
  descripcion: string;
  estado: EstadoPropuesta;
  resultado_aprobada: boolean | null;
  votos_si: number;
  votos_no: number;
  total_votos: number;
  porcentaje_si: number | null;
  porcentaje_no: number | null;
  fecha_apertura: string | null;
  fecha_cierre: string | null;
  orden: number;
  created_at: string;
}

export interface Voto {
  id: string;
  propuesta_id: string;
  vivienda_id: string;
  asistencia_id: string;
  tipo_voto: TipoVoto;
  fecha_voto: string;
  created_at: string;
}

export interface CronometroDebate {
  id: string;
  asamblea_id: string;
  propuesta_id: string | null;
  duracion_segundos: number;
  tiempo_transcurrido: number;
  estado: EstadoCronometro;
  timestamp_inicio: string | null;
  timestamp_pausa: string | null;
  created_at: string;
  updated_at: string;
}

// Tipos para las vistas y queries
export interface EstadisticasPropuesta {
  total_casas: number;
  total_asistentes: number;
  votos_si: number;
  votos_no: number;
  no_voto: number;
  no_asistio: number;
}

export interface ResultadoPropuesta extends Propuesta {
  estadisticas: EstadisticasPropuesta;
}

// Vista de estado completo de asamblea
export interface EstadoAsambleaCompleto {
  asamblea_id: string;
  codigo_acceso: string;
  estado_asamblea: EstadoAsamblea;
  estado_actual: EstadoActualAsamblea;
  propuesta_activa_id: string | null;
  cronometro_activo: boolean;
  cronometro_inicio: string | null;
  cronometro_duracion_segundos: number;
  cronometro_segundos_restantes: number;
  propuesta_id: string | null;
  propuesta_titulo: string | null;
  propuesta_descripcion: string | null;
  propuesta_estado: EstadoPropuesta | null;
  votos_si: number | null;
  votos_no: number | null;
  total_votos: number | null;
  porcentaje_si: number | null;
  total_asistentes: number;
}
