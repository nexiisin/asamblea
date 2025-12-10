import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';

interface BarraPorcentajeProps {
  si: number;
  no: number;
  ausente: number;
  no_voto: number;
  height?: number;
  showLabels?: boolean;
  style?: ViewStyle;
}

export const BarraPorcentaje: React.FC<BarraPorcentajeProps> = ({
  si,
  no,
  ausente,
  no_voto,
  height = 16,
  showLabels = true,
  style,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const barWidth = screenWidth - 32; // padding: 16 * 2

  // Calcular total y porcentajes
  const total = si + no + ausente + no_voto;
  const porcentajeSi = total > 0 ? (si / total) * 100 : 0;
  const porcentajeNo = total > 0 ? (no / total) * 100 : 0;
  const porcentajeOtros = total > 0 ? ((ausente + no_voto) / total) * 100 : 0;

  // Animated values
  const animSi = useRef(new Animated.Value(0)).current;
  const animNo = useRef(new Animated.Value(0)).current;
  const animOtros = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animar las barras
    Animated.parallel([
      Animated.timing(animSi, {
        toValue: porcentajeSi,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(animNo, {
        toValue: porcentajeNo,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.timing(animOtros, {
        toValue: porcentajeOtros,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, [si, no, ausente, no_voto]);

  // Interpolar anchos
  const widthSi = animSi.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const widthNo = animNo.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const widthOtros = animOtros.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, style]}>
      {/* Barra principal */}
      <View
        style={[
          styles.barraContainer,
          { height, width: barWidth },
        ]}
      >
        {/* Sección Sí (Verde) */}
        <Animated.View
          style={[
            styles.seccion,
            styles.seccionSi,
            { width: widthSi, height },
          ]}
        />

        {/* Sección No (Rojo) */}
        <Animated.View
          style={[
            styles.seccion,
            styles.seccionNo,
            { width: widthNo, height },
          ]}
        />

        {/* Sección Otros (Gris) */}
        <Animated.View
          style={[
            styles.seccion,
            styles.seccionOtros,
            { width: widthOtros, height },
          ]}
        />
      </View>

      {/* Etiquetas con porcentajes */}
      {showLabels && (
        <View style={styles.labelsContainer}>
          <View style={styles.labelItem}>
            <View style={[styles.labelDot, styles.dotSi]} />
            <Text style={styles.labelText}>
              Sí: {porcentajeSi.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.labelItem}>
            <View style={[styles.labelDot, styles.dotNo]} />
            <Text style={styles.labelText}>
              No: {porcentajeNo.toFixed(1)}%
            </Text>
          </View>

          <View style={styles.labelItem}>
            <View style={[styles.labelDot, styles.dotOtros]} />
            <Text style={styles.labelText}>
              Otros: {porcentajeOtros.toFixed(1)}%
            </Text>
          </View>
        </View>
      )}

      {/* Contadores numéricos (opcional) */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#00C851' }]}>{si}</Text>
          <Text style={styles.statLabel}>Sí</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#ff4444' }]}>{no}</Text>
          <Text style={styles.statLabel}>No</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#ffbb33' }]}>{ausente}</Text>
          <Text style={styles.statLabel}>Ausente</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#999999' }]}>
            {no_voto}
          </Text>
          <Text style={styles.statLabel}>No votó</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  barraContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  seccion: {
    flexDirection: 'row',
  },
  seccionSi: {
    backgroundColor: '#00C851',
  },
  seccionNo: {
    backgroundColor: '#ff4444',
  },
  seccionOtros: {
    backgroundColor: '#999999',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotSi: {
    backgroundColor: '#00C851',
  },
  dotNo: {
    backgroundColor: '#ff4444',
  },
  dotOtros: {
    backgroundColor: '#999999',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
});
