const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Medicament = sequelize.define('Medicament', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categorie: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  prix: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  pharmacien_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pharmaciens',
      key: 'id'
    }
  },
  necessite_ordonnance: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_ajout: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'medicaments',
  timestamps: false
});

module.exports = Medicament;