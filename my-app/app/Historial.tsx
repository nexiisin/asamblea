import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Button,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
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

export default function Historial() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [puntos, setPuntos] = useState<VotacionPunto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      cargarHistorial();
    }, [])
  );

  const cargarHistorial = async () => {
    try {
      const puntosGuardados = await AsyncStorage.getItem('votacionPuntos');
      if (puntosGuardados) {
        const datos = JSON.parse(puntosGuardados);
        setPuntos(datos);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    cargarHistorial().then(() => setRefreshing(false));
  }, []);

  const calcularPorcentajes = (votos: VotacionPunto['votos']) => {
    const total = votos.si + votos.no + votos.ausente + votos.no_voto;
    if (total === 0) {
      return {
        si: 0,
        no: 0,
        ausente: 0,
        no_voto: 0,
      };
    }
    return {
      si: (votos.si / total) * 100,
      no: (votos.no / total) * 100,
      ausente: (votos.ausente / total) * 100,
      no_voto: (votos.no_voto / total) * 100,
    };
  };

  const getColorTarjeta = (estado?: string) => {
    switch (estado) {
      case 'aprobado':
        return '#00C851';
      case 'desaprobado':
        return '#ff4444';
      default:
        return '#ffbb33';
    }
  };

  const getTextoEstado = (estado?: string) => {
    switch (estado) {
      case 'aprobado':
        return '✓ APROBADO';
      case 'desaprobado':
        return '✗ DESAPROBADO';
      default:
        return '⏳ PENDIENTE';
    }
  };

  const renderTarjetaPunto = ({ item, index }: { item: VotacionPunto; index: number }) => {
    const porcentajes = calcularPorcentajes(item.votos);
    const colorTarjeta = getColorTarjeta(item.estado);
    const textoEstado = getTextoEstado(item.estado);

    return (
      <View
        style={[
          styles.tarjeta,
          {
            borderLeftColor: colorTarjeta,
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Encabezado */}
        <View style={styles.tarjetaHeader}>
          <View style={styles.headerTitulo}>
            <Text style={[styles.puntoNumero, { color: colors.tint }]}>
              Punto #{index + 1}
            </Text>
            <Text
              style={[styles.puntoTexto, { color: colors.text }]}
              numberOfLines={2}
            >
              {item.punto}
            </Text>
          </View>

          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: colorTarjeta },
            ]}
          >
            <Text style={styles.estadoTexto}>{textoEstado}</Text>
          </View>
        </View>

        {/* Divider */}
        <View
          style={[
            styles.divider,
            { backgroundColor: colors.icon },
          ]}
        />

        {/* Porcentajes */}
        <View style={styles.porcentajesContainer}>
          <PorcentajeItem
            label="Sí"
            porcentaje={porcentajes.si}
            votos={item.votos.si}
            color="#00C851"
          />
          <PorcentajeItem
            label="No"
            porcentaje={porcentajes.no}
            votos={item.votos.no}
            color="#ff4444"
          />
          <PorcentajeItem
            label="Ausente"
            porcentaje={porcentajes.ausente}
            votos={item.votos.ausente}
            color="#ffbb33"
          />
          <PorcentajeItem
            label="No votó"
            porcentaje={porcentajes.no_voto}
            votos={item.votos.no_voto}
            color="#999999"
          />
        </View>

        {/* Total de votos */}
        <View
          style={[
            styles.totalVotos,
            { borderTopColor: colors.icon },
          ]}
        >
          <Text style={[styles.totalVotosTexto, { color: colors.icon }]}>
            Total de votos: {item.votos.si + item.votos.no + item.votos.ausente + item.votos.no_voto}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Cargando historial...
          </Text>
        </View>
      ) : puntos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No hay votos registrados
          </Text>
          <View style={styles.spacer} />
          <Button
            title="Volver"
            color={colors.tint}
            onPress={() => router.back()}
          />
        </View>
      ) : (
        <>
          {/* Encabezado con contador */}
          <View style={[styles.header, { borderBottomColor: colors.icon }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Historial de Votación
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
              {puntos.length} propuesta{puntos.length !== 1 ? 's' : ''} votada{puntos.length !== 1 ? 's' : ''}
            </Text>
          </View>

          <FlatList
            data={puntos}
            renderItem={renderTarjetaPunto}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.tint]}
                tintColor={colors.tint}
              />
            }
            ListFooterComponent={
              <View style={styles.footer}>
                <Button
                  title="Ir a Votación"
                  color={colors.tint}
                  onPress={() => router.push('/Votacion')}
                />
                <View style={styles.spacer} />
                <Button
                  title="Volver"
                  color={colors.icon}
                  onPress={() => router.back()}
                />
              </View>
            }
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
          />
        </>
      )}
    </SafeAreaView>
  );
}

interface PorcentajeItemProps {
  label: string;
  porcentaje: number;
  votos: number;
  color: string;
}

const PorcentajeItem: React.FC<PorcentajeItemProps> = ({
  label,
  porcentaje,
  votos,
  color,
}) => (
  <View style={styles.porcentajeItem}>
    <View style={styles.porcentajeLabel}>
      <View style={[styles.colorDot, { backgroundColor: color }]} />
      <Text style={styles.labelText}>{label}</Text>
    </View>
    <View style={styles.porcentajeValores}>
      <Text style={[styles.porcentajeTexto, { color }]}>
        {porcentaje.toFixed(1)}%
      </Text>
      <Text style={styles.votosTexto}>({votos})</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tarjeta: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  tarjetaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerTitulo: {
    flex: 1,
  },
  puntoNumero: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  puntoTexto: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  estadoTexto: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 10,
    opacity: 0.2,
  },
  porcentajesContainer: {
    marginBottom: 10,
  },
  porcentajeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  porcentajeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  porcentajeValores: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  porcentajeTexto: {
    fontSize: 13,
    fontWeight: '700',
  },
  votosTexto: {
    fontSize: 11,
    color: '#999',
    marginLeft: 6,
  },
  totalVotos: {
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  totalVotosTexto: {
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
  },
  spacer: {
    height: 8,
  },
});

