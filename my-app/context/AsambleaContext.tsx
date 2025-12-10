import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipos de datos
export interface Asistente {
  id: string;
  numeroCasa: string;
  nombrePropietario: string;
  numeroPersonasAutorizadas: string;
  fecha: string;
}

export interface CasaEscaneada {
  id: string;
  numeroCasa: string;
  nombrePropietario: string;
  fecha: string;
}

export interface VotoUsuario {
  id: string;
  puntoId: string;
  voto: 'si' | 'no' | 'ausente' | 'no_voto';
  timestamp: string;
}

export interface VotacionPunto {
  id: string;
  punto: string;
  votos: {
    si: number;
    no: number;
    ausente: number;
    no_voto: number;
  };
  estado?: 'aprobado' | 'desaprobado' | 'pendiente';
}

export type EstadoAsamblea = 'registro' | 'escaneo' | 'votacion' | 'resultados' | 'cerrada';

export interface AsambleaContextType {
  // Estado
  asistentes: Asistente[];
  casasEscaneadas: CasaEscaneada[];
  puntosVotacion: VotacionPunto[];
  votosUsuarios: VotoUsuario[];
  estadoAsamblea: EstadoAsamblea;
  loading: boolean;

  // Métodos
  addAsistente: (asistente: Omit<Asistente, 'id' | 'fecha'>) => Promise<void>;
  confirmarQR: (numeroCasa: string, nombrePropietario: string) => Promise<void>;
  registrarVoto: (puntoId: string, voto: 'si' | 'no' | 'ausente' | 'no_voto') => Promise<void>;
  setEstadoAsamblea: (estado: EstadoAsamblea) => void;
  limpiarSesion: () => Promise<void>;
  cargarDatos: () => Promise<void>;
}

const AsambleaContext = createContext<AsambleaContextType | undefined>(undefined);

export const AsambleaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [asistentes, setAsistentes] = useState<Asistente[]>([]);
  const [casasEscaneadas, setCasasEscaneadas] = useState<CasaEscaneada[]>([]);
  const [puntosVotacion, setPuntosVotacion] = useState<VotacionPunto[]>([]);
  const [votosUsuarios, setVotosUsuarios] = useState<VotoUsuario[]>([]);
  const [estadoAsamblea, setEstadoAsamblea] = useState<EstadoAsamblea>('registro');
  const [loading, setLoading] = useState(true);

  // Cargar datos al iniciar
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const [asisArc, casasArc, puntosArc, votosArc] = await Promise.all([
        AsyncStorage.getItem('asistentes'),
        AsyncStorage.getItem('casasEscaneadas'),
        AsyncStorage.getItem('votacionPuntos'),
        AsyncStorage.getItem('votosUsuarios'),
      ]);

      if (asisArc) setAsistentes(JSON.parse(asisArc));
      if (casasArc) setCasasEscaneadas(JSON.parse(casasArc));
      if (puntosArc) setPuntosVotacion(JSON.parse(puntosArc));
      if (votosArc) setVotosUsuarios(JSON.parse(votosArc));
    } catch (error) {
      console.error('Error cargando datos del Context:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAsistente = async (asistenteData: Omit<Asistente, 'id' | 'fecha'>) => {
    try {
      const nuevoAsistente: Asistente = {
        ...asistenteData,
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
      };

      const nuevosAsistentes = [...asistentes, nuevoAsistente];
      setAsistentes(nuevosAsistentes);
      await AsyncStorage.setItem('asistentes', JSON.stringify(nuevosAsistentes));
    } catch (error) {
      console.error('Error al agregar asistente:', error);
      throw error;
    }
  };

  const confirmarQR = async (numeroCasa: string, nombrePropietario: string) => {
    try {
      // Verificar que el asistente esté registrado
      const asistenteRegistrado = asistentes.some(
        (a) =>
          a.numeroCasa === numeroCasa && a.nombrePropietario === nombrePropietario
      );

      if (!asistenteRegistrado) {
        throw new Error('Asistente no registrado');
      }

      // Verificar si ya fue escaneado
      const yaEscaneado = casasEscaneadas.some(
        (c) => c.numeroCasa === numeroCasa && c.nombrePropietario === nombrePropietario
      );

      if (yaEscaneado) {
        console.log('Ya fue escaneado previamente');
        return;
      }

      const nuevaCasaEscaneada: CasaEscaneada = {
        id: Date.now().toString(),
        numeroCasa,
        nombrePropietario,
        fecha: new Date().toISOString(),
      };

      const nuevasCasas = [...casasEscaneadas, nuevaCasaEscaneada];
      setCasasEscaneadas(nuevasCasas);
      await AsyncStorage.setItem('casasEscaneadas', JSON.stringify(nuevasCasas));
    } catch (error) {
      console.error('Error al confirmar QR:', error);
      throw error;
    }
  };

  const registrarVoto = async (
    puntoId: string,
    voto: 'si' | 'no' | 'ausente' | 'no_voto'
  ) => {
    try {
      // Buscar el punto de votación
      const puntoIndex = puntosVotacion.findIndex((p) => p.id === puntoId);
      if (puntoIndex === -1) {
        throw new Error('Punto de votación no encontrado');
      }

      // Registrar voto (sin identificar por cédula)
      const nuevoVoto: VotoUsuario = {
        id: Date.now().toString(),
        puntoId,
        voto,
        timestamp: new Date().toISOString(),
      };

      const nuevosVotos = [...votosUsuarios, nuevoVoto];
      setVotosUsuarios(nuevosVotos);

      // Actualizar punto de votación
      const puntoActualizado = [...puntosVotacion];
      puntoActualizado[puntoIndex].votos[voto]++;

      // Calcular estado
      const total =
        puntoActualizado[puntoIndex].votos.si +
        puntoActualizado[puntoIndex].votos.no +
        puntoActualizado[puntoIndex].votos.ausente +
        puntoActualizado[puntoIndex].votos.no_voto;

      const porcentajeSi = total === 0 ? 0 : (puntoActualizado[puntoIndex].votos.si / total) * 100;
      puntoActualizado[puntoIndex].estado =
        porcentajeSi >= 51 ? 'aprobado' : 'desaprobado';

      setPuntosVotacion(puntoActualizado);

      // Guardar en AsyncStorage
      await Promise.all([
        AsyncStorage.setItem('votosUsuarios', JSON.stringify(nuevosVotos)),
        AsyncStorage.setItem('votacionPuntos', JSON.stringify(puntoActualizado)),
      ]);
    } catch (error) {
      console.error('Error al registrar voto:', error);
      throw error;
    }
  };

  const limpiarSesion = async () => {
    try {
      setAsistentes([]);
      setCasasEscaneadas([]);
      setPuntosVotacion([]);
      setVotosUsuarios([]);
      setEstadoAsamblea('registro');

      await Promise.all([
        AsyncStorage.removeItem('asistentes'),
        AsyncStorage.removeItem('casasEscaneadas'),
        AsyncStorage.removeItem('votacionPuntos'),
        AsyncStorage.removeItem('votosUsuarios'),
      ]);
    } catch (error) {
      console.error('Error limpiando sesión:', error);
      throw error;
    }
  };

  const value: AsambleaContextType = {
    asistentes,
    casasEscaneadas,
    puntosVotacion,
    votosUsuarios,
    estadoAsamblea,
    loading,
    addAsistente,
    confirmarQR,
    registrarVoto,
    setEstadoAsamblea,
    limpiarSesion,
    cargarDatos,
  };

  return (
    <AsambleaContext.Provider value={value}>
      {children}
    </AsambleaContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useAsamblea = (): AsambleaContextType => {
  const context = useContext(AsambleaContext);
  if (!context) {
    throw new Error('useAsamblea debe usarse dentro de AsambleaProvider');
  }
  return context;
};
