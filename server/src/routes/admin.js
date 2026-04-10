// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// ==================== MÉDICAMENTS (CRUD complet) ====================
router.get('/medicaments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const medicaments = await db.Medicament.findAll({
      include: [{ model: db.Pharmacien, attributes: ['nom_pharmacie'] }]
    });
    res.json(medicaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/medicaments/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const medicament = await db.Medicament.findByPk(req.params.id, {
      include: [{ model: db.Pharmacien, attributes: ['nom_pharmacie'] }]
    });
    if (!medicament) return res.status(404).json({ error: 'Médicament non trouvé' });
    res.json(medicament);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/medicaments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { nom, description, categorie, prix, stock, pharmacien_id, necessite_ordonnance } = req.body;
    const medicament = await db.Medicament.create({
      nom, description, categorie, prix, stock,
      pharmacien_id: pharmacien_id || 1,
      necessite_ordonnance: necessite_ordonnance || false
    });
    res.status(201).json({ success: true, medicament });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/medicaments/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { nom, description, categorie, prix, stock, necessite_ordonnance } = req.body;
    const medicament = await db.Medicament.findByPk(req.params.id);
    if (!medicament) return res.status(404).json({ error: 'Médicament non trouvé' });
    
    await medicament.update({ nom, description, categorie, prix, stock, necessite_ordonnance });
    res.json({ success: true, medicament });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/medicaments/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const medicament = await db.Medicament.findByPk(req.params.id);
    if (!medicament) return res.status(404).json({ error: 'Médicament non trouvé' });
    
    await medicament.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/medicaments/:id/stock', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { stock } = req.body;
    const medicament = await db.Medicament.findByPk(req.params.id);
    if (!medicament) return res.status(404).json({ error: 'Médicament non trouvé' });
    await medicament.update({ stock });
    res.json({ success: true, medicament });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AMBULANCES (CRUD complet) ====================
router.get('/ambulances', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ambulances = await db.Ambulancier.findAll();
    res.json(ambulances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ambulances/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ambulance = await db.Ambulancier.findByPk(req.params.id);
    if (!ambulance) return res.status(404).json({ error: 'Ambulance non trouvée' });
    res.json(ambulance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/ambulances', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { nom, telephone, matricule, zone_couverture, mot_de_passe } = req.body;
    const hashedPassword = await bcrypt.hash(mot_de_passe || 'ambulance123', 10);
    const ambulance = await db.Ambulancier.create({
      nom, telephone, matricule, zone_couverture,
      mot_de_passe_hash: hashedPassword,
      statut: 'DISPONIBLE'
    });
    res.status(201).json({ success: true, ambulance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/ambulances/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { nom, telephone, matricule, zone_couverture, statut } = req.body;
    const ambulance = await db.Ambulancier.findByPk(req.params.id);
    if (!ambulance) return res.status(404).json({ error: 'Ambulance non trouvée' });
    
    await ambulance.update({ nom, telephone, matricule, zone_couverture, statut });
    res.json({ success: true, ambulance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/ambulances/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const ambulance = await db.Ambulancier.findByPk(req.params.id);
    if (!ambulance) return res.status(404).json({ error: 'Ambulance non trouvée' });
    
    await ambulance.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/ambulances/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { statut } = req.body;
    const ambulance = await db.Ambulancier.findByPk(req.params.id);
    if (!ambulance) return res.status(404).json({ error: 'Ambulance non trouvée' });
    await ambulance.update({ statut });
    res.json({ success: true, ambulance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CENTRES DE SANTÉ (CRUD complet) ====================
router.get('/centres-sante', authenticateToken, isAdmin, async (req, res) => {
  try {
    const centres = await db.CentreSante.findAll();
    res.json(centres);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/centres-sante/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const centre = await db.CentreSante.findByPk(req.params.id);
    if (!centre) return res.status(404).json({ error: 'Centre non trouvé' });
    res.json(centre);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/centres-sante', authenticateToken, isAdmin, async (req, res) => {
  try {
    const centre = await db.CentreSante.create(req.body);
    res.status(201).json({ success: true, centre });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/centres-sante/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const centre = await db.CentreSante.findByPk(req.params.id);
    if (!centre) return res.status(404).json({ error: 'Centre non trouvé' });
    
    await centre.update(req.body);
    res.json({ success: true, centre });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/centres-sante/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const centre = await db.CentreSante.findByPk(req.params.id);
    if (!centre) return res.status(404).json({ error: 'Centre non trouvé' });
    
    await centre.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== PHARMACIES (CRUD complet) ====================
router.get('/pharmacies', authenticateToken, isAdmin, async (req, res) => {
  try {
    const pharmacies = await db.Pharmacien.findAll();
    res.json(pharmacies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pharmacies/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const pharmacie = await db.Pharmacien.findByPk(req.params.id);
    if (!pharmacie) return res.status(404).json({ error: 'Pharmacie non trouvée' });
    res.json(pharmacie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pharmacies', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { nom_pharmacie, responsable, telephone, email, adresse, mot_de_passe, livraison_disponible } = req.body;
    const hashedPassword = await bcrypt.hash(mot_de_passe || 'pharmacy123', 10);
    const pharmacie = await db.Pharmacien.create({
      nom_pharmacie, responsable, telephone, email, adresse,
      mot_de_passe_hash: hashedPassword,
      livraison_disponible: livraison_disponible !== false,
      statut: 'ACTIF'
    });
    res.status(201).json({ success: true, pharmacie });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/pharmacies/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { nom_pharmacie, responsable, telephone, email, adresse, livraison_disponible, statut } = req.body;
    const pharmacie = await db.Pharmacien.findByPk(req.params.id);
    if (!pharmacie) return res.status(404).json({ error: 'Pharmacie non trouvée' });
    
    await pharmacie.update({ nom_pharmacie, responsable, telephone, email, adresse, livraison_disponible, statut });
    res.json({ success: true, pharmacie });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/pharmacies/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const pharmacie = await db.Pharmacien.findByPk(req.params.id);
    if (!pharmacie) return res.status(404).json({ error: 'Pharmacie non trouvée' });
    
    await pharmacie.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/pharmacies/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { statut } = req.body;
    const pharmacie = await db.Pharmacien.findByPk(req.params.id);
    if (!pharmacie) return res.status(404).json({ error: 'Pharmacie non trouvée' });
    await pharmacie.update({ statut: statut === 'ACTIF' ? 'ACTIF' : 'INACTIF' });
    res.json({ success: true, pharmacie });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== UTILISATEURS (CRUD complet) ====================
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const patients = await db.Patient.findAll({
      attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'sexe', 'groupe_sanguin', 'date_inscription', 'statut']
    });
    const ambulanciers = await db.Ambulancier.findAll({
      attributes: ['id', 'nom', 'telephone', 'statut', 'zone_couverture']
    });
    const pharmaciens = await db.Pharmacien.findAll({
      attributes: ['id', 'nom_pharmacie', 'responsable', 'telephone', 'email', 'statut']
    });
    const admins = await db.Admin.findAll({
      attributes: ['id', 'nom', 'prenom', 'email', 'telephone', 'niveau_acces', 'statut']
    });
    res.json({ patients, ambulanciers, pharmaciens, admins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/:id/:type', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id, type } = req.params;
    let user = null;
    
    if (type === 'PATIENT') user = await db.Patient.findByPk(id);
    else if (type === 'AMBULANCIER') user = await db.Ambulancier.findByPk(id);
    else if (type === 'PHARMACIEN') user = await db.Pharmacien.findByPk(id);
    else if (type === 'ADMIN') user = await db.Admin.findByPk(id);
    
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { nom, prenom, email, telephone, mot_de_passe, role, sexe, groupe_sanguin } = req.body;
    const hashedPassword = await bcrypt.hash(mot_de_passe || 'password123', 10);
    
    let user;
    if (role === 'PATIENT') {
      user = await db.Patient.create({
        nom, prenom, email, telephone,
        mot_de_passe_hash: hashedPassword,
        sexe, groupe_sanguin,
        date_inscription: new Date(),
        statut: 'ACTIF'
      });
    } else if (role === 'AMBULANCIER') {
      user = await db.Ambulancier.create({
        nom, telephone,
        mot_de_passe_hash: hashedPassword,
        statut: 'DISPONIBLE'
      });
    } else if (role === 'PHARMACIEN') {
      user = await db.Pharmacien.create({
        nom_pharmacie: `${nom} ${prenom}`,
        responsable: `${prenom} ${nom}`,
        telephone, email,
        mot_de_passe_hash: hashedPassword,
        statut: 'ACTIF'
      });
    } else if (role === 'ADMIN') {
      user = await db.Admin.create({
        nom, prenom, email, telephone,
        mot_de_passe_hash: hashedPassword,
        niveau_acces: 'ADMIN_STANDARD',
        statut: 'ACTIF'
      });
    }
    res.status(201).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/users/:id/:type', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id, type } = req.params;
    const updateData = req.body;
    let user = null;
    
    if (type === 'PATIENT') {
      user = await db.Patient.findByPk(id);
      if (updateData.mot_de_passe) {
        updateData.mot_de_passe_hash = await bcrypt.hash(updateData.mot_de_passe, 10);
        delete updateData.mot_de_passe;
      }
      await user?.update(updateData);
    } else if (type === 'AMBULANCIER') {
      user = await db.Ambulancier.findByPk(id);
      if (updateData.mot_de_passe) {
        updateData.mot_de_passe_hash = await bcrypt.hash(updateData.mot_de_passe, 10);
        delete updateData.mot_de_passe;
      }
      await user?.update(updateData);
    } else if (type === 'PHARMACIEN') {
      user = await db.Pharmacien.findByPk(id);
      if (updateData.mot_de_passe) {
        updateData.mot_de_passe_hash = await bcrypt.hash(updateData.mot_de_passe, 10);
        delete updateData.mot_de_passe;
      }
      await user?.update(updateData);
    } else if (type === 'ADMIN') {
      user = await db.Admin.findByPk(id);
      if (updateData.mot_de_passe) {
        updateData.mot_de_passe_hash = await bcrypt.hash(updateData.mot_de_passe, 10);
        delete updateData.mot_de_passe;
      }
      await user?.update(updateData);
    }
    
    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id/:type', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id, type } = req.params;
    let deleted = false;
    
    if (type === 'PATIENT') {
      const user = await db.Patient.findByPk(id);
      if (user) { await user.destroy(); deleted = true; }
    } else if (type === 'AMBULANCIER') {
      const user = await db.Ambulancier.findByPk(id);
      if (user) { await user.destroy(); deleted = true; }
    } else if (type === 'PHARMACIEN') {
      const user = await db.Pharmacien.findByPk(id);
      if (user) { await user.destroy(); deleted = true; }
    } else if (type === 'ADMIN') {
      const user = await db.Admin.findByPk(id);
      if (user) { await user.destroy(); deleted = true; }
    }
    
    if (!deleted) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COMMANDES ====================
router.get('/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const commandes = await db.Commande.findAll({
      include: [
        { model: db.Patient, attributes: ['nom', 'prenom'] },
        { model: db.Pharmacien, attributes: ['nom_pharmacie'] },
        { model: db.CommandeDetail, include: [db.Medicament] }
      ],
      order: [['date_commande', 'DESC']]
    });
    res.json(commandes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/orders/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const commande = await db.Commande.findByPk(req.params.id, {
      include: [
        { model: db.Patient, attributes: ['nom', 'prenom', 'telephone'] },
        { model: db.Pharmacien, attributes: ['nom_pharmacie'] },
        { model: db.CommandeDetail, include: [db.Medicament] }
      ]
    });
    if (!commande) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(commande);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { statut } = req.body;
    const commande = await db.Commande.findByPk(req.params.id);
    if (!commande) return res.status(404).json({ error: 'Commande non trouvée' });
    await commande.update({ statut });
    res.json({ success: true, commande });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== URGENCES ====================
router.get('/emergencies', authenticateToken, isAdmin, async (req, res) => {
  try {
    const urgences = await db.Urgence.findAll({
      include: [
        { model: db.Patient, attributes: ['nom', 'prenom', 'telephone'] },
        { model: db.Ambulancier, attributes: ['nom'] }
      ],
      order: [['date_alerte', 'DESC']]
    });
    res.json(urgences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/emergencies/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const urgence = await db.Urgence.findByPk(req.params.id, {
      include: [
        { model: db.Patient, attributes: ['nom', 'prenom', 'telephone'] },
        { model: db.Ambulancier, attributes: ['nom'] }
      ]
    });
    if (!urgence) return res.status(404).json({ error: 'Urgence non trouvée' });
    res.json(urgence);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/emergencies/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { statut, ambulancier_id } = req.body;
    const urgence = await db.Urgence.findByPk(req.params.id);
    if (!urgence) return res.status(404).json({ error: 'Urgence non trouvée' });
    await urgence.update({ statut, ambulancier_id });
    res.json({ success: true, urgence });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== STATISTIQUES ====================
router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const stats = {
      patients: await db.Patient.count(),
      ambulanciers: await db.Ambulancier.count(),
      pharmaciens: await db.Pharmacien.count(),
      admins: await db.Admin.count(),
      medicaments: await db.Medicament.count(),
      commandes: await db.Commande.count(),
      urgences: await db.Urgence.count(),
      articles: await db.Article.count(),
      centresSante: await db.CentreSante.count(),
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;