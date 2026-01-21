import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';
import { descargarCertificado } from '../../utils/descargarCertificado';



type Props = NativeStackScreenProps<
  RootStackParamList,
  'FormularioCierre'
>;

export default function FormularioCierreScreen({ route, navigation }: Props) {
  const { asistenciaId, asambleaId } = route.params;

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [numeroCasa, setNumeroCasa] = useState('');
  const [nombreAsistente, setNombreAsistente] = useState('');
  const [esApoderado, setEsApoderado] = useState(false);
  const [casaRepresentada, setCasaRepresentada] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [formularioEnviado, setFormularioEnviado] = useState(false);


const handleEnviar = async () => {
  if (!nombre || !apellido || !numeroCasa || !nombreAsistente) {
    Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
    return;
  }

  if (esApoderado && !casaRepresentada) {
    Alert.alert('Error', 'Debes indicar la casa que representas');
    return;
  }

  try {
    setEnviando(true);

    const { error } = await supabase
      .from('asistencias')
      .update({
        nombre_asistente: nombreAsistente,
        apellido_propietario: apellido,
        formulario_cierre_completado: true,
      })
      .eq('id', asistenciaId);

    if (error) {
      console.error(error);
      Alert.alert('Error', 'Error al enviar formulario');
      return;
    }

    Alert.alert(
      'Formulario enviado',
      'Ahora puedes descargar tu certificado',
      [
        {
          text: 'Aceptar',
          onPress: () => setFormularioEnviado(true),
        },
      ],
      { cancelable: false }
    );
  } catch (e) {
    console.error(e);
    Alert.alert('Error', 'Ocurrió un error inesperado');
  } finally {
    setEnviando(false);
  }
};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Formulario de Cierre</Text>

      <TextInput
        placeholder="Nombre del propietario"
        style={styles.input}
        value={nombre}
        onChangeText={setNombre}
      />

      <TextInput
        placeholder="Apellido del propietario"
        style={styles.input}
        value={apellido}
        onChangeText={setApellido}
      />

      <TextInput
        placeholder="Número de casa"
        style={styles.input}
        value={numeroCasa}
        onChangeText={setNumeroCasa}
      />

      <TextInput
        placeholder="Nombre del asistente"
        style={styles.input}
        value={nombreAsistente}
        onChangeText={setNombreAsistente}
      />

      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => setEsApoderado(!esApoderado)}
      >
        <Text>{esApoderado ? '☑' : '☐'} Actúo como apoderado</Text>
      </TouchableOpacity>

      {esApoderado && (
        <TextInput
          placeholder="Casa que representa"
          style={styles.input}
          value={casaRepresentada}
          onChangeText={setCasaRepresentada}
        />
      )}

{!formularioEnviado && (
  <TouchableOpacity
    style={styles.boton}
    onPress={handleEnviar}
    disabled={enviando}
  >
    <Text style={styles.botonTexto}>
      {enviando ? 'Enviando...' : 'Enviar Formulario'}
    </Text>
  </TouchableOpacity>
)}

{formularioEnviado && (
  <TouchableOpacity
    style={[styles.boton, { backgroundColor: '#16a34a' }]}
    onPress={async () => {
      await descargarCertificado(asistenciaId);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }}
  >
    <Text style={styles.botonTexto}>
      Descargar certificado
    </Text>
  </TouchableOpacity>
)}


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  checkbox: {
    marginVertical: 12,
  },
  boton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center',
  },
  botonTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
