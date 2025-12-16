import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RootStackParamList } from '../../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏛️ Asamblea Digital</Text>
      <Text style={styles.subtitle}>Sistema de Votación Residencial</Text>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.buttonInvitado]}
          onPress={() => navigation.navigate('IngresoCodigo')}
        >
          <Text style={styles.buttonText}>👤 Ingresar como Invitado</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonAdmin]}
          onPress={() => navigation.navigate('PanelAdmin')}
        >
          <Text style={styles.buttonText}>👑 Panel Administrativo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 50,
    textAlign: 'center',
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
  },
  button: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonInvitado: {
    backgroundColor: '#2563eb',
  },
  buttonAdmin: {
    backgroundColor: '#7c3aed',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
