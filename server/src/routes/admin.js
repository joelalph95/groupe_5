const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Middleware pour vérifier le rôle admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// Statistiques générales
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const patientsCount = await db.Patient.count();
    const ambulanciersCount = await db.Ambulancier.count();
    const pharmaciensCount = await db.Pharmacien.count();
    const urgencesCount = await db.Urgence.count();
    const commandesCount = await db.Commande.count();
    const medicamentsCount = await db.Medicament.count();
    
    const urgencesByStatus = await db.Urgence.findAll({
      attributes: ['statut', [db.sequelize.fn('COUNT', 'statut'), 'count']],
      group: ['statut']
    });
    
    const commandesByStatus = await db.Commande.findAll({
      attributes: ['statut', [db.sequelize.fn('COUNT', 'statut'), 'count']],
      group: ['statut']
    });
    
    res.json({
      counts: {
        patients: patientsCount,
        ambulanciers: ambulanciersCount,
        pharmaciens: pharmaciensCount,
        urgences: urgencesCount,
        commandes: commandesCount,
        medicaments: medicamentsCount
      },
      urgencesByStatus,
      commandesByStatus
    });
  } catch (error) {
    console.error('Erreur statistiques admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Gestion des utilisateurs
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const patients = await db.Patient.findAll({
      attributes: ['id', 'nom', 'prenom', 'telephone', 'email', 'sexe', 'date_inscription']
    });
    
    const ambulanciers = await db.Ambulancier.findAll({
      attributes: ['id', 'nom', 'telephone', 'statut', 'zone_couverture']
    });
    
    const pharmaciens = await db.Pharmacien.findAll({
      attributes: ['id', 'nom_pharmacie', 'responsable', 'telephone', 'email', 'statut']
    });
    
    res.json({ patients, ambulanciers, pharmaciens });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Gestion des urgences (admin)
router.get('/emergencies', authenticateToken, isAdmin, async (req, res) => {
  try {
    const urgences = await db.Urgence.findAll({
      include: [
        { model: db.Patient, attributes: ['nom', 'prenom', 'telephone'] },
        { model: db.Ambulancier, attributes: ['nom', 'telephone'] }
      ],
      order: [['date_alerte', 'DESC']]
    });
    
    res.json(urgences);
  } catch (error) {
    console.error('Erreur récupération urgences admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Gestion des commandes (admin)
router.get('/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const commandes = await db.Commande.findAll({
      include: [
        { model: db.Patient, attributes: ['nom', 'prenom', 'telephone'] },
        { model: db.Pharmacien, attributes: ['nom_pharmacie', 'telephone'] },
        { model: db.CommandeDetail, include: [db.Medicament] }
      ],
      order: [['date_commande', 'DESC']]
    });
    
    res.json(commandes);
  } catch (error) {
    console.error('Erreur récupération commandes admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Gestion des médicaments (admin)
router.post('/medicaments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { nom, description, categorie, prix, stock, pharmacien_id, necessite_ordonnance } = req.body;
    
    const medicament = await db.Medicament.create({
      nom,
      description,
      categorie,
      prix,
      stock,
      pharmacien_id,
      necessite_ordonnance
    });
    
    res.status(201).json({ success: true, medicament });
  } catch (error) {
    console.error('Erreur création médicament:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/medicaments/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const medicament = await db.Medicament.findByPk(req.params.id);
    if (!medicament) {
      return res.status(404).json({ error: 'Médicament non trouvé' });
    }
    
    await medicament.update(req.body);
    
    res.json({ success: true, medicament });
  } catch (error) {
    console.error('Erreur mise à jour médicament:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Gestion des centres de santé
router.get('/centres-sante', authenticateToken, isAdmin, async (req, res) => {
  try {
    const centres = await db.CentreSante.findAll();
    res.json(centres);
  } catch (error) {
    console.error('Erreur récupération centres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.post('/centres-sante', authenticateToken, isAdmin, async (req, res) => {
  try {
    const centre = await db.CentreSante.create(req.body);
    res.status(201).json({ success: true, centre });
  } catch (error) {
    console.error('Erreur création centre:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;