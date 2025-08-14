# 🚀 Configurazione Login Social - TableTalk

## 📋 Panoramica

Questo documento spiega come configurare e testare il sistema di login social (Google e Apple) per TableTalk.

## 🔧 Configurazione Completata

### ✅ File di Configurazione
- `src/config/googleAuth.js` - Configurazione Google Auth
- `capacitor.config.js` - Configurazione Capacitor per Google e Apple
- `BACKEND/config/config.js` - Configurazione backend
- `BACKEND/credentials/` - Directory per le credenziali OAuth

### ✅ Componenti Creati
- `SocialLoginButtons` - Componente per i pulsanti social
- `socialAuthService` - Servizio per gestire l'autenticazione
- `socialAuthController` - Controller backend per l'autenticazione

### ✅ Traduzioni
- Aggiunte in tutte le lingue supportate (IT, EN, ES, FR, DE, AR, ZH)
- Chiavi: `orContinueWith`, `continueWithGoogle`, `continueWithApple`

## 🧪 Come Testare

### 1. **Test Frontend (Senza Backend)**
```bash
cd FRONTEND/client
npm start
```

Apri la pagina di login e verifica che:
- I pulsanti social siano visibili
- Le traduzioni funzionino
- I pulsanti siano stilizzati correttamente

### 2. **Test Backend**
```bash
cd BACKEND
npm start
```

Testa gli endpoint:
```bash
# Test Google Auth (con token valido)
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"TOKEN_VALIDO","user":{"email":"test@example.com"}}'

# Test Apple Auth
curl -X POST http://localhost:5000/api/auth/apple \
  -H "Content-Type: application/json" \
  -d '{"identityToken":"TOKEN","authorizationCode":"CODE","user":{"email":"test@example.com"}}'
```

### 3. **Test Integrazione Completa**
1. Avvia backend e frontend
2. Vai alla pagina di login
3. Clicca su "Continua con Google"
4. Verifica che il flusso funzioni end-to-end

## 🔍 Debug e Troubleshooting

### Problemi Comuni

#### 1. **Errore "Google Auth not configured"**
- Verifica che `capacitor.config.js` contenga la configurazione GoogleAuth
- Controlla che i Client ID siano corretti

#### 2. **Errore "Invalid token" nel backend**
- Verifica che il Web Client ID nel backend corrisponda a quello di Google Cloud Console
- Controlla che `google-auth-library` sia installato

#### 3. **Pulsanti non visibili**
- Verifica che `SocialLoginButtons` sia importato correttamente
- Controlla che le traduzioni esistano

### Log di Debug
```javascript
// Nel browser console
console.log('Google Auth config:', GOOGLE_AUTH_CONFIG);

// Nel backend
console.log('Google Client ID:', config.googleWebClientId);
```

## 📱 Test su Dispositivi

### Android
```bash
cd FRONTEND/client
npx cap sync android
npx cap run android
```

### iOS
```bash
cd FRONTEND/client
npx cap sync ios
npx cap run ios
```

## 🚀 Prossimi Passi

### 1. **Verifica Google Cloud Console**
- Conferma che i Client ID siano attivi
- Verifica che le API OAuth siano abilitate

### 2. **Test Produzione**
- Testa con account Google reali
- Verifica il flusso di registrazione utenti

### 3. **Apple Sign-In (iOS)**
- Configura Apple Developer Account
- Testa su dispositivo iOS fisico

## 📚 Risorse Utili

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign-In](https://developer.apple.com/sign-in-with-apple/)
- [Capacitor Google Auth](https://github.com/CodetrixStudio/CapacitorGoogleAuth)
- [Capacitor Apple Sign-In](https://github.com/capacitor-community/apple-sign-in)

## 🆘 Supporto

Se incontri problemi:
1. Controlla i log del browser e del backend
2. Verifica la configurazione OAuth
3. Controlla che tutte le dipendenze siano installate
4. Verifica che i Client ID corrispondano
