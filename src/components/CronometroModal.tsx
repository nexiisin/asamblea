import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../services/supabase';
import { CronometroDebate } from '../types/database.types';

interface Props {
  asambleaId: string;
}

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.35, 140);
const STROKE_WIDTH = 4;

export default function CronometroModal({ asambleaId }: Props) {
  const [visible, setVisible] = useState(false);
  const [cronometro, setCronometro] = useState<CronometroDebate | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  // Calcular tiempo restante basado en timestamp del servidor
  const calcularTiempoRestante = useCallback((crono: CronometroDebate) => {
    if (crono.estado === 'ACTIVO' && crono.timestamp_inicio) {
      const ahora = Date.now();
      const inicio = new Date(crono.timestamp_inicio).getTime();
      const transcurrido = Math.floor((ahora - inicio) / 1000) + crono.tiempo_transcurrido;
      const restante = Math.max(0, crono.duracion_segundos - transcurrido);
      setTiempoRestante(restante);
    } else if (crono.estado === 'PAUSADO') {
      const restante = Math.max(0, crono.duracion_segundos - crono.tiempo_transcurrido);
      setTiempoRestante(restante);
    } else {
      setTiempoRestante(crono.duracion_segundos);
    }
  }, []);

  // Cargar cronómetro existente
  const cargarCronometro = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cronometro_debate')
        .select('*')
        .eq('asamblea_id', asambleaId)
        .maybeSingle();

      if (error) throw error;

      if (data && data.estado !== 'DETENIDO') {
        setCronometro(data);
        calcularTiempoRestante(data);
        setVisible(true);
      } else {
        setVisible(false);
        setCronometro(null);
      }
    } catch (error: any) {
      console.error('Error al cargar cronómetro:', error.message);
    }
  }, [asambleaId, calcularTiempoRestante]);

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    cargarCronometro();

    const subscription = supabase
      .channel('cronometro_invitado_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cronometro_debate',
          filter: `asamblea_id=eq.${asambleaId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setCronometro(null);
            setVisible(false);
          } else {
            const nuevoCrono = payload.new as CronometroDebate;
            
            if (nuevoCrono.estado === 'DETENIDO') {
              setVisible(false);
              setCronometro(null);
            } else {
              setCronometro(nuevoCrono);
              calcularTiempoRestante(nuevoCrono);
              setVisible(true);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [asambleaId, cargarCronometro, calcularTiempoRestante]);

  // Actualizar cuenta regresiva cada segundo
  useEffect(() => {
    if (!cronometro || cronometro.estado !== 'ACTIVO') return;

    const interval = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cronometro]);

  // Formatear tiempo
  const formatearTiempo = (segundosTotales: number) => {
    const mins = Math.floor(segundosTotales / 60);
    const secs = segundosTotales % 60;
    return { mins, secs };
  };

  // Componente de círculo de progreso
  const CirculoProgreso = ({ valor, max, label }: { valor: number; max: number; label: string }) => {
    const radius = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = (valor / max) * circumference;
    
    return (
      <View style={styles.circleContainer}>
        <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
          {/* Círculo de fondo */}
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={radius}
            stroke="#2D3748"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Círculo de progreso */}
          <Circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={radius}
            stroke="#48BB78"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
          />
        </Svg>
        <View style={styles.circleContent}>
          <Text style={styles.circleValue}>{valor.toString().padStart(2, '0')}</Text>
        </View>
        <Text style={styles.circleLabel}>{label}</Text>
      </View>
    );
  };

  const { mins, secs } = formatearTiempo(tiempoRestante);

  // Obtener color según estado
  const obtenerColor = () => {
    if (!cronometro) return '#6B7280';
    if (tiempoRestante === 0) return '#EF4444';
    if (cronometro.estado === 'ACTIVO') return '#10B981';
    return '#F59E0B';
  };

  // Obtener mensaje de estado
  const obtenerMensajeEstado = () => {
    if (!cronometro) return 'ESPERANDO';
    if (tiempoRestante === 0) return '¡TIEMPO FINALIZADO!';
    if (cronometro.estado === 'ACTIVO') return 'EN PROGRESO';
    if (cronometro.estado === 'PAUSADO') return 'PAUSADO';
    return 'DETENIDO';
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.titulo}>⏱️ TIEMPO DE DEBATE</Text>
          
          <View style={styles.circlesRow}>
            <CirculoProgreso valor={mins} max={59} label="MINUTES" />
            <CirculoProgreso valor={secs} max={59} label="SECONDS" />
          </View>

          <View style={[
            styles.estadoBadge,
            cronometro?.estado === 'ACTIVO' && styles.estadoActivo,
            cronometro?.estado === 'PAUSADO' && styles.estadoPausado,
            tiempoRestante === 0 && styles.estadoFinalizado,
          ]}>
            <Text style={styles.estadoText}>
              {tiempoRestante === 0 ? '¡FINALIZADO!' : obtenerMensajeEstado()}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 500,
    backgroundColor: '#1A202C',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 1,
  },
  circlesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  circleContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  circleContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  circleLabel: {
    fontSize: 10,
    color: '#A0AEC0',
    marginTop: 8,
    letterSpacing: 1,
    fontWeight: '600',
  },
  estadoBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  estadoActivo: {
    backgroundColor: '#48BB78',
  },
  estadoPausado: {
    backgroundColor: '#F59E0B',
  },
  estadoFinalizado: {
    backgroundColor: '#EF4444',
  },
  estadoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
