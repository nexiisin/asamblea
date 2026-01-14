import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Asamblea, Propuesta } from '../../types/database.types';
import CronometroModal from '../../components/CronometroModal';

type Props = NativeStackScreenProps<RootStackParamList, 'SalaEspera'>;

export default function SalaEsperaScreen({ navigation, route }: Props) {
  const { asambleaId, asistenciaId, numeroCasa } = route.params;
  const [viviendaId, setViviendaId] = useState<string>('');
  const [estadoActual, setEstadoActual] = useState<string>('ESPERA');
  const [propuestaResultados, setPropuestaResultados] = useState<Propuesta | null>(null);
  const [totalAsistentes, setTotalAsistentes] = useState<number>(0);
  const [totalCasas, setTotalCasas] = useState<number>(0);
  const [noVoto, setNoVoto] = useState<number>(0);
  const [noAsistio, setNoAsistio] = useState<number>(0);
  const [refrescando, setRefrescando] = useState(false);
  const [asambleaCerradaHandled, setAsambleaCerradaHandled] = useState(false);

  // Obtener vivienda_id
  useEffect(() => {
    const fetchViviendaId = async () => {
      const { data } = await supabase
        .from('asistencias')
        .select('vivienda_id')
        .eq('id', asistenciaId)
        .single();

      if (data) {
        setViviendaId(data.vivienda_id);
      }
    };

    fetchViviendaId();
  }, [asistenciaId]);

  // Cargar última propuesta cerrada para mostrar resultados
  const cargarUltimaPropuestaCerrada = async () => {
    try {
      const { data: propuesta, error } = await supabase
        .from('propuestas')
        .select('*')
        .eq('asamblea_id', asambleaId)
        .eq('estado', 'CERRADA')
        .order('fecha_cierre', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (propuesta) {
        setPropuestaResultados(propuesta);
        
        // Obtener total de casas
        const { count: countCasas } = await supabase
          .from('viviendas')
          .select('*', { count: 'exact', head: true });
        
        // Obtener total de asistentes
        const { count: countAsistentes } = await supabase
          .from('asistencias')
          .select('*', { count: 'exact', head: true })
          .eq('asamblea_id', asambleaId);
        
        const totalCasasValue = countCasas || 0;
        const totalAsistentesValue = countAsistentes || 0;
        const totalVotos = (propuesta.votos_si || 0) + (propuesta.votos_no || 0);
        
        setTotalCasas(totalCasasValue);
        setTotalAsistentes(totalAsistentesValue);
        setNoVoto(totalAsistentesValue - totalVotos);
        setNoAsistio(totalCasasValue - totalAsistentesValue);
      }
    } catch (error: any) {
      console.error('[SALA ESPERA] Error al cargar resultados:', error.message);
    }
  };

  // 🔄 RECARGAR ESTADO MANUALMENTE
  const recargarEstado = async () => {
    setRefrescando(true);
    try {
      const { data, error } = await supabase
        .from('asambleas')
        .select('estado_actual, propuesta_activa_id, cronometro_activo')
        .eq('id', asambleaId)
        .single();

      if (error) throw error;

      if (data) {
        console.log('🔄 [SALA ESPERA] Estado recargado:', data);
        setEstadoActual(data.estado_actual);
        
        if (data.estado_actual === 'VOTACION' && data.propuesta_activa_id) {
          navigation.replace('Votacion', {
            asambleaId,
            asistenciaId,
            viviendaId,
            numeroCasa,
          });
        } else if (data.estado_actual === 'RESULTADOS') {
          await cargarUltimaPropuestaCerrada();
        }
      }
    } catch (error: any) {
      console.error('[SALA ESPERA] Error al recargar:', error.message);
    } finally {
      setRefrescando(false);
    }
  };

  // 🚀 SUSCRIPCIÓN CENTRALIZADA AL ESTADO DE LA ASAMBLEA
  useEffect(() => {
    if (!viviendaId) return;

    const channelName = `sala-espera-${asambleaId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asambleas',
          filter: `id=eq.${asambleaId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const asam = payload.new as Asamblea;
            console.log('🔔 [SALA ESPERA] Estado actualizado:', asam.estado_actual, 'estado:', asam.estado);
            console.log('[SALA ESPERA] Cronómetro activo:', asam.cronometro_activo);
            setEstadoActual(asam.estado_actual);

            // 🎯 NAVEGACIÓN AUTOMÁTICA SEGÚN ESTADO
            switch(asam.estado_actual) {
              case 'DEBATE':
                break;
              case 'VOTACION':
                navigation.replace('Votacion', {
                  asambleaId,
                  asistenciaId,
                  viviendaId,
                  numeroCasa,
                });
                break;
              case 'RESULTADOS':
                cargarUltimaPropuestaCerrada();
                break;
              case 'ESPERA':
                setPropuestaResultados(null);
                break;
            }

            // Si la asamblea fue cerrada por el admin, expulsar al invitado y volver al inicio
            if (asam.estado === 'CERRADA' && !asambleaCerradaHandled) {
              setAsambleaCerradaHandled(true);
              console.log('[SALA ESPERA] Asamblea cerrada por admin — expulsando usuario');
              Alert.alert('Asamblea finalizada', 'La asamblea ha terminado. Volviendo al inicio.', [
                { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }) }
              ], { cancelable: false });
            }
          }
        }
      )
      .subscribe();

    // Verificar estado inicial
    const checkEstadoInicial = async () => {
      const { data, error } = await supabase
        .from('asambleas')
        .select('estado_actual, propuesta_activa_id, cronometro_activo')
        .eq('id', asambleaId)
        .single();

      if (error) {
        console.error('❌ Error al verificar estado inicial:', error);
        return;
      }

      if (data) {
        console.log('📊 [SALA ESPERA] Estado inicial:', {
          estado_actual: data.estado_actual,
          cronometro_activo: data.cronometro_activo,
          propuesta_activa_id: data.propuesta_activa_id
        });
        setEstadoActual(data.estado_actual);
        
        // Si ya está en VOTACION, navegar inmediatamente
        if (data.estado_actual === 'VOTACION' && data.propuesta_activa_id) {
          navigation.replace('Votacion', {
            asambleaId,
            asistenciaId,
            viviendaId,
            numeroCasa,
          });
        } else if (data.estado_actual === 'RESULTADOS') {
          cargarUltimaPropuestaCerrada();
        }
        
        // Si la asamblea ya está marcada como cerrada, regresar al inicio inmediatamente
        const { data: asamFull } = await supabase
          .from('asambleas')
          .select('estado')
          .eq('id', asambleaId)
          .single();

        if (asamFull?.estado === 'CERRADA' && !asambleaCerradaHandled) {
          setAsambleaCerradaHandled(true);
          Alert.alert('Asamblea finalizada', 'La asamblea ha terminado. Volviendo al inicio.', [
            { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] }) }
          ], { cancelable: false });
        }
      }
    };

    checkEstadoInicial();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [asambleaId, asistenciaId, viviendaId, numeroCasa, navigation]);

  // Mensaje dinámico según estado
  const getMensaje = () => {
    switch(estadoActual) {
      case 'DEBATE':
        return {
          titulo: 'Debate en curso',
          subtitulo: 'El administrador está conduciendo el debate. Por favor espere.',
          emoji: '💬'
        };
      case 'VOTACION':
        return {
          titulo: 'Votación iniciada',
          subtitulo: 'Redirigiendo a la pantalla de votación...',
          emoji: '🗳️'
        };
      case 'RESULTADOS':
        return {
          titulo: 'Votación finalizada',
          subtitulo: 'El administrador está revisando los resultados.',
          emoji: '📊'
        };
      default:
        return {
          titulo: 'La asamblea está pronta a comenzar',
          subtitulo: 'Por favor espere a que el administrador inicie la votación',
          emoji: '⏳'
        };
    }
  };

  const mensaje = getMensaje();

  return (
    <View style={styles.container}>
      <CronometroModal asambleaId={asambleaId} key={`cronometro-${refrescando}`} />
      
      {estadoActual === 'RESULTADOS' && propuestaResultados ? (
        // MOSTRAR RESULTADOS DIRECTAMENTE
        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refrescando} onRefresh={recargarEstado} />
          }
        >
          <View style={styles.card}>
            <Text style={styles.casa}>🏠 Casa: {numeroCasa}</Text>
            
            <View style={styles.resultadosHeader}>
              <Text style={styles.resultadosTitulo}>📊 Resultados de Votación</Text>
              <Text style={styles.propuestaTitulo}>{propuestaResultados.titulo}</Text>
              {propuestaResultados.descripcion && (
                <Text style={styles.propuestaDescripcion}>{propuestaResultados.descripcion}</Text>
              )}
            </View>

            {/* Estado de aprobación */}
            <View style={[
              styles.estadoContainer,
              { backgroundColor: propuestaResultados.resultado_aprobada ? '#dcfce7' : '#fee2e2' }
            ]}>
              <Text style={[
                styles.estadoTexto,
                { color: propuestaResultados.resultado_aprobada ? '#166534' : '#991b1b' }
              ]}>
                {propuestaResultados.resultado_aprobada ? '✅ APROBADA' : '❌ RECHAZADA'}
              </Text>
            </View>

            {/* Resultados con barras de progreso */}
            <View style={styles.votosContainer}>
              {/* Votos SI */}
              <View style={styles.votoItem}>
                <View style={styles.votoHeader}>
                  <Text style={styles.votoLabel}>✅ SI</Text>
                  <Text style={styles.votoNumero}>{propuestaResultados.votos_si} votos</Text>
                </View>
                <View style={styles.barraContainer}>
                  <View 
                    style={[
                      styles.barraProgreso,
                      { width: `${propuestaResultados.porcentaje_si || 0}%`, backgroundColor: '#10b981' }
                    ]}
                  />
                </View>
                <Text style={styles.porcentaje}>{propuestaResultados.porcentaje_si?.toFixed(1) || 0}%</Text>
              </View>

              {/* Votos NO */}
              <View style={styles.votoItem}>
                <View style={styles.votoHeader}>
                  <Text style={styles.votoLabel}>❌ NO</Text>
                  <Text style={styles.votoNumero}>{propuestaResultados.votos_no} votos</Text>
                </View>
                <View style={styles.barraContainer}>
                  <View 
                    style={[
                      styles.barraProgreso,
                      { width: `${propuestaResultados.porcentaje_no || 0}%`, backgroundColor: '#ef4444' }
                    ]}
                  />
                </View>
                <Text style={styles.porcentaje}>{propuestaResultados.porcentaje_no?.toFixed(1) || 0}%</Text>
              </View>

              {/* No Votó */}
              <View style={styles.votoItem}>
                <View style={styles.votoHeader}>
                  <Text style={styles.votoLabel}>⚪ No Votó</Text>
                  <Text style={styles.votoNumero}>{noVoto} casas</Text>
                </View>
                <View style={styles.barraContainer}>
                  <View 
                    style={[
                      styles.barraProgreso,
                      { 
                        width: `${totalAsistentes > 0 ? (noVoto / totalAsistentes * 100) : 0}%`, 
                        backgroundColor: '#94a3b8' 
                      }
                    ]}
                  />
                </View>
                <Text style={styles.porcentaje}>
                  {totalAsistentes > 0 ? ((noVoto / totalAsistentes) * 100).toFixed(1) : 0}%
                </Text>
              </View>

              {/* No Asistió */}
              <View style={styles.votoItem}>
                <View style={styles.votoHeader}>
                  <Text style={styles.votoLabel}>⚫ No Asistió</Text>
                  <Text style={styles.votoNumero}>{noAsistio} casas</Text>
                </View>
                <View style={styles.barraContainer}>
                  <View 
                    style={[
                      styles.barraProgreso,
                      { 
                        width: `${totalCasas > 0 ? (noAsistio / totalCasas * 100) : 0}%`, 
                        backgroundColor: '#64748b' 
                      }
                    ]}
                  />
                </View>
                <Text style={styles.porcentaje}>
                  {totalCasas > 0 ? ((noAsistio / totalCasas) * 100).toFixed(1) : 0}%
                </Text>
              </View>
            </View>

            {/* Estadísticas */}
            <View style={styles.estadisticasContainer}>
              <View style={styles.estadisticaItem}>
                <Text style={styles.estadisticaNumero}>{propuestaResultados.total_votos}</Text>
                <Text style={styles.estadisticaLabel}>Votos Totales</Text>
              </View>
              <View style={styles.estadisticaItem}>
                <Text style={styles.estadisticaNumero}>{totalAsistentes}</Text>
                <Text style={styles.estadisticaLabel}>Asistentes</Text>
              </View>
              <View style={styles.estadisticaItem}>
                <Text style={styles.estadisticaNumero}>{totalCasas}</Text>
                <Text style={styles.estadisticaLabel}>Total Casas</Text>
              </View>
            </View>

            <View style={[styles.infoBox, { backgroundColor: '#f0fdf4', borderLeftColor: '#16a34a' }]}>
              <Text style={[styles.infoText, { color: '#166534' }]}>
                ✅ Resultados actualizados en tiempo real
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        // SALA DE ESPERA NORMAL
        <View style={styles.card}>
          <Text style={styles.casa}>🏠 Casa: {numeroCasa}</Text>
          
          <View style={styles.loadingContainer}>
            <Text style={styles.emoji}>{mensaje.emoji}</Text>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.title}>{mensaje.titulo}</Text>
            <Text style={styles.subtitle}>
              {mensaje.subtitulo}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  casa: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginBottom: 30,
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  // Estilos para resultados
  resultadosHeader: {
    marginBottom: 24,
    alignItems: 'center',
  },
  resultadosTitulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16,
  },
  propuestaTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 8,
  },
  propuestaDescripcion: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  estadoContainer: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  estadoTexto: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  votosContainer: {
    marginBottom: 24,
    gap: 20,
  },
  votoItem: {
    marginBottom: 8,
  },
  votoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  votoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  votoNumero: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  barraContainer: {
    height: 24,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barraProgreso: {
    height: '100%',
    borderRadius: 12,
  },
  porcentaje: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
    fontWeight: '600',
  },
  estadisticasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  estadisticaItem: {
    alignItems: 'center',
  },
  estadisticaNumero: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  estadisticaLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
});
