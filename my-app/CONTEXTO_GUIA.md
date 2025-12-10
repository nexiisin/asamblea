# AsambleaContext - Guía de Uso

## Overview
`AsambleaContext` es un Context global que centraliza todo el estado de la aplicación de asambleas. Proporciona métodos para manejar asistentes, QR, votación e historial.

## Importar el Hook

```tsx
import { useAsamblea } from '@/context/AsambleaContext';
```

## Uso en Componentes

```tsx
export default function MiComponente() {
  const {
    asistentes,
    casasEscaneadas,
    puntosVotacion,
    votosUsuarios,
    estadoAsamblea,
    loading,
    addAsistente,
    confirmarQR,
    registrarVoto,
    setEstadoAsamblea,
    limpiarSesion,
  } = useAsamblea();

  // Usar el estado y métodos...
}
```

## Métodos Disponibles

### 1. `addAsistente(asistenteData)`
Agrega un nuevo asistente al registro.

```tsx
try {
  await addAsistente({
    numeroCasa: '42A',
    nombrePropietario: 'Juan Pérez',
    cedula: '1234567890',
    numeroPersonasAutorizadas: '5',
  });
} catch (error) {
  console.error('Error:', error.message); // "Esta cédula ya está registrada"
}
```

### 2. `confirmarQR(numeroCasa, nombrePropietario)`
Confirma que una casa fue escaneada exitosamente.

```tsx
try {
  await confirmarQR('42A', 'Juan Pérez');
} catch (error) {
  console.error('Error:', error.message); // "Asistente no registrado"
}
```

### 3. `registrarVoto(cedula, puntoId, voto)`
Registra el voto de un usuario en un punto de votación.

```tsx
try {
  await registrarVoto('1234567890', 'punto-1', 'si');
} catch (error) {
  console.error('Error:', error.message); // "Ya has votado en esta propuesta"
}
```

### 4. `setEstadoAsamblea(estado)`
Actualiza el estado global de la asamblea.

```tsx
setEstadoAsamblea('votacion'); // 'registro' | 'escaneo' | 'votacion' | 'resultados' | 'cerrada'
```

### 5. `limpiarSesion()`
Limpia todos los datos y reinicia la aplicación.

```tsx
await limpiarSesion();
// Elimina: asistentes, casasEscaneadas, puntosVotacion, votosUsuarios
// Reinicia estado a 'registro'
```

### 6. `cargarDatos()`
Recarga todos los datos desde AsyncStorage.

```tsx
await cargarDatos();
```

## Estado Global

```tsx
const {
  asistentes,        // Asistente[]
  casasEscaneadas,   // CasaEscaneada[]
  puntosVotacion,    // VotacionPunto[]
  votosUsuarios,     // VotoUsuario[]
  estadoAsamblea,    // 'registro' | 'escaneo' | 'votacion' | 'resultados' | 'cerrada'
  loading,           // boolean
} = useAsamblea();
```

## Tipos de Datos

```tsx
interface Asistente {
  id: string;
  numeroCasa: string;
  nombrePropietario: string;
  cedula: string;
  numeroPersonasAutorizadas: string;
  fecha: string;
}

interface CasaEscaneada {
  id: string;
  numeroCasa: string;
  nombrePropietario: string;
  fecha: string;
}

interface VotoUsuario {
  id: string;
  cedula: string;
  puntoId: string;
  voto: 'si' | 'no' | 'ausente' | 'no_voto';
  timestamp: string;
}

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
```

## Ejemplo Completo

```tsx
import React from 'react';
import { View, Button, Text } from 'react-native';
import { useAsamblea } from '@/context/AsambleaContext';

export default function Dashboard() {
  const {
    asistentes,
    casasEscaneadas,
    puntosVotacion,
    estadoAsamblea,
    loading,
    setEstadoAsamblea,
    limpiarSesion,
  } = useAsamblea();

  if (loading) {
    return <Text>Cargando...</Text>;
  }

  return (
    <View>
      <Text>Asistentes registrados: {asistentes.length}</Text>
      <Text>Casas escaneadas: {casasEscaneadas.length}</Text>
      <Text>Puntos de votación: {puntosVotacion.length}</Text>
      <Text>Estado: {estadoAsamblea}</Text>

      <Button
        title="Ir a Votación"
        onPress={() => setEstadoAsamblea('votacion')}
      />

      <Button
        title="Limpiar Sesión"
        onPress={() => limpiarSesion()}
        color="red"
      />
    </View>
  );
}
```

## Persistencia

Todos los datos se guardan automáticamente en `AsyncStorage` bajo las siguientes claves:
- `'asistentes'`
- `'casasEscaneadas'`
- `'votacionPuntos'`
- `'votosUsuarios'`

Los datos se cargan automáticamente al iniciar la aplicación.

## Validaciones

El Context incluye validaciones automáticas:
- ✅ Evita cédulas duplicadas en registro
- ✅ Verifica que el asistente esté registrado antes de escanear QR
- ✅ Evita votos duplicados por usuario en el mismo punto
- ✅ Calcula automáticamente estado de aprobación (≥51% Sí = aprobado)
