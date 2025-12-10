import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AsambleaProvider } from '@/context/AsambleaContext';

export const unstable_settings = {
  anchor: 'Login',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AsambleaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: true }}>
          <Stack.Screen name="Login" options={{ title: 'Home', headerShown: false }} />
          <Stack.Screen name="RegistrarAsistentes" options={{ title: 'Registrar asistentes' }} />
          <Stack.Screen name="EscanearQR" options={{ title: 'Escanear QR' }} />
          <Stack.Screen name="Votacion" options={{ title: 'Votación' }} />
          <Stack.Screen name="Resultados" options={{ title: 'Resultados' }} />
          <Stack.Screen name="Historial" options={{ title: 'Historial' }} />
          <Stack.Screen name="Cronometro" options={{ title: 'Cronómetro' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AsambleaProvider>
  );
}

