import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'IngresoCodigo'>;

export default function IngresoCodigoScreen({ navigation }: Props) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleIngresar = async () => {
    if (!codigo.trim()) {
      Alert.alert('Error', 'Por favor ingrese el código de acceso');
      return;
    }

    setLoading(true);

    try {
      // Buscar asamblea activa con ese código
      const { data: asamblea, error } = await supabase
        .from('asambleas')
        .select('*')
        .eq('codigo_acceso', codigo.trim().toUpperCase())
        .eq('estado', 'ABIERTA')
        .single();

      if (error || !asamblea) {
        Alert.alert('Error', 'Código inválido o asamblea no disponible');
        return;
      }

      // Navegar a registro
      navigation.navigate('RegistroInvitado', {
        asambleaId: asamblea.id,
        codigoAcceso: codigo.trim().toUpperCase(),
      });
    } catch (error) {
      console.error('Error al validar código:', error);
      Alert.alert('Error', 'Ocurrió un error al validar el código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Ingrese el Código de Acceso</Text>
        <Text style={styles.subtitle}>
          Solicite el código al administrador de la asamblea
        </Text>

        <TextInput
          style={styles.input}
          placeholder="XXXXXX"
          value={codigo}
          onChangeText={(text) => setCodigo(text.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
          autoCorrect={false}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleIngresar}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Validando...' : 'Ingresar'}
          </Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
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
