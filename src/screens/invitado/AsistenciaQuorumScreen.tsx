import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';


type Props = NativeStackScreenProps<
  RootStackParamList,
  'AsistenciaQuorum'
>;

export default function AsistenciaQuorumScreen({ route, navigation }: Props) {
  const { asambleaId, asistenciaId, numeroCasa } = route.params;

  const [asistentes, setAsistentes] = useState(0);
  const [totalViviendas, setTotalViviendas] = useState(1);
  const [horaCierre, setHoraCierre] = useState<Date | null>(null);
  

  const cargarDatos = async () => {
    // 1. Datos de la asamblea
    const { data: asamblea } = await supabase
      .from('asambleas')
      .select('hora_cierre_ingreso, total_viviendas')
      .eq('id', asambleaId)
      .single();

    if (asamblea) {
      setHoraCierre(new Date(asamblea.hora_cierre_ingreso));
      setTotalViviendas(asamblea.total_viviendas || 1);
    }

    // 2. Contar viviendas propias (TODOS)
    const { count: propias } = await supabase
      .from('asistencias')
      .select('*', { count: 'exact', head: true })
      .eq('asamblea_id', asambleaId);

    // 3. Contar SOLO apoderados aprobados
    const { count: apoderadosAprobados } = await supabase
      .from('asistencias')
      .select('*', { count: 'exact', head: true })
      .eq('asamblea_id', asambleaId)
      .eq('es_apoderado', true)
      .eq('estado_apoderado', 'APROBADO')
      .not('vivienda_representada_id', 'is', null);

    const total = (propias || 0) + (apoderadosAprobados || 0);

    setAsistentes(total);
  };


  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (horaCierre && new Date() > horaCierre) {
        navigation.replace('SalaEspera', {
        asambleaId,
        asistenciaId,
        numeroCasa,
        });
    }
  }, [horaCierre]);

  const porcentaje = Math.round((asistentes / totalViviendas) * 100);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tiempo de Asistencia</Text>
      <Text style={styles.count}>{asistentes} asistentes</Text>
      <Text style={styles.percent}>{porcentaje}% de quórum</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  count: {
    fontSize: 20,
    marginBottom: 8,
  },
  percent: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#16a34a',
  },
});
