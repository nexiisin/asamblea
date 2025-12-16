import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// Pantallas comunes
import HomeScreen from '../screens/common/HomeScreen';

// Pantallas de Invitado
import IngresoCodigoScreen from '../screens/invitado/IngresoCodigoScreen';
import RegistroInvitadoScreen from '../screens/invitado/RegistroInvitadoScreen';
import SalaEsperaScreen from '../screens/invitado/SalaEsperaScreen';
import VotacionScreen from '../screens/invitado/VotacionScreen';

// Pantallas de Admin
import PanelAdminScreen from '../screens/admin/PanelAdminScreen';
import ControlAsambleaScreen from '../screens/admin/ControlAsambleaScreen';
import CrearPropuestaScreen from '../screens/admin/CrearPropuestaScreen';
import ResultadosScreen from '../screens/admin/ResultadosScreen';
import HistorialScreen from '../screens/admin/HistorialScreen';

export type RootStackParamList = {
  // Común
  Home: undefined;
  
  // Invitado
  IngresoCodigo: undefined;
  RegistroInvitado: { asambleaId: string; codigoAcceso: string };
  SalaEspera: { asambleaId: string; asistenciaId: string; numeroCasa: string };
  Votacion: { asambleaId: string; asistenciaId: string; viviendaId: string; numeroCasa: string };
  
  // Admin
  PanelAdmin: undefined;
  ControlAsamblea: { asambleaId: string };
  CrearPropuesta: { asambleaId: string };
  Resultados: { asambleaId: string; propuestaId?: string };
  Historial: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2563eb',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Común */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Asamblea Digital' }}
        />
        
        {/* Invitado */}
        <Stack.Screen 
          name="IngresoCodigo" 
          component={IngresoCodigoScreen} 
          options={{ title: 'Ingresar Código' }}
        />
        <Stack.Screen 
          name="RegistroInvitado" 
          component={RegistroInvitadoScreen} 
          options={{ title: 'Registro' }}
        />
        <Stack.Screen 
          name="SalaEspera" 
          component={SalaEsperaScreen} 
          options={{ title: 'Sala de Espera' }}
        />
        <Stack.Screen 
          name="Votacion" 
          component={VotacionScreen} 
          options={{ title: 'Votación' }}
        />
        
        {/* Admin */}
        <Stack.Screen 
          name="PanelAdmin" 
          component={PanelAdminScreen} 
          options={{ title: 'Panel Administrativo' }}
        />
        <Stack.Screen 
          name="ControlAsamblea" 
          component={ControlAsambleaScreen} 
          options={{ title: 'Control de Asamblea' }}
        />
        <Stack.Screen 
          name="CrearPropuesta" 
          component={CrearPropuestaScreen} 
          options={{ title: 'Nueva Propuesta' }}
        />
        <Stack.Screen 
          name="Resultados" 
          component={ResultadosScreen} 
          options={{ title: 'Resultados' }}
        />
        <Stack.Screen 
          name="Historial" 
          component={HistorialScreen} 
          options={{ title: 'Historial' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
