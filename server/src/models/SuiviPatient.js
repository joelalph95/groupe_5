const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SuiviPatient = sequelize.define('SuiviPatient', {
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
  date_visite: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  poids: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  temperature: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true
  },
  pression_arterielle: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  frequence_cardiaque: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  glycemie: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  symptomes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  medicaments_pris: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'suivi_patient',
  timestamps: false
});

module.exports = SuiviPatient;