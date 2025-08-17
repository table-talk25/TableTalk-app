# 🌍 Guida alla Pluralizzazione Dinamica - TableTalk

## 📖 Panoramica

TableTalk ora supporta la **pluralizzazione dinamica** per tutte le lingue supportate, utilizzando le regole native di i18next. Questo sistema garantisce che i testi si adattino correttamente al numero di elementi, seguendo le regole grammaticali di ogni lingua.

## 🎯 Problemi Risolti

### **Prima (Sistema Statico)**
- ❌ Testi hardcoded per singolare/plurale
- ❌ Traduzioni non naturali ("1 TableTalk®" vs "2 TableTalk®")
- ❌ Supporto limitato per lingue con regole complesse (es. arabo)
- ❌ Manutenzione difficile per nuove lingue

### **Dopo (Sistema Dinamico)**
- ✅ **Pluralizzazione Automatica**: i18next sceglie la forma corretta
- ✅ **Lingue Complesse**: Supporto per arabo (5 forme), francese (3 forme)
- ✅ **Manutenzione Semplice**: Aggiunta nuove lingue senza modifiche al codice
- ✅ **UX Naturale**: Testi che suonano naturali in ogni lingua

## 🏗️ Architettura

### **Configurazione i18n**
```javascript
// src/i18n.js
pluralRules: {
  // Italiano: 1, 2+, 0
  it: {
    numbers: [1, 2, 0],
    plurals: function(n) {
      if (n === 1) return 0;        // "1 TableTalk®"
      if (n >= 2 && n <= 19) return 1; // "2 TableTalk®"
      return 2;                     // "0 TableTalk®"
    }
  },
  // Inglese: 1, other
  en: {
    numbers: [1, 2],
    plurals: function(n) {
      return n === 1 ? 0 : 1;      // "1 TableTalk®" vs "2 TableTalk®"
    }
  }
}
```

### **Chiavi di Traduzione**
```json
// it/translation.json
{
  "meals": {
    "mealCount_one": "{{count}} TableTalk®",      // 1 TableTalk®
    "mealCount_other": "{{count}} TableTalk®",    // 2+ TableTalk®
    "mealCount_zero": "Nessun TableTalk®"         // 0 TableTalk®
  }
}

// en/translation.json
{
  "meals": {
    "mealCount_one": "{{count}} TableTalk®",      // 1 TableTalk®
    "mealCount_other": "{{count}} TableTalk®"     // 2+ TableTalk®
  }
}
```

## 🚀 Utilizzo

### **1. Hook Personalizzato (Raccomandato)**
```javascript
import usePluralization from '../../hooks/usePluralization';

const MyComponent = () => {
  const { pluralizeMeal, pluralizeUser } = usePluralization();
  
  return (
    <div>
      <p>{pluralizeMeal(5)}</p>        // "5 TableTalk®"
      <p>{pluralizeUser(1)}</p>        // "1 utente"
    </div>
  );
};
```

### **2. Funzione t Diretta**
```javascript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <p>{t('meals.mealCount', { count: 3 })}</p>  // "3 TableTalk®"
      <p>{t('meals.user', { count: 1 })}</p>        // "1 utente"
    </div>
  );
};
```

### **3. Pluralizzazione Condizionale**
```javascript
const { smartPluralize } = usePluralization();

// Con fallback personalizzato
const result = smartPluralize('meals.mealCount', count, (n) => 
  `${n} TableTalk®`
);
```

## 🌐 Lingue Supportate

### **Italiano (it)**
- **Forme**: 3 (1, 2+, 0)
- **Esempi**: 
  - 1: "1 TableTalk®"
  - 2-19: "2 TableTalk®"
  - 0: "Nessun TableTalk®"

### **Inglese (en)**
- **Forme**: 2 (1, other)
- **Esempi**:
  - 1: "1 TableTalk®"
  - 2+: "2 TableTalk®"

### **Francese (fr)**
- **Forme**: 3 (0, 1, other)
- **Esempi**:
  - 0: "0 TableTalk®"
  - 1: "1 TableTalk®"
  - 2+: "2 TableTalk®"

### **Tedesco (de)**
- **Forme**: 2 (1, other)
- **Esempi**:
  - 1: "1 TableTalk®"
  - 2+: "2 TableTalk®"

### **Spagnolo (es)**
- **Forme**: 2 (1, other)
- **Esempi**:
  - 1: "1 TableTalk®"
  - 2+: "2 TableTalk®"

### **Arabo (ar)**
- **Forme**: 5 (0, 1, 2, 3-10, 11+)
- **Esempi**:
  - 0: "0 TableTalk®"
  - 1: "1 TableTalk®"
  - 2: "2 TableTalk®"
  - 3-10: "3 TableTalk®"
  - 11+: "11 TableTalk®"

### **Cinese (zh)**
- **Forme**: 1 (sempre singolare)
- **Esempi**:
  - Tutti: "TableTalk®" (senza numeri)

## 📝 Aggiungere Nuove Chiavi

### **1. Aggiorna i File di Traduzione**
```json
// it/translation.json
{
  "meals": {
    "newItem_one": "{{count}} nuovo elemento",
    "newItem_other": "{{count}} nuovi elementi",
    "newItem_zero": "Nessun nuovo elemento"
  }
}

// en/translation.json
{
  "meals": {
    "newItem_one": "{{count}} new item",
    "newItem_other": "{{count}} new items"
  }
}
```

### **2. Aggiungi Funzione all'Hook**
```javascript
// src/hooks/usePluralization.js
const pluralizeNewItem = (count) => {
  return t('meals.newItem', { count });
};

// Aggiungi all'export
return {
  // ... altre funzioni
  pluralizeNewItem
};
```

### **3. Utilizza nel Componente**
```javascript
const { pluralizeNewItem } = usePluralization();
const text = pluralizeNewItem(5); // "5 nuovi elementi"
```

## 🔧 Configurazione Avanzata

### **Regole Personalizzate**
```javascript
// Per lingue con regole complesse
pluralRules: {
  custom: {
    numbers: [0, 1, 2, 3, 4, 5],
    plurals: function(n) {
      if (n === 0) return 0;
      if (n === 1) return 1;
      if (n === 2) return 2;
      if (n >= 3 && n <= 10) return 3;
      if (n >= 11 && n <= 20) return 4;
      return 5;
    }
  }
}
```

### **Separatori Personalizzati**
```javascript
i18n.init({
  pluralSeparator: '_',    // mealCount_one
  keySeparator: '.',       // meals.mealCount
  contextSeparator: '|'    // mealCount|context
});
```

## 📱 Esempi Pratici

### **Lista Pasti**
```javascript
const MealList = ({ meals }) => {
  const { pluralizeMeal } = usePluralization();
  
  return (
    <div>
      <h3>{pluralizeMeal(meals.length)}</h3>
      {meals.map(meal => (
        <MealItem key={meal.id} meal={meal} />
      ))}
    </div>
  );
};
```

### **Statistiche**
```javascript
const Stats = ({ stats }) => {
  const { pluralizeUser, pluralizeMessage } = usePluralization();
  
  return (
    <div>
      <p>Utenti attivi: {pluralizeUser(stats.activeUsers)}</p>
      <p>Messaggi oggi: {pluralizeMessage(stats.todayMessages)}</p>
    </div>
  );
};
```

### **Notifiche**
```javascript
const NotificationBadge = ({ count }) => {
  const { pluralizeNotification } = usePluralization();
  
  return (
    <div className="badge">
      {count > 0 && (
        <span>{pluralizeNotification(count)}</span>
      )}
    </div>
  );
};
```

## 🧪 Testing

### **Componente di Test**
```javascript
// src/components/common/PluralizationExample/index.js
// Questo componente permette di testare tutte le funzionalità
// di pluralizzazione in tempo reale
```

### **Test Automatici**
```javascript
// Esempi di test per verificare la pluralizzazione
describe('Pluralization', () => {
  it('should pluralize meals correctly in Italian', () => {
    expect(pluralizeMeal(1)).toBe('1 TableTalk®');
    expect(pluralizeMeal(2)).toBe('2 TableTalk®');
    expect(pluralizeMeal(0)).toBe('Nessun TableTalk®');
  });
});
```

## 🚨 Troubleshooting

### **Problemi Comuni**

#### **1. Chiave Non Trovata**
```javascript
// ❌ Errore: "meals.mealCount" non trovata
const result = t('meals.mealCount', { count: 5 });

// ✅ Soluzione: Verifica che la chiave esista
// e che il file di traduzione sia caricato
```

#### **2. Pluralizzazione Non Funziona**
```javascript
// ❌ Problema: Sempre la stessa forma
// ✅ Soluzione: Verifica pluralRules nella configurazione i18n
```

#### **3. Fallback Non Funziona**
```javascript
// ❌ Problema: Fallback non viene utilizzato
// ✅ Soluzione: Usa smartPluralize con fallback personalizzato
```

### **Debug**
```javascript
// Abilita logging per debug
console.log('Lingua corrente:', i18n.language);
console.log('Regole plurali:', i18n.options.pluralRules);
console.log('Risultato pluralizzazione:', t('meals.mealCount', { count: 5 }));
```

## 🔮 Prossimi Passi

1. **Estensione Lingue**: Aggiungere supporto per altre lingue
2. **Regole Avanzate**: Implementare regole per lingue con pluralizzazione complessa
3. **Performance**: Ottimizzare il caricamento delle traduzioni
4. **Analytics**: Tracciare l'utilizzo delle diverse lingue
5. **A/B Testing**: Testare diverse formulazioni per ogni lingua

## 📚 Risorse

- [Documentazione i18next](https://www.i18next.com/)
- [Pluralization Rules](https://www.i18next.com/translation-function/plurals)
- [Language Detection](https://www.i18next.com/overview/plugins-and-utils#language-detector)
- [React Integration](https://react.i18next.com/)

---

**TableTalk ora offre un sistema di pluralizzazione professionale e scalabile per tutte le lingue supportate!** 🌍✨
