const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Ottieni statistiche sull'uso delle lingue
 * @route   GET /api/analytics/languages
 * @access  Admin
 */
exports.getLanguageStats = asyncHandler(async (req, res, next) => {
  // 1. Conta quanti utenti hanno ogni lingua nel profilo
  const languageStats = await User.aggregate([
    { $unwind: '$languages' },
    {
      $group: {
        _id: '$languages',
        count: { $sum: 1 },
        users: { $push: '$_id' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // 2. Conta utenti senza lingue configurate
  const usersWithoutLanguages = await User.countDocuments({
    $or: [
      { languages: { $exists: false } },
      { languages: { $size: 0 } }
    ]
  });

  // 3. Calcola statistiche generali
  const totalUsers = await User.countDocuments();
  const usersWithLanguages = totalUsers - usersWithoutLanguages;

  // 4. Analizza le tendenze (ultimi 30 giorni)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentLanguageStats = await User.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    { $unwind: '$languages' },
    {
      $group: {
        _id: '$languages',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // 5. Genera raccomandazioni
  const recommendations = generateLanguageRecommendations(languageStats, recentLanguageStats, totalUsers);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      usersWithLanguages,
      usersWithoutLanguages,
      languageStats,
      recentLanguageStats,
      recommendations
    }
  });
});

/**
 * @desc    Ottieni statistiche dettagliate per una lingua specifica
 * @route   GET /api/analytics/languages/:languageCode
 * @access  Admin
 */
exports.getLanguageDetails = asyncHandler(async (req, res, next) => {
  const { languageCode } = req.params;

  // 1. Utenti che parlano questa lingua
  const usersWithLanguage = await User.find({
    languages: languageCode
  }).select('nickname email createdAt lastLogin');

  // 2. Statistiche temporali (ultimi 6 mesi)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyStats = await User.aggregate([
    { $match: { languages: languageCode, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        newUsers: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // 3. Lingue combinate (quali lingue usano insieme)
  const combinedLanguages = await User.aggregate([
    { $match: { languages: languageCode } },
    { $unwind: '$languages' },
    {
      $group: {
        _id: '$languages',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      languageCode,
      totalUsers: usersWithLanguage.length,
      users: usersWithLanguage,
      monthlyStats,
      combinedLanguages
    }
  });
});

/**
 * @desc    Ottieni report di priorità traduzioni
 * @route   GET /api/analytics/translation-priority
 * @access  Admin
 */
exports.getTranslationPriority = asyncHandler(async (req, res, next) => {
  // 1. Analizza l'uso delle lingue
  const languageStats = await User.aggregate([
    { $unwind: '$languages' },
    {
      $group: {
        _id: '$languages',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);

  // 2. Calcola priorità basata su diversi fattori
  const priorityReport = calculateTranslationPriority(languageStats);

  // 3. Suggerimenti per nuove traduzioni
  const suggestions = generateTranslationSuggestions(priorityReport);

  res.status(200).json({
    success: true,
    data: {
      priorityReport,
      suggestions
    }
  });
});

// Funzioni helper
function generateLanguageRecommendations(languageStats, recentStats, totalUsers) {
  const recommendations = [];

  // 1. Lingue con alta crescita recente
  const highGrowthLanguages = recentStats.filter(stat => {
    const overallStat = languageStats.find(s => s._id === stat._id);
    if (!overallStat) return false;
    
    const growthRate = (stat.count / 30) / (overallStat.count / totalUsers * 30);
    return growthRate > 1.5; // 50% più crescita del normale
  });

  if (highGrowthLanguages.length > 0) {
    recommendations.push({
      type: 'high_growth',
      message: `Lingue con crescita rapida: ${highGrowthLanguages.map(l => l._id).join(', ')}`,
      priority: 'high'
    });
  }

  // 2. Lingue con molti utenti ma senza traduzione
  const untranslatedLanguages = languageStats.filter(stat => {
    // Controlla se la traduzione esiste (da implementare)
    return stat.count > 10; // Più di 10 utenti
  });

  if (untranslatedLanguages.length > 0) {
    recommendations.push({
      type: 'untranslated_demand',
      message: `Considera di tradurre: ${untranslatedLanguages.map(l => l._id).join(', ')}`,
      priority: 'medium'
    });
  }

  // 3. Lingue emergenti
  const emergingLanguages = recentStats.filter(stat => {
    const overallStat = languageStats.find(s => s._id === stat._id);
    return !overallStat && stat.count >= 3; // Nuove lingue con almeno 3 utenti
  });

  if (emergingLanguages.length > 0) {
    recommendations.push({
      type: 'emerging',
      message: `Nuove lingue emergenti: ${emergingLanguages.map(l => l._id).join(', ')}`,
      priority: 'low'
    });
  }

  return recommendations;
}

function calculateTranslationPriority(languageStats) {
  const priorityReport = [];

  languageStats.forEach(stat => {
    const priority = {
      language: stat._id,
      userCount: stat.count,
      priority: 'low',
      reasons: []
    };

    // Calcola priorità basata su diversi fattori
    if (stat.count > 100) {
      priority.priority = 'high';
      priority.reasons.push('Molti utenti (>100)');
    } else if (stat.count > 50) {
      priority.priority = 'medium';
      priority.reasons.push('Utenti significativi (>50)');
    } else if (stat.count > 10) {
      priority.priority = 'low';
      priority.reasons.push('Utenti limitati (>10)');
    }

    // Fattori aggiuntivi
    if (['en', 'es', 'fr', 'de'].includes(stat._id)) {
      priority.priority = 'high';
      priority.reasons.push('Lingua europea importante');
    }

    if (['zh', 'ja', 'ar'].includes(stat._id)) {
      priority.reasons.push('Mercato internazionale');
    }

    priorityReport.push(priority);
  });

  return priorityReport.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function generateTranslationSuggestions(priorityReport) {
  const suggestions = [];

  const highPriority = priorityReport.filter(p => p.priority === 'high');
  const mediumPriority = priorityReport.filter(p => p.priority === 'medium');

  if (highPriority.length > 0) {
    suggestions.push({
      type: 'immediate',
      message: `Traduci immediatamente: ${highPriority.map(p => p.language).join(', ')}`,
      impact: 'Alto impatto sugli utenti'
    });
  }

  if (mediumPriority.length > 0) {
    suggestions.push({
      type: 'planned',
      message: `Pianifica traduzione per: ${mediumPriority.map(p => p.language).join(', ')}`,
      impact: 'Miglioramento esperienza utente'
    });
  }

  return suggestions;
} 