#!/bin/bash

# Script per buildare la release Android 1.0.4 di TableTalk Social
# Include le nuove funzionalità di login social

echo "🚀 Iniziando build della release 1.0.4 - TableTalk Social con Login Social"
echo "📱 Versione: 1.0.4 (versionCode: 9)"
echo "📅 Data: $(date)"
echo ""

# Controlla se siamo nella directory corretta
if [ ! -f "package.json" ]; then
    echo "❌ Errore: Esegui questo script dalla directory FRONTEND/client"
    exit 1
fi

# Controlla se Capacitor è installato
if ! command -v npx &> /dev/null; then
    echo "❌ Errore: npx non trovato. Installa Node.js e npm"
    exit 1
fi

echo "🧹 Pulizia build precedenti..."
cd android && ./gradlew clean && cd ..

if [ $? -ne 0 ]; then
    echo "❌ Errore durante la pulizia Gradle"
    exit 1
fi

echo "📦 Installazione dipendenze npm..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Errore durante l'installazione npm"
    exit 1
fi

echo "🔨 Build produzione React..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Errore durante il build React"
    exit 1
fi

echo "🔄 Sincronizzazione Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Errore durante la sincronizzazione Capacitor"
    exit 1
fi

echo "📱 Copia assets Android..."
npx cap copy android

if [ $? -ne 0 ]; then
    echo "❌ Errore durante la copia assets"
    exit 1
fi

echo "🏗️ Build Android App Bundle (AAB)..."
cd android && ./gradlew bundleRelease && cd ..

if [ $? -ne 0 ]; then
    echo "❌ Errore durante il build AAB"
    exit 1
fi

echo ""
echo "✅ BUILD COMPLETATO CON SUCCESSO!"
echo ""
echo "📁 File AAB generato in:"
echo "   android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "📋 Informazioni Release:"
echo "   - Versione: 1.0.4"
echo "   - Version Code: 9"
echo "   - Nome: TableTalk Social con Login Social"
echo "   - Data: $(date)"
echo ""
echo "🚀 Prossimi passi:"
echo "   1. Carica il file AAB su Google Play Console"
echo "   2. Aggiorna le note di rilascio con il changelog"
echo "   3. Pubblica la release in produzione"
echo ""
echo "📚 Documentazione:"
echo "   - SOCIAL_LOGIN_SETUP.md per dettagli tecnici"
echo "   - CHANGELOG.md per note di rilascio"
echo ""
echo "🎉 Release 1.0.4 pronta per Google Play!"
