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
    console.log('📡 Iniciando suscripción de cambios en votación...');
    
    // Suscripción a cambios en propuestas
    const channel = supabase
      .channel('votacion-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'propuestas',
          filter: `asamblea_id=eq.${asambleaId}`,
        },
        async (payload) => {
          console.log('🔔 Cambio en propuesta detectado:', payload);
          const propuesta = payload.new as Propuesta;
          
          if (propuesta.estado === 'CERRADA' && propuesta.id === propuestaActual?.id) {
            console.log('🔴 Propuesta actual cerrada, regresando a sala de espera...');
            // Propuesta actual cerrada, regresar a sala de espera
            setTimeout(() => {
              navigation.replace('SalaEspera', {
                asambleaId,
                asistenciaId,
                numeroCasa,
              });
            }, 2000);
          } else if (propuesta.estado === 'ABIERTA') {
            console.log('🟢 Nueva propuesta abierta:', propuesta.titulo);
            // Nueva propuesta abierta
            setPropuestaActual(propuesta);
            setYaVoto(false);
            setVotoActual(null);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción votación:', status);
      });

    return () => {
      console.log('🔌 Desuscribiendo de cambios de votación...');
      supabase.removeChannel(channel);
    };
  }, [asambleaId, propuestaActual, navigation, asistenciaId, numeroCasa]);

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
});
