# 🚀 Inicio Rápido - Asamblea Digital

## ⚡ 3 Pasos para Comenzar

### 1️⃣ Configurar Supabase

```bash
# Crear proyecto en https://supabase.com
# Ejecutar SQL en SQL Editor:
cat supabase/schema.sql
# Copiar todo y ejecutar en Supabase SQL Editor

# Habilitar Realtime en Database > Replication:
# ✅ asambleas
# ✅ propuestas  
# ✅ votos
# ✅ asistencias
```

### 2️⃣ Configurar Variables

```bash
# Copiar template
cp .env.example .env

# Editar .env con tus credenciales:
# EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3️⃣ Ejecutar App

```bash
# Opción A: Script automático
./start.sh

# Opción B: Comando directo
npm start
```

---

## 📱 Probar la App

### En tu Móvil
1. Descarga **Expo Go** (iOS/Android)
2. Escanea el QR que aparece en la terminal
3. ¡Listo!

### En Emulador
```bash
npm run android  # Android
npm run ios      # iOS (solo Mac)
npm run web      # Navegador web
```

---

## 🧪 Testing Rápido

### Como Admin
1. Abre app → Panel Administrativo
2. Iniciar Nueva Asamblea
3. Copiar código (ej: ABC123)

### Como Invitado
1. Abre app (otra ventana/dispositivo)
2. Ingresar como Invitado
3. Pegar código ABC123
4. Registrarse:
   - Casa: 101
   - Nombre propietario: (cualquiera de los generados)
   - Apellido propietario: (el correspondiente)
   - Tu nombre: Juan Pérez

### Votar
1. Admin: Crear propuesta y Abrir votación
2. Invitado: Verá automáticamente la propuesta
3. Invitado: Votar SI o NO
4. Admin: Ver resultados en tiempo real
5. Admin: Cerrar votación

---

## 📚 Documentación Completa

- **[README.md](README.md)** - Documentación técnica completa
- **[GUIA_USO.md](GUIA_USO.md)** - Manual de usuario
- **[supabase/README.md](supabase/README.md)** - Configuración de BD
- **[PROYECTO_COMPLETO.md](PROYECTO_COMPLETO.md)** - Resumen del proyecto

---

## ⚠️ Solución de Problemas

### Error: Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

### Variables de entorno no se cargan
```bash
# Verificar que .env exista
ls -la .env

# Reiniciar servidor
# Presiona Ctrl+C y ejecuta: npm start
```

### No compila TypeScript
```bash
npm install @react-navigation/native-stack
```

---

## 🎯 Features Principales

✅ Votación SI/NO en tiempo real  
✅ Control total del administrador  
✅ Validación de propietarios  
✅ Resultados con gráficas  
✅ Historial auditable  
✅ Un voto por casa (inmutable)  
✅ Cálculo automático 51%  

---

**🏛️ Asamblea Digital v1.0.0**

*Sistema de votación confiable para asambleas residenciales*
