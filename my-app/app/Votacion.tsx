import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface VotacionPunto {
  id: string;
  punto: string;
  votos: {
    si: number;
    no: number;
    ausente: number;
    no_voto: number;
  };
  estado?: 'aprobado' | 'desaprobado' | 'pendiente';
}

interface VotoUsuario {
  puntoId: string;
  voto: 'si' | 'no' | 'ausente' | 'no_voto';
  timestamp: string;
}

type VoteKey = keyof VotacionPunto['votos'];

const BOTONES_VOTO: { label: string; key: VoteKey; color: string }[] = [
  { label: 'Sí', key: 'si', color: '#00C851' },
  { label: 'No', key: 'no', color: '#ff4444' },
  { label: 'Ausente', key: 'ausente', color: '#ffbb33' },
  { label: 'No votó', key: 'no_voto', color: '#999999' },
];

export default function Votacion() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [puntos, setPuntos] = useState<VotacionPunto[]>([]);
  const [puntoActual, setPuntoActual] = useState(0);
  const [votosUsuario, setVotosUsuario] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Cargar puntos y votos del usuario
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const puntosGuardados = await AsyncStorage.getItem('votacionPuntos');
      if (puntosGuardados) {
        setPuntos(JSON.parse(puntosGuardados));
      } else {
        // Cargar puntos de ejemplo si no existen
        const puntosPorDefecto: VotacionPunto[] = [
          {
            id: '1',
            punto: 'Propuesta 1: Aumentar presupuesto para educación',
            votos: { si: 0, no: 0, ausente: 0, no_voto: 0 },
            estado: 'pendiente',
          },
          {
            id: '2',
            punto: 'Propuesta 2: Crear nuevo parque comunitario',
            votos: { si: 0, no: 0, ausente: 0, no_voto: 0 },
            estado: 'pendiente',
          },
          {
            id: '3',
            punto: 'Propuesta 3: Mejorar infraestructura vial',
            votos: { si: 0, no: 0, ausente: 0, no_voto: 0 },
            estado: 'pendiente',
          },
        ];
        setPuntos(puntosPorDefecto);
        await AsyncStorage.setItem('votacionPuntos', JSON.stringify(puntosPorDefecto));
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  // Calcular estado de aprobación/desaprobación
  const calcularEstado = (votos: VotacionPunto['votos']): 'aprobado' | 'desaprobado' => {
    const totalVotos = votos.si + votos.no + votos.ausente + votos.no_voto;
    
    // Si no hay votos, se considera desaprobado
    if (totalVotos === 0) return 'desaprobado';

    const porcentajeSi = (votos.si / totalVotos) * 100;
    return porcentajeSi >= 51 ? 'aprobado' : 'desaprobado';
  };

  const registrarVoto = async (voto: 'si' | 'no' | 'ausente' | 'no_voto') => {
    const puntoId = puntos[puntoActual].punto;

    // Verificar si ya votó en este punto
    if (votosUsuario.has(puntoId)) {
      Alert.alert('Aviso', 'Ya has votado en esta propuesta');
      return;
    }

    setLoading(true);
    try {
      // Actualizar votos del punto
      const nuevosPuntos = [...puntos];
      nuevosPuntos[puntoActual].votos[voto]++;

      // Calcular estado del punto
      const estado = calcularEstado(nuevosPuntos[puntoActual].votos);
      nuevosPuntos[puntoActual].estado = estado;

      // Guardar puntos actualizados
      await AsyncStorage.setItem('votacionPuntos', JSON.stringify(nuevosPuntos));
      setPuntos(nuevosPuntos);

      // Registrar voto del usuario
      const nuevoVotoUsuario = new Set(votosUsuario);
      nuevoVotoUsuario.add(puntoId);
      setVotosUsuario(nuevoVotoUsuario);

      // Guardar historial de votos del usuario
      const historialVotos: VotoUsuario = {
        puntoId,
        voto,
        timestamp: new Date().toISOString(),
      };

      // Guardar en historial global
      const historialGlobal = await AsyncStorage.getItem('historialVotosGlobal');
      const todoHistorial: VotoUsuario[] = historialGlobal ? JSON.parse(historialGlobal) : [];
      todoHistorial.push(historialVotos);
      await AsyncStorage.setItem('historialVotosGlobal', JSON.stringify(todoHistorial));

      const estadoActual = nuevosPuntos[puntoActual].estado;
      Alert.alert(
        'Éxito',
        `Tu voto por "${voto}" ha sido registrado\n\nEstado actual: ${estadoActual}`
      );

      // Avanzar al siguiente punto
      if (puntoActual < puntos.length - 1) {
        setTimeout(() => {
          setPuntoActual(puntoActual + 1);
        }, 1000);
      } else {
        Alert.alert('Votación finalizada', 'Has votado en todos los puntos', [
          { text: 'Ver Resultados', onPress: () => router.push('/Resultados') },
          { text: 'Volver', onPress: () => router.back() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo registrar el voto');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const porcentajeVotacion = Math.round(
    (votosUsuario.size / puntos.length) * 100
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {puntos.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Cargando propuestas...
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Progreso */}
          <View style={styles.progressContainer}>
            <Text style={[styles.progressText, { color: colors.text }]}>
              Propuesta {puntoActual + 1} de {puntos.length}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: colors.icon }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.tint,
                    width: `${porcentajeVotacion}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Tarjeta de propuesta */}
          <View style={[styles.tarjeta, { backgroundColor: colors.accent }]}>
            <Text style={styles.tarjetaTitle}>Propuesta #{puntoActual + 1}</Text>
            <Text style={[styles.tarjetaText, { color: '#333' }]}>
              {puntos[puntoActual].punto}
            </Text>
          </View>

          {/* Contadores de votos */}
          <View style={styles.contadores}>
            {BOTONES_VOTO.map((btn) => (
              <View key={btn.key} style={styles.contadorItem}>
                <Text style={[styles.contadorLabel, { color: colors.text }]}>
                  {btn.label}
                </Text>
                <Text
                  style={[
                    styles.contadorNumero,
                    { color: btn.color },
                  ]}
                >
                  {puntos[puntoActual]?.votos[btn.key] ?? 0}
                </Text>
              </View>
            ))}
          </View>

          {/* Botones de voto */}
          <View style={styles.botonesContainer}>
            {BOTONES_VOTO.map((btn) => (
              <TouchableOpacity
                key={btn.key}
                style={[
                  styles.botonVoto,
                  {
                    backgroundColor: btn.color,
                    opacity: votosUsuario.has(puntos[puntoActual].punto) ? 0.5 : 1,
                  },
                ]}
                onPress={() =>
                  registrarVoto(btn.key as 'si' | 'no' | 'ausente' | 'no_voto')
                }
                disabled={
                  votosUsuario.has(puntos[puntoActual].punto) || loading
                }
              >
                <Text style={styles.botonTexto}>{btn.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Botón Volver */}
          <TouchableOpacity
            style={[styles.botonVolver, { borderColor: colors.tint }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.botonVolverText, { color: colors.tint }]}>
              Volver
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tarjeta: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tarjetaTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    opacity: 0.7,
  },
  tarjetaText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
  },
  contadores: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  contadorItem: {
    alignItems: 'center',
  },
  contadorLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  contadorNumero: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  botonesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  botonVoto: {
    width: '48%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  botonTexto: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  botonVolver: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  botonVolverText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
