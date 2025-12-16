// Tipos de la base de datos
export type EstadoAsamblea = 'ABIERTA' | 'CERRADA';
export type EstadoPropuesta = 'BORRADOR' | 'ABIERTA' | 'CERRADA';
export type TipoVoto = 'SI' | 'NO';
export type EstadoCasa = 'SI' | 'NO' | 'NO_VOTO' | 'NO_ASISTIO';

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
