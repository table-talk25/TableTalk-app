#!/bin/bash

# Script di Build per Produzione TableTalk
# Questo script configura le variabili d'ambiente e compila l'app per produzione

echo "🚀 TableTalk - Build di Produzione"
echo "================================="

# Verifica che le variabili d'ambiente critiche siano impostate
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ ERRORE: La variabile d'ambiente $1 non è impostata!"
        echo "   Imposta con: export $1=your_value_here"
        exit 1
    else
        echo "✅ $1 configurata"
    fi
}

echo "📋 Controllo variabili d'ambiente..."

# Controlla Google Maps
check_env_var "MAPS_API_KEY"

# Controlla Firebase (opzionale se disabilitato)
if [ "$ENABLE_FIREBASE" = "true" ]; then
    check_env_var "REACT_APP_FIREBASE_API_KEY"
    check_env_var "REACT_APP_FIREBASE_AUTH_DOMAIN"
    check_env_var "REACT_APP_FIREBASE_PROJECT_ID"
fi

# Controlla Twilio
check_env_var "TWILIO_ACCOUNT_SID"
check_env_var "TWILIO_AUTH_TOKEN"
check_env_var "TWILIO_API_KEY"
check_env_var "TWILIO_API_SECRET"

# Controlla URL di produzione
check_env_var "REACT_APP_API_URL"

echo ""
echo "🏗️ Avvio build di produzione..."

# Build React
echo "📦 Build React app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ ERRORE: Build React fallito!"
    exit 1
fi

# Sync Capacitor
echo "📱 Sync Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ ERRORE: Capacitor sync fallito!"
    exit 1
fi

# Build Android
echo "🤖 Build Android APK..."
cd android
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 BUILD COMPLETATO CON SUCCESSO!"
    echo "📦 APK di produzione disponibile in:"
    echo "   android/app/build/outputs/apk/release/app-release.apk"
else
    echo "❌ ERRORE: Build Android fallito!"
    exit 1
fi