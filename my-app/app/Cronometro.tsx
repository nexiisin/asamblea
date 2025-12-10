import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Button,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTimer } from '@/hooks/use-timer';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function Cronometro() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [tiempoConfigurable, setTiempoConfigurable] = useState('60');
  const [showConfigModal, setShowConfigModal] = useState(true);

  const timer = useTimer({
    initialSeconds: 60,
    onComplete: () => {
      // Aquí puedes agregar una acción al terminar el tiempo
    },
  });

  // Convertir segundos a formato MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Manejar configuración inicial
  const handleConfigurarTiempo = () => {
    const segundos = parseInt(tiempoConfigurable, 10);
    if (segundos > 0 && segundos <= 3600) {
      timer.reset(segundos);
      setShowConfigModal(false);
    }
  };

  // Calcular porcentaje para barra circular visual
  const porcentajeBarra = (timer.seconds / 60) * 100; // Basado en 60s máx para visualización

  // Determinar colores según tiempo restante
  const getColorPorTiempo = () => {
    if (timer.seconds > 30) return colors.tint; // Verde
    if (timer.seconds > 10) return '#ffbb33'; // Amarillo
    return '#ff4444'; // Rojo
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Modal de configuración */}
      <Modal visible={showConfigModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Configurar tiempo (segundos)
            </Text>
            <TextInput
              style={[
                styles.tiempoInput,
                { borderColor: colors.tint, color: colors.text },
              ]}
              placeholder="Ej: 60"
              placeholderTextColor={colors.icon}
              value={tiempoConfigurable}
              onChangeText={setTiempoConfigurable}
              keyboardType="numeric"
              maxLength={4}
            />
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.tint }]}
              onPress={handleConfigurarTiempo}
            >
              <Text style={styles.modalButtonText}>Comenzar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        {/* Título */}
        <Text style={[styles.titulo, { color: colors.text }]}>
          Cronómetro
        </Text>

        {/* Display grande del tiempo */}
        <View style={styles.displayContainer}>
          <View
            style={[
              styles.circuloFondo,
              { borderColor: getColorPorTiempo() },
            ]}
          >
            <Text
              style={[
                styles.tiempoGrande,
                { color: getColorPorTiempo() },
              ]}
            >
              {formatTime(timer.seconds)}
            </Text>
          </View>

          {/* Barra de progreso circular visual */}
          <View
            style={[
              styles.barraTiempo,
              {
                borderColor: getColorPorTiempo(),
                opacity: 0.3,
              },
            ]}
          />
        </View>

        {/* Estado del timer */}
        <Text style={[styles.estado, { color: colors.icon }]}>
          {timer.isRunning
            ? '▶ Corriendo...'
            : timer.seconds === 0
            ? '⏹ Finalizado'
            : '⏸ Pausado'}
        </Text>

        {/* Botones de control */}
        <View style={styles.botonesContainer}>
          <TouchableOpacity
            style={[
              styles.botonControl,
              {
                backgroundColor: timer.isRunning ? '#ffbb33' : colors.tint,
              },
            ]}
            onPress={timer.isRunning ? timer.pause : timer.start}
            disabled={timer.seconds === 0}
          >
            <Text style={styles.botonTexto}>
              {timer.isRunning ? '⏸ Pausar' : '▶ Iniciar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.botonControl,
              { backgroundColor: '#999999' },
            ]}
            onPress={() => {
              timer.reset();
              setShowConfigModal(true);
            }}
          >
            <Text style={styles.botonTexto}>↻ Reiniciar</Text>
          </TouchableOpacity>
        </View>

        {/* Botón de configuración rápida */}
        <TouchableOpacity
          style={[styles.botonConfig, { borderColor: colors.tint }]}
          onPress={() => setShowConfigModal(true)}
        >
          <Text style={[styles.botonConfigTexto, { color: colors.tint }]}>
            ⚙ Configurar
          </Text>
        </TouchableOpacity>

        {/* Botón volver */}
        <TouchableOpacity
          style={[styles.botonVolver, { marginTop: 24 }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.botonVolverTexto, { color: colors.tint }]}>
            ← Volver
          </Text>
        </TouchableOpacity>
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
    paddingHorizontal: 16,
  },
  titulo: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
  },
  displayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    position: 'relative',
    width: 280,
    height: 280,
  },
  circuloFondo: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  tiempoGrande: {
    fontSize: 80,
    fontWeight: '700',
    letterSpacing: 2,
  },
  barraTiempo: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
  },
  estado: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  botonesContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  botonControl: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  botonConfig: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
  },
  botonConfigTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
  botonVolver: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  botonVolverTexto: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  tiempoInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
