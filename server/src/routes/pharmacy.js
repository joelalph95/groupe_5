const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');

// Obtenir tous les médicaments
router.get('/medicaments', async (req, res) => {
  try {
    const { search, categorie, pharmacie_id } = req.query;
    
    const where = {};
    if (search) {
      where[db.Sequelize.Op.or] = [
        { nom: { [db.Sequelize.Op.iLike]: `%${search}%` } },
        { description: { [db.Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }
    if (categorie) where.categorie = categorie;
    if (pharmacie_id) where.pharmacien_id = pharmacie_id;
    
    const medicaments = await db.Medicament.findAll({
      where,
      include: [{
        model: db.Pharmacien,
        attributes: ['id', 'nom_pharmacie', 'telephone', 'adresse']
      }],
      order: [['nom', 'ASC']]
    });
    
    res.json(medicaments);
  } catch (error) {
    console.error('Erreur récupération médicaments:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir un médicament par ID
router.get('/medicaments/:id', async (req, res) => {
  try {
    const medicament = await db.Medicament.findByPk(req.params.id, {
      include: [{
        model: db.Pharmacien,
        attributes: ['id', 'nom_pharmacie', 'telephone', 'adresse', 'latitude', 'longitude']
      }]
    });
    
    if (!medicament) {
      return res.status(404).json({ error: 'Médicament non trouvé' });
    }
    
    res.json(medicament);
  } catch (error) {
    console.error('Erreur récupération médicament:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les pharmacies
router.get('/pharmacies', async (req, res) => {
  try {
    const pharmaciens = await db.Pharmacien.findAll({
      where: { statut: 'ACTIF' },
      attributes: ['id', 'nom_pharmacie', 'responsable', 'telephone', 'adresse', 'latitude', 'longitude', 'livraison_disponible', 'horaires_ouverture']
    });
    
    res.json(pharmaciens);
  } catch (error) {
    console.error('Erreur récupération pharmacies:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une commande
router.post('/commandes', authenticateToken, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log('🔐 Utilisateur connecté:', req.user);
    console.log('📦 Body reçu:', req.body);
    
    const { items, adresse_livraison, mode_paiement, ordonnance_url } = req.body;
    
    // Vérifier que le panier n'est pas vide
    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Panier vide' });
    }
    
    // Vérifier que l'utilisateur est un patient
    if (req.user.role !== 'PATIENT') {
      await transaction.rollback();
      return res.status(403).json({ error: 'Seuls les patients peuvent passer commande' });
    }
    
    // Calculer le montant total et vérifier les stocks
    let montant_total = 0;
    const itemsWithDetails = [];
    
    for (const item of items) {
      const medicament = await db.Medicament.findByPk(item.medicament_id);
      if (!medicament) {
        await transaction.rollback();
        return res.status(404).json({ error: `Médicament ${item.medicament_id} non trouvé` });
      }
      if (medicament.stock < item.quantite) {
        await transaction.rollback();
        return res.status(400).json({ error: `Stock insuffisant pour ${medicament.nom}` });
      }
      const itemTotal = parseFloat(medicament.prix) * item.quantite;
      montant_total += itemTotal;
      itemsWithDetails.push({ 
        medicament, 
        quantite: item.quantite,
        prix_unitaire: medicament.prix
      });
    }
    
    console.log('💰 Montant total:', montant_total);
    
    // Récupérer une pharmacie par défaut
    let pharmacien = await db.Pharmacien.findOne();
    if (!pharmacien) {
      // Créer une pharmacie par défaut si aucune n'existe
      pharmacien = await db.Pharmacien.create({
        nom_pharmacie: 'Pharmacie par défaut',
        responsable: 'Admin',
        telephone: '+261341234567',
        mot_de_passe_hash: 'default',
        statut: 'ACTIF',
        livraison_disponible: true
      });
    }
    
    // Créer la commande
    const commande = await db.Commande.create({
      patient_id: req.user.id,
      pharmacien_id: pharmacien.id,
      montant_total: montant_total,
      adresse_livraison: adresse_livraison || 'À définir',
      mode_paiement: mode_paiement || 'MOBILE_MONEY',
      ordonnance_url: ordonnance_url || null,
      statut: 'CONFIRMED',
      date_commande: new Date()
    }, { transaction });
    
    console.log('✅ Commande créée ID:', commande.id);
    
    // Créer les détails et mettre à jour le stock
    for (const item of itemsWithDetails) {
      await db.CommandeDetail.create({
        commande_id: commande.id,
        medicament_id: item.medicament.id,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire
      }, { transaction });
      
      // Mettre à jour le stock
      await item.medicament.update({
        stock: item.medicament.stock - item.quantite
      }, { transaction });
    }
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      commande: {
        id: commande.id,
        montant_total: commande.montant_total,
        statut: commande.statut,
        date_commande: commande.date_commande
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Erreur création commande:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de la commande' });
  }
});

// Obtenir les commandes d'un patient
router.get('/commandes', authenticateToken, async (req, res) => {
  try {
    console.log('🔐 Récupération commandes pour:', req.user);
    
    const commandes = await db.Commande.findAll({
      where: { patient_id: req.user.id },
      include: [
        {
          model: db.CommandeDetail,
          include: [{
            model: db.Medicament,
            attributes: ['id', 'nom', 'prix']
          }]
        },
        {
          model: db.Pharmacien,
          attributes: ['nom_pharmacie', 'telephone']
        }
      ],
      order: [['date_commande', 'DESC']]
    });
    
    console.log(`📦 ${commandes.length} commandes trouvées`);
    res.json(commandes);
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir une commande spécifique
router.get('/commandes/:id', authenticateToken, async (req, res) => {
  try {
    const commande = await db.Commande.findOne({
      where: { id: req.params.id, patient_id: req.user.id },
      include: [
        {
          model: db.CommandeDetail,
          include: [{
            model: db.Medicament,
            attributes: ['id', 'nom', 'prix']
          }]
        },
        {
          model: db.Pharmacien,
          attributes: ['nom_pharmacie', 'telephone', 'adresse']
        }
      ]
    });
    
    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    res.json(commande);
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'une commande
router.patch('/commandes/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;
    
    const commande = await db.Commande.findByPk(id);
    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    // Vérifier les autorisations
    if (req.user.role === 'PHARMACIEN' && commande.pharmacien_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    
    await commande.update({ statut });
    
    res.json({ success: true, commande });
  } catch (error) {
    console.error('Erreur mise à jour commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Annuler une commande
router.post('/commandes/:id/cancel', authenticateToken, async (req, res) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const commande = await db.Commande.findOne({
      where: { id, patient_id: req.user.id },
      include: [{
        model: db.CommandeDetail,
        include: [db.Medicament]
      }]
    });
    
    if (!commande) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    if (commande.statut !== 'CONFIRMED' && commande.statut !== 'PREPARED') {
      await transaction.rollback();
      return res.status(400).json({ error: 'Cette commande ne peut plus être annulée' });
    }
    
    // Restaurer les stocks
    for (const detail of commande.CommandeDetails) {
      await detail.Medicament.update({
        stock: detail.Medicament.stock + detail.quantite
      }, { transaction });
    }
    
    await commande.update({ statut: 'CANCELLED' }, { transaction });
    
    await transaction.commit();
    
    res.json({ success: true, message: 'Commande annulée' });
  } catch (error) {
    await transaction.rollback();
    console.error('Erreur annulation commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;