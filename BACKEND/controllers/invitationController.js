const Invitation = require('../models/Invitation');
const User = require('../models/User');
const Chat = require('../models/Chat');
const asyncHandler = require('express-async-handler');
const ErrorResponse = require('../utils/errorResponse');
const pushNotificationService = require('../services/pushNotificationService');
const sendEmail = require('../utils/sendEmail');

exports.sendInvitation = asyncHandler(async (req, res, next) => {
  const { toUser, message } = req.body;
  const fromUser = req.user;

  if (fromUser.id === toUser) {
    return next(new ErrorResponse('Non puoi inviare un invito a te stesso.', 400));
  }

  const recipient = await User.findById(toUser);
  if (!recipient) {
    return next(new ErrorResponse('Utente destinatario non trovato.', 404));
  }

  const existingInvitation = await Invitation.findOne({
    $or: [
      { fromUser: fromUser.id, toUser: toUser },
      { fromUser: toUser, toUser: fromUser.id },
    ],
    status: { $in: ['pending', 'accepted'] },
  });

  if (existingInvitation) {
    return next(new ErrorResponse('Hai già un invito o una connessione attiva con questo utente.', 400));
  }

  const invitation = await Invitation.create({
    fromUser: fromUser.id,
    toUser,
    message,
  });

  if (recipient.settings.notifications.push && recipient.fcmTokens && recipient.fcmTokens.length > 0) {
    const pushMessage = message ? `"${message}"` : 'Dai un\'occhiata al suo profilo!';
    pushNotificationService.sendPushNotification(
      recipient.fcmTokens,
      `${fromUser.nickname} ti ha invitato a un TableTalk!`,
      pushMessage,
      { type: 'invitation', invitationId: invitation._id.toString() }
    );
  }

  if (recipient.settings.notifications.email) {
    const emailSubject = `${fromUser.nickname} ti ha invitato a un TableTalk!`;
    const emailMessage = `
      <h1>Hai un nuovo invito!</h1>
      <p>${fromUser.nickname} vorrebbe connettersi con te su TableTalk.</p>
      ${message ? `<p><strong>Il suo messaggio:</strong> "${message}"</p>` : ''}
      <p>Apri l'app per accettare o rifiutare l'invito.</p>
    `;
    try {
      await sendEmail({
        to: recipient.email,
        subject: emailSubject,
        html: emailMessage,
      });
    } catch (err) {
      console.error("Errore nell'invio dell'email di invito:", err);
    }
  }

  res.status(201).json({
    success: true,
    data: invitation,
  });
});

exports.getReceivedInvitations = asyncHandler(async (req, res, next) => {
  const invitations = await Invitation.find({
    toUser: req.user.id,
    status: 'pending',
  })
  .populate('fromUser', 'nickname profileImage bio')
  .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: invitations.length,
    data: invitations,
  });
});

exports.acceptInvitation = asyncHandler(async (req, res, next) => {
  const invitation = await Invitation.findById(req.params.id).populate('fromUser').populate('toUser');

  if (!invitation) {
    return next(new ErrorResponse('Invito non trovato.', 404));
  }

  if (invitation.toUser._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Non autorizzato a compiere questa azione.', 401));
  }

  if (invitation.status !== 'pending') {
    return next(new ErrorResponse(`Questo invito è già stato ${invitation.status}.`, 400));
  }

  invitation.status = 'accepted';
  await invitation.save();

  let chat = await Chat.findOne({
    isGroupChat: false,
    participants: { $all: [invitation.fromUser._id, invitation.toUser._id], $size: 2 },
  });

  if (!chat) {
    chat = await Chat.create({
      chatName: 'Direct Chat',
      participants: [invitation.fromUser._id, invitation.toUser._id],
    });
  }

  const sender = invitation.fromUser;
  if (sender.settings.notifications.push && sender.fcmTokens && sender.fcmTokens.length > 0) {
    pushNotificationService.sendPushNotification(
      sender.fcmTokens,
      'Invito Accettato!',
      `${invitation.toUser.nickname} ha accettato il tuo invito. Inizia a chattare!`,
      { type: 'chat', chatId: chat._id.toString() }
    );
  }

  if (sender.settings.notifications.email) {
      const emailMessage = `<p>${invitation.toUser.nickname} ha accettato il tuo invito! Ora potete chattare nell'app per organizzare il vostro TableTalk.</p>`;
      try {
          await sendEmail({ to: sender.email, subject: 'Il tuo invito è stato accettato!', html: emailMessage });
      } catch (err) {
          console.error("Errore nell'invio dell'email di accettazione:", err);
      }
  }

  res.status(200).json({
    success: true,
    data: invitation,
  });
});

exports.declineInvitation = asyncHandler(async (req, res, next) => {
  const invitation = await Invitation.findById(req.params.id);

  if (!invitation) {
    return next(new ErrorResponse('Invito non trovato.', 404));
  }

  if (invitation.toUser.toString() !== req.user.id) {
    return next(new ErrorResponse('Non autorizzato a compiere questa azione.', 401));
  }

  if (invitation.status !== 'pending') {
    return next(new ErrorResponse(`Questo invito è già stato ${invitation.status}.`, 400));
  }

  invitation.status = 'declined';
  await invitation.save();

  res.status(200).json({
    success: true,
    message: 'Invito rifiutato con successo.',
  });
});