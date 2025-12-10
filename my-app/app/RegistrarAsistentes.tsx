import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface Asistente {
  id: string;
  numeroCasa: string;
  nombrePropietario: string;
  cedula: string;
  numeroPersonasAutorizadas: string;
  fecha: string;
}

export default function RegistrarAsistentes() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [numeroCasa, setNumeroCasa] = useState('');
  const [nombrePropietario, setNombrePropietario] = useState('');
  const [cedula, setCedula] = useState('');
  const [numeroPersonas, setNumeroPersonas] = useState('');
  const [loading, setLoading] = useState(false);

  // Validaciones
  const validarFormulario = (): boolean => {
    if (!numeroCasa.trim()) {
      Alert.alert('Error', 'El número de casa es requerido');
      return false;
    }
    if (!nombrePropietario.trim()) {
      Alert.alert('Error', 'El nombre del propietario es requerido');
      return false;
    }
    if (!cedula.trim()) {
      Alert.alert('Error', 'La cédula es requerida');
      return false;
    }
    if (!/^\d+$/.test(cedula)) {
      Alert.alert('Error', 'La cédula debe contener solo números');
      return false;
    }
    if (!numeroPersonas.trim()) {
      Alert.alert('Error', 'El número de personas autorizadas es requerido');
      return false;
    }
    if (!/^\d+$/.test(numeroPersonas)) {
      Alert.alert('Error', 'El número de personas debe ser un número entero');
      return false;
    }
    const personas = parseInt(numeroPersonas, 10);
    if (personas <= 0) {
      Alert.alert('Error', 'El número de personas debe ser mayor a 0');
      return false;
    }
    return true;
  };

  // Guardar asistente
  const guardarAsistente = async () => {
    if (!validarFormulario()) return;

    setLoading(true);
    try {
      const nuevoAsistente: Asistente = {
        id: Date.now().toString(),
        numeroCasa: numeroCasa.trim(),
        nombrePropietario: nombrePropietario.trim(),
        cedula: cedula.trim(),
        numeroPersonasAutorizadas: numeroPersonas.trim(),
        fecha: new Date().toISOString(),
      };

      // Obtener asistentes existentes
      const existentes = await AsyncStorage.getItem('asistentes');
      const asistentes: Asistente[] = existentes ? JSON.parse(existentes) : [];

      // Verificar si la cédula ya existe
      if (asistentes.some((a) => a.cedula === cedula.trim())) {
        Alert.alert('Error', 'Esta cédula ya está registrada');
        setLoading(false);
        return;
      }

      // Agregar nuevo asistente
      asistentes.push(nuevoAsistente);
      await AsyncStorage.setItem('asistentes', JSON.stringify(asistentes));

      Alert.alert('Éxito', 'Asistente registrado correctamente');

      // Limpiar formulario
      setNumeroCasa('');
      setNombrePropietario('');
      setCedula('');
      setNumeroPersonas('');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el asistente');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: colors.text }]}>Registrar Asistente</Text>

        {/* Número de casa */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Número de Casa</Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.tint, color: colors.text },
            ]}
            placeholder="Ej: 42A"
            placeholderTextColor={colors.icon}
            value={numeroCasa}
            onChangeText={setNumeroCasa}
            editable={!loading}
          />
        </View>

        {/* Nombre del propietario */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Nombre del Propietario</Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.tint, color: colors.text },
            ]}
            placeholder="Ej: Juan Pérez"
            placeholderTextColor={colors.icon}
            value={nombrePropietario}
            onChangeText={setNombrePropietario}
            editable={!loading}
          />
        </View>

        {/* Cédula */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>Cédula</Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.tint, color: colors.text },
            ]}
            placeholder="Ej: 1234567890"
            placeholderTextColor={colors.icon}
            value={cedula}
            onChangeText={setCedula}
            keyboardType="numeric"
            editable={!loading}
          />
        </View>

        {/* Número de personas autorizadas */}
        <View style={styles.fieldContainer}>
          <Text style={[styles.label, { color: colors.text }]}>
            Número de Personas Autorizadas
          </Text>
          <TextInput
            style={[
              styles.input,
              { borderColor: colors.tint, color: colors.text },
            ]}
            placeholder="Ej: 5"
            placeholderTextColor={colors.icon}
            value={numeroPersonas}
            onChangeText={setNumeroPersonas}
            keyboardType="numeric"
            editable={!loading}
          />
        </View>

        {/* Botones */}
        <View style={styles.buttonContainer}>
          <Button
            title={loading ? 'Guardando...' : 'Guardar Asistente'}
            color={colors.tint}
            onPress={guardarAsistente}
            disabled={loading}
          />
        </View>

        <View style={styles.spacer} />

        <View style={styles.buttonContainer}>
          <Button title="Volver" color={colors.icon} onPress={() => router.back()} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  buttonContainer: {
    marginVertical: 8,
  },
  spacer: {
    height: 20,
  },
});
