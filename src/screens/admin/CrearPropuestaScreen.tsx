import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { supabase } from '../../services/supabase';

type Props = NativeStackScreenProps<RootStackParamList, 'CrearPropuesta'>;

export default function CrearPropuestaScreen({ navigation, route }: Props) {
  const { asambleaId } = route.params;
  
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCrearBorrador = async () => {
    if (!titulo.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    setLoading(true);

    try {
      // Obtener el siguiente orden
      const { data: propuestas } = await supabase
        .from('propuestas')
        .select('orden')
        .eq('asamblea_id', asambleaId)
        .order('orden', { ascending: false })
        .limit(1);

      const siguienteOrden = propuestas && propuestas.length > 0 ? propuestas[0].orden + 1 : 1;

      const { error } = await supabase
        .from('propuestas')
        .insert({
          asamblea_id: asambleaId,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          estado: 'BORRADOR',
          orden: siguienteOrden,
        });

      if (error) {
        Alert.alert('Error', 'No se pudo crear la propuesta');
        return;
      }

      Alert.alert('Éxito', 'Propuesta guardada como borrador', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error al crear propuesta:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la propuesta');
    } finally {
      setLoading(false);
    }
  };

  const handleCrearYAbrir = async () => {
    if (!titulo.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    setLoading(true);

    try {
      // Verificar que no haya otra propuesta abierta
      const { data: propuestaAbierta } = await supabase
        .from('propuestas')
        .select('id')
        .eq('asamblea_id', asambleaId)
        .eq('estado', 'ABIERTA')
        .single();

      if (propuestaAbierta) {
        Alert.alert('Error', 'Ya hay una propuesta abierta. Ciérrela antes de abrir una nueva.');
        setLoading(false);
        return;
      }

      // Obtener el siguiente orden
      const { data: propuestas } = await supabase
        .from('propuestas')
        .select('orden')
        .eq('asamblea_id', asambleaId)
        .order('orden', { ascending: false })
        .limit(1);

      const siguienteOrden = propuestas && propuestas.length > 0 ? propuestas[0].orden + 1 : 1;

      const { error } = await supabase
        .from('propuestas')
        .insert({
          asamblea_id: asambleaId,
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          estado: 'ABIERTA',
          fecha_apertura: new Date().toISOString(),
          orden: siguienteOrden,
        });

      if (error) {
        Alert.alert('Error', 'No se pudo crear la propuesta');
        return;
      }

      Alert.alert('Éxito', 'Propuesta creada y abierta para votación', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error al crear propuesta:', error);
      Alert.alert('Error', 'Ocurrió un error al crear la propuesta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Nueva Propuesta</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.inputTitulo}
            placeholder="Ej: Aprobación del presupuesto 2025"
            value={titulo}
            onChangeText={setTitulo}
            multiline
            editable={!loading}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={styles.inputDescripcion}
            placeholder="Detalle la propuesta..."
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!loading}
          />

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonBorrador]}
              onPress={handleCrearBorrador}
              disabled={loading}
            >
              <Text style={styles.buttonText}>💾 Guardar Borrador</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonAbrir]}
              onPress={handleCrearYAbrir}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? '⏳ Creando...' : '🚀 Crear y Abrir Votación'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              ℹ️ <Text style={styles.infoBold}>Guardar Borrador:</Text> La propuesta se guardará sin iniciar votación
            </Text>
            <Text style={styles.infoText}>
              ℹ️ <Text style={styles.infoBold}>Crear y Abrir:</Text> La votación iniciará inmediatamente
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
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
  },
  inputTitulo: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 60,
  },
  inputDescripcion: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 120,
  },
  buttonsContainer: {
    gap: 12,
    marginTop: 8,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonBorrador: {
    backgroundColor: '#64748b',
  },
  buttonAbrir: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: 'bold',
  },
});
