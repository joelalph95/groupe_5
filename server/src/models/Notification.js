const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_type: {
    type: DataTypes.ENUM('PATIENT', 'AMBULANCIER', 'PHARMACIEN', 'ADMIN'),
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('EMERGENCY', 'ORDER', 'REMINDER', 'SYSTEM', 'CHAT', 'PROMOTION'),
    defaultValue: 'SYSTEM'
  },
  titre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSON,
    allowNull: true
  },
  lu: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  date_lecture: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: false
});

module.exports = Notification;