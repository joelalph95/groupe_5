const express = require('express');
const router = express.Router();
const db = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { Op } = require('sequelize');

// Obtenir tous les articles (public)
router.get('/', async (req, res) => {
  try {
    const { categorie, genre, age, limit = 20, offset = 0 } = req.query;
    
    const where = { statut: 'PUBLIE' };
    
    if (categorie) where.categorie = categorie;
    
    if (genre && genre !== 'TOUS') {
      where[Op.or] = [
        { cible_genre: 'TOUS' },
        { cible_genre: genre }
      ];
    }
    
    const articles = await db.Article.findAll({
      where,
      include: [{
        model: db.Admin,
        attributes: ['nom', 'prenom']
      }],
      order: [['date_publication', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json(articles);
  } catch (error) {
    console.error('Erreur récupération articles:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les articles personnalisés pour un utilisateur
router.get('/personnalises', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    let genre = 'TOUS';
    let age = null;
    
    if (user.role === 'PATIENT') {
      const patient = await db.Patient.findByPk(user.id);
      if (patient) {
        genre = patient.sexe || 'TOUS';
        if (patient.date_naissance) {
          const birthDate = new Date(patient.date_naissance);
          const today = new Date();
          age = today.getFullYear() - birthDate.getFullYear();
        }
      }
    }
    
    const where = { statut: 'PUBLIE' };
    
    // Filtrer par genre
    if (genre !== 'TOUS') {
      where[Op.or] = [
        { cible_genre: 'TOUS' },
        { cible_genre: genre }
      ];
    }
    
    // Filtrer par âge si disponible
    if (age) {
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push({
        [Op.or]: [
          { cible_age_min: null, cible_age_max: null },
          {
            cible_age_min: { [Op.lte]: age },
            cible_age_max: { [Op.gte]: age }
          },
          {
            cible_age_min: { [Op.lte]: age },
            cible_age_max: null
          },
          {
            cible_age_min: null,
            cible_age_max: { [Op.gte]: age }
          }
        ]
      });
    }
    
    const articles = await db.Article.findAll({
      where,
      include: [{
        model: db.Admin,
        attributes: ['nom', 'prenom']
      }],
      order: [
        ['categorie', 'ASC'],
        ['date_publication', 'DESC']
      ],
      limit: 30
    });
    
    // Incrémenter les vues
    const articleIds = articles.map(a => a.id);
    if (articleIds.length > 0) {
      await db.Article.increment('vues', { 
        where: { id: articleIds },
        silent: true
      });
    }
    
    res.json(articles);
  } catch (error) {
    console.error('Erreur articles personnalisés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir un article par ID
router.get('/:id', async (req, res) => {
  try {
    const article = await db.Article.findByPk(req.params.id, {
      include: [{
        model: db.Admin,
        attributes: ['nom', 'prenom']
      }]
    });
    
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    // Incrémenter les vues
    await article.increment('vues');
    
    res.json(article);
  } catch (error) {
    console.error('Erreur récupération article:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liker un article
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const article = await db.Article.findByPk(req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    await article.increment('likes');
    
    res.json({ success: true, likes: article.likes + 1 });
  } catch (error) {
    console.error('Erreur like article:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Routes admin pour gérer les articles
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    
    const article = await db.Article.create({
      ...req.body,
      admin_id: req.user.id
    });
    
    res.status(201).json({ success: true, article });
  } catch (error) {
    console.error('Erreur création article:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    
    const article = await db.Article.findByPk(req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    await article.update({
      ...req.body,
      date_modification: new Date()
    });
    
    res.json({ success: true, article });
  } catch (error) {
    console.error('Erreur mise à jour article:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }
    
    const article = await db.Article.findByPk(req.params.id);
    
    if (!article) {
      return res.status(404).json({ error: 'Article non trouvé' });
    }
    
    await article.update({ statut: 'ARCHIVE' });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression article:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les catégories disponibles
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await db.Article.findAll({
      attributes: ['categorie', [db.sequelize.fn('COUNT', 'categorie'), 'count']],
      where: { statut: 'PUBLIE' },
      group: ['categorie']
    });
    
    res.json(categories);
  } catch (error) {
    console.error('Erreur catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;