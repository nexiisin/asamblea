import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../services/supabase';
import { Asamblea } from '../types/database.types';

interface Props {
  asambleaId: string;
  key?: string | number;
}

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.35, 140);
const STROKE_WIDTH = 4;

export default function CronometroModal({ asambleaId }: Props) {
  const [visible, setVisible] = useState(false);
  const [asamblea, setAsamblea] = useState<Asamblea | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);

  // Calcular tiempo restante basado en timestamp del servidor
  const calcularTiempoRestante = (asam: Asamblea) => {
    if (asam.cronometro_activo && !asam.cronometro_pausado && asam.cronometro_inicio) {
      const ahora = Date.now();
      const inicio = new Date(asam.cronometro_inicio).getTime();
      const transcurrido = Math.floor((ahora - inicio) / 1000);
      const restante = Math.max(0, asam.cronometro_duracion_segundos - transcurrido);
      setTiempoRestante(restante);
    } else if (asam.cronometro_pausado) {
      const restante = Math.max(0, asam.cronometro_duracion_segundos - asam.cronometro_tiempo_pausado);
      setTiempoRestante(restante);
    } else {
      setTiempoRestante(0);
    }
  };

  // Cargar asamblea
  const cargarAsamblea = async () => {
    try {
      const { data, error } = await supabase
        .from('asambleas')
        .select('cronometro_activo, cronometro_pausado, cronometro_inicio, cronometro_duracion_segundos, cronometro_tiempo_pausado')
        .eq('id', asambleaId)
        .single();

      if (error) throw error;

      console.log('[CRONOMETRO MODAL] Datos cargados:', {
        cronometro_activo: data?.cronometro_activo,
        cronometro_pausado: data?.cronometro_pausado,
        cronometro_duracion: data?.cronometro_duracion_segundos
      });

      if (data && data.cronometro_activo) {
        const asamData = data as Asamblea;
        setAsamblea(asamData);
        calcularTiempoRestante(asamData);
        setVisible(true);
        console.log('✅ [CRONOMETRO MODAL] Modal visible = true');
      } else {
        setVisible(false);
        setAsamblea(null);
        console.log('❌ [CRONOMETRO MODAL] Modal visible = false');
      }
    } catch (error: any) {
      console.error('[CRONOMETRO MODAL] Error al cargar asamblea:', error.message);
    }
  };

  // 🚀 SUSCRIPCIÓN EN TIEMPO REAL
  useEffect(() => {
    cargarAsamblea();

    console.log('📡 [CRONOMETRO MODAL] Suscribiéndose a cambios de cronómetro...');

    const channelName = `cronometro-${asambleaId}-${Date.now()}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'asambleas',
          filter: `id=eq.${asambleaId}`,
        },
        (payload) => {
          console.log('🔔 [CRONOMETRO MODAL] Cambio detectado');
          const nuevaAsamblea = payload.new as Asamblea;
          console.log('[CRONOMETRO MODAL] Nuevo estado:', {
            cronometro_activo: nuevaAsamblea.cronometro_activo,
            estado_actual: nuevaAsamblea.estado_actual
          });
          
          if (nuevaAsamblea.cronometro_activo) {
            setAsamblea(nuevaAsamblea);
            calcularTiempoRestante(nuevaAsamblea);
            setVisible(true);
            console.log('✅ [CRONOMETRO MODAL] Modal mostrado');
          } else {
            setVisible(false);
            setAsamblea(null);
            console.log('❌ [CRONOMETRO MODAL] Modal ocultado');
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 [CRONOMETRO MODAL] Desuscribiendo...');
      supabase.removeChannel(subscription);
    };
  }, [asambleaId]);

  // Actualizar cuenta regresiva cada segundo
  useEffect(() => {
    if (!asamblea || !asamblea.cronometro_activo || asamblea.cronometro_pausado) return;

    const interval = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [asamblea]);

  // Formatear tiempo
  const formatearTiempo = (segundosTotales: number) => {
    const mins = Math.floor(segundosTotales / 60);
    const secs = segundosTotales % 60;
    return { mins, secs };
  };

  const CirculoProgreso = ({ 
    valor, 
    maximo, 
    label, 
    size 
  }: { 
    valor: number; 
    maximo: number; 
    label: string; 
    size: number;
  }) => {
    const radius = (size - STROKE_WIDTH) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = maximo > 0 ? (valor / maximo) : 0;
    const strokeDashoffset = circumference * (1 - progress);

    return (
      <View style={styles.circleContainer}>
        <Svg width={size} height={size}>
          {/* Círculo de fondo */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#9AE6B4"
            strokeWidth={STROKE_WIDTH}
            fill="none"
          />
          {/* Círculo de progreso */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#48BB78"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.circleContent}>
          <Text style={styles.circleValue}>{valor}</Text>
          <Text style={styles.circleLabel}>{label}</Text>
        </View>
      </View>
    );
  };

  if (!visible || !asamblea) {
    return null;
  }

  const { mins: minutosRestantes, secs: segundosRestantes } = formatearTiempo(tiempoRestante);
  const duracionTotal = asamblea.cronometro_duracion_segundos;
  const minutosMaximos = Math.floor(duracionTotal / 60);

  const estadoTexto = asamblea.cronometro_pausado ? '⏸️ PAUSADO' : '▶️ EN CURSO';
  const estadoColor = asamblea.cronometro_pausado ? '#f59e0b' : '#10b981';
  const cronometroTerminado = tiempoRestante === 0;

  const handleCerrarModal = () => {
    setVisible(false);
    setAsamblea(null);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.titulo}>⏱️ Cronómetro de Debate</Text>
            <View style={[styles.estadoBadge, { backgroundColor: estadoColor }]}>
              <Text style={styles.estadoTexto}>{estadoTexto}</Text>
            </View>
          </View>

          <View style={styles.cronometroContainer}>
            <CirculoProgreso
              valor={minutosRestantes}
              maximo={minutosMaximos}
              label="MIN"
              size={CIRCLE_SIZE}
            />
            <CirculoProgreso
              valor={segundosRestantes}
              maximo={59}
              label="SEG"
              size={CIRCLE_SIZE}
            />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTexto}>
              📡 Sincronizado en tiempo real
            </Text>
          </View>

          {cronometroTerminado && (
            <TouchableOpacity 
              style={styles.botonFinalizar}
              onPress={handleCerrarModal}
            >
              <Text style={styles.botonFinalizarTexto}>⏹️ Finalizar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
  },
  estadoBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  estadoTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cronometroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
    gap: 20,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  circleValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  circleLabel: {
  botonFinalizar: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  botonFinalizarTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  infoContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  infoTexto: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
