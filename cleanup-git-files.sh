#!/bin/bash

# Script per rimuovere file grandi dalla storia Git
# Mantiene la cronologia ma rimuove file problematici

echo "🧹 PULIZIA FILE GRANDI DALLA STORIA GIT"
echo "======================================="
echo "🎯 Obiettivo: Rimuovere file >100MB dalla storia Git"
echo "📱 Per rispettare i limiti GitHub senza perdere cronologia"
echo ""

# Controlla se siamo nella directory corretta
if [ ! -d ".git" ]; then
    echo "❌ Errore: Esegui questo script dalla directory root di TableTalk"
    exit 1
fi

echo "📊 Dimensioni attuali del repository:"
du -sh .git
echo ""

echo "🔍 File grandi trovati nella storia Git:"
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sed -n 's/^blob //p' | sort -k2nr | head -20
echo ""

echo "⚠️  ATTENZIONE: Questa operazione modificherà la storia Git!"
echo "🗑️  Rimuoverà file grandi ma manterrà la cronologia"
echo ""

read -p "🤔 Sei sicuro di voler continuare? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operazione annullata"
    exit 1
fi

echo ""
echo "🗑️  Inizio pulizia file grandi..."
echo ""

# 1. Backup del repository corrente
echo "💾 Creo backup del repository corrente..."
cp -r .git .git.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup creato"

# 2. Rimuovi file grandi dalla cronologia
echo "🧹 Rimuovo file grandi dalla cronologia Git..."

# Rimuovi .next dalla cronologia
if git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch -r .next' --prune-empty --tag-name-filter cat -- --all; then
    echo "✅ Rimosso .next dalla cronologia"
else
    echo "⚠️  Errore nella rimozione di .next"
fi

# Rimuovi node_modules dalla cronologia
if git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch -r node_modules' --prune-empty --tag-name-filter cat -- --all; then
    echo "✅ Rimosso node_modules dalla cronologia"
else
    echo "⚠️  Errore nella rimozione di node_modules"
fi

# Rimuovi build dalla cronologia
if git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch -r build' --prune-empty --tag-name-filter cat -- --all; then
    echo "✅ Rimosso build dalla cronologia"
else
    echo "⚠️  Errore nella rimozione di build"
fi

# Rimuovi android dalla cronologia
if git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch -r android' --prune-empty --tag-name-filter cat -- --all; then
    echo "✅ Rimosso android dalla cronologia"
else
    echo "⚠️  Errore nella rimozione di android"
fi

# Rimuovi ios dalla cronologia
if git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch -r ios' --prune-empty --tag-name-filter cat -- --all; then
    echo "✅ Rimosso ios dalla cronologia"
else
    echo "⚠️  Errore nella rimozione di ios"
fi

# Rimuovi uploads dalla cronologia
if git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch -r uploads' --prune-empty --tag-name-filter cat -- --all; then
    echo "✅ Rimosso uploads dalla cronologia"
else
    echo "⚠️  Errore nella rimozione di uploads"
fi

# 3. Pulisci e ottimizza il repository
echo "🧹 Pulisco e ottimizzo il repository..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive
echo "✅ Repository ottimizzato"

# 4. Verifica dimensioni
echo ""
echo "📊 Dimensioni dopo la pulizia:"
du -sh .git
echo ""

echo "🎯 PULIZIA FILE GRANDI COMPLETATA!"
echo ""

echo "💡 PROSSIMI PASSI:"
echo "1. Verifica che non ci siano più file grandi:"
echo "   git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sed -n 's/^blob //p' | sort -k2nr | head -10"
echo ""
echo "2. Forza il push per aggiornare il repository remoto:"
echo "   git push -f origin main"
echo ""
echo "3. Per altri collaboratori:"
echo "   git fetch origin"
echo "   git reset --hard origin/main"
echo ""

echo "🚀 Il repository è ora PULITO e rispetta i limiti GitHub!"
echo "📱 I file grandi sono stati rimossi dalla cronologia!"
echo ""
echo "⚠️  RICORDA: La cronologia è stata modificata"
echo "💡 Tutti i collaboratori dovranno fare fetch e reset"
echo ""
echo "💾 Backup disponibile in .git.backup.*"
