import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Button,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarraPorcentaje } from '@/components/BarraPorcentaje';
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

export default function Resultados() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [puntos, setPuntos] = useState<VotacionPunto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarResultados();
  }, []);

  const cargarResultados = async () => {
    try {
      const puntosGuardados = await AsyncStorage.getItem('votacionPuntos');
      if (puntosGuardados) {
        const datos = JSON.parse(puntosGuardados);
        setPuntos(datos);
      }
    } catch (error) {
      console.error('Error cargando resultados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado?: string) => {
    switch (estado) {
      case 'aprobado':
        return '#00C851';
      case 'desaprobado':
        return '#ff4444';
      default:
        return '#ffbb33';
    }
  };

  const totalVotantes = puntos.length > 0
    ? puntos[0].votos.si +
      puntos[0].votos.no +
      puntos[0].votos.ausente +
      puntos[0].votos.no_voto
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Cargando resultados...
          </Text>
        </View>
      ) : puntos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No hay datos de votación
          </Text>
          <View style={styles.spacer} />
          <Button title="Volver" color={colors.tint} onPress={() => router.back()} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Encabezado con resumen */}
          <View style={[styles.headerCard, { backgroundColor: colors.accent }]}>
            <Text style={styles.headerTitle}>Resultados de Votación</Text>
            <Text style={[styles.headerSubtitle, { color: '#333' }]}>
              Total de votantes: {totalVotantes}
            </Text>
          </View>

          {/* Lista de puntos con barras */}
          {puntos.map((punto, index) => (
            <View key={punto.id} style={styles.puntoContainer}>
              <View style={styles.puntoHeader}>
                <View style={styles.puntoTitleContainer}>
                  <Text style={[styles.puntoNumber, { color: colors.tint }]}>
                    #{index + 1}
                  </Text>
                  <Text
                    style={[styles.puntoTitle, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {punto.punto}
                  </Text>
                </View>
                <View
                  style={[
                    styles.estadoBadge,
                    {
                      backgroundColor: getEstadoColor(punto.estado),
                    },
                  ]}
                >
                  <Text style={styles.estadoText}>
                    {punto.estado?.toUpperCase() || 'PENDIENTE'}
                  </Text>
                </View>
              </View>

              {/* Barra de porcentajes */}
              <BarraPorcentaje
                si={punto.votos.si}
                no={punto.votos.no}
                ausente={punto.votos.ausente}
                no_voto={punto.votos.no_voto}
                height={20}
                showLabels={true}
              />
            </View>
          ))}

          {/* Botón de volver */}
          <View style={styles.buttonContainer}>
            <Button
              title="Volver a Historial"
              color={colors.tint}
              onPress={() => router.push('/Historial')}
            />
          </View>

          <View style={styles.spacer} />
          <Button title="Volver" color={colors.icon} onPress={() => router.back()} />
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
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 16,
  },
  headerCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 8,
  },
  puntoContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  puntoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  puntoTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  puntoNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 30,
  },
  puntoTitle: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  estadoText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  buttonContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  spacer: {
    height: 16,
  },
});
