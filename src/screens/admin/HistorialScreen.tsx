import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Asamblea } from '../../types/database.types';

type Props = NativeStackScreenProps<RootStackParamList, 'Historial'>;

interface AsambleaConEstadisticas extends Asamblea {
  total_propuestas: number;
  total_asistentes: number;
  propuestas_aprobadas: number;
}

export default function HistorialScreen({ navigation }: Props) {
  const [asambleas, setAsambleas] = useState<AsambleaConEstadisticas[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarHistorial = async () => {
    setLoading(true);

    try {
      const { data: asambleasData } = await supabase
        .from('asambleas')
        .select('*')
        .order('fecha_inicio', { ascending: false });

      if (asambleasData) {
        // Cargar estadísticas para cada asamblea
        const asambleasConEstadisticas = await Promise.all(
          asambleasData.map(async (asamblea) => {
            // Contar propuestas
            const { count: totalPropuestas } = await supabase
              .from('propuestas')
              .select('*', { count: 'exact', head: true })
              .eq('asamblea_id', asamblea.id);

            // Contar propuestas aprobadas
            const { count: propuestasAprobadas } = await supabase
              .from('propuestas')
              .select('*', { count: 'exact', head: true })
              .eq('asamblea_id', asamblea.id)
              .eq('resultado_aprobada', true);

            // Contar asistentes
            const { count: totalAsistentes } = await supabase
              .from('asistencias')
              .select('*', { count: 'exact', head: true })
              .eq('asamblea_id', asamblea.id);

            return {
              ...asamblea,
              total_propuestas: totalPropuestas || 0,
              total_asistentes: totalAsistentes || 0,
              propuestas_aprobadas: propuestasAprobadas || 0,
            };
          })
        );

        setAsambleas(asambleasConEstadisticas);
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const renderAsamblea = ({ item }: { item: AsambleaConEstadisticas }) => (
    <TouchableOpacity
      style={styles.asambleaCard}
      onPress={() => navigation.navigate('ControlAsamblea', { asambleaId: item.id })}
    >
      <View style={styles.asambleaHeader}>
        <View>
          <Text style={styles.codigo}>{item.codigo_acceso}</Text>
          <Text style={styles.fecha}>
            {new Date(item.fecha_inicio).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <View style={[
          styles.estadoBadge,
          item.estado === 'ABIERTA' ? styles.estadoAbierta : styles.estadoCerrada,
        ]}>
          <Text style={styles.estadoTexto}>{item.estado}</Text>
        </View>
      </View>

      <View style={styles.estadisticas}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.total_asistentes}</Text>
          <Text style={styles.statLabel}>Asistentes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.total_propuestas}</Text>
          <Text style={styles.statLabel}>Propuestas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.propuestas_aprobadas}</Text>
          <Text style={styles.statLabel}>Aprobadas</Text>
        </View>
      </View>

      {item.fecha_fin && (
        <Text style={styles.duracion}>
          Duración:{' '}
          {Math.round(
            (new Date(item.fecha_fin).getTime() - new Date(item.fecha_inicio).getTime()) / 
            (1000 * 60)
          )}{' '}
          minutos
        </Text>
      )}
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>Historial de Asambleas</Text>
        <Text style={styles.headerSubtitle}>Total: {asambleas.length}</Text>
      </View>

      {asambleas.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay asambleas registradas</Text>
        </View>
      ) : (
        <FlatList
          data={asambleas}
          renderItem={renderAsamblea}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
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
    backgroundColor: '#7c3aed',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e9d5ff',
  },
  listContainer: {
    padding: 20,
    gap: 16,
  },
  asambleaCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  asambleaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  codigo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    letterSpacing: 3,
    marginBottom: 4,
  },
  fecha: {
    fontSize: 14,
    color: '#64748b',
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  estadoAbierta: {
    backgroundColor: '#dcfce7',
  },
  estadoCerrada: {
    backgroundColor: '#fee2e2',
  },
  estadoTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  estadisticas: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  duracion: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 12,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});
