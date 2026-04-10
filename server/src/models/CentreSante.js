const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CentreSante = sequelize.define('CentreSante', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('HOPITAL', 'CLINIQUE', 'CSB', 'DISPENSAIRE'),
    allowNull: true
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  telephone: {
    type: DataTypes.STRING(20),
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
  capacite_lits: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  urgences_24_7: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'centres_sante',
  timestamps: false
});

module.exports = CentreSante;