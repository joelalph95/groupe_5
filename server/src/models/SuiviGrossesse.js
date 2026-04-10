const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SuiviGrossesse = sequelize.define('SuiviGrossesse', {
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
  date_debut: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  date_prevue_accouchement: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  semaine_actuelle: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  niveau_risque: {
    type: DataTypes.ENUM('FAIBLE', 'MOYEN', 'ELEVE'),
    defaultValue: 'FAIBLE'
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'suivi_grossesse',
  timestamps: false
});

module.exports = SuiviGrossesse;