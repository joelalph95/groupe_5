const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Pharmacien = sequelize.define('Pharmacien', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom_pharmacie: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  responsable: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    unique: true,
    allowNull: true
  },
  telephone: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  mot_de_passe_hash: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  zone_couverture: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true
  },
  horaires_ouverture: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('ACTIF', 'INACTIF'),
    defaultValue: 'ACTIF'
  },
  livraison_disponible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'pharmaciens',
  timestamps: false,
  hooks: {
    beforeCreate: async (pharmacien) => {
      if (pharmacien.mot_de_passe_hash && !pharmacien.mot_de_passe_hash.startsWith('$2')) {
        pharmacien.mot_de_passe_hash = await bcrypt.hash(pharmacien.mot_de_passe_hash, 10);
      }
    }
  }
});

Pharmacien.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.mot_de_passe_hash);
};

module.exports = Pharmacien;