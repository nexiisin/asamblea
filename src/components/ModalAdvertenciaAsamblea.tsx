import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  visible: boolean;
  onAceptar: () => void;
}

export default function ModalAdvertenciaAsamblea({ visible, onAceptar }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.close} onPress={onAceptar}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Información importante</Text>

          <Text style={styles.text}>
            Al ingresar a la asamblea, usted se compromete a permanecer hasta la
            finalización de la misma.
          </Text>

          <Text style={styles.text}>
            Salir antes de que la asamblea finalice puede afectar el quórum y la
            validez de las decisiones tomadas.
          </Text>

          <Text style={styles.text}>
            En caso de una urgencia mayor, deberá informar al administrador.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    position: 'relative',
  },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    marginBottom: 10,
    lineHeight: 22,
  },
});
