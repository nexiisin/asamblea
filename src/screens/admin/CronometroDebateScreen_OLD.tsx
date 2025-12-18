import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../../services/supabase';
import { CronometroDebate } from '../../types/database.types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CronometroDebate'>;

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.35, 140);
const STROKE_WIDTH = 4;

export default function CronometroDebateScreen({ route, navigation }: Props) {
  const { asambleaId } = route.params;

  const [minutos, setMinutos] = useState(5);
  const [segundos, setSegundos] = useState(0);
  const [cronometro, setCronometro] = useState<CronometroDebate | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cargar cronómetro existente
  const cargarCronometro = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cronometro_debate')
        .select('*')
        .eq('asamblea_id', asambleaId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setCronometro(data);
        calcularTiempoRestante(data);
      }
    } catch (error: any) {
      console.error('Error al cargar cronómetro:', error.message);
    } finally {
      setLoading(false);
    }
  }, [asambleaId]);

  // Calcular tiempo restante basado en timestamp del servidor
  const calcularTiempoRestante = (crono: CronometroDebate) => {
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
  };

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    cargarCronometro();

    const subscription = supabase
      .channel('cronometro_changes')
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
            setTiempoRestante(0);
          } else {
            const nuevoCrono = payload.new as CronometroDebate;
            setCronometro(nuevoCrono);
            calcularTiempoRestante(nuevoCrono);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [asambleaId, cargarCronometro]);

  // Actualizar cuenta regresiva cada segundo
  useEffect(() => {
    if (!cronometro || cronometro.estado !== 'ACTIVO') return;

    const interval = setInterval(() => {
      setTiempoRestante((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cronometro]);

  // Iniciar cronómetro
  const iniciarCronometro = async () => {
    try {
      const duracionTotal = minutos * 60 + segundos;
      
      if (duracionTotal <= 0) {
        Alert.alert('Error', 'Ingresa un tiempo válido');
        return;
      }

      if (cronometro) {
        // Actualizar cronómetro existente
        const { error } = await supabase
          .from('cronometro_debate')
          .update({
            estado: 'ACTIVO',
            timestamp_inicio: new Date().toISOString(),
            timestamp_pausa: null,
          })
          .eq('id', cronometro.id);

        if (error) throw error;
      } else {
        // Crear nuevo cronómetro
        const { error } = await supabase
          .from('cronometro_debate')
          .insert({
            asamblea_id: asambleaId,
            duracion_segundos: duracionTotal,
            tiempo_transcurrido: 0,
            estado: 'ACTIVO',
            timestamp_inicio: new Date().toISOString(),
          });

        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Pausar cronómetro
  const pausarCronometro = async () => {
    if (!cronometro) return;

    try {
      // Calcular tiempo transcurrido hasta ahora
      const ahora = Date.now();
      const inicio = new Date(cronometro.timestamp_inicio!).getTime();
      const nuevoTranscurrido = Math.floor((ahora - inicio) / 1000) + cronometro.tiempo_transcurrido;

      const { error } = await supabase
        .from('cronometro_debate')
        .update({
          estado: 'PAUSADO',
          tiempo_transcurrido: nuevoTranscurrido,
          timestamp_pausa: new Date().toISOString(),
        })
        .eq('id', cronometro.id);

      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Reanudar cronómetro
  const reanudarCronometro = async () => {
    if (!cronometro) return;

    try {
      const { error } = await supabase
        .from('cronometro_debate')
        .update({
          estado: 'ACTIVO',
          timestamp_inicio: new Date().toISOString(),
          timestamp_pausa: null,
        })
        .eq('id', cronometro.id);

      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Reiniciar cronómetro
  const reiniciarCronometro = async () => {
    if (!cronometro) return;

    try {
      const { error } = await supabase
        .from('cronometro_debate')
        .update({
          estado: 'DETENIDO',
          tiempo_transcurrido: 0,
          timestamp_inicio: null,
          timestamp_pausa: null,
        })
        .eq('id', cronometro.id);

      if (error) throw error;
      
      setTiempoRestante(cronometro.duracion_segundos);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Finalizar cronómetro
  const finalizarCronometro = async () => {
    if (!cronometro) return;

    try {
      const { error } = await supabase
        .from('cronometro_debate')
        .delete()
        .eq('id', cronometro.id);

      if (error) throw error;
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Formatear tiempo
  const formatearTiempo = (segundosTotales: number) => {
    const mins = Math.floor(segundosTotales / 60);
    const secs = segundosTotales % 60;
    return { mins, secs };
  };

  // Componente de círculo de progreso
  const CirculoProgreso = ({ valor, max, label, onIncrement, onDecrement, editable }: { 
    valor: number; 
    max: number; 
    label: string;
    onIncrement?: () => void;
    onDecrement?: () => void;
    editable: boolean;
  }) => {
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
            stroke="#9AE6B4"
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
          {editable && onIncrement && (
            <TouchableOpacity onPress={onIncrement} style={styles.incrementBtn}>
              <Text style={styles.incrementText}>+</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.circleValue}>{valor.toString().padStart(2, '0')}</Text>
          {editable && onDecrement && (
            <TouchableOpacity onPress={onDecrement} style={styles.decrementBtn}>
              <Text style={styles.decrementText}>-</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.circleLabel}>{label}</Text>
      </View>
    );
  };

  const { mins, secs } = formatearTiempo(tiempoRestante);

  // Obtener color según estado
  const obtenerColor = () => {
    if (!cronometro || cronometro.estado === 'DETENIDO') return '#6B7280';
    if (cronometro.estado === 'ACTIVO') return '#10B981';
    return '#F59E0B';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cronómetro de Debate</Text>

      {/* Círculos de tiempo */}
      <View style={styles.circlesRow}>
        <CirculoProgreso
          valor={cronometro ? mins : minutos}
          max={59}
          label="MINUTES"
          editable={!cronometro || cronometro.estado === 'DETENIDO'}
          onIncrement={() => setMinutos(prev => Math.min(prev + 1, 59))}
          onDecrement={() => setMinutos(prev => Math.max(prev - 1, 0))}
        />
        <CirculoProgreso
          valor={cronometro ? secs : segundos}
          max={59}
          label="SECONDS"
          editable={!cronometro || cronometro.estado === 'DETENIDO'}
          onIncrement={() => setSegundos(prev => Math.min(prev + 1, 59))}
          onDecrement={() => setSegundos(prev => Math.max(prev - 1, 0))}
        />
      </View>

      {/* Estado */}
      {cronometro && (
        <View style={styles.estadoContainer}>
          <View style={[
            styles.estadoBadge,
            cronometro.estado === 'ACTIVO' && styles.estadoActivo,
            cronometro.estado === 'PAUSADO' && styles.estadoPausado,
          ]}>
            <Text style={styles.estadoText}>{cronometro.estado}</Text>
          </View>
        </View>
      )}

      {/* Botones de control */}
      <View style={styles.botonesContainer}>
        {(!cronometro || cronometro.estado === 'DETENIDO') && (
          <TouchableOpacity style={[styles.boton, styles.botonIniciar]} onPress={iniciarCronometro}>
            <Text style={styles.botonTexto}>Iniciar</Text>
          </TouchableOpacity>
        )}

        {cronometro && cronometro.estado === 'ACTIVO' && (
          <TouchableOpacity style={[styles.boton, styles.botonPausar]} onPress={pausarCronometro}>
            <Text style={styles.botonTexto}>Pausar</Text>
          </TouchableOpacity>
        )}

        {cronometro && cronometro.estado === 'PAUSADO' && (
          <TouchableOpacity style={[styles.boton, styles.botonReanudar]} onPress={reanudarCronometro}>
            <Text style={styles.botonTexto}>Reanudar</Text>
          </TouchableOpacity>
        )}

        {cronometro && cronometro.estado !== 'DETENIDO' && (
          <>
            <TouchableOpacity style={[styles.boton, styles.botonReiniciar]} onPress={reiniciarCronometro}>
              <Text style={styles.botonTexto}>Reiniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.boton, styles.botonFinalizar]} onPress={finalizarCronometro}>
              <Text style={styles.botonTexto}>Finalizar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
        <Text style={styles.botonVolverTexto}>Volver</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A202C',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A202C',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
    marginTop: 20,
  },
  circlesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
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
  incrementBtn: {
    position: 'absolute',
    top: 10,
    padding: 5,
  },
  incrementText: {
    fontSize: 24,
    color: '#48BB78',
    fontWeight: 'bold',
  },
  decrementBtn: {
    position: 'absolute',
    bottom: 10,
    padding: 5,
  },
  decrementText: {
    fontSize: 24,
    color: '#48BB78',
    fontWeight: 'bold',
  },
  estadoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  estadoBadge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  estadoActivo: {
    backgroundColor: '#48BB78',
  },
  estadoPausado: {
    backgroundColor: '#F59E0B',
  },
  estadoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  botonesContainer: {
    gap: 12,
    paddingHorizontal: 20,
  },
  boton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  botonIniciar: {
    backgroundColor: '#48BB78',
  },
  botonPausar: {
    backgroundColor: '#F59E0B',
  },
  botonReanudar: {
    backgroundColor: '#48BB78',
  },
  botonReiniciar: {
    backgroundColor: '#3B82F6',
  },
  botonFinalizar: {
    backgroundColor: '#EF4444',
  },
  botonTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  botonVolver: {
    marginTop: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botonVolverTexto: {
    fontSize: 16,
    color: '#A0AEC0',
    fontWeight: '600',
  },
});
