const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const ErrorResponse = require('../utils/errorResponse');
const Meal = require('../models/Meal');
const User = require('../models/User');
const Chat = require('../models/Chat');
const twilio = require('twilio');
const fs = require('fs');
const path = require('path');
// Salva un'immagine base64 nella cartella uploads/meal-images e restituisce il path relativo
function saveBase64Cover(base64String, userId) {
  if (!base64String) return null;
  // Supporta sia data URL (data:image/jpeg;base64,...) che puro base64
  const matches = base64String.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const mime = matches ? matches[1] : 'image/jpeg';
  const data = matches ? matches[2] : base64String;
  const extMap = { 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
  const ext = extMap[mime] || '.jpg';
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'meal-images');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  const filename = `coverImage-${userId}-${Date.now()}${ext}`;
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  return `uploads/meal-images/${filename}`;
}
const notificationService = require('../services/notificationService');
const sendEmail = require('../utils/sendEmail');
const { sanitizeMealData } = require('../services/sanitizationService');
const mealStatusService = require('../services/mealStatusService');
const geolocationNotificationService = require('../services/geolocationNotificationService');

const twilioClient = twilio(
  process.env.TWILIO_API_KEY,
  process.env.TWILIO_API_SECRET,
  { accountSid: process.env.TWILIO_ACCOUNT_SID }
);

// Helper function per normalizzare la location
const normalizeMealLocation = (mealDoc) => {
  const meal = mealDoc && typeof mealDoc.toObject === 'function' ? mealDoc.toObject() : mealDoc;
  
  if (meal && meal.location) {
    if (typeof meal.location === 'string') {
      const match = meal.location.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
      if (match) {
        const latNum = parseFloat(match[1]);
        const lngNum = parseFloat(match[2]);
        if (!Number.isNaN(latNum) && !Number.isNaN(lngNum)) {
          meal.location = {
            address: meal.location,
            coordinates: [lngNum, latNum]
          };
        }
      } else {
        meal.location = {
          address: meal.location,
          coordinates: undefined
        };
      }
    }
  }
  
  return meal;
};

// Helper functions per calcoli geospaziali
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Raggio della Terra in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distanza in km
};

const validateCoordinates = (lat, lng) => {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

const validateRadius = (radius) => {
  const radiusNum = parseFloat(radius);
  return !isNaN(radiusNum) && radiusNum > 0 && radiusNum <= 1000; // Max 1000 km
};

// @desc    Get meals within a certain radius for the map (OTIMIZZATA)
// @route   GET /api/meals/map?lat=45.46&lng=9.18&radius=50
// @access  Public
exports.getMealsForMap = asyncHandler(async (req, res, next) => {
  try {
    const { lat, lng, radius, mealType = 'physical', status = 'upcoming' } = req.query;

    // Validazione parametri richiesti
    if (!lat || !lng || !radius) {
      return next(new ErrorResponse('Coordinate e raggio richiesti: lat, lng, radius', 400));
    }

    // Validazione coordinate
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (!validateCoordinates(latitude, longitude)) {
      return next(new ErrorResponse('Coordinate non valide. Lat: -90 a 90, Lng: -180 a 180', 400));
    }

    if (!validateRadius(radiusKm)) {
      return next(new ErrorResponse('Raggio non valido. Deve essere tra 0 e 1000 km', 400));
    }

    console.log(`🗺️ [MealController] Ricerca pasti per mappa: lat=${latitude}, lng=${longitude}, radius=${radiusKm}km`);

    // Calcola il raggio in radianti per query MongoDB
    const radiusInRad = radiusKm / 6371; // 6371 km = raggio della Terra

    // Query base per pasti fisici con location valida
    const baseQuery = {
      mealType: mealType,
      status: { $in: status.split(',') },
      'location.coordinates': { $exists: true, $ne: null }
    };

    // Query geospaziale ottimizzata
    const geoQuery = {
      ...baseQuery,
      'location.coordinates': {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRad]
        }
      }
    };

    // Esegui query con popolamento minimo per performance
    const meals = await Meal.find(geoQuery)
      .select('_id title description date duration mealType location host maxParticipants participants status')
      .populate('host', 'nickname profileImage')
      .lean()
      .exec();

    console.log(`✅ [MealController] Trovati ${meals.length} pasti nel raggio di ${radiusKm}km`);

    // Aggiungi distanza calcolata e normalizza location
    const mealsWithDistance = meals.map(meal => {
      const mealData = normalizeMealLocation(meal);
      
      if (mealData.location && mealData.location.coordinates) {
        const [mealLng, mealLat] = mealData.location.coordinates;
        const distance = calculateDistance(latitude, longitude, mealLat, mealLng);
        
        return {
          ...mealData,
          distance: Math.round(distance * 100) / 100, // Arrotonda a 2 decimali
          distanceFormatted: `${Math.round(distance * 100) / 100} km`
        };
      }
      
      return mealData;
    });

    // Ordina per distanza (più vicini prima)
    mealsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    res.status(200).json({
      success: true,
      count: mealsWithDistance.length,
      data: mealsWithDistance,
      searchParams: {
        center: { lat: latitude, lng: longitude },
        radius: radiusKm,
        mealType,
        status
      },
      performance: {
        queryType: 'geospatial',
        radiusKm,
        resultsCount: mealsWithDistance.length
      }
    });

  } catch (error) {
    console.error('❌ [MealController] Errore in getMealsForMap:', error);
    return next(new ErrorResponse('Errore nella ricerca geospaziale', 500));
  }
});

// @desc    Get geospatial statistics for meals
// @route   GET /api/meals/geostats?lat=45.46&lng=9.18&radius=50
// @access  Public
exports.getMealsGeoStats = asyncHandler(async (req, res, next) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return next(new ErrorResponse('Coordinate richieste: lat, lng', 400));
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (!validateCoordinates(latitude, longitude)) {
      return next(new ErrorResponse('Coordinate non valide', 400));
    }

    if (!validateRadius(radiusKm)) {
      return next(new ErrorResponse('Raggio non valido', 400));
    }

    console.log(`📊 [MealController] Statistiche geospaziali: lat=${latitude}, lng=${longitude}, radius=${radiusKm}km`);

    const radiusInRad = radiusKm / 6371;

    // Query per statistiche aggregate
    const stats = await Meal.aggregate([
      {
        $match: {
          mealType: 'physical',
          'location.coordinates': {
            $geoWithin: {
              $centerSphere: [[longitude, latitude], radiusInRad]
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalMeals: { $sum: 1 },
          upcomingMeals: {
            $sum: {
              $cond: [
                { $gte: ['$date', new Date()] },
                1,
                0
              ]
            }
          },
          ongoingMeals: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lte: ['$date', new Date()] },
                    { $gte: [{ $add: ['$date', { $multiply: ['$duration', 60000] }] }, new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          },
          avgParticipants: { $avg: { $size: '$participants' } },
          maxParticipants: { $max: { $size: '$participants' } },
          mealTypes: { $addToSet: '$mealType' },
          hosts: { $addToSet: '$host' }
        }
      }
    ]);

    const result = stats[0] || {
      totalMeals: 0,
      upcomingMeals: 0,
      ongoingMeals: 0,
      avgParticipants: 0,
      maxParticipants: 0,
      mealTypes: [],
      hosts: []
    };

    // Calcola densità e distribuzione
    const area = Math.PI * radiusKm * radiusKm; // Area approssimativa in km²
    const density = result.totalMeals / area;

    res.status(200).json({
      success: true,
      data: {
        ...result,
        searchArea: {
          center: { lat: latitude, lng: longitude },
          radius: radiusKm,
          areaKm2: Math.round(area * 100) / 100
        },
        density: {
          mealsPerKm2: Math.round(density * 1000) / 1000,
          mealsPer100Km2: Math.round(density * 100 * 100) / 100
        },
        performance: {
          queryType: 'geospatial_aggregation',
          radiusKm,
          resultsCount: result.totalMeals
        }
      }
    });

  } catch (error) {
    console.error('❌ [MealController] Errore in getMealsGeoStats:', error);
    return next(new ErrorResponse('Errore nelle statistiche geospaziali', 500));
  }
});

// @desc    Get meals within a certain radius for the map (LEGACY - mantenuta per compatibilità)
// @route   GET /api/meals/map?lat=45.46&lng=9.18&radius=50
// @access  Public
exports.getMealsForMapLegacy = asyncHandler(async (req, res, next) => {
  try {
    const { lat, lng, radius } = req.query;

    if (!lat || !lng || !radius) {
      return next(new ErrorResponse('Please provide latitude, longitude, and radius', 400));
    }

    // Calcola il raggio in radianti dividendo la distanza per il raggio della Terra (6378 km)
    const radiusInRad = radius / 6378;

    const meals = await Meal.find({
      mealType: 'physical',
      location: {
        $geoWithin: { $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRad] }
      }
    });

    res.status(200).json({ success: true, count: meals.length, data: meals });
  } catch (error) {
    console.error('❌ [MealController] Errore in getMealsForMapLegacy:', error);
    return next(new ErrorResponse('Errore nella ricerca geospaziale legacy', 500));
  }
});

// @desc    Advanced geospatial search with multiple filters
// @route   GET /api/meals/search/advanced?lat=45.46&lng=9.18&radius=50&mealType=physical&date=2024-01-01&maxDistance=25
// @access  Public
exports.advancedGeospatialSearch = asyncHandler(async (req, res, next) => {
  try {
    const { 
      lat, lng, radius = 50, 
      mealType = 'physical', 
      status = 'upcoming',
      date,
      maxDistance,
      minParticipants,
      maxParticipants,
      hostId,
      tags
    } = req.query;

    if (!lat || !lng) {
      return next(new ErrorResponse('Coordinate richieste: lat, lng', 400));
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (!validateCoordinates(latitude, longitude)) {
      return next(new ErrorResponse('Coordinate non valide', 400));
    }

    if (!validateRadius(radiusKm)) {
      return next(new ErrorResponse('Raggio non valido', 400));
    }

    console.log(`🔍 [MealController] Ricerca avanzata: lat=${latitude}, lng=${longitude}, radius=${radiusKm}km`);

    const radiusInRad = radiusKm / 6371;

    // Query base geospaziale
    let geoQuery = {
      mealType: mealType,
      status: { $in: status.split(',') },
      'location.coordinates': {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusInRad]
        }
      }
    };

    // Filtri aggiuntivi
    if (date) {
      const targetDate = new Date(date);
      if (!isNaN(targetDate.getTime())) {
        geoQuery.date = {
          $gte: targetDate,
          $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) // +24 ore
        };
      }
    }

    if (minParticipants || maxParticipants) {
      geoQuery.participants = {};
      if (minParticipants) geoQuery.participants.$gte = parseInt(minParticipants);
      if (maxParticipants) geoQuery.participants.$lte = parseInt(maxParticipants);
    }

    if (hostId) {
      geoQuery.host = hostId;
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      geoQuery.tags = { $in: tagArray };
    }

    // Esegui query con popolamento e selezione ottimizzati
    const meals = await Meal.find(geoQuery)
      .select('_id title description date duration mealType location host maxParticipants participants status tags')
      .populate('host', 'nickname profileImage')
      .lean()
      .exec();

    console.log(`✅ [MealController] Ricerca avanzata completata: ${meals.length} risultati`);

    // Aggiungi distanza e filtra per distanza massima se specificata
    let mealsWithDistance = meals.map(meal => {
      const mealData = normalizeMealLocation(meal);
      
      if (mealData.location && mealData.location.coordinates) {
        const [mealLng, mealLat] = mealData.location.coordinates;
        const distance = calculateDistance(latitude, longitude, mealLat, mealLng);
        
        return {
          ...mealData,
          distance: Math.round(distance * 100) / 100,
          distanceFormatted: `${Math.round(distance * 100) / 100} km`
        };
      }
      
      return mealData;
    });

    // Filtra per distanza massima se specificata
    if (maxDistance) {
      const maxDist = parseFloat(maxDistance);
      if (!isNaN(maxDist)) {
        mealsWithDistance = mealsWithDistance.filter(meal => meal.distance <= maxDist);
        console.log(`📍 [MealController] Filtrati per distanza max ${maxDist}km: ${mealsWithDistance.length} risultati`);
      }
    }

    // Ordina per distanza e poi per data
    mealsWithDistance.sort((a, b) => {
      const distDiff = (a.distance || 0) - (b.distance || 0);
      if (distDiff !== 0) return distDiff;
      return new Date(a.date) - new Date(b.date);
    });

    res.status(200).json({
      success: true,
      count: mealsWithDistance.length,
      data: mealsWithDistance,
      searchParams: {
        center: { lat: latitude, lng: longitude },
        radius: radiusKm,
        mealType,
        status,
        date,
        maxDistance,
        minParticipants,
        maxParticipants,
        hostId,
        tags
      },
      performance: {
        queryType: 'advanced_geospatial',
        radiusKm,
        resultsCount: mealsWithDistance.length,
        filtersApplied: Object.keys(geoQuery).length
      }
    });

  } catch (error) {
    console.error('❌ [MealController] Errore in advancedGeospatialSearch:', error);
    return next(new ErrorResponse('Errore nella ricerca avanzata geospaziale', 500));
  }
});

// GET /api/meals (Mostra solo pasti futuri - OTTIMIZZATA)
exports.getMeals = asyncHandler(async (req, res) => {
  const statusFilter = req.query.status ? req.query.status.split(',') : ['upcoming'];
  const mealTypeFilter = req.query.mealType; // Nuovo filtro per tipo di pasto
  const nearFilter = req.query.near; // Filtro per posizione geografica
  const page = parseInt(req.query.page, 10) || 1; // Pagina corrente, default 1
  const limit = parseInt(req.query.limit, 10) || 10; // Risultati per pagina, default 10
  const skip = (page - 1) * limit;

  // Costruisci la query base
  let query = { status: { $in: statusFilter } };
  
  // Aggiungi filtro per tipo di pasto se specificato
  if (mealTypeFilter) {
    query.mealType = mealTypeFilter;
  }

  // Aggiungi filtro per posizione geografica se specificato (OTTIMIZZATO)
  if (nearFilter) {
    try {
      const [lat, lng] = nearFilter.split(',').map(coord => parseFloat(coord.trim()));
      
      if (!validateCoordinates(lat, lng)) {
        return res.status(400).json({
          success: false,
          message: 'Coordinate non valide. Lat: -90 a 90, Lng: -180 a 180'
        });
      }

      // Filtra solo pasti fisici con location valida
      query.mealType = 'physical';
      query['location.coordinates'] = { $exists: true, $ne: null };
      
      // Aggiungi filtro geospaziale ottimizzato
      // Calcola raggio predefinito di 50 km se non specificato
      const defaultRadius = 50;
      const radiusInRad = defaultRadius / 6371;
      
      query['location.coordinates'] = {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRad]
        }
      };
      
      console.log(`🗺️ [MealController] Filtro geospaziale applicato: lat=${lat}, lng=${lng}, radius=${defaultRadius}km`);
      
    } catch (error) {
      console.error('❌ [MealController] Errore nel filtro geografico:', error);
      return res.status(400).json({
        success: false,
        message: 'Formato coordinate non valido. Usa: lat,lng'
      });
    }
  }

  // Ottieni gli ID degli utenti da escludere (blocchi bidirezionali)
  const currentUser = await require('../models/User').findById(req.user.id);
  const usersWhoBlockedMe = await require('../models/User').find({ blockedUsers: req.user.id }).select('_id');
  const usersWhoBlockedMeIds = usersWhoBlockedMe.map(user => user._id);
  // Escludi solo utenti bloccati (miei e che mi hanno bloccato), NON me stesso
  const excludedIds = [...currentUser.blockedUsers, ...usersWhoBlockedMeIds];

  // Aggiungi filtro per escludere pasti di utenti bloccati, ma includi i miei
  if (excludedIds.length > 0) {
    query.host = { $nin: excludedIds };
  }

  const mealsQuery = Meal.find(query)
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit)
    .populate('host', 'nickname profileImage')
    .lean(); // Usa lean() per performance, ma perdiamo i virtuals

  // 🕐 STATUS VIRTUALE: Aggiungi status virtuale ai risultati
  const meals = await mealsQuery;
  
  // Aggiungi status virtuale e info dettagliate
  const mealsWithVirtualStatus = meals.map(meal => {
    const now = new Date();
    const startTime = new Date(meal.date);
    const endTime = new Date(startTime.getTime() + (meal.duration || 60) * 60 * 1000);
    
    let virtualStatus = meal.status;
    if (meal.status !== 'cancelled') {
      if (now < startTime) {
        virtualStatus = 'upcoming';
      } else if (now >= startTime && now < endTime) {
        virtualStatus = 'ongoing';
      } else {
        virtualStatus = 'completed';
      }
    }
    
    // Calcola info aggiuntive
    let statusInfo = {};
    if (meal.status === 'cancelled') {
      statusInfo = {
        status: 'cancelled',
        message: 'Pasto cancellato',
        isActive: false,
        isUpcoming: false,
        isCompleted: false
      };
    } else if (now < startTime) {
      const timeUntilStart = startTime.getTime() - now.getTime();
      const minutesUntilStart = Math.ceil(timeUntilStart / (1000 * 60));
      statusInfo = {
        status: 'upcoming',
        message: `Inizia tra ${minutesUntilStart} minuti`,
        isActive: false,
        isUpcoming: true,
        isCompleted: false,
        timeUntilStart: minutesUntilStart
      };
    } else if (now >= startTime && now < endTime) {
      const timeRemaining = endTime.getTime() - now.getTime();
      const minutesRemaining = Math.ceil(timeRemaining / (1000 * 60));
      statusInfo = {
        status: 'ongoing',
        message: `In corso (${minutesRemaining} minuti rimanenti)`,
        isActive: true,
        isUpcoming: false,
        isCompleted: false,
        timeRemaining: minutesRemaining
      };
    } else {
      const timeSinceEnd = now.getTime() - endTime.getTime();
      const minutesSinceEnd = Math.ceil(timeSinceEnd / (1000 * 60));
      statusInfo = {
        status: 'completed',
        message: `Completato ${minutesSinceEnd} minuti fa`,
        isActive: false,
        isUpcoming: false,
        isCompleted: true,
        timeSinceEnd: minutesSinceEnd
      };
    }
    
    return {
      ...meal,
      virtualStatus,
      statusInfo,
      timeRemaining: statusInfo.timeRemaining || 0
    };
  });

  const [_, total] = await Promise.all([
    Promise.resolve(), // mealsQuery è già eseguito sopra
    Meal.countDocuments(query)
  ]);

  // Normalizza la location usando la funzione helper
  const normalizedMeals = Array.isArray(meals) ? meals.map(normalizeMealLocation) : [];

  // Se è richiesto un filtro geografico, filtra i risultati per distanza
  let filteredMeals = normalizedMeals;
  if (nearFilter) {
    try {
      const [lat, lng] = nearFilter.split(',').map(coord => parseFloat(coord.trim()));
      
      // Filtra i pasti che hanno coordinate valide
      filteredMeals = normalizedMeals.filter(meal => {
        if (!meal.location || typeof meal.location !== 'object' || !meal.location.coordinates || !Array.isArray(meal.location.coordinates) || meal.location.coordinates.length !== 2) {
          return false;
        }
        
        const [mealLng, mealLat] = meal.location.coordinates;
        if (typeof mealLng !== 'number' || typeof mealLat !== 'number' || isNaN(mealLng) || isNaN(mealLat)) {
          return false;
        }
        
        // Calcola la distanza usando la formula di Haversine
        const R = 6371; // Raggio della Terra in km
        const dLat = (mealLat - lat) * Math.PI / 180;
        const dLng = (mealLng - lng) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat * Math.PI / 180) * Math.cos(mealLat * Math.PI / 180) *
                  Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        // Filtra per pasti entro 20km (come specificato nel frontend)
        return distance <= 20;
      });
    } catch (error) {
      console.error('Errore nel calcolo della distanza:', error);
      filteredMeals = [];
    }
  }

  res.status(200).json({
    success: true,
    count: filteredMeals.length,
    total: filteredMeals.length, // Per i filtri geografici, total = count
    page,
    pages: Math.ceil(filteredMeals.length / limit),
    data: filteredMeals
  });
});

// GET /api/meals/history
exports.getMealHistory = asyncHandler(async (req, res) => {
  // Ottieni gli ID degli utenti da escludere (blocchi bidirezionali)
  const currentUser = await require('../models/User').findById(req.user.id);
  const usersWhoBlockedMe = await require('../models/User').find({ blockedUsers: req.user.id }).select('_id');
  const usersWhoBlockedMeIds = usersWhoBlockedMe.map(user => user._id);
  const excludedIds = [...currentUser.blockedUsers, ...usersWhoBlockedMeIds];

  const meals = await Meal.find({ 
      participants: req.user.id,
      status: { $in: ['completed', 'cancelled'] },
      host: { $nin: excludedIds } // Escludi pasti di utenti bloccati
  })
  .sort({ date: -1 })
  .populate('host', 'nickname profileImage');
  res.status(200).json({ 
    success: true, 
    data: mealsWithVirtualStatus,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// GET /api/meals/:id
exports.getMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id).populate('host participants', 'nickname profileImage');
  if (!meal) return next(new ErrorResponse(`Pasto non trovato`, 404));
  
  const normalizedMeal = normalizeMealLocation(meal);
  res.status(200).json({ success: true, data: normalizedMeal });
});

// POST /api/meals (Crea pasto, chat E stanza video)
exports.createMeal = asyncHandler(async (req, res, next) => {
  // Log diagnostici di autenticazione e payload
  const authHeader = req.get('authorization') || '';
  const maskedAuth = authHeader ? `${authHeader.slice(0, 12)}...${authHeader.slice(-4)}` : '(nessuno)';
  console.log('--- [CreateMeal] Nuova richiesta di creazione pasto ---');
  console.log('[CreateMeal] Utente autenticato:', req.user ? req.user.id : '(nessuno)');
  console.log('[CreateMeal] Authorization:', maskedAuth);
  console.log('[CreateMeal] Content-Type:', req.get('content-type'));
  console.log('[CreateMeal] Headers keys:', Object.keys(req.headers || {}));
  console.log('[CreateMeal] Body keys:', Object.keys(req.body || {}));
  console.log('[CreateMeal] File present?:', Boolean(req.file));

  // 🛡️ PROTEZIONE XSS: Sanitizza tutti i dati prima della creazione
  const sanitizedBody = sanitizeMealData(req.body);
  
  const mealData = { ...sanitizedBody, host: req.user.id };
  
  // Log per debugging (solo in development)
  if (process.env.NODE_ENV === 'development') {
    const hasChanges = JSON.stringify(sanitizedBody) !== JSON.stringify(req.body);
    if (hasChanges) {
      console.log('🛡️ [CreateMeal] Dati sanitizzati:', {
        original: req.body,
        sanitized: sanitizedBody
      });
    }
  }
  // Normalizza numerici/booleani da FormData JSON fallback
  if (typeof mealData.duration === 'string') mealData.duration = parseInt(mealData.duration, 10);
  if (typeof mealData.maxParticipants === 'string') mealData.maxParticipants = parseInt(mealData.maxParticipants, 10);
  if (typeof mealData.isPublic === 'string') mealData.isPublic = mealData.isPublic === 'true';
  if (typeof mealData.date === 'string') {
    try { mealData.date = new Date(mealData.date); } catch (_) {}
  }
  if (req.file) mealData.coverImage = req.file.path;
  if (!mealData.coverImage && req.body.coverImageBase64) {
    try { mealData.coverImage = saveBase64Cover(req.body.coverImageBase64, req.user.id); } catch (e) { /* ignore */ }
  }
  // Se il client invia anche un'anteprima locale, salvala come campo di comodo (non usata come immagine finale)
  if (req.body.coverLocalUri && !mealData.coverImage) {
    mealData.coverLocalUri = req.body.coverLocalUri;
  }
  
  // Gestione del campo location dal FormData.
  // Se arriva un JSON con coordinates [lng, lat], salviamo come stringa "lat,lng" per compatibilità
  // Gestione del campo location: salva l'oggetto completo con indirizzo e coordinate
  let rawLocationReceived = req.body.location;
  if (req.body.location) {
    try {
      const parsedLocation = JSON.parse(req.body.location);
      if (parsedLocation && typeof parsedLocation === 'object') {
        // Salva l'oggetto location completo
        mealData.location = {
          address: parsedLocation.address || parsedLocation.formattedAddress || parsedLocation.label || '',
          coordinates: parsedLocation.coordinates || undefined
        };
        
        // Se non abbiamo un indirizzo valido, prova a usare il valore originale
        if (!mealData.location.address && typeof req.body.location === 'string') {
          mealData.location.address = req.body.location.slice(0, 200);
        }
      } else {
        // Fallback per valori non oggetto: salva come stringa
        mealData.location = String(req.body.location);
      }
    } catch (error) {
      // Se non è JSON valido, usa il valore come stringa
      mealData.location = String(req.body.location);
    }
  }

  // Log dei principali campi ricevuti per aiutare il debug di validazione
  try {
    console.log('[CreateMeal] Campi ricevuti:', {
      title: req.body?.title,
      titleLen: (req.body?.title || '').length,
      descriptionLen: (req.body?.description || '').length,
      type: req.body?.type,
      mealType: req.body?.mealType,
      dateRaw: req.body?.date,
      duration: req.body?.duration,
      maxParticipants: req.body?.maxParticipants,
      language: req.body?.language,
      topicsCount: Array.isArray(req.body?.topics) ? req.body.topics.length : (req.body?.['topics[]'] ? 1 : 0),
      hasCoverImageFile: Boolean(req.file),
      hasCoverImageBase64: typeof req.body?.coverImageBase64 === 'string' && req.body.coverImageBase64.startsWith('data:image/'),
      locationRaw: rawLocationReceived,
      locationNormalized: mealData?.location,
      locationType: typeof mealData?.location,
      locationHasAddress: mealData?.location?.address ? true : false,
      locationHasCoordinates: mealData?.location?.coordinates ? true : false,
    });
  } catch (_e) {}
  
  let meal, chat;
  try {
      meal = await Meal.create(mealData);
      chat = await Chat.create({
          name: `Chat per: ${meal.title}`,
          mealId: meal._id,
          participants: [req.user.id]
      });
      meal.chatId = chat._id;

      // Logica Twilio - solo per pasti virtuali (graceful + timeout)
      if (meal.mealType === 'virtual') {
        const withTimeout = (promise, ms) => new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Twilio timeout')), ms);
          promise.then((v) => { clearTimeout(timer); resolve(v); })
                 .catch((e) => { clearTimeout(timer); reject(e); });
        });
        try {
          const room = await withTimeout(
            twilioClient.video.v1.rooms.create({
              uniqueName: meal._id.toString(),
              type: 'group'
            }),
            3000
          );
          meal.twilioRoomSid = room.sid;
        } catch (twilioError) {
          console.warn('Twilio non disponibile o lento: continuo senza creare la stanza video.', twilioError?.message || twilioError);
        }
      }

      await meal.save();
      
      await User.findByIdAndUpdate(req.user.id, { $push: { createdMeals: meal._id } });
      const populatedMeal = await Meal.findById(meal._id).populate('host', 'nickname profileImage');
      
      // 📍 INVIA NOTIFICHE GEOLOCALIZZATE PER PASTI FISICI
      if (meal.mealType === 'physical' && meal.isPublic && meal.location && meal.location.coordinates) {
        try {
          // Invia notifiche in background (non bloccare la risposta)
          setImmediate(async () => {
            try {
              await geolocationNotificationService.sendNearbyMealNotifications(populatedMeal);
              console.log(`✅ [CreateMeal] Notifiche geolocalizzate inviate per pasto ${meal._id}`);
            } catch (geoError) {
              console.error(`❌ [CreateMeal] Errore nell'invio notifiche geolocalizzate per pasto ${meal._id}:`, geoError);
            }
          });
        } catch (error) {
          // Non blocchiamo la creazione del pasto se le notifiche geolocalizzate falliscono
          console.error(`⚠️ [CreateMeal] Errore nell'invio notifiche geolocalizzate per pasto ${meal._id}:`, error);
        }
      }
      
      const normalizedMeal = normalizeMealLocation(populatedMeal);
      res.status(201).json({ success: true, data: normalizedMeal });
  } catch (error) {
      if (meal) await Meal.findByIdAndDelete(meal._id);
      if (chat) await Chat.findByIdAndDelete(chat._id);
      // Gestione specifica degli errori di validazione Mongoose
      if (error && error.name === 'ValidationError') {
        const messages = Object.values(error.errors || {}).map(e => e.message);
        const message = messages.length ? messages.join(' | ') : error.message;
        console.warn('[CreateMeal] Errore di validazione:', message);
        return next(new ErrorResponse(message, 400));
      }
      console.error('ERRORE DURANTE LA CREAZIONE DEL PASTO:', error);
      return next(new ErrorResponse('Errore nella creazione del pasto o dei servizi associati.', 500));
  }
});

// @desc    Update a meal (partial updates allowed)
// @route   PATCH /api/meals/:id
// @access  Private
exports.updateMeal = asyncHandler(async (req, res, next) => {
  let meal = await Meal.findById(req.params.id);

  if (!meal) {
    return next(
      new ErrorResponse(`Meal not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is the meal host
  if (meal.host.toString() !== req.user.id) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this meal`,
        401
      )
    );
  }

  // 🛡️ PROTEZIONE XSS: Sanitizza tutti i dati prima dell'aggiornamento
  const sanitizedBody = sanitizeMealData(req.body);
  
  // Log per debugging (solo in development)
  if (process.env.NODE_ENV === 'development') {
    const hasChanges = JSON.stringify(sanitizedBody) !== JSON.stringify(req.body);
    if (hasChanges) {
      console.log('🛡️ [UpdateMeal] Dati sanitizzati:', {
        original: req.body,
        sanitized: sanitizedBody
      });
    }
  }

  // Create an object with only the fields to update
  const updates = { ...sanitizedBody };

  // If a new image is uploaded, add its path to the updates
  if (req.file) {
    // Qui puoi anche aggiungere la logica per eliminare la vecchia immagine dal server
    updates.coverImage = req.file.path;
  }

  // Gestione del campo location dal FormData: salva l'oggetto completo
  if (updates.location) {
    try {
      const parsedLocation = JSON.parse(updates.location);
      if (parsedLocation && typeof parsedLocation === 'object') {
        // Salva l'oggetto location completo
        updates.location = {
          address: parsedLocation.address || parsedLocation.formattedAddress || parsedLocation.label || '',
          coordinates: parsedLocation.coordinates || undefined
        };
        
        // Se non abbiamo un indirizzo valido, prova a usare il valore originale
        if (!updates.location.address && typeof req.body.location === 'string') {
          updates.location.address = req.body.location.slice(0, 200);
        }
      } else {
        // Fallback per valori non oggetto: salva come stringa
        updates.location = String(updates.location);
      }
    } catch (error) {
      // Se non è JSON valido, usa il valore come stringa
      updates.location = String(updates.location);
    }
  }
  
  // Log per debugging della location
  if (process.env.NODE_ENV === 'development') {
    console.log('[UpdateMeal] Location aggiornata:', {
      originalLocation: meal.location,
      newLocation: updates.location,
      locationType: typeof updates.location,
      hasAddress: updates.location?.address ? true : false,
      hasCoordinates: updates.location?.coordinates ? true : false,
    });
  }

  // Se il pasto diventa fisico da virtuale, rimuovi i dati Twilio
  if (updates.mealType === 'physical' && meal.mealType === 'virtual') {
    updates.twilioRoomSid = undefined;
    updates.videoCallStatus = undefined;
  }

  // Se il pasto diventa virtuale da fisico, crea stanza Twilio
  if (updates.mealType === 'virtual' && meal.mealType === 'physical') {
    try {
      const room = await twilioClient.video.v1.rooms.create({
        uniqueName: meal._id.toString(),
        type: 'group'
      });
      updates.twilioRoomSid = room.sid;
      updates.videoCallStatus = 'pending';
    } catch (error) {
      console.error("Errore nella creazione della stanza Twilio:", error);
      return next(new ErrorResponse('Errore nella creazione della stanza video.', 500));
    }
  }

  // Use findByIdAndUpdate to apply the partial updates
  meal = await Meal.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('host', 'nickname profileImage');

  const normalizedMeal = normalizeMealLocation(meal);
  res.status(200).json({ success: true, data: normalizedMeal });
});

// DELETE /api/meals/:id (Cancella pasto)
exports.deleteMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  if (!meal) return next(new ErrorResponse(`Pasto non trovato`, 404));
  if (meal.host.toString() !== req.user.id) return next(new ErrorResponse(`Non autorizzato`, 403));
  
  // BLOCCO: Se il pasto è terminato o cancellato, non si può eliminare
  const mealEndTime = new Date(meal.date.getTime() + (meal.duration || 0) * 60000);
  if (meal.status === 'completed' || meal.status === 'cancelled' || new Date() > mealEndTime) {
    return next(new ErrorResponse('Non puoi eliminare un pasto già terminato o cancellato.', 403));
  }

  // Rimuovi la stanza Twilio se esiste (solo per pasti virtuali)
  if (meal.mealType === 'virtual' && meal.twilioRoomSid) {
    try {
      await twilioClient.video.v1.rooms(meal.twilioRoomSid).update({ status: 'completed' });
    } catch (error) {
      console.error("Errore nella rimozione della stanza Twilio:", error);
    }
  }

  await meal.remove();
  res.status(200).json({ success: true, data: {} });
});

// 🕐 GET /api/meals/status/stats - Statistiche status pasti in tempo reale
exports.getMealStatusStats = asyncHandler(async (req, res, next) => {
  try {
    const stats = await mealStatusService.getMealStatusStats();
    
    if (stats.success) {
      res.status(200).json({
        success: true,
        data: stats
      });
    } else {
      return next(new ErrorResponse('Errore nel calcolo delle statistiche', 500));
    }
  } catch (error) {
    return next(new ErrorResponse('Errore interno del server', 500));
  }
});

// 🕐 POST /api/meals/:id/sync-status - Sincronizza status di un pasto specifico
exports.syncMealStatus = asyncHandler(async (req, res, next) => {
  try {
    const result = await mealStatusService.syncMealStatus(req.params.id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result
      });
    } else {
      return next(new ErrorResponse(result.error || 'Errore nella sincronizzazione', 400));
    }
  } catch (error) {
    return next(new ErrorResponse('Errore interno del server', 500));
  }
});

/**
 * @desc    Unisciti a un pasto
 * @route   POST /api/meals/:id/participants
 */
exports.joinMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id).populate('host', 'nickname');
  if (!meal) { return next(new ErrorResponse(`Pasto non trovato`, 404)); }
  // Nuovi controlli di sicurezza e coerenza
  if (meal.status !== 'upcoming') {
    return next(new ErrorResponse('Non è più possibile iscriversi a questo pasto', 400));
  }
  if (meal.participantsCount >= meal.maxParticipants) {
    return next(new ErrorResponse('Questo pasto è al completo', 400));
  }
  if (meal.host.toString() === req.user.id) {
    return next(new ErrorResponse('Sei l\'host di questo pasto', 400));
  }
  if (meal.participants.some(p => p.toString() === req.user.id)) {
    return next(new ErrorResponse('Sei già iscritto a questo pasto', 400));
  }
  
  await meal.addParticipant(req.user.id);
  await User.findByIdAndUpdate(req.user.id, { $push: { joinedMeals: meal._id } });
  
  const chat = await Chat.findById(meal.chatId);
  if (chat) {
    await chat.addParticipant(req.user.id);
    console.log(`[Sync] Utente ${req.user.nickname} aggiunto alla chat del pasto "${meal.title}".`);
  }
    // NOTIFICHE
    // 1. All'host
    notificationService.sendNotification(meal.host, 'participant_joined', `${req.user.nickname} si è unito al tuo pasto "${meal.title}".`, { mealId: meal._id });
    // 2. Agli altri partecipanti
    const otherParticipantsJoin = meal.participants.filter(p => p._id.toString() !== req.user.id);
    if (otherParticipantsJoin.length > 0) {
      notificationService.sendNotification(otherParticipantsJoin.map(p => p._id), 'participant_joined', `${req.user.nickname} si è unito al pasto "${meal.title}".`, { mealId: meal._id });
    }
    // Creiamo una notifica per l'organizzatore del pasto
    const notificationMessage = `L'utente ${req.user.nickname} si è unito al tuo pasto "${meal.title}"`;  
  meal.notifications.push({
    type: 'join',
    message: notificationMessage,
    recipient: meal.host,
  });

  await meal.save();

  // Invia email di conferma iscrizione se l'utente ha attivato le notifiche email
  const participant = await User.findById(req.user.id);
  if (participant && participant.settings?.notifications?.email) {
    try {
      await sendEmail.sendMealRegistrationEmail(
        participant.email,
        participant.nickname || participant.name,
        {
          title: meal.title,
          date: meal.date,
          hostName: meal.host.nickname || 'Host'
        }
      );
    } catch (err) {
      console.error('Errore invio email conferma iscrizione:', err.message);
    }
  }
  
  const updatedMeal = await Meal.findById(meal._id)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage');

  res.status(200).json({ 
    success: true, 
    message: 'Ti sei unito al pasto con successo',
    data: updatedMeal
  });
});

/**
 * @desc    Lascia un pasto
 * @route   DELETE /api/meals/:id/participants
 */
exports.leaveMeal = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);
  if (!meal) { return next(new ErrorResponse(`Pasto non trovato`, 404)); }
  
  // Impedisci di abbandonare pasti terminati o annullati
  if (meal.status === 'completed' || meal.status === 'cancelled') {
    return next(new ErrorResponse('Non puoi abbandonare un TableTalk® che si è già concluso o è stato annullato', 400));
  }
  
  // Impedisci che l'host lasci il proprio pasto
  if (meal.host.toString() === req.user.id) {
    return next(new ErrorResponse('L\'host non può lasciare il proprio pasto', 400));
  }

  await meal.removeParticipant(req.user.id);
  await User.findByIdAndUpdate(req.user.id, { $pull: { joinedMeals: meal._id } });
  
  const chat = await Chat.findById(meal.chatId);
  if (chat) {
    await chat.removeParticipant(req.user.id);
    console.log(`[Sync] Utente ${req.user.nickname} rimosso dalla chat del pasto "${meal.title}".`);
  }

  // Notifica all'host
  notificationService.sendNotification(
    meal.host, 
    'participant_left', 
    `${req.user.nickname} ha lasciato il tuo pasto "${meal.title}".`, 
    { mealId: meal._id }
  );
  
  const updatedMeal = await Meal.findById(meal._id)
    .populate('host', 'nickname profileImage')
    .populate('participants', 'nickname profileImage');

  res.status(200).json({ 
      success: true, 
      message: 'Hai lasciato il pasto con successo',
      data: updatedMeal
  });
});

/**
 * @desc    Cerca pasti tramite una stringa di ricerca
 * @route   GET /api/meals/search?q=parolachiave
 * @access  Public
 */
exports.searchMeals = asyncHandler(async (req, res, next) => {
  const searchTerm = req.query.q;

  if (!searchTerm) {
    return res.status(200).json({ success: true, count: 0, data: [] });
  }

  const query = {
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { language: { $regex: searchTerm, $options: 'i' } },
      { topics: { $regex: searchTerm, $options: 'i' } }
    ]
  };

  const meals = await Meal.find(query)
    .populate('host', 'nickname profileImage')
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    count: meals.length,
    data: meals,
  });
});

const { v4: uuidv4 } = require('uuid'); // Importa in cima al file per generare ID unici

// GET /api/meals/user/all?status=upcoming,ongoing,completed,cancelled
exports.getUserMeals = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const statusFilter = req.query.status ? req.query.status.split(',') : ['upcoming', 'ongoing', 'completed', 'cancelled'];
  const meals = await Meal.find({
    status: { $in: statusFilter },
    $or: [
      { host: userId },
      { participants: userId }
    ]
  })
  .sort({ date: -1 })
  .populate('host', 'nickname profileImage')
  .populate('participants', 'nickname profileImage');
  res.status(200).json({ success: true, count: meals.length, data: meals });
});

/**
 * @desc    Ottiene o crea il link per la videochiamata di un pasto
 * @route   GET /api/meals/:id/stream
 * @access  Private (solo per i partecipanti)
 */
exports.getVideoCallUrl = asyncHandler(async (req, res, next) => {
  const meal = await Meal.findById(req.params.id);

  if (!meal) {
    return next(new ErrorResponse('Pasto non trovato', 404));
  }
  // Controlla se l'utente è un partecipante o l'host
  if (!meal.participants.some(p => p.equals(req.user._id))) {
    return next(new ErrorResponse('Non sei autorizzato ad accedere a questa videochiamata', 403));
  }

  // Se il link non è mai stato creato, lo generiamo ora
  if (!meal.videoCallLink) {
    // Creiamo un nome di stanza unico e difficile da indovinare
    const roomName = `TableTalk-${meal._id}-${uuidv4()}`;
    meal.videoCallLink = `https://meet.jit.si/${roomName}`;
    await meal.save();
  }

  res.status(200).json({
    success: true,
    data: {
      videoCallLink: meal.videoCallLink
    }
  });
});