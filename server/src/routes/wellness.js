const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Chatbot - Envoyer un message
router.post('/chatbot', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    // Analyse simple par mots-clés
    let response = "Je vous écoute. Comment vous sentez-vous aujourd'hui ?";
    let humeur = 'NEUTRE';
    
    const messageLower = message.toLowerCase();
    
    if (messageLower.includes('stress') || messageLower.includes('angoissé') || messageLower.includes('anxiété')) {
      response = "Je comprends votre stress. 💙 Essayez la respiration 4-7-8 : inspirez 4 secondes, retenez 7 secondes, expirez 8 secondes. Répétez 4 fois. Cela aide vraiment à calmer le système nerveux.";
      humeur = 'STRESS';
    } else if (messageLower.includes('triste') || messageLower.includes('déprimé') || messageLower.includes('pleure')) {
      response = "Je suis là pour vous. 💙 Il est normal de se sentir triste parfois. Parler à un proche peut vraiment aider. Voulez-vous que je vous propose des exercices de respiration ou de méditation ?";
      humeur = 'TRISTESSE';
    } else if (messageLower.includes('fatigué') || messageLower.includes('épuisé') || messageLower.includes('dormir')) {
      response = "Le repos est essentiel ! 🌙 Essayez de prendre 15 minutes pour vous détendre. Une courte sieste ou une pause peut faire des merveilles. Évitez les écrans avant de dormir.";
      humeur = 'FATIGUE';
    } else if (messageLower.includes('bien') || messageLower.includes('content') || messageLower.includes('heureux')) {
      response = "C'est merveilleux à entendre ! 🌟 Continuez à prendre soin de vous. Qu'est-ce qui vous rend si heureux(se) aujourd'hui ?";
      humeur = 'POSITIF';
    } else if (messageLower.includes('colère') || messageLower.includes('énervé') || messageLower.includes('frustré')) {
      response = "La colère est une émotion valide. 🧘 Prenez 10 respirations profondes, comptez jusqu'à 10 lentement. Voulez-vous en parler davantage ?";
      humeur = 'COLERE';
    }
    
    // Détection de mots critiques
    const criticalWords = ['suicide', 'mourir', 'mort', 'finir', 'plus envie'];
    if (criticalWords.some(word => messageLower.includes(word))) {
      response = "⚠️ Je sens que vous traversez un moment très difficile. Vous n'êtes pas seul(e).\n\n📞 Ligne d'écoute : 1520 (gratuit)\n🏥 Centre psycho : +261 20 22 000 00\n\nParler à un professionnel peut vraiment vous aider. 💙";
      humeur = 'CRITIQUE';
    }
    
    // Sauvegarder l'historique
    await db.ChatbotHistory.create({
      patient_id: req.user.id,
      message_patient: message,
      reponse_bot: response,
      humeur_detectee: humeur
    });
    
    res.json({ response, humeur });
  } catch (error) {
    console.error('Erreur chatbot:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir l'historique du chatbot
router.get('/chatbot/history', authenticateToken, async (req, res) => {
  try {
    const history = await db.ChatbotHistory.findAll({
      where: { patient_id: req.user.id },
      order: [['date_message', 'DESC']],
      limit: 50
    });
    
    res.json(history);
  } catch (error) {
    console.error('Erreur historique chatbot:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Suivi de grossesse
router.get('/grossesse', authenticateToken, async (req, res) => {
  try {
    const suivi = await db.SuiviGrossesse.findOne({
      where: { patient_id: req.user.id }
    });
    
    res.json(suivi || null);
  } catch (error) {
    console.error('Erreur suivi grossesse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/grossesse', authenticateToken, async (req, res) => {
  try {
    const { date_debut, date_prevue_accouchement, niveau_risque } = req.body;
    
    // Calculer la semaine actuelle
    const debut = new Date(date_debut);
    const aujourdhui = new Date();
    const diffJours = Math.floor((aujourdhui - debut) / (1000 * 60 * 60 * 24));
    const semaine_actuelle = Math.floor(diffJours / 7);
    
    const [suivi, created] = await db.SuiviGrossesse.upsert({
      patient_id: req.user.id,
      date_debut,
      date_prevue_accouchement,
      semaine_actuelle,
      niveau_risque: niveau_risque || 'FAIBLE'
    });
    
    res.json({ success: true, suivi });
  } catch (error) {
    console.error('Erreur création suivi grossesse:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Articles de bien-être
router.get('/articles', async (req, res) => {
  try {
    // Articles statiques (à remplacer par une table si nécessaire)
    const articles = [
      { id: 1, titre: 'Comprendre son cycle menstruel', categorie: 'FEMME', contenu: 'Le cycle menstruel dure en moyenne 28 jours...' },
      { id: 2, titre: 'Suivi de grossesse : 1er trimestre', categorie: 'FEMME', contenu: 'Les 12 premières semaines sont cruciales...' },
      { id: 3, titre: 'Examens santé homme après 40 ans', categorie: 'HOMME', contenu: 'Après 40 ans, faites un bilan sanguin annuel...' },
      { id: 4, titre: 'Gérer son stress au quotidien', categorie: 'MENTAL', contenu: 'Le stress chronique affecte le corps et l\'esprit...' },
      { id: 5, titre: 'Les bienfaits de l\'activité physique', categorie: 'GENERAL', contenu: '30 minutes d\'activité modérée par jour...' }
    ];
    
    res.json(articles);
  } catch (error) {
    console.error('Erreur articles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques d'humeur
router.get('/mood-stats', authenticateToken, async (req, res) => {
  try {
    const stats = await db.ChatbotHistory.findAll({
      where: { patient_id: req.user.id },
      attributes: [
        'humeur_detectee',
        [db.sequelize.fn('COUNT', db.sequelize.col('humeur_detectee')), 'count']
      ],
      group: ['humeur_detectee'],
      order: [[db.sequelize.fn('COUNT', db.sequelize.col('humeur_detectee')), 'DESC']]
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Erreur statistiques humeur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== SUIVI SANTE (CRUD) ====================

// Obtenir tous les suivis d'un patient
router.get('/suivi-sante', authenticateToken, async (req, res) => {
  try {
    const suivis = await db.SuiviSante.findAll({
      where: { patient_id: req.user.id },
      order: [['date_creation', 'DESC']]
    });
    res.json(suivis);
  } catch (error) {
    console.error('Erreur récupération suivis:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir un suivi par type
router.get('/suivi-sante/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const suivis = await db.SuiviSante.findAll({
      where: { patient_id: req.user.id, type },
      order: [['date_creation', 'DESC']]
    });
    res.json(suivis);
  } catch (error) {
    console.error('Erreur récupération suivi:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un suivi
router.post('/suivi-sante', authenticateToken, async (req, res) => {
  try {
    const suivi = await db.SuiviSante.create({
      ...req.body,
      patient_id: req.user.id
    });
    res.status(201).json({ success: true, suivi });
  } catch (error) {
    console.error('Erreur création suivi:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un suivi
router.put('/suivi-sante/:id', authenticateToken, async (req, res) => {
  try {
    const suivi = await db.SuiviSante.findOne({
      where: { id: req.params.id, patient_id: req.user.id }
    });
    if (!suivi) {
      return res.status(404).json({ error: 'Suivi non trouvé' });
    }
    await suivi.update(req.body);
    res.json({ success: true, suivi });
  } catch (error) {
    console.error('Erreur mise à jour suivi:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un suivi
router.delete('/suivi-sante/:id', authenticateToken, async (req, res) => {
  try {
    const suivi = await db.SuiviSante.findOne({
      where: { id: req.params.id, patient_id: req.user.id }
    });
    if (!suivi) {
      return res.status(404).json({ error: 'Suivi non trouvé' });
    }
    await suivi.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression suivi:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});



module.exports = router;