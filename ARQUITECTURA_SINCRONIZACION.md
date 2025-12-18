# 🏗️ Arquitectura de Sincronización en Tiempo Real

## 📐 Modelo de Estado Centralizado

### Backend (Fuente de Verdad Única)

```
┌──────────────────────────────────────┐
│         TABLA: asambleas             │
├──────────────────────────────────────┤
│ estado_actual:                       │
│   • ESPERA                          │
│   • DEBATE                          │
│   • VOTACION                        │
│   • RESULTADOS                      │
│                                      │
│ propuesta_activa_id: UUID           │
│ cronometro_activo: boolean          │
│ cronometro_inicio: timestamp        │
│ cronometro_duracion_segundos: int   │
└──────────────────────────────────────┘
```

### Flujo de Estados

```
ESPERA → DEBATE → VOTACION → RESULTADOS → ESPERA
  ↑                                           ↓
  └───────────────────────────────────────────┘
```

---

## 🔄 Sincronización Automática

### 1. Triggers Automáticos

#### ✅ Al insertar un voto:
```sql
votos (INSERT) 
  → Trigger actualiza propuesta.votos_si/no
  → Trigger calcula porcentaje_si/no
  → Realtime notifica a todos los clientes
```

#### ✅ Al cambiar estado de asamblea:
```sql
asambleas.estado_actual (UPDATE)
  → Realtime notifica a todos
  → Invitados reaccionan automáticamente
```

### 2. Funciones del Backend

| Función | Propósito | Efectos |
|---------|-----------|---------|
| `iniciar_cronometro_debate()` | Admin inicia cronómetro | • estado_actual = 'DEBATE'<br>• cronometro_activo = true<br>• cronometro_inicio = NOW() |
| `detener_cronometro()` | Admin detiene cronómetro | • cronometro_activo = false<br>• estado_actual = 'ESPERA' |
| `iniciar_votacion()` | Admin abre propuesta | • estado_actual = 'VOTACION'<br>• propuesta.estado = 'ABIERTA'<br>• Cierra propuesta anterior |
| `cerrar_votacion()` | Admin cierra votación | • estado_actual = 'RESULTADOS'<br>• propuesta.estado = 'CERRADA' |
| `regresar_a_espera()` | Volver a inicio | • estado_actual = 'ESPERA' |

---

## 📱 Frontend Reactivo

### Arquitectura de Componentes

```
┌─────────────────────────────────────────────┐
│           INVITADO APP                      │
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────────────────────────────────┐    │
│  │   SalaEsperaScreen                 │    │
│  │   • Suscrito a: asambleas         │    │
│  │   • Reacciona a: estado_actual     │    │
│  └────────────────────────────────────┘    │
│              ↓                              │
│  ┌────────────────────────────────────┐    │
│  │   DebateScreen (modal/overlay)     │    │
│  │   • Muestra cronómetro             │    │
│  │   • Calcula desde timestamp        │    │
│  └────────────────────────────────────┘    │
│              ↓                              │
│  ┌────────────────────────────────────┐    │
│  │   VotacionScreen                   │    │
│  │   • Suscrito a: propuestas, votos │    │
│  │   • Muestra resultados real-time  │    │
│  └────────────────────────────────────┘    │
│              ↓                              │
│  ┌────────────────────────────────────┐    │
│  │   ResultadosScreen                 │    │
│  │   • Muestra resultado final        │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Lógica de Navegación Automática

```typescript
// SalaEsperaScreen.tsx
useEffect(() => {
  const subscription = supabase
    .channel('estado-asamblea')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'asambleas',
      filter: `id=eq.${asambleaId}`
    }, (payload) => {
      const asamblea = payload.new;
      
      switch(asamblea.estado_actual) {
        case 'DEBATE':
          // Mostrar cronómetro en overlay
          setMostrarCronometro(true);
          break;
        
        case 'VOTACION':
          // Navegar a votación
          navigation.replace('Votacion', {...});
          break;
        
        case 'RESULTADOS':
          // Navegar a resultados
          navigation.replace('Resultados', {...});
          break;
        
        case 'ESPERA':
          // Quedarse en sala de espera
          setMostrarCronometro(false);
          break;
      }
    })
    .subscribe();
}, []);
```

---

## ⏱️ Cronómetro Sincronizado

### Cálculo en Frontend

```typescript
// NO usar setInterval local
// SÍ calcular desde timestamp del servidor

const calcularTiempoRestante = (asamblea: Asamblea) => {
  if (!asamblea.cronometro_activo) return 0;
  
  const ahora = Date.now();
  const inicio = new Date(asamblea.cronometro_inicio!).getTime();
  const transcurrido = Math.floor((ahora - inicio) / 1000);
  const restante = Math.max(0, asamblea.cronometro_duracion_segundos - transcurrido);
  
  return restante;
};

// Actualizar cada segundo para la UI
useEffect(() => {
  const interval = setInterval(() => {
    setTiempoRestante(calcularTiempoRestante(asamblea));
  }, 1000);
  
  return () => clearInterval(interval);
}, [asamblea]);
```

**Ventajas:**
- ✅ Todos ven el mismo tiempo
- ✅ Funciona aunque el invitado entre tarde
- ✅ No se desincroniza

---

## 🗳️ Votación con Resultados en Tiempo Real

### Suscripción a Votos

```typescript
// VotacionScreen.tsx
const [resultados, setResultados] = useState({
  votos_si: 0,
  votos_no: 0,
  porcentaje_si: 0,
  porcentaje_no: 0,
});

useEffect(() => {
  // Suscripción a cambios en la propuesta
  const subscription = supabase
    .channel('resultados-votacion')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'propuestas',
      filter: `id=eq.${propuestaId}`
    }, (payload) => {
      const propuesta = payload.new;
      
      setResultados({
        votos_si: propuesta.votos_si,
        votos_no: propuesta.votos_no,
        porcentaje_si: propuesta.porcentaje_si || 0,
        porcentaje_no: propuesta.porcentaje_no || 0,
      });
    })
    .subscribe();
    
  return () => subscription.unsubscribe();
}, [propuestaId]);
```

**Lo que pasa automáticamente:**
1. Invitado vota → INSERT en `votos`
2. Trigger ejecuta → UPDATE en `propuestas`
3. Realtime notifica → Todos los clientes reciben UPDATE
4. Frontend actualiza → Gráficas se redibujan automáticamente

---

## 👨‍💼 Controles del Admin

### Admin Panel Actions

```typescript
// 1. Iniciar Cronómetro
const iniciarCronometro = async (minutos: number) => {
  await supabase.rpc('iniciar_cronometro_debate', {
    p_asamblea_id: asambleaId,
    p_duracion_segundos: minutos * 60
  });
  // ✅ Automáticamente todos los invitados ven el cronómetro
};

// 2. Iniciar Votación
const iniciarVotacion = async (propuestaId: string) => {
  await supabase.rpc('iniciar_votacion', {
    p_asamblea_id: asambleaId,
    p_propuesta_id: propuestaId
  });
  // ✅ Automáticamente todos navegan a pantalla de votación
};

// 3. Cerrar Votación
const cerrarVotacion = async () => {
  await supabase.rpc('cerrar_votacion', {
    p_asamblea_id: asambleaId
  });
  // ✅ Automáticamente todos ven los resultados finales
};

// 4. Regresar a Espera
const regresarAEspera = async () => {
  await supabase.rpc('regresar_a_espera', {
    p_asamblea_id: asambleaId
  });
  // ✅ Automáticamente todos regresan a sala de espera
};
```

---

## 🎯 Flujo Completo de Uso

### Escenario: Asamblea completa

```
1. ADMIN crea asamblea
   └─> Estado: ESPERA

2. INVITADOS ingresan con código
   └─> Ven: SalaEsperaScreen

3. ADMIN inicia cronómetro (5 min)
   ├─> Backend: iniciar_cronometro_debate()
   ├─> Estado: DEBATE
   └─> Invitados: Ven cronómetro en pantalla

4. ADMIN inicia votación (Propuesta 1)
   ├─> Backend: iniciar_votacion()
   ├─> Estado: VOTACION
   └─> Invitados: Navegan a VotacionScreen

5. INVITADOS votan SI/NO
   ├─> Backend: INSERT en votos
   ├─> Trigger: UPDATE en propuestas
   └─> Todos: Ven porcentajes actualizarse

6. ADMIN cierra votación
   ├─> Backend: cerrar_votacion()
   ├─> Estado: RESULTADOS
   └─> Invitados: Ven resultado final

7. ADMIN regresa a espera
   ├─> Backend: regresar_a_espera()
   ├─> Estado: ESPERA
   └─> Invitados: Regresan a SalaEsperaScreen

8. Se repite desde paso 3 con nueva propuesta
```

---

## ✅ Checklist de Implementación

### Backend
- [x] Migración SQL ejecutada
- [x] Funciones RPC creadas
- [x] Triggers configurados
- [x] Vista estado_asamblea creada
- [ ] Realtime habilitado en todas las tablas

### Frontend
- [x] Tipos TypeScript actualizados
- [ ] SalaEsperaScreen refactorizada
- [ ] VotacionScreen con resultados en tiempo real
- [ ] Admin panel con funciones RPC
- [ ] Cronómetro sincronizado por timestamp

### Testing
- [ ] Probar con múltiples invitados simultáneos
- [ ] Verificar sincronización del cronómetro
- [ ] Verificar actualización de porcentajes
- [ ] Verificar navegación automática

---

## 🚨 Reglas Críticas

### ❌ NUNCA:
- ❌ Calcular resultados en el frontend
- ❌ Usar timers locales para cronómetro
- ❌ Duplicar lógica de negocio
- ❌ Permitir múltiples propuestas abiertas
- ❌ Confiar en estado local

### ✅ SIEMPRE:
- ✅ Backend es la fuente de verdad
- ✅ Usar Realtime para todo
- ✅ Calcular desde timestamps
- ✅ Triggers para cálculos automáticos
- ✅ Navegación reactiva al estado

---

## 📊 Diagrama de Secuencia

```
ADMIN          SUPABASE         INVITADOS
  │                │                │
  │  iniciar_cronometro()          │
  ├───────────────>│                │
  │                │  UPDATE        │
  │                │  asambleas     │
  │                ├────────────────>│
  │                │                │ ✅ Ven cronómetro
  │                │                │
  │  iniciar_votacion()            │
  ├───────────────>│                │
  │                │  UPDATE        │
  │                │  estado=VOTACION│
  │                ├────────────────>│
  │                │                │ ✅ Navegan a votación
  │                │                │
  │                │  <─────────────┤
  │                │  INSERT voto   │
  │                │  TRIGGER       │
  │                │  UPDATE propuesta
  │                ├────────────────>│
  │                │                │ ✅ Ven porcentajes
```

---

## 🔧 Próximos Pasos

1. **Ejecutar migración en Supabase**
   ```bash
   # Copiar contenido de migracion_estado_centralizado.sql
   # Pegar en Supabase SQL Editor
   # Ejecutar
   ```

2. **Refactorizar SalaEsperaScreen**
3. **Refactorizar VotacionScreen**
4. **Actualizar Admin Panel**
5. **Probar sincronización end-to-end**
