import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../../services/supabase';
import { Asamblea } from '../../types/database.types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'CronometroDebate'>;

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.35, 140);
const STROKE_WIDTH = 4;

export default function CronometroDebateScreen({ route, navigation }: Props) {
  const { asambleaId } = route.params;

  const [asamblea, setAsamblea] = useState<Asamblea | null>(null);
  const [minutos, setMinutos] = useState(5);
  const [segundos, setSegundos] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cargar asamblea
  const cargarAsamblea = async () => {
    try {
      const { data, error } = await supabase
        .from('asambleas')
        .select('*')
        .eq('id', asambleaId)
        .single();

      if (error) throw error;
      
      if (data) {
        setAsamblea(data);
        calcularTiempoRestante(data);
      }
    } catch (error: any) {
      console.error('Error al cargar asamblea:', error.message);
    } finally {
      setLoading(false);
    }
  };

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
      setTiempoRestante(asam.cronometro_duracion_segundos);
    }
  };

  // 🚀 SUSCRIPCIÓN EN TIEMPO REAL
  useEffect(() => {
    cargarAsamblea();

    console.log('📡 [CRONOMETRO] Suscribiéndose a cambios de asamblea...');

    const subscription = supabase
      .channel('cronometro-asamblea')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'asambleas',
          filter: `id=eq.${asambleaId}`,
        },
        (payload) => {
          console.log('🔔 [CRONOMETRO] Cambio detectado:', payload);
          const nuevaAsamblea = payload.new as Asamblea;
          setAsamblea(nuevaAsamblea);
          calcularTiempoRestante(nuevaAsamblea);
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 [CRONOMETRO] Desuscribiendo...');
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

  // 🟢 INICIAR CRONÓMETRO
  const iniciarCronometro = async () => {
    try {
      const duracionTotal = minutos * 60 + segundos;
      
      if (duracionTotal <= 0) {
        Alert.alert('Error', 'Ingresa un tiempo válido');
        return;
      }

      console.log('🚀 Iniciando cronómetro:', duracionTotal, 'segundos');

      const { error } = await supabase.rpc('iniciar_cronometro_debate', {
        p_asamblea_id: asambleaId,
        p_duracion_segundos: duracionTotal,
      });

      if (error) throw error;

      Alert.alert('Éxito', 'Cronómetro iniciado');
    } catch (error: any) {
      console.error('Error al iniciar cronómetro:', error);
      Alert.alert('Error', error.message);
    }
  };

  // ⏸️ PAUSAR CRONÓMETRO
  const pausarCronometro = async () => {
    if (!asamblea) return;

    try {
      console.log('⏸️ Pausando cronómetro...');

      const { error } = await supabase.rpc('pausar_cronometro', {
        p_asamblea_id: asambleaId,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error al pausar cronómetro:', error);
      Alert.alert('Error', error.message);
    }
  };

  // ▶️ REANUDAR CRONÓMETRO
  const reanudarCronometro = async () => {
    if (!asamblea) return;

    try {
      console.log('▶️ Reanudando cronómetro...');

      const { error } = await supabase.rpc('reanudar_cronometro', {
        p_asamblea_id: asambleaId,
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error al reanudar cronómetro:', error);
      Alert.alert('Error', error.message);
    }
  };

  // ⏹️ DETENER CRONÓMETRO
  const detenerCronometro = async () => {
    if (!asamblea) return;

    Alert.alert(
      'Detener Cronómetro',
      '¿Estás seguro de que deseas detener el cronómetro y regresar a espera?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Detener',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('⏹️ Deteniendo cronómetro...');

              const { error } = await supabase.rpc('detener_cronometro', {
                p_asamblea_id: asambleaId,
              });

              if (error) throw error;

              Alert.alert('Cronómetro Detenido', 'El estado regresó a ESPERA');
              navigation.goBack();
            } catch (error: any) {
              console.error('Error al detener cronómetro:', error);
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!asamblea) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No se pudo cargar la asamblea</Text>
      </View>
    );
  }

  const { mins: minutosRestantes, secs: segundosRestantes } = formatearTiempo(tiempoRestante);
  const estaActivo = asamblea.cronometro_activo && !asamblea.cronometro_pausado;
  const estaPausado = asamblea.cronometro_pausado;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Estado actual */}
      <View style={styles.estadoContainer}>
        <Text style={styles.estadoLabel}>Estado:</Text>
        <Text style={[
          styles.estadoValor,
          estaActivo && styles.estadoActivo,
          estaPausado && styles.estadoPausado,
        ]}>
          {estaActivo ? '▶️ ACTIVO' : estaPausado ? '⏸️ PAUSADO' : '⏹️ DETENIDO'}
        </Text>
      </View>

      {/* Círculos de progreso */}
      <View style={styles.cronometroContainer}>
        <CirculoProgreso
          valor={minutosRestantes}
          maximo={Math.floor(asamblea.cronometro_duracion_segundos / 60)}
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

      {/* Configuración (solo si no está activo) */}
      {!asamblea.cronometro_activo && (
        <View style={styles.configuracionContainer}>
          <Text style={styles.configuracionTitulo}>Configurar Duración</Text>
          
          <View style={styles.tiempoControles}>
            <View style={styles.tiempoGrupo}>
              <Text style={styles.tiempoLabel}>Minutos</Text>
              <View style={styles.tiempoBotones}>
                <TouchableOpacity
                  style={styles.botonIncremento}
                  onPress={() => setMinutos(Math.max(0, minutos - 1))}
                >
                  <Text style={styles.botonIncrementoTexto}>-</Text>
                </TouchableOpacity>
                <Text style={styles.tiempoValor}>{minutos}</Text>
                <TouchableOpacity
                  style={styles.botonIncremento}
                  onPress={() => setMinutos(minutos + 1)}
                >
                  <Text style={styles.botonIncrementoTexto}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tiempoGrupo}>
              <Text style={styles.tiempoLabel}>Segundos</Text>
              <View style={styles.tiempoBotones}>
                <TouchableOpacity
                  style={styles.botonIncremento}
                  onPress={() => setSegundos(Math.max(0, segundos - 15))}
                >
                  <Text style={styles.botonIncrementoTexto}>-15</Text>
                </TouchableOpacity>
                <Text style={styles.tiempoValor}>{segundos}</Text>
                <TouchableOpacity
                  style={styles.botonIncremento}
                  onPress={() => setSegundos(Math.min(59, segundos + 15))}
                >
                  <Text style={styles.botonIncrementoTexto}>+15</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Botones de control */}
      <View style={styles.botonesContainer}>
        {!asamblea.cronometro_activo && (
          <TouchableOpacity
            style={[styles.botonControl, styles.botonIniciar]}
            onPress={iniciarCronometro}
          >
            <Text style={styles.botonControlTexto}>▶️ INICIAR</Text>
          </TouchableOpacity>
        )}

        {estaActivo && (
          <TouchableOpacity
            style={[styles.botonControl, styles.botonPausar]}
            onPress={pausarCronometro}
          >
            <Text style={styles.botonControlTexto}>⏸️ PAUSAR</Text>
          </TouchableOpacity>
        )}

        {estaPausado && (
          <TouchableOpacity
            style={[styles.botonControl, styles.botonReanudar]}
            onPress={reanudarCronometro}
          >
            <Text style={styles.botonControlTexto}>▶️ REANUDAR</Text>
          </TouchableOpacity>
        )}

        {asamblea.cronometro_activo && (
          <TouchableOpacity
            style={[styles.botonControl, styles.botonDetener]}
            onPress={detenerCronometro}
          >
            <Text style={styles.botonControlTexto}>⏹️ DETENER</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Información */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTexto}>
          ℹ️ Los invitados ven el cronómetro en tiempo real
        </Text>
        <Text style={styles.infoTexto}>
          📡 Sincronización automática por Supabase
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  estadoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  estadoLabel: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  estadoValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
  },
  estadoActivo: {
    color: '#10b981',
  },
  estadoPausado: {
    color: '#f59e0b',
  },
  cronometroContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 30,
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
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  configuracionContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  configuracionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16,
    textAlign: 'center',
  },
  tiempoControles: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
  },
  tiempoGrupo: {
    flex: 1,
    alignItems: 'center',
  },
  tiempoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  tiempoBotones: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  botonIncremento: {
    backgroundColor: '#2563eb',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonIncrementoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tiempoValor: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    width: 60,
    textAlign: 'center',
  },
  botonesContainer: {
    gap: 12,
  },
  botonControl: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  botonIniciar: {
    backgroundColor: '#10b981',
  },
  botonPausar: {
    backgroundColor: '#f59e0b',
  },
  botonReanudar: {
    backgroundColor: '#10b981',
  },
  botonDetener: {
    backgroundColor: '#ef4444',
  },
  botonControlTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 20,
    gap: 8,
  },
  infoTexto: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});
