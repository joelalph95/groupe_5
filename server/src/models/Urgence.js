const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Urgence = sequelize.define('Urgence', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'patients',
      key: 'id'
    }
  },
  date_alerte: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  type_urgence: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  niveau_priorite: {
    type: DataTypes.ENUM('FAIBLE', 'MOYEN', 'ELEVE', 'CRITIQUE'),
    defaultValue: 'MOYEN'
  },
  localisation: {
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
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'),
    defaultValue: 'PENDING'
  },
  ambulancier_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ambulanciers',
      key: 'id'
    }
  },
  centre_sante_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'urgences',
  timestamps: false
});

module.exports = Urgence;