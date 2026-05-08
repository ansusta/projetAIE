const cron = require('node-cron');
const Candidature = require('../models/candidature');
const { createNotification } = require('../utils/notification'); // Adjust path

const scheduleInterviewReminders = () => {
  // Runs every day at 08:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('Running daily interview reminder check...');

    try {
      // 1. Define the time range for "Tomorrow"
      const tomorrowStart = new Date();
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date();
      tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
      tomorrowEnd.setHours(23, 59, 59, 999);

      // 2. Find candidatures with interviews scheduled for tomorrow
      const candidatures = await Candidature.find({
        'entretien.dateEntretien': {
          $gte: tomorrowStart,
          $lte: tomorrowEnd
        },
        etatCandidature: 'convocationEntretien'
      }).populate('idOffre', 'titre');

      // 3. Send notifications
      for (const cand of candidatures) {
        const timeStr = cand.entretien.dateEntretien.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });

        await createNotification({
          idUtilisateur: cand.idCandidat,
          idCandidature: cand._id,
          contenu: `Rappel : Vous avez un entretien demain à ${timeStr} pour le poste de "${cand.idOffre.titre}".`
        });
      }

      console.log(`${candidatures.length} reminders sent.`);
    } catch (err) {
      console.error('Error in interview reminder cron:', err);
    }
  });
};

module.exports = scheduleInterviewReminders;