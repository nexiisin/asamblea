# Configuración de Supabase

Este directorio contiene el esquema de la base de datos y configuraciones relacionadas con Supabase.

## Configuración Inicial

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una nueva cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Guarda las credenciales:
   - **URL del proyecto**: `https://tu-proyecto.supabase.co`
   - **Anon/Public Key**: `eyJhbG...`

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita `.env` y agrega tus credenciales de Supabase:

```
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 3. Ejecutar el Esquema de Base de Datos

1. Abre el proyecto en Supabase Dashboard
2. Ve a **SQL Editor**
3. Copia y pega el contenido de `schema.sql`
4. Ejecuta el script

Esto creará:
- ✅ Todas las tablas necesarias
- ✅ Índices para optimizar consultas
- ✅ Triggers para actualización automática
- ✅ Vistas para estadísticas
- ✅ Políticas RLS básicas
- ✅ Datos de prueba (opcional)

## Estructura de Tablas

### `viviendas`
- Todas las casas del conjunto
- Identificadas por `numero_casa`

### `propietarios`
- Datos de propietarios
- Vinculados a viviendas
- Validación de nombres

### `asambleas`
- Registro de asambleas
- Código de acceso único
- Estado: ABIERTA/CERRADA

### `asistencias`
- Solo se crea cuando una casa ingresa
- Una asistencia por casa por asamblea
- Cambia estado de NO_ASISTIO a NO_VOTO

### `propuestas`
- Preguntas para votar
- Estados: BORRADOR/ABIERTA/CERRADA
- Contadores automáticos

### `votos`
- Solo guarda SI / NO
- NO_VOTO y NO_ASISTIO se calculan
- Un voto por casa por propuesta

## Realtime

Para habilitar Realtime en las tablas necesarias:

1. Ve a **Database** > **Replication**
2. Habilita Realtime para:
   - `asambleas`
   - `propuestas`
   - `votos`
   - `asistencias`

## Seguridad

Las políticas RLS están configuradas de forma permisiva para desarrollo.

**Para producción**, debes:
1. Implementar autenticación de administradores
2. Ajustar políticas RLS
3. Restringir accesos según roles

## Testing

Para probar la base de datos:

1. Ejecuta el script de datos de prueba incluido en `schema.sql`
2. Tendrás 15 viviendas con propietarios
3. Puedes crear una asamblea de prueba desde el panel admin

## Mantenimiento

### Limpiar datos de prueba

```sql
TRUNCATE TABLE votos CASCADE;
TRUNCATE TABLE asistencias CASCADE;
TRUNCATE TABLE propuestas CASCADE;
TRUNCATE TABLE asambleas CASCADE;
```

### Resetear todo

```sql
DROP TABLE IF EXISTS votos CASCADE;
DROP TABLE IF EXISTS asistencias CASCADE;
DROP TABLE IF EXISTS propuestas CASCADE;
DROP TABLE IF EXISTS asambleas CASCADE;
DROP TABLE IF EXISTS propietarios CASCADE;
DROP TABLE IF EXISTS viviendas CASCADE;
```

Luego vuelve a ejecutar `schema.sql`.
