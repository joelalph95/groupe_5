const sequelize = require('../config/database');

const Patient = require('./Patient');
const Ambulancier = require('./Ambulancier');
const Pharmacien = require('./Pharmacien');
const Admin = require('./Admin');
const Medicament = require('./Medicament');
const Commande = require('./Commande');
const CommandeDetail = require('./CommandeDetail');
const Urgence = require('./Urgence');
const SuiviGrossesse = require('./SuiviGrossesse');
const SuiviPatient = require('./SuiviPatient');
const ChatbotHistory = require('./ChatbotHistory');
const CentreSante = require('./CentreSante');
const Article = require('./Article');
const Rappel = require('./Rappel');
const Notification = require('./Notification');

// Associations existantes
Patient.hasMany(Urgence, { foreignKey: 'patient_id' });
Urgence.belongsTo(Patient, { foreignKey: 'patient_id' });

Patient.hasMany(Commande, { foreignKey: 'patient_id' });
Commande.belongsTo(Patient, { foreignKey: 'patient_id' });

Patient.hasOne(SuiviGrossesse, { foreignKey: 'patient_id' });
SuiviGrossesse.belongsTo(Patient, { foreignKey: 'patient_id' });

Patient.hasMany(SuiviPatient, { foreignKey: 'patient_id' });
SuiviPatient.belongsTo(Patient, { foreignKey: 'patient_id' });

Patient.hasMany(ChatbotHistory, { foreignKey: 'patient_id' });
ChatbotHistory.belongsTo(Patient, { foreignKey: 'patient_id' });

Patient.hasMany(Rappel, { foreignKey: 'patient_id' });
Rappel.belongsTo(Patient, { foreignKey: 'patient_id' });

Ambulancier.hasMany(Urgence, { foreignKey: 'ambulancier_id' });
Urgence.belongsTo(Ambulancier, { foreignKey: 'ambulancier_id' });

Pharmacien.hasMany(Medicament, { foreignKey: 'pharmacien_id' });
Medicament.belongsTo(Pharmacien, { foreignKey: 'pharmacien_id' });

Pharmacien.hasMany(Commande, { foreignKey: 'pharmacien_id' });
Commande.belongsTo(Pharmacien, { foreignKey: 'pharmacien_id' });

Commande.hasMany(CommandeDetail, { foreignKey: 'commande_id', onDelete: 'CASCADE' });
CommandeDetail.belongsTo(Commande, { foreignKey: 'commande_id' });

Medicament.hasMany(CommandeDetail, { foreignKey: 'medicament_id' });
CommandeDetail.belongsTo(Medicament, { foreignKey: 'medicament_id' });

// Nouvelles associations
Admin.hasMany(Article, { foreignKey: 'admin_id' });
Article.belongsTo(Admin, { foreignKey: 'admin_id' });

const db = {
  sequelize,
  Sequelize: require('sequelize'),
  Patient,
  Ambulancier,
  Pharmacien,
  Admin,
  Medicament,
  Commande,
  CommandeDetail,
  Urgence,
  SuiviGrossesse,
  SuiviPatient,
  ChatbotHistory,
  CentreSante,
  Article,
  Rappel,
  Notification
};

module.exports = db;