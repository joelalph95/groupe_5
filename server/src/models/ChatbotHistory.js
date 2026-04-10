const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatbotHistory = sequelize.define('ChatbotHistory', {
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
  message_patient: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  reponse_bot: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  humeur_detectee: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  date_message: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'chatbot_humeur',
  timestamps: false
});

module.exports = ChatbotHistory;