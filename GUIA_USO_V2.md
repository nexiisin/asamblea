# 📘 Guía de Uso - Sistema de Votación para Asambleas

## 🚀 Sincronización en Tiempo Real

**NUEVO:** Todo el sistema ahora funciona con sincronización automática en tiempo real. Los invitados NO necesitan refrescar la pantalla, todo se actualiza automáticamente.

---

## 👨‍💼 Flujo Completo para el Administrador

### 1️⃣ Crear Asamblea

1. En el Panel Admin, presiona **"📋 Nueva Asamblea"**
2. Se genera automáticamente un código de acceso (ej: `ABC123`)
3. Comparte este código con los asistentes

### 2️⃣ Esperando Asistentes

- Los invitados ingresan el código y registran su casa
- En **Control de Asamblea** verás el contador de asistentes en tiempo real
- Código de acceso visible en el header morado

### 3️⃣ Crear Propuestas

1. Presiona **"🗳️ Crear Propuesta"**
2. Ingresa:
   - Título de la propuesta
   - Descripción detallada
3. La propuesta se crea en estado **BORRADOR**
4. Puedes crear múltiples propuestas antes de iniciar

### 4️⃣ Flujo de Debate y Votación

#### Opción A: Con Debate Previo

1. **Iniciar Debate:**
   - Presiona **"💬 Iniciar Debate"**
   - Ingresa duración en minutos (ej: 5)
   - Estado cambia a: `DEBATE`
   - **Todos los invitados** ven el cronómetro automáticamente

2. **Durante el Debate:**
   - Cronómetro circular se muestra en todas las pantallas
   - Cuenta regresiva sincronizada
   - Al terminar, NO hay alerta (solo se detiene)

3. **Detener Cronómetro:**
   - Presiona **"⏹️ Detener Cronómetro"**
   - Estado regresa a: `ESPERA`

#### Opción B: Votación Directa

1. **Iniciar Votación:**
   - Encuentra la propuesta en estado BORRADOR
   - Presiona **"🗳️ Iniciar Votación"**
   - Confirma la acción
   - Estado cambia a: `VOTACION`
   - **Todos los invitados** navegan automáticamente a la pantalla de votación

2. **Durante la Votación:**
   - Ves la propuesta activa con estadísticas en tiempo real
   - Contador de votos se actualiza automáticamente
   - Los invitados votan SI/NO

3. **Cerrar Votación:**
   - Presiona **"📊 Cerrar Votación"**
   - Estado cambia a: `RESULTADOS`
   - Los invitados regresan a sala de espera automáticamente

### 5️⃣ Ver Resultados

- Presiona **"📊 Ver Resultados"**
- Verás todas las propuestas con:
  - Votos SI/NO
  - Porcentajes
  - Estado: APROBADA o RECHAZADA

### 6️⃣ Siguiente Propuesta

- Presiona **"⏸️ Regresar a Espera"**
- Estado cambia a: `ESPERA`
- Repite el proceso desde el paso 4 con otra propuesta

### 7️⃣ Cerrar Asamblea

- Cuando termines todas las propuestas
- Presiona **"🔴 Cerrar Asamblea"**
- Confirma la acción
- Se genera el historial completo

---

## 👥 Flujo Completo para Invitados

### 1️⃣ Ingresar a la Asamblea

1. Abre la app
2. Presiona **"Unirse como Invitado"**
3. Ingresa el código de 6 dígitos (ej: `ABC123`)
4. Ingresa tu número de casa

### 2️⃣ Sala de Espera

- Verás: **"La asamblea está pronta a comenzar"**
- Mensaje: "Por favor espere a que el administrador inicie la votación"
- Indicador de sincronización activa
- **NO necesitas hacer nada**, todo es automático

### 3️⃣ Debate (Si el admin lo inicia)

- El cronómetro aparece AUTOMÁTICAMENTE en tu pantalla
- Verás círculos de progreso con minutos y segundos
- Barra de progreso circular en verde claro
- Cuando termina, desaparece solo

### 4️⃣ Votación

- La app te lleva AUTOMÁTICAMENTE a la pantalla de votación
- Verás:
  - Título de la propuesta
  - Descripción
  - **📊 Resultados en tiempo real** (barras de progreso)
  - Botones: **✓ SI** y **✗ NO**

#### Votar:

1. Lee la propuesta
2. Presiona **SI** o **NO**
3. Confirma que tu voto fue registrado
4. **Observa los resultados actualizarse en tiempo real**
   - Barras de progreso verdes (SI) y rojas (NO)
   - Porcentajes y conteo de votos

#### Después de Votar:

- NO puedes cambiar tu voto
- Verás: "✓ Voto Registrado"
- Los resultados siguen actualizándose conforme otros votan

### 5️⃣ Resultados

- Cuando el admin cierra la votación
- Regresas AUTOMÁTICAMENTE a la sala de espera
- Esperas la siguiente propuesta

### 6️⃣ Siguiente Propuesta

- El ciclo se repite automáticamente
- No necesitas hacer nada, solo esperar

---

## 📊 Estados de la Asamblea

El sistema maneja 4 estados centralizados:

| Estado | Descripción | Pantalla Invitado |
|--------|-------------|-------------------|
| **ESPERA** | Esperando inicio | Sala de Espera |
| **DEBATE** | Cronómetro activo | Sala de Espera + Cronómetro Modal |
| **VOTACION** | Propuesta abierta | Pantalla de Votación |
| **RESULTADOS** | Votación cerrada | Sala de Espera (transitorio) |

---

## 🎯 Controles del Admin

### Panel "Control de Asamblea"

#### 📊 Sección de Estado

- **Estado actual**: ESPERA / DEBATE / VOTACION / RESULTADOS
- **💬 Iniciar Debate**: Inicia cronómetro (especifica minutos)
- **⏹️ Detener Cronómetro**: Detiene el debate
- **⏸️ Regresar a Espera**: Reinicia al estado inicial
- **📊 Cerrar Votación**: Finaliza la votación activa

#### 🗳️ Acciones Principales

- **🗳️ Crear Propuesta**: Nueva propuesta en BORRADOR
- **📊 Ver Resultados**: Historial completo
- **📜 Historial**: Registro de todas las asambleas
- **🔴 Cerrar Asamblea**: Finaliza la asamblea

#### 📋 Lista de Propuestas

- Cada propuesta muestra:
  - Título y descripción
  - Estado: BORRADOR / ABIERTA / CERRADA
  - Botón **"🗳️ Iniciar Votación"** (solo en BORRADOR)
  - Resultados finales (en CERRADA)

---

## 🔔 Funcionalidades en Tiempo Real

### ✅ Lo que se actualiza automáticamente:

#### Para Invitados:
- ✅ Navegación entre pantallas (ESPERA ↔ VOTACION)
- ✅ Aparición/desaparición del cronómetro
- ✅ Resultados de votación (barras de progreso)
- ✅ Porcentajes de votos SI/NO
- ✅ Contador de votos totales

#### Para Admin:
- ✅ Contador de asistentes
- ✅ Estadísticas de votación en tiempo real
- ✅ Estado de la asamblea
- ✅ Lista de propuestas actualizada

### ❌ Lo que NO necesitas hacer:

- ❌ Refrescar la pantalla
- ❌ Cerrar y abrir la app
- ❌ Presionar "Actualizar"
- ❌ Esperar manualmente

---

## 🎨 Diseño Visual

### Cronómetro de Debate

- Dos círculos de progreso:
  - **Minutos**: Círculo exterior
  - **Segundos**: Círculo interior
- Colores:
  - Fondo: Verde claro (#9AE6B4)
  - Progreso: Verde (#48BB78)
- Se actualiza cada segundo
- Cálculo desde timestamp del servidor (sincronizado)

### Pantalla de Votación

- **Resultados en Tiempo Real:**
  - Barra verde para SI
  - Barra roja para NO
  - Porcentajes con 1 decimal
  - Total de votos

- **Botones de Voto:**
  - SI: Verde (#10b981)
  - NO: Rojo (#ef4444)
  - Grandes y táctiles

---

## 🔧 Funciones SQL (Backend)

El admin no las usa directamente, pero es útil conocerlas:

| Función | Propósito |
|---------|-----------|
| `iniciar_cronometro_debate()` | Inicia el cronómetro |
| `detener_cronometro()` | Detiene el cronómetro |
| `iniciar_votacion()` | Abre una propuesta |
| `cerrar_votacion()` | Cierra la votación |
| `regresar_a_espera()` | Reinicia el estado |

**Ventaja:** Todas las operaciones son atómicas y seguras.

---

## 🚨 Solución de Problemas

### Invitados no ven la votación

**Causa:** Realtime no está habilitado en Supabase

**Solución:**
1. Ir a Supabase Dashboard
2. Database → Replication
3. Habilitar en tablas: `asambleas`, `propuestas`

### Cronómetro no se sincroniza

**Causa:** Diferencia de horarios

**Solución:** El sistema usa timestamps del servidor (UTC), está diseñado para sincronizar automáticamente.

### Resultados no se actualizan

**Verificar:**
1. Que el trigger `trigger_voto_actualizar_stats` exista
2. Que Realtime esté habilitado en `propuestas`
3. Revisar logs en consola del navegador/app

---

## 📈 Mejores Prácticas

### Para el Administrador:

1. ✅ Crea todas las propuestas ANTES de iniciar
2. ✅ Usa el debate para propuestas complejas
3. ✅ Revisa el contador de asistentes antes de iniciar
4. ✅ Cierra cada votación antes de abrir la siguiente
5. ✅ Verifica los resultados antes de cerrar la asamblea

### Para Invitados:

1. ✅ Mantén la app abierta durante la asamblea
2. ✅ NO cierres la app mientras haya votación activa
3. ✅ Asegúrate de tener conexión a internet
4. ✅ Si ves desconexión, cierra y vuelve a entrar con el mismo código

---

## 🎓 Ejemplo de Asamblea Completa

```
1. Admin crea asamblea → Código: XYZ789

2. 15 invitados ingresan → Asistentes: 15

3. Admin crea 3 propuestas:
   - Propuesta 1: "Aprobar presupuesto"
   - Propuesta 2: "Reparar portón"
   - Propuesta 3: "Contratar seguridad"

4. Propuesta 1:
   - Admin: "Iniciar Debate" (5 min)
   - Todos ven cronómetro
   - Admin: "Iniciar Votación"
   - Invitados votan automáticamente
   - Resultados: 12 SI (80%), 3 NO (20%)
   - Admin: "Cerrar Votación"
   - Estado: APROBADA

5. Propuesta 2:
   - Admin: "Regresar a Espera"
   - Admin: "Iniciar Votación" (sin debate)
   - Resultados: 5 SI (33%), 10 NO (67%)
   - Estado: RECHAZADA

6. Propuesta 3:
   - Admin: "Iniciar Debate" (10 min)
   - Admin: "Iniciar Votación"
   - Resultados: 15 SI (100%), 0 NO (0%)
   - Estado: APROBADA

7. Admin: "Ver Resultados" → PDF generado

8. Admin: "Cerrar Asamblea" → Fin
```

---

## 🔐 Seguridad

- ✅ Políticas RLS (Row Level Security) activadas
- ✅ Un voto por vivienda por propuesta
- ✅ No se puede votar dos veces
- ✅ No se puede modificar el voto
- ✅ Código de asamblea único y regenerable

---

## 📞 Soporte

Si tienes problemas:

1. Revisa [DIAGNOSTICO_REALTIME.md](DIAGNOSTICO_REALTIME.md)
2. Revisa [SOLUCION_ERRORES.md](SOLUCION_ERRORES.md)  
3. Revisa [ARQUITECTURA_SINCRONIZACION.md](ARQUITECTURA_SINCRONIZACION.md)
4. Verifica la consola de logs en la app

---

**Versión:** 2.0 - Sistema Centralizado con Sincronización en Tiempo Real  
**Última actualización:** Diciembre 2024
