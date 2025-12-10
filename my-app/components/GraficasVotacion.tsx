import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';

interface GraficasVotacionProps {
  si: number;
  no: number;
  ausente: number;
  no_voto: number;
  maxHeight?: number;
  style?: ViewStyle;
}

interface BarData {
  label: string;
  value: number;
  color: string;
  key: 'si' | 'no' | 'ausente' | 'no_voto';
}

export const GraficasVotacion: React.FC<GraficasVotacionProps> = ({
  si,
  no,
  ausente,
  no_voto,
  maxHeight = 250,
  style,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const containerWidth = screenWidth - 32; // padding 16 * 2
  const barWidth = containerWidth / 4 - 12; // 4 columnas con gap

  // Calcular total y porcentajes
  const total = si + no + ausente + no_voto;
  const porcentajeSi = total > 0 ? (si / total) * 100 : 0;
  const porcentajeNo = total > 0 ? (no / total) * 100 : 0;
  const porcentajeAusente = total > 0 ? (ausente / total) * 100 : 0;
  const porcentajeNoVoto = total > 0 ? (no_voto / total) * 100 : 0;

  const barsData: BarData[] = [
    {
      label: 'Sí',
      value: si,
      color: '#00C851',
      key: 'si',
    },
    {
      label: 'No',
      value: no,
      color: '#ff4444',
      key: 'no',
    },
    {
      label: 'Ausente',
      value: ausente,
      color: '#ffeb3b',
      key: 'ausente',
    },
    {
      label: 'No votó',
      value: no_voto,
      color: '#9e9e9e',
      key: 'no_voto',
    },
  ];

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.chartContainer, { width: containerWidth }]}>
        {barsData.map((bar) => {
          const porcentaje =
            bar.key === 'si'
              ? porcentajeSi
              : bar.key === 'no'
              ? porcentajeNo
              : bar.key === 'ausente'
              ? porcentajeAusente
              : porcentajeNoVoto;

          return (
            <BarraVotacion
              key={bar.key}
              label={bar.label}
              value={bar.value}
              porcentaje={porcentaje}
              color={bar.color}
              maxHeight={maxHeight}
              barWidth={barWidth}
            />
          );
        })}
      </View>
    </View>
  );
};

interface BarraVotacionProps {
  label: string;
  value: number;
  porcentaje: number;
  color: string;
  maxHeight: number;
  barWidth: number;
}

const BarraVotacion: React.FC<BarraVotacionProps> = ({
  label,
  value,
  porcentaje,
  color,
  maxHeight,
  barWidth,
}) => {
  const animHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animHeight, {
      toValue: (porcentaje / 100) * maxHeight,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [porcentaje, maxHeight]);

  const heightInterpolation = animHeight.interpolate({
    inputRange: [0, maxHeight],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.barContainer, { width: barWidth }]}>
      {/* Contenedor de la barra */}
      <View style={[styles.barWrapper, { height: maxHeight }]}>
        {/* Barra animada cilíndrica 3D */}
        <Animated.View
          style={[
            styles.bar3D,
            {
              backgroundColor: color,
              height: animHeight,
              width: barWidth,
            },
          ]}
        >
          {/* Efecto 3D: sombra superior */}
          <View
            style={[
              styles.barTop,
              {
                backgroundColor: color,
                borderTopLeftRadius: barWidth / 2,
                borderTopRightRadius: barWidth / 2,
              },
            ]}
          />

          {/* Brillo lateral izquierdo */}
          <View
            style={[
              styles.barShineLeft,
              {
                left: 0,
                backgroundColor: 'rgba(255,255,255,0.15)',
              },
            ]}
          />

          {/* Brillo lateral derecho */}
          <View
            style={[
              styles.barShineRight,
              {
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.1)',
              },
            ]}
          />
        </Animated.View>

        {/* Sombra base */}
        <View
          style={[
            styles.barShadow,
            {
              borderColor: color,
              borderTopLeftRadius: barWidth / 2,
              borderTopRightRadius: barWidth / 2,
            },
          ]}
        />
      </View>

      {/* Información debajo */}
      <View style={styles.infoContainer}>
        <Text style={styles.labelText}>{label}</Text>
        <Text style={[styles.porcentajeText, { color }]}>
          {porcentaje.toFixed(1)}%
        </Text>
        <Text style={styles.votosText}>({value} votos)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  barContainer: {
    alignItems: 'center',
    gap: 12,
  },
  barWrapper: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  bar3D: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    position: 'relative',
  },
  barTop: {
    position: 'absolute',
    top: -4,
    left: 0,
    right: 0,
    height: 8,
    opacity: 0.6,
  },
  barShineLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '20%',
    borderTopLeftRadius: 12,
  },
  barShineRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '15%',
    borderTopRightRadius: 12,
  },
  barShadow: {
    position: 'absolute',
    bottom: -8,
    left: -2,
    right: -2,
    height: 6,
    borderWidth: 1,
    borderColor: '#000',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    opacity: 0.2,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  porcentajeText: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  votosText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '500',
  },
});
