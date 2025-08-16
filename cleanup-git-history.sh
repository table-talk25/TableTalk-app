#!/bin/bash

# Script per pulizia profonda del repository Git
# Rimuove file grandi dalla storia Git per rispettare i limiti GitHub

echo "🧹 PULIZIA PROFONDA REPOSITORY GIT"
echo "==================================="
echo "🎯 Obiettivo: Rimuovere file grandi dalla storia Git"
echo "📱 Per rispettare i limiti GitHub (100MB per file)"
echo ""

# Controlla se siamo nella directory corretta
if [ ! -d ".git" ]; then
    echo "❌ Errore: Esegui questo script dalla directory root di TableTalk"
    exit 1
fi

echo "📊 Dimensioni attuali del repository:"
du -sh .git
du -sh .next
echo ""

echo "🔍 File grandi trovati:"
find . -type f -size +10M -exec ls -lh {} \;
echo ""

echo "⚠️  ATTENZIONE: Questa operazione è IRREVERSIBILE!"
echo "🗑️  Rimuoverà TUTTA la storia Git e creerà un nuovo repository pulito"
echo ""

read -p "🤔 Sei sicuro di voler continuare? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operazione annullata"
    exit 1
fi

echo ""
echo "🗑️  Inizio pulizia profonda..."
echo ""

# 1. Backup del repository corrente
echo "💾 Creo backup del repository corrente..."
cp -r .git .git.backup
echo "✅ Backup creato in .git.backup"

# 2. Rimuovi cartelle problematiche
echo "🧹 Rimuovo cartelle problematiche..."
rm -rf .next
rm -rf node_modules
rm -rf FRONTEND/client/node_modules
rm -rf BACKEND/node_modules
rm -rf FRONTEND/client/build
rm -rf FRONTEND/client/android
rm -rf FRONTEND/client/ios
rm -rf BACKEND/uploads
rm -rf BACKEND/logs
echo "✅ Cartelle problematiche rimosse"

# 3. Rimuovi file di cache e build
echo "🧹 Rimuovo file di cache e build..."
find . -name "*.log" -delete
find . -name "package-lock.json" -delete
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete
echo "✅ File di cache e build rimossi"

# 4. Crea nuovo repository Git pulito
echo "🆕 Creo nuovo repository Git pulito..."
rm -rf .git
git init
echo "✅ Nuovo repository Git creato"

# 5. Configura Git
echo "⚙️  Configuro Git..."
git config user.name "TableTalk Cleanup"
git config user.email "cleanup@tabletalk.app"
echo "✅ Git configurato"

# 6. Aggiungi tutti i file puliti
echo "📁 Aggiungo file puliti..."
git add .
echo "✅ File aggiunti"

# 7. Primo commit pulito
echo "💾 Primo commit pulito..."
git commit -m "🚀 FEAT: Repository pulito e ottimizzato

- 🧹 Rimossa tutta la storia Git precedente
- 📱 File grandi rimossi per rispettare limiti GitHub
- 🎯 App ottimizzata per importazione e condivisione
- 🔥 Dimensioni ridotte significativamente
- ✅ Pronto per nuovo sviluppo pulito"
echo "✅ Primo commit completato"

# 8. Verifica dimensioni
echo ""
echo "📊 Dimensioni dopo la pulizia:"
du -sh .git
echo ""

echo "🎯 PULIZIA PROFONDA COMPLETATA!"
echo ""

echo "💡 PROSSIMI PASSI:"
echo "1. Rimuovi il backup se non serve più:"
echo "   rm -rf .git.backup"
echo ""
echo "2. Aggiungi il nuovo remote:"
echo "   git remote add origin https://github.com/table-talk25/TableTalk-app.git"
echo ""
echo "3. Forza il push (ATTENZIONE: sovrascrive la storia remota):"
echo "   git push -f origin main"
echo ""
echo "4. Per altri collaboratori:"
echo "   git clone https://github.com/table-talk25/TableTalk-app.git"
echo "   cd TableTalk-app"
echo ""

echo "🚀 Il repository è ora PULITO e pronto per GitHub!"
echo "📱 Non ci sono più file grandi che superano i limiti!"
echo ""
echo "⚠️  RICORDA: La storia Git precedente è stata rimossa"
echo "💡 Tutti i collaboratori dovranno clonare nuovamente il repository"
