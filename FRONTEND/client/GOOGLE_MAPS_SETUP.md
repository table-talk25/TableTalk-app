# Configurazione Sicura Google Maps API

## ⚠️ IMPORTANTE: Sicurezza della Chiave API

La chiave API di Google Maps è stata rimossa dal codice JavaScript per motivi di sicurezza. Ora è configurata a livello nativo come richiesto da Google e Capacitor.

## 🔧 Configurazione Attuale

### Android
- **File**: `android/app/src/main/AndroidManifest.xml`
- **Configurazione**: 
```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="${MAPS_API_KEY}" />
```

### iOS
- **File**: `ios/App/App/AppDelegate.swift`
- **Configurazione**:
```swift
let mapsApiKey = ProcessInfo.processInfo.environment["MAPS_API_KEY"] ?? ""
GMSServices.provideAPIKey(mapsApiKey)
```

## 🚨 Configurazione Sicura per Produzione

### 1. Rimuovi la Chiave dal Codice
La chiave API è stata rimossa da:
- `src/components/Map/MapView.js` ✅

### 2. Configura Variabili d'Ambiente

#### Per Sviluppo Locale:
Crea un file `.env.local` nella root del progetto:
```bash
MAPS_API_KEY=la_tua_chiave_api_qui
```

#### Per Build di Produzione:

**Android:**
- Rimuovi la chiave da `gradle.properties`
- Imposta la variabile d'ambiente durante il build:
```bash
export MAPS_API_KEY=la_tua_chiave_api_qui
npx cap build android
```

**iOS:**
- Imposta la variabile d'ambiente durante il build:
```bash
export MAPS_API_KEY=la_tua_chiave_api_qui
npx cap build ios
```

### 3. Configurazione CI/CD

Per i pipeline di build automatici, configura le variabili d'ambiente nei tuoi servizi:

**GitHub Actions:**
```yaml
env:
  MAPS_API_KEY: ${{ secrets.MAPS_API_KEY }}
```

**GitLab CI:**
```yaml
variables:
  MAPS_API_KEY: $MAPS_API_KEY
```

## 🔒 Best Practices di Sicurezza

1. **Mai committare la chiave API** nel repository
2. **Usa variabili d'ambiente** per tutti gli ambienti
3. **Limita la chiave API** nel Google Cloud Console:
   - Restringi per pacchetto Android
   - Restringi per bundle ID iOS
   - Abilita solo le API necessarie
4. **Monitora l'uso** della chiave API
5. **Ruota periodicamente** la chiave API

## 🛠️ Comandi Utili

### Build con Variabile d'Ambiente
```bash
# Android
MAPS_API_KEY=la_tua_chiave npx cap build android

# iOS
MAPS_API_KEY=la_tua_chiave npx cap build ios
```

### Verifica Configurazione
```bash
# Verifica che la chiave non sia nel codice
grep -r "AIzaSy" src/
grep -r "AIzaSy" android/
grep -r "AIzaSy" ios/
```

## 📱 Test

Dopo la configurazione, testa che la mappa funzioni correttamente:
1. Build dell'app con la variabile d'ambiente
2. Verifica che la mappa si carichi
3. Controlla che i marker appaiano
4. Testa l'interazione con i marker

## 🆘 Risoluzione Problemi

### Mappa non si carica
- Verifica che la variabile d'ambiente sia impostata
- Controlla che la chiave API sia valida
- Verifica le restrizioni nel Google Cloud Console

### Errore di build
- Assicurati che la variabile d'ambiente sia disponibile
- Verifica la sintassi nei file di configurazione

## 📞 Supporto

Per problemi con la configurazione, consulta:
- [Documentazione Capacitor Google Maps](https://capacitorjs.com/docs/apis/google-maps)
- [Google Maps Platform](https://developers.google.com/maps/documentation)
- [Best Practices per API Keys](https://developers.google.com/maps/api-security-best-practices) 