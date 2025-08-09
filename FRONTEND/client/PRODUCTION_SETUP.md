# 🚀 TableTalk - Setup di Produzione

## 📋 Checklist Pre-Produzione

### ✅ **Chiavi API Richieste**

#### 🗺️ **Google Maps API**
- [ ] Chiave API Google Maps creata
- [ ] Restrizioni API configurate per il dominio/app
- [ ] Quota e billing configurati
- [ ] Variabile `MAPS_API_KEY` impostata

#### 🔥 **Firebase (Opzionale - per Push Notifications)**
- [ ] Progetto Firebase creato
- [ ] File `google-services.json` reale generato
- [ ] Configurazione web Firebase ottenuta
- [ ] Variabili Firebase impostate

#### 📞 **Twilio (per Videochiamate)**
- [ ] Account Twilio creato
- [ ] API Keys generate
- [ ] Variabili Twilio impostate

#### 🌐 **Backend**
- [ ] Backend deployato online (Render/Heroku/AWS)
- [ ] URL produzione impostato in `REACT_APP_API_URL`
- [ ] Database produzione configurato

---

## 🔧 **Setup Passo-Passo**

### **1. Configura le Variabili d'Ambiente**

```bash
# Copia il file template
cp env.production.example .env.production

# Modifica il file con le tue chiavi reali
nano .env.production
```

### **2. Google Maps API**

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea/seleziona un progetto
3. Abilita "Maps SDK for Android" e "Maps JavaScript API"
4. Crea una chiave API
5. Configura restrizioni:
   - **Android:** Package name `com.TableTalkApp.tabletalk`
   - **Web:** Domini autorizzati

### **3. Firebase (Opzionale)**

1. Vai su [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuovo progetto
3. Aggiungi app Android con package `com.TableTalkApp.tabletalk`
4. Scarica `google-services.json` e sostituisci quello esistente
5. Configura Authentication e Cloud Messaging

### **4. Twilio**

1. Vai su [Twilio Console](https://console.twilio.com/)
2. Ottieni Account SID e Auth Token
3. Crea API Key e Secret per Video
4. Imposta le variabili d'ambiente

---

## 🏗️ **Build di Produzione**

### **Metodo 1: Script Automatico**

```bash
# Imposta le variabili d'ambiente
export MAPS_API_KEY="your_key_here"
export REACT_APP_API_URL="https://your-backend.onrender.com/api"
export TWILIO_ACCOUNT_SID="your_sid_here"
# ... altre variabili

# Esegui il build
./build-production.sh
```

### **Metodo 2: Build Manuale**

```bash
# 1. Build React
npm run build

# 2. Sync Capacitor
npx cap sync android

# 3. Build Android
cd android
export MAPS_API_KEY="your_key_here"
./gradlew assembleRelease
```

---

## 📱 **Output di Produzione**

Dopo il build di successo troverai:

- **APK Release:** `android/app/build/outputs/apk/release/app-release.apk`
- **APK Debug:** `android/app/build/outputs/apk/debug/app-debug.apk`

---

## ⚠️ **Sicurezza**

### **❌ NON fare mai:**
- Committare chiavi API nel repository
- Usare chiavi di sviluppo in produzione
- Esporre chiavi in file pubblici

### **✅ Best Practices:**
- Usa variabili d'ambiente per tutte le chiavi
- Configura restrizioni API appropriate
- Monitora l'uso delle API
- Ruota periodicamente le chiavi

---

## 🔍 **Troubleshooting**

### **Google Maps non funziona**
- Verifica che la chiave API sia corretta
- Controlla le restrizioni nel Google Cloud Console
- Assicurati che il billing sia abilitato

### **Firebase non inizializza**
- Verifica che `google-services.json` sia reale (non di test)
- Controlla che il package name corrisponda
- Verifica le configurazioni nel Firebase Console

### **Twilio non connette**
- Verifica Account SID e Auth Token
- Controlla che le API Key siano corrette
- Assicurati che il servizio Video sia abilitato

---

## 📞 **Supporto**

Per problemi di configurazione:
1. Controlla i log di build
2. Verifica le variabili d'ambiente
3. Consulta la documentazione delle API
4. Controlla le quote e i limiti