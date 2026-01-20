import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import ModalAdvertenciaAsamblea from '../../components/ModalAdvertenciaAsamblea';
import { supabase } from '../../services/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistroInvitado'>;

export default function RegistroInvitadoScreen({ navigation, route }: Props) {
  const { asambleaId, codigoAcceso } = route.params;
  
  const [numeroCasa, setNumeroCasa] = useState('');
  const [primerNombre, setPrimerNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [nombreAsistente, setNombreAsistente] = useState('');
  const [esApoderado, setEsApoderado] = useState(false);
  const [numeroCasaRepresentada, setNumeroCasaRepresentada] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [asistenciaCreada, setAsistenciaCreada] = useState<any>(null);


  const handleRegistro = async () => {
    // Validar campos
    if (!numeroCasa.trim() || !primerNombre.trim() || !primerApellido.trim() || !nombreAsistente.trim()) {
      Alert.alert('Error', 'Todos los campos son obligatorios');
      return;
    }

    setLoading(true);

    try {
      // 1. Buscar la vivienda
      let viviendaRepresentadaId: string | null = null;
      const { data: vivienda, error: errorVivienda } = await supabase
        .from('viviendas')
        .select('id')
        .eq('numero_casa', numeroCasa.trim())
        .single();

      if (errorVivienda || !vivienda) {
        Alert.alert('Error', 'Número de casa no encontrado');
        setLoading(false);
        return;
      }

      // 2. Validar propietario
      const { data: propietario, error: errorPropietario } = await supabase
        .from('propietarios')
        .select('id')
        .eq('vivienda_id', vivienda.id)
        .ilike('primer_nombre', primerNombre.trim())
        .ilike('primer_apellido', primerApellido.trim())
        .single();

      if (errorPropietario || !propietario) {
        Alert.alert('Error', 'Los datos del propietario no coinciden');
        setLoading(false);
        return;
      }

      if (esApoderado) {
        if (!numeroCasaRepresentada.trim()) {
          Alert.alert('Error', 'Debe ingresar la casa que representa');
          setLoading(false);
          return;
        }

        const { data: viviendaRep } = await supabase
          .from('viviendas')
          .select('id')
          .eq('numero_casa', numeroCasaRepresentada.trim())
          .single();

        if (!viviendaRep) {
          Alert.alert('Error', 'La vivienda que representa no existe');
          setLoading(false);
          return;
        }

        viviendaRepresentadaId = viviendaRep.id;

        // VALIDACIÓN OPTION 2 (no duplicar apoderado)
        const { data: apoderadoExistente } = await supabase
          .from('asistencias')
          .select('id')
          .eq('asamblea_id', asambleaId)
          .eq('vivienda_representada_id', viviendaRepresentadaId)
          .in('estado_apoderado', ['PENDIENTE', 'APROBADO'])
          .maybeSingle();

        if (apoderadoExistente) {
          Alert.alert(
            'No permitido',
            'Esta vivienda ya tiene un apoderado asignado'
          );
          setLoading(false);
          return;
        }
      }

      // 3. Verificar que no esté ya registrado
      const { data: asistenciaExistente } = await supabase
        .from('asistencias')
        .select('id')
        .eq('asamblea_id', asambleaId)
        .eq('vivienda_id', vivienda.id)
        .single();

      if (asistenciaExistente) {
        Alert.alert('Error', 'Esta casa ya se encuentra registrada en la asamblea');
        setLoading(false);
        return;
      }

      const { data: asamblea, error: errorAsamblea } = await supabase
        .from('asambleas')
        .select('hora_cierre_ingreso')
        .eq('id', asambleaId)
        .single();

      if (errorAsamblea || !asamblea?.hora_cierre_ingreso) {
        Alert.alert('Error', 'No se pudo validar el estado de la asamblea');
        setLoading(false);
        return;
      }

      if (new Date() > new Date(asamblea.hora_cierre_ingreso)) {
        Alert.alert(
          'Ingreso cerrado',
          'El tiempo de ingreso a la asamblea ha finalizado'
        );
        setLoading(false);
        return;
      }

      console.log('REGISTRO ASISTENCIA →', {
        esApoderado,
        viviendaRepresentadaId,
        estado_apoderado: esApoderado === true ? 'PENDIENTE' : 'APROBADO',
      });

      // 4. Crear asistencia
    const { data: nuevaAsistencia, error: errorAsistencia } = await supabase
      .from('asistencias')
      .insert({
        asamblea_id: asambleaId,
        vivienda_id: vivienda.id,
        nombre_asistente: nombreAsistente.trim(),
        es_apoderado: esApoderado === true,
        vivienda_representada_id: viviendaRepresentadaId,
        estado_apoderado: esApoderado === true ? 'PENDIENTE' : 'APROBADO',
      })
      .select()
      .single();

    if (errorAsistencia || !nuevaAsistencia) {
      Alert.alert('Error', 'No se pudo completar el registro');
      setLoading(false);
      return;
    }

    setAsistenciaCreada(nuevaAsistencia);
    setMostrarModal(true);
    setLoading(false);  
    if (esApoderado) {
      Alert.alert(
        'Registro enviado',
        'Tu solicitud como apoderado quedó pendiente de aprobación del administrador'
      );
    }

    return;      

    } catch (error) {
      console.error('Error en registro:', error);
      Alert.alert('Error', 'Ocurrió un error durante el registro');
      setLoading(false);
    }
  };
  
    return (
    <>
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Registro de Asistente</Text>
          <Text style={styles.subtitle}>Código: {codigoAcceso}</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Número de Casa *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 101"
              value={numeroCasa}
              onChangeText={setNumeroCasa}
              editable={!loading}
            />

            <Text style={styles.label}>Primer Nombre del Propietario *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Juan"
              value={primerNombre}
              onChangeText={setPrimerNombre}
              editable={!loading}
            />

            <Text style={styles.label}>Primer Apellido del Propietario *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Pérez"
              value={primerApellido}
              onChangeText={setPrimerApellido}
              editable={!loading}
            />

            <Text style={styles.label}>Nombre del Asistente *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: María Pérez"
              value={nombreAsistente}
              onChangeText={setNombreAsistente}
              editable={!loading}
            />

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
              onPress={() => setEsApoderado(!esApoderado)}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderWidth: 2,
                  borderColor: '#2563eb',
                  marginRight: 8,
                  backgroundColor: esApoderado ? '#2563eb' : 'transparent',
                }}
              />
              <Text>Soy apoderado de otra vivienda</Text>
            </TouchableOpacity>

            {esApoderado && (
              <>
                <Text style={styles.label}>Número de Casa que Representa *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 205"
                  value={numeroCasaRepresentada}
                  onChangeText={setNumeroCasaRepresentada}
                  editable={!loading}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegistro}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Registrando...' : 'Confirmar Registro'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ✅ EL MODAL SIEMPRE DEBE IR AQUÍ */}
      <ModalAdvertenciaAsamblea
        visible={mostrarModal}
        onAceptar={() => {
          setMostrarModal(false);

          navigation.replace('AsistenciaQuorum', {
            asambleaId,
            asistenciaId: asistenciaCreada.id,
            numeroCasa: numeroCasa.trim(),
          });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
