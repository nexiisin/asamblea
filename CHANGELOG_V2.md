# 📋 Registro de Cambios - Sistema de Votación

## [2.0.0] - Diciembre 2024 - Arquitectura Centralizada 🚀

### 🎯 Cambios Mayores

#### Arquitectura Backend-First
- **Estado centralizado** en tabla `asambleas` con campo `estado_actual`
- **Funciones SQL** para control atómico de flujo de estados
- **Triggers automáticos** para cálculo de resultados en tiempo real
- **Vista materializada** `vista_estado_asamblea` para consultas completas

#### Flujo de Estados Definido
```
ESPERA → DEBATE → VOTACION → RESULTADOS → ESPERA
```

### ✨ Nuevas Funcionalidades

#### 1. Cronómetro de Debate Sincronizado
- ✅ Diseño circular con anillos de progreso (minutos y segundos)
- ✅ Sincronización basada en timestamps del servidor
- ✅ Aparición/desaparición automática para invitados
- ✅ Color verde claro (#9AE6B4) de fondo
- ✅ Sin alerta al finalizar (solo se detiene)

#### 2. Control de Estado Centralizado (Admin)
- ✅ Botón **"💬 Iniciar Debate"** con selector de duración
- ✅ Botón **"⏹️ Detener Cronómetro"**
- ✅ Botón **"🗳️ Iniciar Votación"** por propuesta
- ✅ Botón **"📊 Cerrar Votación"**
- ✅ Botón **"⏸️ Regresar a Espera"**
- ✅ Indicador visual de estado actual

#### 3. Resultados en Tiempo Real (Invitados)
- ✅ Barras de progreso que se actualizan automáticamente
- ✅ Porcentajes con 1 decimal de precisión
- ✅ Contador de votos SI/NO en vivo
- ✅ Total de votos acumulados
- ✅ Diseño visual con colores verde (SI) y rojo (NO)

#### 4. Navegación Automática
- ✅ Invitados navegan automáticamente según `estado_actual`
- ✅ Transición ESPERA ↔ VOTACION sin intervención manual
- ✅ Cronómetro aparece/desaparece reactivamente
- ✅ Regreso a sala de espera al cerrar votación

### 🔧 Mejoras Técnicas

#### Base de Datos
- **Nuevas columnas en `asambleas`:**
  - `estado_actual` VARCHAR(20) - Estado centralizado
  - `propuesta_activa_id` UUID - Referencia a propuesta activa
  - `cronometro_activo` BOOLEAN - Indica si hay cronómetro en curso
  - `cronometro_inicio` TIMESTAMPTZ - Timestamp de inicio
  - `cronometro_duracion_segundos` INTEGER - Duración total

- **Nueva columna en `propuestas`:**
  - `porcentaje_no` DECIMAL(5,2) - Porcentaje de votos en contra

- **Funciones SQL creadas:**
  - `calcular_estadisticas_propuesta(UUID)` - Calcula votos y porcentajes
  - `iniciar_cronometro_debate(UUID, INTEGER)` - Inicia debate
  - `detener_cronometro(UUID)` - Detiene cronómetro
  - `iniciar_votacion(UUID, UUID)` - Abre propuesta para votar
  - `cerrar_votacion(UUID)` - Cierra votación activa
  - `regresar_a_espera(UUID)` - Reinicia estado

- **Triggers automáticos:**
  - `trigger_voto_actualizar_stats` - Ejecuta al INSERT en `votos`
  - Actualiza automáticamente `votos_si`, `votos_no`, `porcentaje_si`, `porcentaje_no`

- **Índices optimizados:**
  - `idx_asambleas_estado_actual`
  - `idx_asambleas_propuesta_activa`

#### Frontend

**SalaEsperaScreen.tsx:**
- ✅ Suscripción a tabla `asambleas` en lugar de `propuestas`
- ✅ Navegación reactiva basada en `estado_actual`
- ✅ Mensajes dinámicos según estado (ESPERA/DEBATE/VOTACION/RESULTADOS)
- ✅ Indicador de sincronización en tiempo real
- ✅ Logs detallados para debugging

**VotacionScreen.tsx:**
- ✅ Suscripción en tiempo real a propuesta específica
- ✅ Resultados actualizados automáticamente con cada voto
- ✅ Barras de progreso animadas
- ✅ Porcentajes con precisión de 1 decimal
- ✅ Auto-regreso a sala de espera al cerrar votación

**ControlAsambleaScreen.tsx:**
- ✅ Sección dedicada para control de estado
- ✅ Botones para cada transición de estado
- ✅ Indicador visual del estado actual
- ✅ Estadísticas en tiempo real de propuesta activa
- ✅ Botón "Iniciar Votación" en cada propuesta BORRADOR

**CronometroModal.tsx:**
- ✅ Diseño circular con SVG
- ✅ Cálculo desde timestamps (sincronizado)
- ✅ Actualización cada segundo
- ✅ Aparición/desaparición automática

### 🐛 Correcciones de Bugs

#### Problema: Invitados no veían votación iniciada por admin
- **Causa:** Suscripción a `propuestas` sin filtro específico
- **Solución:** Suscripción centralizada a `asambleas` con `estado_actual`
- **Resultado:** Navegación automática 100% confiable

#### Problema: Resultados no se actualizaban en tiempo real
- **Causa:** Falta de trigger para cálculo automático
- **Solución:** Trigger `trigger_voto_actualizar_stats` en INSERT de `votos`
- **Resultado:** Porcentajes se actualizan instantáneamente

#### Problema: Cronómetro desincronizado entre usuarios
- **Causa:** Uso de timers locales con `setInterval`
- **Solución:** Cálculo desde `cronometro_inicio` + timestamp del servidor
- **Resultado:** Sincronización perfecta entre todos los dispositivos

#### Problema: Múltiples propuestas abiertas simultáneamente
- **Causa:** No había validación
- **Solución:** Función `iniciar_votacion()` cierra automáticamente propuestas anteriores
- **Resultado:** Solo una propuesta activa a la vez

### 📚 Documentación

- ✅ [ARQUITECTURA_SINCRONIZACION.md](ARQUITECTURA_SINCRONIZACION.md) - Arquitectura completa del sistema
- ✅ [GUIA_USO_V2.md](GUIA_USO_V2.md) - Guía actualizada de usuario
- ✅ [DIAGNOSTICO_REALTIME.md](DIAGNOSTICO_REALTIME.md) - Guía de troubleshooting
- ✅ Diagramas de flujo de estados
- ✅ Ejemplos de uso completos

### 🔄 Migración desde v1.x

#### Scripts SQL
```sql
-- Ejecutar: supabase/migracion_estado_centralizado.sql
```

#### Cambios Breaking
- ⚠️ La tabla `cronometro_debate` standalone ya NO se usa
- ⚠️ Ahora se usan funciones RPC en lugar de UPDATE directo
- ⚠️ El flujo de navegación cambió completamente

#### Pasos de Migración
1. Ejecutar `migracion_estado_centralizado.sql` en Supabase SQL Editor
2. Habilitar Realtime en tabla `asambleas` (Database → Replication)
3. Verificar que funciones SQL se crearon correctamente
4. Actualizar código frontend (ya incluido en este release)

### 📊 Métricas de Mejora

| Aspecto | Antes (v1.x) | Ahora (v2.0) | Mejora |
|---------|--------------|--------------|--------|
| Sincronización | Manual | Automática | 100% |
| Navegación | Refresh manual | Reactiva | Instantánea |
| Resultados | Diferidos | Tiempo real | Live |
| Estados | Distribuidos | Centralizados | Atómico |
| Bugs de sync | Frecuentes | Eliminados | ✅ |

---

## [1.0.0] - Diciembre 2024 - Release Inicial

### ✨ Funcionalidades Base

#### Sistema de Autenticación
- Rol de Administrador
- Rol de Invitado
- Ingreso por código de acceso

#### Gestión de Asambleas
- Crear asamblea con código único
- Panel de control de administrador
- Contador de asistentes en tiempo real

#### Sistema de Votación
- Crear propuestas (título + descripción)
- Abrir/cerrar propuestas
- Votación SI/NO
- Resultados con porcentajes
- Historial de votaciones

#### Interfaz de Usuario
- Diseño responsive
- Navegación con React Navigation
- Componentes reutilizables
- Estilos modernos con Tailwind-like colors

#### Backend
- Supabase PostgreSQL
- Row Level Security (RLS)
- Realtime habilitado en tablas
- Políticas de acceso configuradas

### 🐛 Problemas Conocidos (Resueltos en v2.0)
- ❌ Invitados necesitaban refrescar manualmente
- ❌ Resultados no se actualizaban en tiempo real
- ❌ No había cronómetro de debate
- ❌ Estados distribuidos causaban desincronización

---

## [Roadmap Futuro]

### v2.1 - Mejoras de UX
- [ ] Pantalla de resultados dedicada para invitados
- [ ] Notificaciones push cuando inicia votación
- [ ] Modo offline con sincronización al reconectar
- [ ] Animaciones de transición entre estados

### v2.2 - Características Avanzadas
- [ ] Quorum configurable por propuesta
- [ ] Votación ponderada por coeficiente
- [ ] Exportar resultados a PDF/Excel
- [ ] Chat en vivo durante debate
- [ ] Grabación de actas automática

### v2.3 - Analytics
- [ ] Dashboard de estadísticas de participación
- [ ] Gráficos de tendencias de votación
- [ ] Reporte de asistencia histórica
- [ ] Métricas de tiempo de votación

---

**Mantenido por:** Equipo de Desarrollo  
**Última actualización:** Diciembre 2024
