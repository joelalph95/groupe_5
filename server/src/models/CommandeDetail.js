const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CommandeDetail = sequelize.define('CommandeDetail', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  commande_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'commandes',
      key: 'id'
    }
  },
  medicament_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'medicaments',
      key: 'id'
    }
  },
  quantite: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  prix_unitaire: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'commande_details',
  timestamps: false
});

module.exports = CommandeDetail;