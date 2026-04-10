const express = require('express');
const router = express.Router();
const db = require('../models');
const { generateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Inscription Patient
router.post('/register/patient', async (req, res) => {
  try {
    const { nom, prenom, telephone, mot_de_passe, email, sexe, date_naissance, adresse, groupe_sanguin, allergies, contact_urgence } = req.body;
    
    const existing = await db.Patient.findOne({ where: { telephone } });
    if (existing) {
      return res.status(400).json({ error: 'Ce numéro de téléphone est déjà utilisé' });
    }
    
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    
    const patient = await db.Patient.create({
      nom, prenom, telephone,
      mot_de_passe_hash: hashedPassword,
      email, sexe, date_naissance, adresse, groupe_sanguin, allergies, contact_urgence
    });
    
    const token = generateToken({ id: patient.id, telephone: patient.telephone, role: 'PATIENT' });
    
    res.status(201).json({
      success: true, token,
      user: { id: patient.id, nom: patient.nom, prenom: patient.prenom, telephone: patient.telephone, email: patient.email, sexe: patient.sexe, groupe_sanguin: patient.groupe_sanguin, role: 'PATIENT' }
    });
  } catch (error) {
    console.error('Erreur inscription patient:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Inscription Ambulancier
router.post('/register/ambulancier', async (req, res) => {
  try {
    const { nom, telephone, mot_de_passe, matricule, zone_couverture } = req.body;
    
    const existing = await db.Ambulancier.findOne({ where: { telephone } });
    if (existing) return res.status(400).json({ error: 'Ce numéro est déjà utilisé' });
    
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    
    const ambulancier = await db.Ambulancier.create({
      nom, telephone, mot_de_passe_hash: hashedPassword, matricule, zone_couverture, statut: 'DISPONIBLE'
    });
    
    const token = generateToken({ id: ambulancier.id, telephone: ambulancier.telephone, role: 'AMBULANCIER' });
    
    res.status(201).json({
      success: true, token,
      user: { id: ambulancier.id, nom: ambulancier.nom, telephone: ambulancier.telephone, role: 'AMBULANCIER' }
    });
  } catch (error) {
    console.error('Erreur inscription ambulancier:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Inscription Pharmacien
router.post('/register/pharmacien', async (req, res) => {
  try {
    const { nom_pharmacie, responsable, telephone, mot_de_passe, email, adresse, zone_couverture } = req.body;
    
    const existing = await db.Pharmacien.findOne({ where: { telephone } });
    if (existing) return res.status(400).json({ error: 'Ce numéro est déjà utilisé' });
    
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    
    const pharmacien = await db.Pharmacien.create({
      nom_pharmacie, responsable, telephone, mot_de_passe_hash: hashedPassword, email, adresse, zone_couverture
    });
    
    const token = generateToken({ id: pharmacien.id, telephone: pharmacien.telephone, role: 'PHARMACIEN' });
    
    res.status(201).json({
      success: true, token,
      user: { id: pharmacien.id, nom_pharmacie: pharmacien.nom_pharmacie, responsable: pharmacien.responsable, telephone: pharmacien.telephone, role: 'PHARMACIEN' }
    });
  } catch (error) {
    console.error('Erreur inscription pharmacien:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { telephone, mot_de_passe } = req.body;
    
    let user = await db.Patient.findOne({ where: { telephone } });
    let role = 'PATIENT';
    
    if (!user) {
      user = await db.Ambulancier.findOne({ where: { telephone } });
      role = 'AMBULANCIER';
    }
    
    if (!user) {
      user = await db.Pharmacien.findOne({ where: { telephone } });
      role = 'PHARMACIEN';
    }
    
    if (!user) {
      user = await db.Admin.findOne({ where: { telephone } });
      role = 'ADMIN';
    }
    
    if (!user) {
      user = await db.Admin.findOne({ where: { email: telephone } });
      role = 'ADMIN';
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    
    const isValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    
    const token = generateToken({ id: user.id, telephone: user.telephone, role });
    
    let userData = { id: user.id, telephone: user.telephone, role };
    
    if (role === 'PATIENT') {
      userData = { ...userData, nom: user.nom, prenom: user.prenom, email: user.email, sexe: user.sexe, groupe_sanguin: user.groupe_sanguin, adresse: user.adresse };
    } else if (role === 'AMBULANCIER') {
      userData = { ...userData, nom: user.nom, statut: user.statut, zone_couverture: user.zone_couverture };
    } else if (role === 'PHARMACIEN') {
      userData = { ...userData, nom_pharmacie: user.nom_pharmacie, responsable: user.responsable, email: user.email };
    } else if (role === 'ADMIN') {
      userData = { ...userData, nom: user.nom, prenom: user.prenom, email: user.email, niveau_acces: user.niveau_acces };
    }
    
    res.json({ success: true, token, user: userData });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

module.exports = router;