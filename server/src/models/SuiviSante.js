const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SuiviSante = sequelize.define('SuiviSante', {
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
  type: {
    type: DataTypes.ENUM('CYCLE_MENSTRUEL', 'GROSSESSE', 'PSA', 'ACTIVITE_PHYSIQUE'),
    allowNull: false
  },
  date_debut: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  date_fin: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  valeur: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  unite: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  duree_cycle: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  semaine_grossesse: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  date_prevue_accouchement: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  observations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'suivi_sante',
  timestamps: false
});

module.exports = SuiviSante;