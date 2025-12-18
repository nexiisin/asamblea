# 🔍 Diagnóstico de Sincronización Realtime

## ✅ Cambios Implementados

### 1. **SalaEsperaScreen.tsx**
- ✅ Agregados logs de consola para debugging
- ✅ Suscripción realtime a cambios en tabla `propuestas`
- ✅ Verificación inicial de propuestas abiertas al entrar
- ✅ Navegación automática a `Votacion` cuando detecta `estado: 'ABIERTA'`
- ✅ Usa `.maybeSingle()` para evitar errores si no hay resultados

### 2. **VotacionScreen.tsx**
- ✅ Agregados logs de consola para debugging
- ✅ Si no hay propuesta abierta, regresa automáticamente a `SalaEspera`
- ✅ Suscripción realtime detecta cuando propuesta se CIERRA
- ✅ Al cerrar propuesta, regresa a sala de espera después de 2 segundos

## 🧪 Cómo Probar

### Paso 1: Verificar Realtime en Supabase
1. Ve a tu Dashboard de Supabase
2. **Database** → **Replication**
3. Verifica que la tabla `propuestas` tenga **Realtime** habilitado
4. Si no está habilitado, actívalo

### Paso 2: Abrir Consola del Navegador/Expo
Ahora verás logs como:
```
📡 Iniciando suscripción realtime para propuestas...
Asamblea ID: xxx-xxx-xxx
Vivienda ID: yyy-yyy-yyy
📡 Estado de suscripción: SUBSCRIBED
🔍 Verificando si ya hay propuesta abierta...
⏳ No hay propuesta abierta, esperando...
```

### Paso 3: Flujo de Prueba Completo

#### **Como ADMIN:**
1. Entra al Panel Admin
2. Crea una asamblea nueva
3. Ve a **Control de Asamblea**
4. Click en **"🗳️ Crear Propuesta"**
5. Llena título y descripción
6. Click en **"Crear y Abrir"** ← ESTO DEBE ACTIVAR LOS INVITADOS

#### **Como INVITADO (en otro dispositivo/navegador):**
1. Entra con el código de la asamblea
2. Registra tu casa (ej: 101)
3. Debes estar en SALA DE ESPERA
4. **Cuando el admin abra la propuesta**:
   - En consola verás: `🔔 Cambio detectado en propuestas`
   - Luego: `✅ Propuesta ABIERTA detectada! Navegando a votación...`
   - La pantalla debe cambiar AUTOMÁTICAMENTE a votación

#### **Cerrar Votación:**
1. Admin cierra la propuesta
2. Invitados ven en consola: `🔴 Propuesta actual cerrada, regresando a sala de espera...`
3. Después de 2 segundos regresan a SALA DE ESPERA

## 🐛 Si No Funciona

### Verifica en Consola:
1. ¿Ves el log `📡 Iniciando suscripción realtime...`?
   - ✅ SI → La suscripción se configuró
   - ❌ NO → El useEffect no se ejecutó

2. ¿Ves `📡 Estado de suscripción: SUBSCRIBED`?
   - ✅ SI → Supabase Realtime está conectado
   - ❌ NO → Problema de conexión

3. ¿Cuando el admin abre la propuesta, ves `🔔 Cambio detectado...`?
   - ✅ SI → Realtime funciona, verifica el estado de la propuesta
   - ❌ NO → Realtime no está habilitado en Supabase

### Verifica en Supabase:
```sql
-- Ejecuta esto en SQL Editor para ver el estado de las propuestas
SELECT id, titulo, estado, asamblea_id 
FROM propuestas 
ORDER BY created_at DESC 
LIMIT 5;
```

### Verifica que Realtime esté habilitado:
```sql
-- Verifica replicación
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE tablename = 'propuestas';
```

Si no devuelve resultados, habilita Realtime:
1. Dashboard → Database → Replication
2. Busca tabla `propuestas`
3. Toggle ON el switch

## 📝 Flujo Esperado

```
INVITADO                           ADMIN
    |                                |
    | Entra a asamblea              |
    | (Sala de Espera)              |
    | 📡 Suscripción activa          |
    |                                | Crea propuesta
    |                                | Click "Crear y Abrir"
    | 🔔 Detecta cambio             | ✅ INSERT estado='ABIERTA'
    | ✅ Navega a Votación          |
    | Vota SI o NO                   |
    |                                | Cierra propuesta
    | 🔔 Detecta cierre             | ✅ UPDATE estado='CERRADA'
    | ⏳ Espera 2 segundos          |
    | ✅ Regresa a Sala Espera      |
    |                                | Abre otra propuesta
    | 🔔 Detecta apertura           |
    | ✅ Navega a Votación (nuevo)  |
```

## 🚨 Errores Comunes

### Error: "PGRST116"
- **Causa**: No hay propuesta abierta
- **Solución**: Cambiado `.single()` por `.maybeSingle()`

### Error: No se detectan cambios
- **Causa**: Realtime no habilitado en tabla
- **Solución**: Habilitar en Dashboard → Replication

### Error: "Navigation state is invalid"
- **Causa**: Navegación múltiple
- **Solución**: Usar `replace` en lugar de `navigate`

## ✅ Checklist Final

- [ ] Realtime habilitado en tabla `propuestas` (Supabase Dashboard)
- [ ] Invitado ve logs en consola al entrar a sala de espera
- [ ] Estado de suscripción = `SUBSCRIBED`
- [ ] Cuando admin abre propuesta, invitado ve `🔔 Cambio detectado`
- [ ] Invitado navega automáticamente a pantalla de votación
- [ ] Cuando admin cierra, invitado regresa a sala de espera
- [ ] Si admin abre otra propuesta, invitado vuelve a votación
