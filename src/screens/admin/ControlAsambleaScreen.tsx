import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Asamblea, Propuesta } from '../../types/database.types';

type Props = NativeStackScreenProps<RootStackParamList, 'ControlAsamblea'>;

export default function ControlAsambleaScreen({ navigation, route }: Props) {
  const { asambleaId } = route.params;
  
  const [asamblea, setAsamblea] = useState<Asamblea | null>(null);
  const [propuestas, setPropuestas] = useState<Propuesta[]>([]);
  const [totalAsistentes, setTotalAsistentes] = useState(0);
  const [propuestaAbierta, setPropuestaAbierta] = useState<Propuesta | null>(null);

  const cargarDatos = async () => {
    // Cargar asamblea
    const { data: asambleaData } = await supabase
      .from('asambleas')
      .select('*')
      .eq('id', asambleaId)
      .single();

    if (asambleaData) {
      setAsamblea(asambleaData);
    }

    // Cargar propuestas
    const { data: propuestasData } = await supabase
      .from('propuestas')
      .select('*')
      .eq('asamblea_id', asambleaId)
      .order('orden', { ascending: true });

    if (propuestasData) {
      setPropuestas(propuestasData);
      const abierta = propuestasData.find(p => p.estado === 'ABIERTA');
      setPropuestaAbierta(abierta || null);
    }

    // Contar asistentes
    const { count } = await supabase
      .from('asistencias')
      .select('*', { count: 'exact', head: true })
      .eq('asamblea_id', asambleaId);

    setTotalAsistentes(count || 0);
  };

  useEffect(() => {
    cargarDatos();

    // Suscripción a cambios
    const channel = supabase
      .channel('control-asamblea')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asistencias',
          filter: `asamblea_id=eq.${asambleaId}`,
        },
        () => cargarDatos()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'propuestas',
          filter: `asamblea_id=eq.${asambleaId}`,
        },
        () => cargarDatos()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [asambleaId]);

  const handleRegenerarCodigo = async () => {
    Alert.alert(
      'Regenerar Código',
      '¿Está seguro de que desea generar un nuevo código de acceso? El código anterior dejará de funcionar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Regenerar',
          style: 'destructive',
          onPress: async () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let nuevoCodigo = '';
            for (let i = 0; i < 6; i++) {
              nuevoCodigo += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            const { error } = await supabase
              .from('asambleas')
              .update({ codigo_acceso: nuevoCodigo })
              .eq('id', asambleaId);

            if (!error) {
              Alert.alert('Código Regenerado', `Nuevo código: ${nuevoCodigo}`);
              cargarDatos();
            }
          },
        },
      ]
    );
  };

  const handleCerrarAsamblea = async () => {
    Alert.alert(
      'Cerrar Asamblea',
      '¿Está seguro de que desea cerrar la asamblea? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar',
          style: 'destructive',
          onPress: async () => {
            // Cerrar propuesta abierta si existe
            if (propuestaAbierta) {
              await supabase
                .from('propuestas')
                .update({ estado: 'CERRADA' })
                .eq('id', propuestaAbierta.id);
            }

            // Cerrar asamblea
            const { error } = await supabase
              .from('asambleas')
              .update({ 
                estado: 'CERRADA',
                fecha_fin: new Date().toISOString(),
              })
              .eq('id', asambleaId);

            if (!error) {
              Alert.alert('Asamblea Cerrada', 'La asamblea ha sido cerrada exitosamente', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            }
          },
        },
      ]
    );
  };

  if (!asamblea) {
    return <View style={styles.container}><Text>Cargando...</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header con código */}
      <View style={styles.codigoHeader}>
        <Text style={styles.codigoLabel}>Código de Acceso</Text>
        <Text style={styles.codigoTexto}>{asamblea.codigo_acceso}</Text>
        <TouchableOpacity onPress={handleRegenerarCodigo}>
          <Text style={styles.regenerarLink}>🔄 Regenerar</Text>
        </TouchableOpacity>
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalAsistentes}</Text>
          <Text style={styles.statLabel}>Asistentes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{propuestas.length}</Text>
          <Text style={styles.statLabel}>Propuestas</Text>
        </View>
      </View>

      {/* Propuesta Activa */}
      {propuestaAbierta && (
        <View style={styles.propuestaActiva}>
          <Text style={styles.propuestaActivaTitulo}>📍 Propuesta Activa</Text>
          <Text style={styles.propuestaTitulo}>{propuestaAbierta.titulo}</Text>
        </View>
      )}

      {/* Botones de Acción */}
      <View style={styles.accionesContainer}>
        <TouchableOpacity
          style={[styles.boton, styles.botonCrear]}
          onPress={() => navigation.navigate('CrearPropuesta', { asambleaId })}
          disabled={asamblea.estado !== 'ABIERTA'}
        >
          <Text style={styles.botonTexto}>🗳️ Crear Propuesta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boton, styles.botonCronometro]}
          onPress={() => navigation.navigate('CronometroDebate', { asambleaId })}
          disabled={asamblea.estado !== 'ABIERTA'}
        >
          <Text style={styles.botonTexto}>⏱️ Cronómetro de Debate</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boton, styles.botonResultados]}
          onPress={() => navigation.navigate('Resultados', { asambleaId })}
        >
          <Text style={styles.botonTexto}>📊 Ver Resultados</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.boton, styles.botonCerrar]}
          onPress={handleCerrarAsamblea}
          disabled={asamblea.estado !== 'ABIERTA'}
        >
          <Text style={styles.botonTexto}>🔴 Cerrar Asamblea</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Propuestas */}
      <View style={styles.propuestasSection}>
        <Text style={styles.sectionTitle}>Propuestas Creadas</Text>
        {propuestas.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No hay propuestas creadas</Text>
          </View>
        ) : (
          propuestas.map((propuesta) => (
            <View key={propuesta.id} style={styles.propuestaCard}>
              <View style={styles.propuestaHeader}>
                <Text style={styles.propuestaTitulo}>{propuesta.titulo}</Text>
                <View style={[
                  styles.estadoBadge,
                  propuesta.estado === 'ABIERTA' && styles.estadoAbierta,
                  propuesta.estado === 'CERRADA' && styles.estadoCerrada,
                  propuesta.estado === 'BORRADOR' && styles.estadoBorrador,
                ]}>
                  <Text style={styles.estadoTexto}>{propuesta.estado}</Text>
                </View>
              </View>
              {propuesta.estado === 'CERRADA' && (
                <Text style={styles.resultadoTexto}>
                  {propuesta.resultado_aprobada ? '✅ APROBADA' : '❌ RECHAZADA'}
                  {' '}({propuesta.porcentaje_si?.toFixed(1)}% SI)
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  codigoHeader: {
    backgroundColor: '#7c3aed',
    padding: 24,
    alignItems: 'center',
  },
  codigoLabel: {
    fontSize: 14,
    color: '#e9d5ff',
    marginBottom: 8,
  },
  codigoTexto: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 6,
    marginBottom: 12,
  },
  regenerarLink: {
    fontSize: 16,
    color: '#fff',
    textDecorationLine: 'underline',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  propuestaActiva: {
    backgroundColor: '#fef3c7',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  propuestaActivaTitulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 8,
  },
  accionesContainer: {
    padding: 20,
    gap: 12,
  },
  boton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  botonCrear: {
    backgroundColor: '#2563eb',
  },
  botonCronometro: {
    backgroundColor: '#F59E0B',
  },
  botonResultados: {
    backgroundColor: '#10b981',
  },
  botonCerrar: {
    backgroundColor: '#ef4444',
  },
  botonTexto: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  propuestasSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16,
  },
  propuestaCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  propuestaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  propuestaTitulo: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    fontWeight: '600',
  },
  resultadoTexto: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    color: '#334155',
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
});
