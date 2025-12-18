import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { Propuesta } from '../../types/database.types';
import CronometroModal from '../../components/CronometroModal';

type Props = NativeStackScreenProps<RootStackParamList, 'SalaEspera'>;

export default function SalaEsperaScreen({ navigation, route }: Props) {
  const { asambleaId, asistenciaId, numeroCasa } = route.params;
  const [viviendaId, setViviendaId] = useState<string>('');

  useEffect(() => {
    // Obtener vivienda_id de la asistencia
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

  useEffect(() => {
    if (!viviendaId) return;

    console.log('📡 Iniciando suscripción realtime para propuestas...');
    console.log('Asamblea ID:', asambleaId);
    console.log('Vivienda ID:', viviendaId);

    // Suscripción a propuestas ABIERTAS
    const channel = supabase
      .channel('propuestas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'propuestas',
          filter: `asamblea_id=eq.${asambleaId}`,
        },
        async (payload) => {
          console.log('🔔 Cambio detectado en propuestas:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const propuesta = payload.new as Propuesta;
            
            console.log('Estado de la propuesta:', propuesta.estado);
            
            if (propuesta.estado === 'ABIERTA') {
              console.log('✅ Propuesta ABIERTA detectada! Navegando a votación...');
              
              // Navegar a votación
              navigation.replace('Votacion', {
                asambleaId,
                asistenciaId,
                viviendaId,
                numeroCasa,
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Estado de suscripción:', status);
      });

    // Verificar si ya hay una propuesta abierta
    const checkPropuestaAbierta = async () => {
      console.log('🔍 Verificando si ya hay propuesta abierta...');
      
      const { data, error } = await supabase
        .from('propuestas')
        .select('*')
        .eq('asamblea_id', asambleaId)
        .eq('estado', 'ABIERTA')
        .maybeSingle();

      if (error) {
        console.error('❌ Error al verificar propuesta:', error);
      }

      if (data) {
        console.log('✅ Ya existe propuesta abierta! Navegando...');
        navigation.replace('Votacion', {
          asambleaId,
          asistenciaId,
          viviendaId,
          numeroCasa,
        });
      } else {
        console.log('⏳ No hay propuesta abierta, esperando...');
      }
    };

    checkPropuestaAbierta();

    return () => {
      console.log('🔌 Desuscribiendo del canal...');
      supabase.removeChannel(channel);
    };
  }, [asambleaId, asistenciaId, viviendaId, numeroCasa, navigation]);

  return (
    <View style={styles.container}>
      <CronometroModal asambleaId={asambleaId} />
      
      <View style={styles.card}>
        <Text style={styles.casa}>Casa: {numeroCasa}</Text>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.title}>La asamblea está pronta a comenzar</Text>
          <Text style={styles.subtitle}>
            Por favor espere a que el administrador inicie la votación
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            ℹ️ Recibirá la primera propuesta automáticamente cuando esté disponible
          </Text>
        </View>
      </View>
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
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});
