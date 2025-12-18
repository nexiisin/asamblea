import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Propuesta, TipoVoto } from '../../types/database.types';
import CronometroModal from '../../components/CronometroModal';

type Props = NativeStackScreenProps<RootStackParamList, 'Votacion'>;

export default function VotacionScreen({ navigation, route }: Props) {
  const { asambleaId, asistenciaId, viviendaId, numeroCasa } = route.params;
  
  const [propuestaActual, setPropuestaActual] = useState<Propuesta | null>(null);
  const [yaVoto, setYaVoto] = useState(false);
  const [votoActual, setVotoActual] = useState<TipoVoto | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 📊 Estados para resultados en tiempo real
  const [resultados, setResultados] = useState({
    votos_si: 0,
    votos_no: 0,
    total_votos: 0,
    porcentaje_si: 0,
    porcentaje_no: 0,
  });

  const cargarPropuestaActual = async () => {
    try {
      console.log('🔍 Cargando propuesta actual para votación...');
      
      // Buscar propuesta ABIERTA
      const { data: propuesta, error } = await supabase
        .from('propuestas')
        .select('*')
        .eq('asamblea_id', asambleaId)
        .eq('estado', 'ABIERTA')
        .maybeSingle();

      if (error) {
        console.error('❌ Error al cargar propuesta:', error);
      }

      if (propuesta) {
        console.log('✅ Propuesta activa encontrada:', propuesta.titulo);
        setPropuestaActual(propuesta);
        
        // 📊 Cargar resultados iniciales
        setResultados({
          votos_si: propuesta.votos_si || 0,
          votos_no: propuesta.votos_no || 0,
          total_votos: propuesta.total_votos || 0,
          porcentaje_si: propuesta.porcentaje_si || 0,
          porcentaje_no: propuesta.porcentaje_no || 0,
        });

        // Verificar si ya votó
        const { data: voto } = await supabase
          .from('votos')
          .select('tipo_voto')
          .eq('propuesta_id', propuesta.id)
          .eq('vivienda_id', viviendaId)
          .maybeSingle();

        if (voto) {
          console.log('✅ Usuario ya votó:', voto.tipo_voto);
          setYaVoto(true);
          setVotoActual(voto.tipo_voto);
        } else {
          console.log('⏳ Usuario no ha votado aún');
        }
      } else {
        console.log('⚠️ No hay propuesta abierta, regresando a sala de espera...');
        // No hay propuesta abierta, regresar a sala de espera
        navigation.replace('SalaEspera', {
          asambleaId,
          asistenciaId,
          numeroCasa,
        });
      }
    } catch (error) {
      console.error('Error al cargar propuesta:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPropuestaActual();
  }, []);

  useEffect(() => {
    if (!propuestaActual) return;
    
    console.log('📡 [VOTACION] Iniciando suscripción de cambios en propuesta...');
    
    // 🚀 SUSCRIPCIÓN EN TIEMPO REAL A RESULTADOS
    const channel = supabase
      .channel('votacion-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'propuestas',
          filter: `id=eq.${propuestaActual.id}`,
        },
        (payload) => {
          console.log('🔔 [VOTACION] Actualización en propuesta:', payload);
          const propuesta = payload.new as Propuesta;
          
          // 📊 Actualizar resultados en tiempo real
          console.log('📊 Votos SI:', propuesta.votos_si, '| NO:', propuesta.votos_no);
          console.log('📊 Porcentaje SI:', propuesta.porcentaje_si, '% | NO:', propuesta.porcentaje_no, '%');
          
          setResultados({
            votos_si: propuesta.votos_si || 0,
            votos_no: propuesta.votos_no || 0,
            total_votos: propuesta.total_votos || 0,
            porcentaje_si: propuesta.porcentaje_si || 0,
            porcentaje_no: propuesta.porcentaje_no || 0,
          });
          
          // Si la propuesta se cerró, regresar a sala de espera
          if (propuesta.estado === 'CERRADA') {
            console.log('🔴 Propuesta cerrada, regresando a sala de espera...');
            setTimeout(() => {
              navigation.replace('SalaEspera', {
                asambleaId,
                asistenciaId,
                numeroCasa,
              });
            }, 2000);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [VOTACION] Estado de suscripción:', status);
      });

    return () => {
      console.log('🔌 [VOTACION] Desuscribiendo del canal...');
      supabase.removeChannel(channel);
    };
  }, [propuestaActual, asambleaId, asistenciaId, numeroCasa, navigation]);

  const handleVotar = async (tipoVoto: TipoVoto) => {
    if (!propuestaActual || yaVoto) return;

    try {
      const { error } = await supabase
        .from('votos')
        .insert({
          propuesta_id: propuestaActual.id,
          vivienda_id: viviendaId,
          asistencia_id: asistenciaId,
          tipo_voto: tipoVoto,
        });

      if (error) {
        Alert.alert('Error', 'No se pudo registrar el voto');
        return;
      }

      setYaVoto(true);
      setVotoActual(tipoVoto);
      Alert.alert('Éxito', 'Su voto ha sido registrado correctamente');
    } catch (error) {
      console.error('Error al votar:', error);
      Alert.alert('Error', 'Ocurrió un error al registrar el voto');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!propuestaActual) {
    // Redirigir automáticamente a sala de espera
    console.log('⚠️ No hay propuesta actual, redirigiendo...');
    setTimeout(() => {
      navigation.replace('SalaEspera', {
        asambleaId,
        asistenciaId,
        numeroCasa,
      });
    }, 1000);
    
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Regresando a sala de espera...</Text>
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 20 }} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <CronometroModal asambleaId={asambleaId} />
      
      <View style={styles.header}>
        <Text style={styles.casa}>Casa: {numeroCasa}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.propuestaTitulo}>{propuestaActual.titulo}</Text>
        <Text style={styles.propuestaDescripcion}>{propuestaActual.descripcion}</Text>

        {/* 📊 RESULTADOS EN TIEMPO REAL */}
        <View style={styles.resultadosContainer}>
          <Text style={styles.resultadosTitulo}>📊 Resultados en tiempo real</Text>
          
          <View style={styles.barraContainer}>
            <View style={styles.barraHeader}>
              <Text style={styles.barraLabel}>✓ SI</Text>
              <Text style={styles.barraValor}>{resultados.votos_si} votos ({resultados.porcentaje_si.toFixed(1)}%)</Text>
            </View>
            <View style={styles.barraBg}>
              <View 
                style={[
                  styles.barraProgreso, 
                  styles.barraSi,
                  { width: `${resultados.porcentaje_si}%` }
                ]} 
              />
            </View>
          </View>

          <View style={styles.barraContainer}>
            <View style={styles.barraHeader}>
              <Text style={styles.barraLabel}>✗ NO</Text>
              <Text style={styles.barraValor}>{resultados.votos_no} votos ({resultados.porcentaje_no.toFixed(1)}%)</Text>
            </View>
            <View style={styles.barraBg}>
              <View 
                style={[
                  styles.barraProgreso, 
                  styles.barraNo,
                  { width: `${resultados.porcentaje_no}%` }
                ]} 
              />
            </View>
          </View>

          <Text style={styles.totalVotos}>
            Total de votos: {resultados.total_votos}
          </Text>
        </View>

        {yaVoto ? (
          <View style={styles.votoRegistrado}>
            <Text style={styles.votoRegistradoTitulo}>✓ Voto Registrado</Text>
            <Text style={styles.votoRegistradoTexto}>
              Ha votado: <Text style={styles.votoValor}>{votoActual}</Text>
            </Text>
            <Text style={styles.infoText}>
              Su voto ha sido guardado y no puede ser modificado
            </Text>
          </View>
        ) : (
          <View style={styles.botonesVotacion}>
            <TouchableOpacity
              style={[styles.botonVoto, styles.botonSi]}
              onPress={() => handleVotar('SI')}
            >
              <Text style={styles.botonVotoTexto}>✓ SI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.botonVoto, styles.botonNo]}
              onPress={() => handleVotar('NO')}
            >
              <Text style={styles.botonVotoTexto}>✗ NO</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 16,
    alignItems: 'center',
  },
  casa: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  propuestaTitulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16,
  },
  propuestaDescripcion: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
    marginBottom: 30,
  },
  botonesVotacion: {
    gap: 16,
  },
  botonVoto: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  botonSi: {
    backgroundColor: '#10b981',
  },
  botonNo: {
    backgroundColor: '#ef4444',
  },
  botonVotoTexto: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  votoRegistrado: {
    backgroundColor: '#dcfce7',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
  },
  votoRegistradoTitulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#166534',
    marginBottom: 10,
  },
  votoRegistradoTexto: {
    fontSize: 18,
    color: '#166534',
    marginBottom: 10,
  },
  votoValor: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#16a34a',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  resultadosContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  resultadosTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 16,
    textAlign: 'center',
  },
  barraContainer: {
    marginBottom: 16,
  },
  barraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  barraLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
  },
  barraValor: {
    fontSize: 14,
    color: '#64748b',
  },
  barraBg: {
    height: 24,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  barraProgreso: {
    height: '100%',
    borderRadius: 12,
    minWidth: 2,
  },
  barraSi: {
    backgroundColor: '#10b981',
  },
  barraNo: {
    backgroundColor: '#ef4444',
  },
  totalVotos: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
  },
});
