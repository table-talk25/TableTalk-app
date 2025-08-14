#!/bin/bash

echo "🚀 Iniziando la build di produzione per Android..."
echo "📱 Versione: 1.0.3 (Build 8)"
echo ""

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Pulisci la cache
echo -e "${YELLOW}1. Pulizia cache e build precedenti...${NC}"
cd android
./gradlew clean
cd ..

# 2. Installa dipendenze
echo -e "${YELLOW}2. Installazione dipendenze...${NC}"
npm install

# 3. Build del progetto React
echo -e "${YELLOW}3. Build del progetto React...${NC}"
npm run build

# 4. Sincronizza con Capacitor
echo -e "${YELLOW}4. Sincronizzazione con Capacitor...${NC}"
npx cap sync android

# 5. Copia le risorse
echo -e "${YELLOW}5. Copia risorse...${NC}"
npx cap copy android

# 6. Genera l'AAB (Android App Bundle)
echo -e "${YELLOW}6. Generazione Android App Bundle (AAB)...${NC}"
cd android
./gradlew bundleRelease

# Controlla se la build è andata a buon fine
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build completata con successo!${NC}"
    echo ""
    echo -e "${GREEN}📦 Il file AAB si trova in:${NC}"
    echo "android/app/build/outputs/bundle/release/app-release.aab"
    echo ""
    echo -e "${YELLOW}📝 Prossimi passi:${NC}"
    echo "1. Carica il file AAB su Google Play Console"
    echo "2. Compila le note di rilascio per la versione 1.0.3"
    echo "3. Invia per la revisione"
    echo ""
    echo -e "${GREEN}🎉 Note di rilascio suggerite:${NC}"
    echo "- Traduzioni complete in 7 lingue (IT, EN, ES, FR, DE, AR, ZH)"
    echo "- Migliorato sistema di segnalazione utenti"
    echo "- Aggiunto sistema per lasciare chat/videochiamate con feedback"
    echo "- Correzioni minori e miglioramenti delle prestazioni"
else
    echo -e "${RED}❌ Errore durante la build!${NC}"
    echo "Controlla i log sopra per identificare il problema."
    exit 1
fi
