const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Créer une urgence
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type_urgence, niveau_priorite, localisation, latitude, longitude, description } = req.body;
    
    const urgence = await db.Urgence.create({
      patient_id: req.user.id,
      type_urgence,
      niveau_priorite,
      localisation,
      latitude,
      longitude,
      description,
      statut: 'PENDING'
    });
    
    // Récupérer les hôpitaux proches (simulation)
    const hopitaux = await db.CentreSante.findAll({
      where: { urgences_24_7: true },
      limit: 5
    });
    
    // Récupérer les ambulances disponibles
    const ambulances = await db.Ambulancier.findAll({
      where: { statut: 'DISPONIBLE' },
      limit: 5
    });
    
    res.status(201).json({
      success: true,
      urgence,
      hopitaux_proches: hopitaux,
      ambulances_disponibles: ambulances
    });
  } catch (error) {
    console.error('Erreur création urgence:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'urgence' });
  }
});

// Envoyer une alerte SMS
router.post('/send-sms-alert', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, type_urgence, description } = req.body;
    
    // TODO: Implémenter l'envoi SMS via Twilio
    // const smsService = require('../services/smsService');
    // await smsService.sendEmergencyAlert(req.user.telephone, latitude, longitude);
    
    res.json({ success: true, message: 'Alerte SMS envoyée' });
  } catch (error) {
    console.error('Erreur envoi SMS:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du SMS' });
  }
});

// Recevoir un BIP (appel court)
router.post('/bip', async (req, res) => {
  try {
    const { expediteur, position, timestamp } = req.body;
    
    // Vérifier si c'est un patient enregistré
    const patient = await db.Patient.findOne({ where: { telephone: expediteur } });
    
    // Créer une urgence
    const urgence = await db.Urgence.create({
      patient_id: patient?.id || null,
      type_urgence: 'BIP_URGENCE',
      niveau_priorite: 'ELEVE',
      localisation: position ? `${position.latitude}, ${position.longitude}` : null,
      latitude: position?.latitude,
      longitude: position?.longitude,
      description: `BIP reçu du numéro ${expediteur}${patient ? ' (Patient enregistré)' : ' (Non enregistré)'}`,
      statut: 'PENDING'
    });
    
    // TODO: Envoyer notification au centre médical
    
    res.json({ 
      success: true, 
      urgence,
      isRegistered: !!patient,
      patient: patient ? { nom: patient.nom, prenom: patient.prenom } : null
    });
  } catch (error) {
    console.error('Erreur traitement BIP:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les hôpitaux proches
router.get('/hospitals', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    let hopitaux;
    if (lat && lng) {
      // Calculer la distance et trier
      hopitaux = await db.CentreSante.findAll();
      // TODO: Calculer la distance réelle avec la formule Haversine
    } else {
      hopitaux = await db.CentreSante.findAll({ limit: 10 });
    }
    
    res.json(hopitaux);
  } catch (error) {
    console.error('Erreur récupération hôpitaux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les ambulances disponibles
router.get('/ambulances', async (req, res) => {
  try {
    const ambulances = await db.Ambulancier.findAll({
      where: { statut: 'DISPONIBLE' },
      attributes: ['id', 'nom', 'telephone', 'statut', 'position_gps', 'zone_couverture']
    });
    
    res.json(ambulances);
  } catch (error) {
    console.error('Erreur récupération ambulances:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'une urgence
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, ambulancier_id } = req.body;
    
    const urgence = await db.Urgence.findByPk(id);
    if (!urgence) {
      return res.status(404).json({ error: 'Urgence non trouvée' });
    }
    
    await urgence.update({ statut, ambulancier_id });
    
    res.json({ success: true, urgence });
  } catch (error) {
    console.error('Erreur mise à jour urgence:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir l'historique des urgences d'un patient
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const urgences = await db.Urgence.findAll({
      where: { patient_id: req.user.id },
      order: [['date_alerte', 'DESC']],
      limit: 20
    });
    
    res.json(urgences);
  } catch (error) {
    console.error('Erreur historique urgences:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;