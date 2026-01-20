import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Asamblea } from '../../types/database.types';

type Props = NativeStackScreenProps<RootStackParamList, 'PanelAdmin'>;

export default function PanelAdminScreen({ navigation }: Props) {
  const [asambleas, setAsambleas] = useState<Asamblea[]>([]);
  const [loading, setLoading] = useState(false);
  const [duracionIngreso, setDuracionIngreso] = useState(60);

  const cargarAsambleas = async () => {
    const { data } = await supabase
      .from('asambleas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setAsambleas(data);
    }
  };

  useEffect(() => {
    cargarAsambleas();
  }, []);

  const generarCodigoAcceso = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) {
      codigo += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return codigo;
  };

  const handleIniciarAsamblea = async () => {
    setLoading(true);

    try {
      const codigo = generarCodigoAcceso();

      const ahora = new Date();
      const duracionIngresoMinutos = duracionIngreso;

      const horaCierreIngreso = new Date(
        ahora.getTime() + duracionIngresoMinutos * 60000
      );

      const { data: nuevaAsamblea, error } = await supabase
        .from('asambleas')
        .insert({
          codigo_acceso: codigo,
          estado: 'ABIERTA',
          regla_aprobacion: 0.51,
          fecha_inicio: ahora.toISOString(),
          hora_cierre_ingreso: horaCierreIngreso.toISOString(),
          total_viviendas: 100, // AJUSTA ESTO A TU CONJUNTO
        })
        .select()
        .single();

      if (error || !nuevaAsamblea) {
        Alert.alert('Error', 'No se pudo crear la asamblea');
        return;
      }

      Alert.alert(
        'Asamblea Creada',
        `Código de acceso: ${codigo}`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('ControlAsamblea', { asambleaId: nuevaAsamblea.id });
            },
          },
        ]
      );
      
      cargarAsambleas();
    } catch (error) {
      console.error('Error al crear asamblea:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la asamblea');
    } finally {
      setLoading(false);
    }
  };

  const renderAsamblea = ({ item }: { item: Asamblea }) => (
    <TouchableOpacity
      style={styles.asambleaCard}
      onPress={() => navigation.navigate('ControlAsamblea', { asambleaId: item.id })}
    >
      <View style={styles.asambleaHeader}>
        <Text style={styles.asambleaCodigo}>{item.codigo_acceso}</Text>
        <View style={[styles.badge, item.estado === 'ABIERTA' ? styles.badgeAbierta : styles.badgeCerrada]}>
          <Text style={styles.badgeText}>{item.estado}</Text>
        </View>
      </View>
      <Text style={styles.asambleaFecha}>
        {new Date(item.fecha_inicio).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </TouchableOpacity>
  );

  return (

    
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Panel Administrativo</Text>
        <Text style={styles.headerSubtitle}>Gestión de Asambleas</Text>
      </View>

      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
          Tiempo de asistencia (minutos)
        </Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[30, 60, 90].map(min => (
            <TouchableOpacity
              key={min}
              style={{
                padding: 10,
                borderRadius: 8,
                backgroundColor: duracionIngreso === min ? '#10b981' : '#e5e7eb',
              }}
              onPress={() => setDuracionIngreso(min)}
            >
              <Text style={{ color: duracionIngreso === min ? '#fff' : '#000' }}>
                {min}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
          onPress={handleIniciarAsamblea}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '⏳ Creando...' : '🟢 Iniciar Nueva Asamblea'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => navigation.navigate('Historial')}
        >
          <Text style={styles.buttonText}>📚 Historial General</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.recentTitle}>Asambleas Recientes</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#7c3aed',
    padding: 24,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e9d5ff',
  },
  buttonsContainer: {
    padding: 20,
    gap: 12,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonPrimary: {
    backgroundColor: '#10b981',
  },
  buttonSecondary: {
    backgroundColor: '#2563eb',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  recentSection: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16,
  },
  listContainer: {
    gap: 12,
  },
  asambleaCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  asambleaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  asambleaCodigo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    letterSpacing: 2,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeAbierta: {
    backgroundColor: '#dcfce7',
  },
  badgeCerrada: {
    backgroundColor: '#fee2e2',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  asambleaFecha: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  badgeIngreso: {
    backgroundColor: '#fef3c7',
  },
});
