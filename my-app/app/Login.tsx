import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAsamblea } from '@/context/AsambleaContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface MenuItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

export default function Home() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { asistentes, casasEscaneadas, puntosVotacion, loading } = useAsamblea();

  const [selectedMenu, setSelectedMenu] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    {
      id: '3',
      label: 'Iniciar Votación',
      description: `${puntosVotacion.length} puntos`,
      icon: '🗳️',
      route: '/Votacion',
      color: '#ffbb33',
    },
    {
      id: '4',
      label: 'Ver Resultados',
      description: 'Estadísticas en vivo',
      icon: '📊',
      route: '/Resultados',
      color: '#ff6b6b',
    },
    {
      id: '5',
      label: 'Cronómetro',
      description: 'Control de tiempo',
      icon: '⏱️',
      route: '/Cronometro',
      color: '#4ECDC4',
    },
    {
      id: '6',
      label: 'Historial',
      description: 'Registro de votos',
      icon: '📋',
      route: '/Historial',
      color: '#9b59b6',
    },
  ];

  const handleNavigation = (route: string) => {
    setSelectedMenu(route);
    setTimeout(() => {
      router.push(route as any);
    }, 200);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Cargando AsambleApp...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.headerBadge,
              { backgroundColor: colors.tint },
            ]}
          >
            <Text style={styles.headerBadgeIcon}>🏛️</Text>
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            AsambleApp
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
            Sistema de Votación
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            label="Asistentes"
            value={asistentes.length.toString()}
            icon="👥"
            bgColor={colors.tint}
          />
          <StatCard
            label="Confirmados"
            value={casasEscaneadas.length.toString()}
            icon="✓"
            bgColor="#00C851"
          />
          <StatCard
            label="Puntos"
            value={puntosVotacion.length.toString()}
            icon="🗳️"
            bgColor="#ffbb33"
          />
        </View>

        {/* Menu Grid */}
        <View style={styles.gridContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuCard,
                {
                  backgroundColor: colors.background,
                  borderColor: item.color,
                  opacity: selectedMenu === item.route ? 0.7 : 1,
                },
              ]}
              onPress={() => handleNavigation(item.route)}
              activeOpacity={0.7}
            >
              {/* Indicador de color */}
              <View
                style={[
                  styles.colorBar,
                  { backgroundColor: item.color },
                ]}
              />

              {/* Icono grande */}
              <Text style={styles.cardIcon}>{item.icon}</Text>

              {/* Contenido */}
              <Text style={[styles.cardLabel, { color: colors.text }]}>
                {item.label}
              </Text>
              <Text style={[styles.cardDescription, { color: colors.icon }]}>
                {item.description}
              </Text>

              {/* Arrow */}
              <Text style={styles.cardArrow}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer Info */}
        <View style={[styles.footerInfo, { borderTopColor: colors.icon }]}>
          <Text style={[styles.footerText, { color: colors.icon }]}>
            {puntosVotacion.filter((p) => p.estado === 'aprobado').length} aprobados • 
            {puntosVotacion.filter((p) => p.estado === 'desaprobado').length} desaprobados
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  bgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, bgColor }) => (
  <View style={[styles.statCard, { backgroundColor: bgColor }]}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
  },
  headerBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerBadgeIcon: {
    fontSize: 40,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    gap: 12,
    marginBottom: 24,
  },
  menuCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 5,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  colorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardIcon: {
    fontSize: 36,
    marginBottom: 8,
    marginTop: 8,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 11,
    marginBottom: 12,
    lineHeight: 16,
  },
  cardArrow: {
    fontSize: 16,
    position: 'absolute',
    right: 12,
    bottom: 12,
    opacity: 0.5,
  },
  footerInfo: {
    marginHorizontal: 16,
    paddingTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    textAlign: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
