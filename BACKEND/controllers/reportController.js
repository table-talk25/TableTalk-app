const Report = require('../models/Report');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Crea una nuova segnalazione
// @route   POST /api/reports
// @access  Private
exports.createReport = asyncHandler(async (req, res, next) => {
    const { reportedUserId, reason, details, context } = req.body;
    const reporterId = req.user.id;

    // Verifica che l'utente non stia segnalando se stesso
    if (reporterId === reportedUserId) {
        return next(new ErrorResponse('Non puoi segnalare te stesso', 400));
    }

    // Verifica che l'utente segnalato esista
    const reportedUser = await User.findById(reportedUserId);
    if (!reportedUser) {
        return next(new ErrorResponse('Utente segnalato non trovato', 404));
    }

    // Verifica se esiste già una segnalazione pendente dello stesso utente
    const existingReport = await Report.findOne({
        reporter: reporterId,
        reportedUser: reportedUserId,
        status: 'pending'
    });

    if (existingReport) {
        return next(new ErrorResponse('Hai già una segnalazione pendente per questo utente', 400));
    }

    const report = await Report.create({
        reporter: reporterId,
        reportedUser: reportedUserId,
        reason,
        details,
        context: context || 'general'
    });

    // Popola i dati degli utenti per la risposta
    await report.populate('reporter', 'nickname profileImage');
    await report.populate('reportedUser', 'nickname profileImage');

    res.status(201).json({
        success: true,
        data: report
    });
});

// @desc    Ottieni tutte le segnalazioni (solo admin)
// @route   GET /api/reports
// @access  Private/Admin
exports.getReports = asyncHandler(async (req, res, next) => {
    const { status, context, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (status) {
        query.status = status;
    }
    
    if (context) {
        query.context = context;
    }

    const skip = (page - 1) * limit;

    const reports = await Report.find(query)
        .populate('reporter', 'nickname profileImage')
        .populate('reportedUser', 'nickname profileImage')
        .populate('resolvedBy', 'nickname')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.status(200).json({
        success: true,
        count: reports.length,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: reports
    });
});

// @desc    Ottieni le segnalazioni dell'utente corrente
// @route   GET /api/reports/my-reports
// @access  Private
exports.getMyReports = asyncHandler(async (req, res, next) => {
    const reports = await Report.findByReporter(req.user.id);

    res.status(200).json({
        success: true,
        count: reports.length,
        data: reports
    });
});

// @desc    Ottieni una singola segnalazione
// @route   GET /api/reports/:id
// @access  Private/Admin
exports.getReport = asyncHandler(async (req, res, next) => {
    const report = await Report.findById(req.params.id)
        .populate('reporter', 'nickname profileImage email')
        .populate('reportedUser', 'nickname profileImage email')
        .populate('resolvedBy', 'nickname');

    if (!report) {
        return next(new ErrorResponse('Segnalazione non trovata', 404));
    }

    res.status(200).json({
        success: true,
        data: report
    });
});

// @desc    Aggiorna lo stato di una segnalazione (solo admin)
// @route   PUT /api/reports/:id/status
// @access  Private/Admin
exports.updateReportStatus = asyncHandler(async (req, res, next) => {
    const { status, adminNotes } = req.body;
    const adminId = req.user.id;

    const report = await Report.findById(req.params.id);
    if (!report) {
        return next(new ErrorResponse('Segnalazione non trovata', 404));
    }

    // Aggiorna lo stato in base al valore fornito
    switch (status) {
        case 'reviewed':
            await report.markAsReviewed(adminId, adminNotes);
            break;
        case 'resolved':
            await report.markAsResolved(adminId, adminNotes);
            break;
        case 'dismissed':
            await report.markAsDismissed(adminId, adminNotes);
            break;
        default:
            return next(new ErrorResponse('Stato non valido', 400));
    }

    // Popola i dati per la risposta
    await report.populate('reporter', 'nickname profileImage');
    await report.populate('reportedUser', 'nickname profileImage');
    await report.populate('resolvedBy', 'nickname');

    res.status(200).json({
        success: true,
        data: report
    });
});

// @desc    Elimina una segnalazione (solo admin)
// @route   DELETE /api/reports/:id
// @access  Private/Admin
exports.deleteReport = asyncHandler(async (req, res, next) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        return next(new ErrorResponse('Segnalazione non trovata', 404));
    }

    await report.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Segnalazione eliminata con successo'
    });
});

// @desc    Ottieni statistiche delle segnalazioni (solo admin)
// @route   GET /api/reports/stats
// @access  Private/Admin
exports.getReportStats = asyncHandler(async (req, res, next) => {
    const stats = await Report.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);

    const totalReports = await Report.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    const statsObject = {
        total: totalReports,
        pending: pendingReports,
        byStatus: {}
    };

    stats.forEach(stat => {
        statsObject.byStatus[stat._id] = stat.count;
    });

    res.status(200).json({
        success: true,
        data: statsObject
    });
}); 