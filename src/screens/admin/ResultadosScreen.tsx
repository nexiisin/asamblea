import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Propuesta } from '../../types/database.types';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Resultados'>;

interface Estadisticas {
  total_casas: number;
  total_asistentes: number;
  votos_si: number;
  votos_no: number;
  no_voto: number;
  no_asistio: number;
}

export default function ResultadosScreen({ navigation, route }: Props) {
  const { asambleaId, propuestaId } = route.params;
  
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [propuestaSeleccionada, setPropuestaSeleccionada] = useState<Propuesta | null>(null);
  const [estadisticas, setEstadisticas] = useState<Estadisticas | null>(null);
  const [loading, setLoading] = useState(true);

  const cargarPropuestas = async () => {
    const { data } = await supabase
      .from('propuestas')
      .select('*')
      .eq('asamblea_id', asambleaId)
      .order('orden', { ascending: true });

    if (data) {
      setPropuestas(data);
      
      // Seleccionar propuesta
      if (propuestaId) {
        const seleccionada = data.find(p => p.id === propuestaId);
        if (seleccionada) {
          setPropuestaSeleccionada(seleccionada);
          await cargarEstadisticas(seleccionada.id);
        }
      } else {
        // Seleccionar la primera por defecto
        if (data.length > 0) {
          setPropuestaSeleccionada(data[0]);
          await cargarEstadisticas(data[0].id);
        }
      }
    }
    
    setLoading(false);
  };

  const cargarEstadisticas = async (pId: string) => {
    // Obtener totales
    const { count: totalCasas } = await supabase
      .from('viviendas')
      .select('*', { count: 'exact', head: true });

    const { count: totalAsistentes } = await supabase
      .from('asistencias')
      .select('*', { count: 'exact', head: true })
      .eq('asamblea_id', asambleaId);

    // Obtener votos
    const { data: propuesta } = await supabase
      .from('propuestas')
      .select('*')
      .eq('id', pId)
      .single();

    if (propuesta) {
      const stats: Estadisticas = {
        total_casas: totalCasas || 0,
        total_asistentes: totalAsistentes || 0,
        votos_si: propuesta.votos_si || 0,
        votos_no: propuesta.votos_no || 0,
        no_voto: (totalAsistentes || 0) - (propuesta.total_votos || 0),
        no_asistio: (totalCasas || 0) - (totalAsistentes || 0),
      };
      setEstadisticas(stats);
    }
  };

  useEffect(() => {
    cargarPropuestas();

    // Suscripción a cambios en tiempo real
    const channelName = `resultados-${asambleaId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votos',
        },
        () => {
          if (propuestaSeleccionada) {
            cargarEstadisticas(propuestaSeleccionada.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'propuestas',
          filter: `asamblea_id=eq.${asambleaId}`,
        },
        () => cargarPropuestas()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [asambleaId]);

  const handleSeleccionarPropuesta = async (propuesta: Propuesta) => {
    setPropuestaSeleccionada(propuesta);
    await cargarEstadisticas(propuesta.id);
  };

  const handleCerrarPropuesta = async () => {
    if (!propuestaSeleccionada || propuestaSeleccionada.estado !== 'ABIERTA') return;

    const { error } = await supabase
      .from('propuestas')
      .update({ estado: 'CERRADA' })
      .eq('id', propuestaSeleccionada.id);

    if (!error) {
      cargarPropuestas();
    }
  };

  const handleAbrirPropuesta = async () => {
    if (!propuestaSeleccionada || propuestaSeleccionada.estado !== 'BORRADOR') return;

    // Verificar que no haya otra abierta
    const propuestaAbierta = propuestas.find(p => p.estado === 'ABIERTA');
    if (propuestaAbierta) {
      return;
    }

    const { error } = await supabase
      .from('propuestas')
      .update({ 
        estado: 'ABIERTA',
        fecha_apertura: new Date().toISOString(),
      })
      .eq('id', propuestaSeleccionada.id);

    if (!error) {
      cargarPropuestas();
    }
  };

  const handleMostrarResultados = async () => {
    if (!propuestaSeleccionada || propuestaSeleccionada.estado !== 'CERRADA') return;

    const { error } = await supabase
      .from('asambleas')
      .update({ estado_actual: 'RESULTADOS' })
      .eq('id', asambleaId);

    if (error) {
      console.error('Error al mostrar resultados:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (propuestas.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay propuestas creadas</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView style={styles.container}>
      {/* Selector de Propuestas */}
      <ScrollView horizontal style={styles.selectorContainer} showsHorizontalScrollIndicator={false}>
        {propuestas.map((propuesta) => (
          <TouchableOpacity
            key={propuesta.id}
            style={[
              styles.selectorItem,
              propuestaSeleccionada?.id === propuesta.id && styles.selectorItemActivo,
            ]}
            onPress={() => handleSeleccionarPropuesta(propuesta)}
          >
            <Text style={[
              styles.selectorTexto,
              propuestaSeleccionada?.id === propuesta.id && styles.selectorTextoActivo,
            ]}>
              {propuesta.titulo.length > 30 ? propuesta.titulo.substring(0, 30) + '...' : propuesta.titulo}
            </Text>
            <View style={[
              styles.estadoBadgeSmall,
              propuesta.estado === 'ABIERTA' && styles.estadoAbierta,
              propuesta.estado === 'CERRADA' && styles.estadoCerrada,
              propuesta.estado === 'BORRADOR' && styles.estadoBorrador,
            ]}>
              <Text style={styles.estadoTextoSmall}>{propuesta.estado}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {propuestaSeleccionada && estadisticas && (
        <View style={styles.content}>
          {/* Información de la propuesta */}
          <View style={styles.card}>
            <Text style={styles.propuestaTitulo}>{propuestaSeleccionada.titulo}</Text>
            {propuestaSeleccionada.descripcion && (
              <Text style={styles.propuestaDescripcion}>{propuestaSeleccionada.descripcion}</Text>
            )}
          </View>

          {/* Gráfico */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Distribución de Votos</Text>
            <BarChart
              data={{
                labels: ['SI', 'NO', 'No Votó', 'No Asistió'],
                datasets: [{
                  data: [
                    estadisticas.votos_si,
                    estadisticas.votos_no,
                    estadisticas.no_voto,
                    estadisticas.no_asistio,
                  ],
                }],
              }}
              width={screenWidth - 80}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForLabels: {
                  fontSize: 12,
                },
              }}
              style={styles.chart}
              showValuesOnTopOfBars
            />
          </View>

          {/* Estadísticas Detalladas */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Estadísticas Detalladas</Text>
            
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, styles.statSi]}>
                <Text style={styles.statValue}>{estadisticas.votos_si}</Text>
                <Text style={styles.statLabel}>SI</Text>
              </View>
              <View style={[styles.statBox, styles.statNo]}>
                <Text style={styles.statValue}>{estadisticas.votos_no}</Text>
                <Text style={styles.statLabel}>NO</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statBox, styles.statNeutral]}>
                <Text style={styles.statValue}>{estadisticas.no_voto}</Text>
                <Text style={styles.statLabel}>No Votó</Text>
              </View>
              <View style={[styles.statBox, styles.statNeutral]}>
                <Text style={styles.statValue}>{estadisticas.no_asistio}</Text>
                <Text style={styles.statLabel}>No Asistió</Text>
              </View>
            </View>

            <View style={styles.totalesContainer}>
              <Text style={styles.totalText}>Total Casas: {estadisticas.total_casas}</Text>
              <Text style={styles.totalText}>Total Asistentes: {estadisticas.total_asistentes}</Text>
              <Text style={styles.totalText}>Total Votos: {estadisticas.votos_si + estadisticas.votos_no}</Text>
            </View>
          </View>

          {/* Resultado */}
          {propuestaSeleccionada.estado === 'CERRADA' && (
            <View style={[
              styles.resultadoCard,
              propuestaSeleccionada.resultado_aprobada ? styles.resultadoAprobada : styles.resultadoRechazada,
            ]}>
              <Text style={styles.resultadoTitulo}>
                {propuestaSeleccionada.resultado_aprobada ? '✅ PROPUESTA APROBADA' : '❌ PROPUESTA RECHAZADA'}
              </Text>
              <Text style={styles.resultadoPorcentaje}>
                {propuestaSeleccionada.porcentaje_si?.toFixed(1)}% de votos SI
              </Text>
              <Text style={styles.resultadoRegla}>
                (Requiere ≥ 51% para aprobar)
              </Text>
            </View>
          )}

          {/* Botones de Acción */}
          <View style={styles.accionesContainer}>
            {propuestaSeleccionada.estado === 'BORRADOR' && (
              <TouchableOpacity
                style={[styles.boton, styles.botonAbrir]}
                onPress={handleAbrirPropuesta}
              >
                <Text style={styles.botonTexto}>🚀 Abrir Votación</Text>
              </TouchableOpacity>
            )}
            {propuestaSeleccionada.estado === 'ABIERTA' && (
              <TouchableOpacity
                style={[styles.boton, styles.botonCerrar]}
                onPress={handleCerrarPropuesta}
              >
                <Text style={styles.botonTexto}>🔒 Cerrar Votación</Text>
              </TouchableOpacity>
            )}
            {propuestaSeleccionada.estado === 'CERRADA' && (
              <TouchableOpacity
                style={[styles.boton, styles.botonMostrar]}
                onPress={handleMostrarResultados}
              >
                <Text style={styles.botonTexto}>📊 Mostrar Resultados a Invitados</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  selectorContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  selectorItem: {
    padding: 16,
    marginHorizontal: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    minWidth: 200,
  },
  selectorItemActivo: {
    borderBottomColor: '#2563eb',
  },
  selectorTexto: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  selectorTextoActivo: {
    color: '#1e40af',
    fontWeight: '600',
  },
  estadoBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  estadoAbierta: {
    backgroundColor: '#dcfce7',
  },
  estadoCerrada: {
    backgroundColor: '#fee2e2',
  },
  estadoBorrador: {
    backgroundColor: '#e0e7ff',
  },
  estadoTextoSmall: {
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  propuestaTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  propuestaDescripcion: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statSi: {
    backgroundColor: '#dcfce7',
  },
  statNo: {
    backgroundColor: '#fee2e2',
  },
  statNeutral: {
    backgroundColor: '#f1f5f9',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  totalesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  resultadoCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  resultadoAprobada: {
    backgroundColor: '#dcfce7',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  resultadoRechazada: {
    backgroundColor: '#fee2e2',
    borderWidth: 2,
    borderColor: '#ef4444',
  },
  resultadoTitulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  resultadoPorcentaje: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  resultadoRegla: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
  },
  accionesContainer: {
    gap: 12,
  },
  boton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  botonAbrir: {
    backgroundColor: '#10b981',
  },
  botonCerrar: {
    backgroundColor: '#ef4444',
  },
  botonMostrar: {
    backgroundColor: '#2563eb',
  },
  botonTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
