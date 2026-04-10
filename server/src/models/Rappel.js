const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rappel = sequelize.define('Rappel', {
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
  titre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('MEDICAMENT', 'REGLE', 'VACCIN', 'RDV', 'EXAMEN', 'AUTRE'),
    defaultValue: 'AUTRE'
  },
  date_rappel: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  heure_rappel: {
    type: DataTypes.TIME,
    allowNull: true
  },
  recurrence: {
    type: DataTypes.ENUM('UNE_FOIS', 'JOURNALIER', 'HEBDOMADAIRE', 'MENSUEL'),
    defaultValue: 'UNE_FOIS'
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  derniere_notification: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'rappels',
  timestamps: false
});

module.exports = Rappel;