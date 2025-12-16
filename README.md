# 🏛️ Asamblea Digital

**Sistema de Votación para Asambleas Residenciales**

Aplicación híbrida desarrollada con React Native + Expo + TypeScript + Supabase para digitalizar y gestionar asambleas de conjuntos residenciales de manera segura, transparente y en tiempo real.

---

## 📋 Tabla de Contenidos

- [Características Principales](#-características-principales)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración de Supabase](#-configuración-de-supabase)
- [Ejecutar el Proyecto](#-ejecutar-el-proyecto)
- [Arquitectura](#-arquitectura)
- [Flujos de Usuario](#-flujos-de-usuario)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Base de Datos](#-base-de-datos)
- [Modelo de Votación](#-modelo-de-votación)
- [Seguridad](#-seguridad)
- [Testing](#-testing)
- [Despliegue](#-despliegue)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## ✨ Características Principales

### Para Administradores
- ✅ Crear y gestionar asambleas
- ✅ Generar códigos de acceso únicos
- ✅ Crear, abrir y cerrar propuestas de votación
- ✅ Ver resultados en tiempo real
- ✅ Controlar quórum de asistentes
- ✅ Historial completo de asambleas
- ✅ Cálculo automático de aprobación (regla 51%)

### Para Invitados
- ✅ Ingreso mediante código de acceso
- ✅ Registro validado por número de casa y propietario
- ✅ Sala de espera con actualización en tiempo real
- ✅ Votación simple (SI / NO)
- ✅ Visualización de resultados
- ✅ Un voto por casa (inmutable)

### Características Técnicas
- ✅ Tiempo real con Supabase Realtime
- ✅ Datos auditables e inmutables
- ✅ Cálculo automático de estadísticas
- ✅ Gráficas interactivas
- ✅ 4 estados por casa: SI, NO, NO_VOTO, NO_ASISTIO
- ✅ Responsive design
- ✅ TypeScript para type safety

---

## 🛠️ Tecnologías

### Frontend
- **React Native** - Framework para aplicaciones móviles
- **Expo** - Plataforma de desarrollo
- **TypeScript** - Tipado estático
- **React Navigation** - Navegación entre pantallas
- **React Native Chart Kit** - Gráficas y visualizaciones

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos relacional
- **Realtime** - Actualizaciones en tiempo real
- **Row Level Security** - Seguridad a nivel de filas

---

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v18 o superior)
- **npm** o **yarn**
- **Expo CLI** (se instalará automáticamente)
- **Cuenta en Supabase** (gratuita)

### Para desarrollo móvil:
- **Expo Go** app en tu dispositivo móvil (iOS/Android)
- O **Android Studio** / **Xcode** para emuladores

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/asamblea.git
cd asamblea
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env` y agrega tus credenciales de Supabase:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

---

## 🗄️ Configuración de Supabase

### 1. Crear Proyecto

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Guarda las credenciales

### 2. Ejecutar Schema SQL

1. Abre el proyecto en Supabase Dashboard
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `supabase/schema.sql`
4. Ejecuta el script

Esto creará:
- ✅ Todas las tablas (viviendas, propietarios, asambleas, asistencias, propuestas, votos)
- ✅ Índices optimizados
- ✅ Triggers automáticos
- ✅ Vistas para estadísticas
- ✅ Políticas RLS
- ✅ Datos de prueba (opcional)

### 3. Habilitar Realtime

1. Ve a **Database** > **Replication**
2. Habilita Realtime para las tablas:
   - `asambleas`
   - `propuestas`
   - `votos`
   - `asistencias`

### 4. Verificar Configuración

```bash
# Las credenciales deben estar en .env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Más detalles en [`supabase/README.md`](supabase/README.md)

---

## ▶️ Ejecutar el Proyecto

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm start
```

Esto abrirá Expo Developer Tools en tu navegador.

### Ejecutar en Dispositivo Físico

1. Descarga **Expo Go** en tu dispositivo
2. Escanea el QR code que aparece en la terminal
3. La app se cargará automáticamente

### Ejecutar en Emulador

```bash
# Android
npm run android

# iOS (solo en Mac)
npm run ios

# Web
npm run web
```

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────┐
│           React Native App              │
│  (Expo + TypeScript + Navigation)       │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│        Supabase Client SDK              │
│      (Realtime + PostgreSQL)            │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│          Supabase Backend               │
│  ┌─────────────────────────────────┐   │
│  │      PostgreSQL Database        │   │
│  ├─────────────────────────────────┤   │
│  │    Realtime Subscriptions       │   │
│  ├─────────────────────────────────┤   │
│  │   Row Level Security (RLS)      │   │
│  ├─────────────────────────────────┤   │
│  │     Triggers & Functions        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Componentes Principales

1. **Navegación**
   - Stack Navigator para flujos lineales
   - Separación clara entre rutas de Admin e Invitado

2. **Estado**
   - Estado local con React Hooks
   - Sincronización en tiempo real con Supabase

3. **Datos**
   - Consultas optimizadas con índices
   - Actualización automática vía Realtime
   - Validación en backend

---

## 👥 Flujos de Usuario

### Flujo del Invitado

```
1. Ingresar Código
   ↓
2. Registro (validado)
   ↓
3. Sala de Espera
   ↓
4. Votación (SI / NO)
   ↓
5. Ver Resultados
```

### Flujo del Administrador

```
1. Panel Principal
   ↓
2. Iniciar Asamblea
   ↓
3. Control de Asamblea
   ├─ Generar Código
   ├─ Crear Propuestas
   ├─ Ver Resultados (tiempo real)
   └─ Cerrar Asamblea
   ↓
4. Historial
```

---

## 📁 Estructura del Proyecto

```
asamblea/
├── App.tsx                      # Punto de entrada
├── src/
│   ├── components/              # Componentes reutilizables
│   ├── constants/
│   │   └── config.ts           # Configuración
│   ├── navigation/
│   │   └── AppNavigator.tsx    # Navegación principal
│   ├── screens/
│   │   ├── admin/              # Pantallas de admin
│   │   │   ├── PanelAdminScreen.tsx
│   │   │   ├── ControlAsambleaScreen.tsx
│   │   │   ├── CrearPropuestaScreen.tsx
│   │   │   ├── ResultadosScreen.tsx
│   │   │   └── HistorialScreen.tsx
│   │   ├── invitado/           # Pantallas de invitado
│   │   │   ├── IngresoCodigoScreen.tsx
│   │   │   ├── RegistroInvitadoScreen.tsx
│   │   │   ├── SalaEsperaScreen.tsx
│   │   │   └── VotacionScreen.tsx
│   │   └── common/             # Pantallas comunes
│   │       └── HomeScreen.tsx
│   ├── services/
│   │   └── supabase.ts         # Cliente Supabase
│   ├── types/
│   │   └── database.types.ts   # Tipos TypeScript
│   └── utils/                  # Utilidades
├── supabase/
│   ├── schema.sql              # Esquema de BD
│   └── README.md               # Docs de Supabase
├── .env.example                # Template de variables
├── package.json
└── README.md
```

---

## 🗄️ Base de Datos

### Tablas Principales

#### `viviendas`
- Registro de todas las casas del conjunto
- `numero_casa`: Identificador único

#### `propietarios`
- Datos de propietarios vinculados a viviendas
- Usado para validación de registro

#### `asambleas`
- Registro de cada asamblea
- `codigo_acceso`: Código único de 6 caracteres
- `estado`: ABIERTA / CERRADA

#### `asistencias`
- Se crea solo cuando una casa ingresa
- Una por casa por asamblea
- Cambia estado de NO_ASISTIO → NO_VOTO

#### `propuestas`
- Preguntas para votación
- Estados: BORRADOR → ABIERTA → CERRADA
- Contadores automáticos (votos_si, votos_no, total_votos)

#### `votos`
- Solo guarda SI / NO
- Un voto por casa por propuesta
- Inmutable (no editable)

### Relaciones

```
viviendas ─────────┐
    │              │
    │              │
propietarios       │
                   │
asambleas ─────────┼─── asistencias
    │              │         │
    │              │         │
propuestas ────────┴─── votos
```

---

## 🗳️ Modelo de Votación

### 4 Estados por Casa

1. **SI** - Voto a favor (guardado en BD)
2. **NO** - Voto en contra (guardado en BD)
3. **NO_VOTO** - Asistió pero no votó (calculado)
4. **NO_ASISTIO** - No se registró (calculado)

### Cálculos Automáticos

```typescript
// Estados calculados (NO se guardan)
NO_VOTO = Total_Asistentes - Total_Votos
NO_ASISTIO = Total_Casas - Total_Asistentes

// Regla de aprobación (51%)
Aprobada = (SI / (SI + NO)) >= 0.51
```

### Flujo de Estados

```
Todas las casas: NO_ASISTIO (por defecto)
    ↓
Casa ingresa: NO_ASISTIO → NO_VOTO
    ↓
Casa vota: NO_VOTO → SI / NO
```

### Resultados en Tiempo Real

Los gráficos se actualizan automáticamente cuando:
- ✅ Entra un nuevo asistente
- ✅ Alguien emite un voto
- ✅ Se cierra una propuesta

---

## 🔐 Seguridad

### Validaciones

- ✅ Código de acceso único por asamblea
- ✅ Validación de propietario contra BD
- ✅ Un voto por casa por propuesta
- ✅ Un registro por casa por asamblea
- ✅ Votos inmutables

### Controles Backend

- ✅ Triggers para actualización automática
- ✅ Constraints en base de datos
- ✅ Row Level Security (RLS)
- ✅ Validación de estados

### Políticas RLS

Actualmente configuradas en modo permisivo para desarrollo.

**Para producción:**
1. Implementar autenticación de administradores
2. Restringir acceso a tablas sensibles
3. Auditar logs de cambios

---

## 🧪 Testing

### Datos de Prueba

El script SQL incluye datos de ejemplo:
- 15 viviendas (101-105, 201-205, 301-305)
- Propietarios generados aleatoriamente

### Crear Asamblea de Prueba

1. Abrir app como Admin
2. Iniciar Nueva Asamblea
3. Copiar código generado
4. Abrir app como Invitado
5. Ingresar código y registrarse

### Escenarios de Prueba

- ✅ Registro con datos válidos
- ✅ Registro con datos inválidos
- ✅ Votación única por casa
- ✅ Propuestas múltiples
- ✅ Cálculo de aprobación
- ✅ Actualización en tiempo real

---

## 🚀 Despliegue

### Build para Producción

#### Android (APK)

```bash
eas build --platform android
```

#### iOS (IPA)

```bash
eas build --platform ios
```

#### Web

```bash
npm run web
npx expo export:web
```

### Configuración EAS

1. Instalar EAS CLI:
```bash
npm install -g eas-cli
```

2. Configurar proyecto:
```bash
eas build:configure
```

3. Build:
```bash
eas build --platform all
```

### Variables de Entorno en Producción

Asegúrate de configurar en Expo:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

---

## 🤝 Contribución

### Cómo Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Guía de Estilo

- Usar TypeScript estricto
- Seguir convenciones de React/React Native
- Documentar funciones complejas
- Escribir tests para nueva funcionalidad

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

---

## 📞 Soporte

Para preguntas o problemas:
- Crear un [Issue](https://github.com/nexiisin/asamblea/issues)
- Email: soporte@asamblea.app

---

## 🙏 Agradecimientos

- Equipo de Expo
- Equipo de Supabase
- Comunidad de React Native

---

**Desarrollado con ❤️ para digitalizar asambleas residenciales**

🏛️ Asamblea Digital - Sistema de Votación Confiable y Transparente
