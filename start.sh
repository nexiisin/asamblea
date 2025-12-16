#!/bin/bash

echo "🏛️  ASAMBLEA DIGITAL - Iniciando aplicación..."
echo ""
echo "📋 Verificando configuración..."

# Verificar que existe .env
if [ ! -f .env ]; then
    echo "⚠️  Advertencia: No se encontró archivo .env"
    echo "   Copia .env.example a .env y configura tus credenciales de Supabase"
    echo ""
    echo "   cp .env.example .env"
    echo ""
    read -p "¿Deseas continuar de todos modos? (s/n): " respuesta
    if [ "$respuesta" != "s" ]; then
        exit 1
    fi
fi

echo "✅ Configuración verificada"
echo ""
echo "🚀 Iniciando servidor de desarrollo..."
echo ""
echo "Opciones disponibles:"
echo "  - Presiona 'a' para Android"
echo "  - Presiona 'i' para iOS"  
echo "  - Presiona 'w' para Web"
echo "  - Escanea el QR con Expo Go en tu móvil"
echo ""

npm start
