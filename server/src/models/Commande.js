const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Commande = sequelize.define('Commande', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id'
    }
  },
  pharmacien_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'pharmaciens',
      key: 'id'
    }
  },
  date_commande: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  montant_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  statut: {
    type: DataTypes.ENUM('PANIER', 'CONFIRMED', 'PREPARED', 'EN_LIVRAISON', 'DELIVERED', 'CANCELLED'),
    defaultValue: 'PANIER'
  },
  adresse_livraison: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mode_paiement: {
    type: DataTypes.ENUM('ESPECES', 'MOBILE_MONEY', 'CARTE'),
    allowNull: true
  },
  ordonnance_url: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'commandes',
  timestamps: false
});

module.exports = Commande;