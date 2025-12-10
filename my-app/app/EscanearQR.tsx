import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BarCodeScanner } from 'expo-barcode-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AsistenciaConfirmada {
  id: string;
  numeroCasa: string;
  nombrePropietario: string;
  fecha: string;
}

export default function EscanearQR() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Solicitar permisos de cámara
  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getBarCodeScannerPermissions();
  }, []);

  // Mostrar mensaje de éxito con animación
  const mostrarExito = (mensaje: string) => {
    setSuccessMessage(mensaje);
    fadeAnim.setValue(1);
    Animated.sequence([
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => setSuccessMessage(''));
  };

  // Procesar código QR escaneado
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setScanning(false);

    try {
      // Parsear formato: "numeroCasa|nombrePropietario"
      const partes = data.split('|');
      if (partes.length !== 2) {
        Alert.alert('Error', 'Formato de QR inválido. Debe contener: numeroCasa|nombrePropietario');
        setTimeout(() => {
          setScanned(false);
          setScanning(true);
        }, 1500);
        return;
      }

      const numeroCasa = partes[0].trim();
      const nombrePropietario = partes[1].trim();

      if (!numeroCasa || !nombrePropietario) {
        Alert.alert('Error', 'Datos incompletos en el QR');
        setTimeout(() => {
          setScanned(false);
          setScanning(true);
        }, 1500);
        return;
      }

      // Verificar si el asistente está registrado
      const existentes = await AsyncStorage.getItem('asistentes');
      const asistentes = existentes ? JSON.parse(existentes) : [];

      const asistenteEncontrado = asistentes.some(
        (a: any) =>
          a.numeroCasa === numeroCasa && a.nombrePropietario === nombrePropietario
      );

      if (!asistenteEncontrado) {
        Alert.alert(
          'Error',
          `El asistente (Casa ${numeroCasa} - ${nombrePropietario}) no está registrado`
        );
        setTimeout(() => {
          setScanned(false);
          setScanning(true);
        }, 1500);
        return;
      }

      // Crear registro de asistencia confirmada
      const asistenciaConfirmada: AsistenciaConfirmada = {
        id: Date.now().toString(),
        numeroCasa,
        nombrePropietario,
        fecha: new Date().toISOString(),
      };

      // Obtener asistencias previas
      const existentesAsistencias = await AsyncStorage.getItem('asistenciasConfirmadas');
      const asistencias: AsistenciaConfirmada[] = existentesAsistencias
        ? JSON.parse(existentesAsistencias)
        : [];

      // Verificar si ya está confirmada
      if (
        asistencias.some(
          (a) => a.numeroCasa === numeroCasa && a.nombrePropietario === nombrePropietario
        )
      ) {
        mostrarExito(`✓ ${nombrePropietario} ya estaba confirmado`);
        setTimeout(() => {
          setScanned(false);
          setScanning(true);
        }, 2500);
        return;
      }

      // Guardar asistencia confirmada
      asistencias.push(asistenciaConfirmada);
      await AsyncStorage.setItem('asistenciasConfirmadas', JSON.stringify(asistencias));

      mostrarExito(`✓ ¡${nombrePropietario} confirmado!`);
      setTimeout(() => {
        setScanned(false);
        setScanning(true);
      }, 2500);
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar el escaneo');
      console.error(error);
      setTimeout(() => {
        setScanned(false);
        setScanning(true);
      }, 1500);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Acceso a Cámara Denegado</Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            Se requiere acceso a la cámara para escanear QR
          </Text>
          <Button
            title="Volver"
            color={colors.tint}
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {scanning ? (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}

      {/* Mensaje de éxito */}
      {successMessage ? (
        <Animated.View
          style={[
            styles.successOverlay,
            {
              backgroundColor: colors.tint,
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.successText}>{successMessage}</Text>
        </Animated.View>
      ) : null}

      {/* Controles inferiores */}
      <View style={[styles.controls, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <Text style={styles.instructionText}>Apunta el QR a la cámara</Text>
        <Button
          title="Volver"
          color={colors.accent}
          onPress={() => router.back()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  successText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '500',
  },
});
