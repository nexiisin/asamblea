import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  FlatList, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Propuesta } from '../../types/database.types';

type Props = NativeStackScreenProps<RootStackParamList, 'ListadoPropuestas'>;

export default function ListadoPropuestasScreen({ navigation, route }: Props) {
  const { asambleaId } = route.params;
  
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [propuestaActiva, setPropuestaActiva] = useState<string | null>(null);

  const cargarPropuestas = async () => {
    setLoading(true);

    try {
      // Cargar propuestas
      const { data: propuestasData } = await supabase
        .from('propuestas')
        .select('*')
        .eq('asamblea_id', asambleaId)
        .order('orden', { ascending: true });

      if (propuestasData) {
        setPropuestas(propuestasData);
        const abierta = propuestasData.find(p => p.estado === 'ABIERTA');
        setPropuestaActiva(abierta?.id || null);
      }
    } catch (error) {
      console.error('Error al cargar propuestas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPropuestas();

    // Suscripción en tiempo real
    const channel = supabase
      .channel('listado-propuestas')
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

  const handleIniciarVotacion = async (propuestaId: string) => {
    Alert.alert(
      'Iniciar Votación',
      '¿Estás seguro de que deseas abrir esta propuesta para votación? Esto cerrará cualquier votación activa.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Iniciar',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('iniciar_votacion', {
                p_asamblea_id: asambleaId,
                p_propuesta_id: propuestaId,
              });

              if (error) {
                console.error('Error al iniciar votación:', error);
                Alert.alert('Error', 'No se pudo iniciar la votación');
              } else {
                Alert.alert('Éxito', 'Votación iniciada. Los invitados fueron notificados.');
                cargarPropuestas();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleCerrarVotacion = async () => {
    Alert.alert(
      'Cerrar Votación',
      '¿Estás seguro de que deseas cerrar la votación actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('cerrar_votacion', {
                p_asamblea_id: asambleaId,
              });

              if (error) {
                console.error('Error al cerrar votación:', error);
                Alert.alert('Error', 'No se pudo cerrar la votación');
              } else {
                Alert.alert('Votación Cerrada', 'Los resultados están disponibles');
                cargarPropuestas();
              }
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const renderPropuesta = ({ item }: { item: Propuesta }) => {
    const esActiva = item.id === propuestaActiva;

    return (
      <View style={styles.propuestaCard}>
        <View style={styles.propuestaHeader}>
          <View style={styles.propuestaTituloContainer}>
            <Text style={styles.propuestaTitulo}>{item.titulo}</Text>
            {item.orden && (
              <Text style={styles.propuestaOrden}>#{item.orden}</Text>
            )}
          </View>
          <View style={[
            styles.estadoBadge,
            item.estado === 'ABIERTA' && styles.estadoAbierta,
            item.estado === 'CERRADA' && styles.estadoCerrada,
            item.estado === 'BORRADOR' && styles.estadoBorrador,
          ]}>
            <Text style={styles.estadoTexto}>{item.estado}</Text>
          </View>
        </View>

        <Text style={styles.propuestaDescripcion} numberOfLines={2}>
          {item.descripcion}
        </Text>

        {/* Resultados si está cerrada */}
        {item.estado === 'CERRADA' && (
          <View style={styles.resultadosContainer}>
            <View style={styles.resultadoRow}>
              <Text style={styles.resultadoLabel}>✓ SI:</Text>
              <Text style={styles.resultadoValor}>
                {item.votos_si} ({item.porcentaje_si?.toFixed(1)}%)
              </Text>
            </View>
            <View style={styles.resultadoRow}>
              <Text style={styles.resultadoLabel}>✗ NO:</Text>
              <Text style={styles.resultadoValor}>
                {item.votos_no} ({item.porcentaje_no?.toFixed(1)}%)
              </Text>
            </View>
            <Text style={[
              styles.resultadoFinal,
              item.resultado_aprobada ? styles.aprobada : styles.rechazada
            ]}>
              {item.resultado_aprobada ? '✅ APROBADA' : '❌ RECHAZADA'}
            </Text>
          </View>
        )}

        {/* Estadísticas en tiempo real si está abierta */}
        {item.estado === 'ABIERTA' && (
          <View style={styles.estadisticasContainer}>
            <Text style={styles.estadisticasTitulo}>📊 En tiempo real:</Text>
            <View style={styles.resultadoRow}>
              <Text style={styles.resultadoLabel}>✓ SI:</Text>
              <Text style={styles.resultadoValor}>
                {item.votos_si} ({item.porcentaje_si?.toFixed(1)}%)
              </Text>
            </View>
            <View style={styles.resultadoRow}>
              <Text style={styles.resultadoLabel}>✗ NO:</Text>
              <Text style={styles.resultadoValor}>
                {item.votos_no} ({item.porcentaje_no?.toFixed(1)}%)
              </Text>
            </View>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.botonesContainer}>
          {item.estado === 'BORRADOR' && (
            <TouchableOpacity
              style={[styles.boton, styles.botonIniciar]}
              onPress={() => handleIniciarVotacion(item.id)}
            >
              <Text style={styles.botonTexto}>🗳️ Iniciar Votación</Text>
            </TouchableOpacity>
          )}

          {esActiva && (
            <TouchableOpacity
              style={[styles.boton, styles.botonCerrar]}
              onPress={handleCerrarVotacion}
            >
              <Text style={styles.botonTexto}>📊 Cerrar Votación</Text>
            </TouchableOpacity>
          )}
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitulo}>📋 Listado de Propuestas</Text>
        <Text style={styles.headerSubtitulo}>
          Total: {propuestas.length} propuestas
        </Text>
      </View>

      {propuestas.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No hay propuestas creadas</Text>
          <TouchableOpacity
            style={styles.botonCrear}
            onPress={() => navigation.navigate('CrearPropuesta', { asambleaId })}
          >
            <Text style={styles.botonCrearTexto}>➕ Crear Primera Propuesta</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={propuestas}
          keyExtractor={(item) => item.id}
          renderItem={renderPropuesta}
          contentContainerStyle={styles.lista}
        />
      )}
    </View>
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
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingBottom: 24,
  },
  headerTitulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitulo: {
    fontSize: 14,
    color: '#dbeafe',
  },
  lista: {
    padding: 16,
  },
  propuestaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  propuestaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  propuestaTituloContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  propuestaTitulo: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  propuestaOrden: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
  estadoTexto: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  propuestaDescripcion: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  resultadosContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  estadisticasContainer: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  estadisticasTitulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  resultadoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultadoLabel: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  resultadoValor: {
    fontSize: 14,
    color: '#64748b',
  },
  resultadoFinal: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
  aprobada: {
    color: '#10b981',
  },
  rechazada: {
    color: '#ef4444',
  },
  botonesContainer: {
    gap: 8,
  },
  boton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonIniciar: {
    backgroundColor: '#2563eb',
  },
  botonCerrar: {
    backgroundColor: '#8b5cf6',
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  botonCrear: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  botonCrearTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
