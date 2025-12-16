# Guía de Uso - Asamblea Digital

## 📖 Manual de Usuario

### Para Administradores

#### 1. Iniciar una Asamblea

1. Abre la aplicación
2. Toca **"Panel Administrativo"**
3. Toca **"Iniciar Nueva Asamblea"**
4. Se generará un código de 6 caracteres (ej: ABC123)
5. **Comparte este código** con los residentes

#### 2. Gestionar el Código de Acceso

El código aparece en la parte superior derecha del Control de Asamblea.

**Regenerar código:**
- Toca "🔄 Regenerar"
- Confirma la acción
- El código anterior dejará de funcionar
- Comparte el nuevo código

#### 3. Crear Propuestas

Hay dos formas:

**a) Guardar como Borrador**
- Toca "🗳️ Crear Propuesta"
- Ingresa título y descripción
- Toca "💾 Guardar Borrador"
- La propuesta no inicia votación aún

**b) Crear y Abrir**
- Toca "🗳️ Crear Propuesta"
- Ingresa título y descripción
- Toca "🚀 Crear y Abrir Votación"
- La votación inicia inmediatamente
- Los invitados verán la propuesta al instante

#### 4. Controlar Votación

**Ver Resultados en Tiempo Real:**
- Toca "📊 Ver Resultados"
- Selecciona la propuesta
- Las gráficas se actualizan automáticamente

**Cerrar Votación:**
- En "Resultados", selecciona la propuesta abierta
- Toca "🔒 Cerrar Votación"
- Se calcula el resultado automáticamente
- Aparece ✅ APROBADA o ❌ RECHAZADA

**Abrir Propuesta Borrador:**
- En "Resultados", selecciona un borrador
- Toca "🚀 Abrir Votación"
- Solo puede haber 1 propuesta abierta a la vez

#### 5. Cerrar Asamblea

1. Ve a "Control de Asamblea"
2. Toca "🔴 Cerrar Asamblea"
3. Confirma la acción
4. Se cierran todas las votaciones pendientes
5. El código dejará de funcionar

#### 6. Ver Historial

- Desde el Panel Principal, toca "📚 Historial General"
- Ve todas las asambleas pasadas
- Toca una asamblea para ver sus detalles

---

### Para Invitados (Residentes)

#### 1. Ingresar a la Asamblea

1. Abre la aplicación
2. Toca **"Ingresar como Invitado"**
3. **Ingresa el código** proporcionado por el administrador
4. Toca "Ingresar"

#### 2. Registrarse

Debes ingresar:
- **Número de casa** (ej: 101)
- **Primer nombre del propietario** (ej: Juan)
- **Primer apellido del propietario** (ej: Pérez)
- **Tu nombre** (quien asiste, puede ser diferente al propietario)

**Importante:**
- Los datos del propietario deben coincidir con los registrados
- Solo puedes registrar tu casa una vez
- Si hay error, verifica los datos con administración

#### 3. Sala de Espera

Después de registrarte:
- Verás el mensaje: **"La asamblea está pronta a comenzar"**
- Espera a que el administrador abra una votación
- La app te llevará automáticamente a la votación

#### 4. Votar

Cuando haya una propuesta activa:
- Lee el título y descripción
- Toca **"✓ SI"** o **"✗ NO"**
- Tu voto se registra inmediatamente
- **No puedes cambiar tu voto**

#### 5. Ver tu Voto

Después de votar:
- Verás "✓ Voto Registrado"
- Se muestra tu voto: SI o NO
- Espera a la siguiente propuesta

---

## ⚠️ Preguntas Frecuentes

### Para Administradores

**P: ¿Puedo tener varias propuestas abiertas al mismo tiempo?**
R: No, solo una propuesta puede estar abierta a la vez.

**P: ¿Qué pasa si cierro la asamblea por error?**
R: No se puede reabrir. Deberás crear una nueva asamblea.

**P: ¿Cómo sé cuántas personas han votado?**
R: En "Resultados", ve las estadísticas en tiempo real.

**P: ¿Cuándo se aprueba una propuesta?**
R: Cuando los votos SI representan al menos el 51% de los votos válidos (SI + NO).

**P: ¿Qué son NO_VOTO y NO_ASISTIO?**
R:
- **NO_VOTO**: Casas que se registraron pero no votaron en esa propuesta
- **NO_ASISTIO**: Casas que nunca se registraron en la asamblea

### Para Invitados

**P: No puedo ingresar el código, ¿qué hago?**
R: Verifica que:
- El código esté correcto (sin espacios)
- La asamblea esté ABIERTA
- Contacta al administrador

**P: Dice que mi casa ya está registrada**
R: Cada casa solo puede registrarse una vez. Si otra persona de tu casa ya se registró, no puedes volver a hacerlo.

**P: Los datos del propietario no coinciden**
R: Verifica con administración los nombres registrados. Deben ser exactos.

**P: ¿Puedo cambiar mi voto?**
R: No, los votos son inmutables por seguridad y transparencia.

**P: ¿Puedo ver los resultados?**
R: Los resultados se muestran después de votar o cuando se cierra la propuesta.

---

## 📊 Interpretación de Resultados

### Gráfico de Barras

Muestra 4 categorías:
1. **SI**: Votos a favor
2. **NO**: Votos en contra
3. **No Votó**: Se registraron pero no votaron
4. **No Asistió**: No se registraron

### Estadísticas

- **Total Casas**: Todas las casas del conjunto
- **Total Asistentes**: Casas que se registraron
- **Total Votos**: SI + NO
- **Porcentaje SI**: (SI / (SI + NO)) × 100

### Resultado Final

**✅ APROBADA**
- SI / (SI + NO) ≥ 0.51 (51% o más)

**❌ RECHAZADA**
- SI / (SI + NO) < 0.51 (menos del 51%)

---

## 🆘 Solución de Problemas

### La app no carga

1. Verifica tu conexión a internet
2. Cierra y vuelve a abrir la app
3. Verifica que Supabase esté configurado

### No aparecen las propuestas

1. Verifica que estés conectado
2. Espera unos segundos (tiempo real)
3. Cierra y vuelve a abrir la pantalla

### Los resultados no se actualizan

1. Verifica conexión a internet
2. El tiempo real puede tardar 1-2 segundos
3. Recarga la pantalla

### Error al votar

1. Verifica que la propuesta esté ABIERTA
2. Confirma que no hayas votado ya
3. Verifica conexión a internet

---

## 💡 Consejos y Mejores Prácticas

### Para Administradores

✅ **HACER:**
- Compartir el código claramente antes de iniciar
- Esperar a que se registren suficientes asistentes
- Cerrar cada votación antes de abrir la siguiente
- Revisar resultados antes de cerrar asamblea
- Mantener registro del historial

❌ **NO HACER:**
- Abrir múltiples propuestas a la vez (no es posible)
- Cerrar la asamblea prematuramente
- Regenerar el código sin avisar

### Para Invitados

✅ **HACER:**
- Llegar puntual (registrarse temprano)
- Leer bien cada propuesta antes de votar
- Verificar datos de propietario antes de registrarse
- Mantener la app abierta durante la asamblea

❌ **NO HACER:**
- Intentar votar dos veces
- Salir de la app durante votaciones
- Compartir tu registro con otros

---

## 📱 Requerimientos Técnicos

- Smartphone o tablet con iOS/Android
- Conexión a internet estable
- Expo Go instalado (para versión de desarrollo)
- O app instalada (para producción)

---

**¿Necesitas más ayuda?**

Contacta a soporte: soporte@asamblea.app
