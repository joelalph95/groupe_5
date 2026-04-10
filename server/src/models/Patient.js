const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  prenom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(150),
    unique: true,
    allowNull: true
  },
  telephone: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  mot_de_passe_hash: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  date_naissance: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  sexe: {
    type: DataTypes.ENUM('MASCULIN', 'FEMININ'),
    allowNull: true
  },
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  groupe_sanguin: {
    type: DataTypes.STRING(5),
    allowNull: true
  },
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  maladies_connues: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  contact_urgence: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  date_inscription: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'patients',
  timestamps: false,
  hooks: {
    beforeCreate: async (patient) => {
      if (patient.mot_de_passe_hash && !patient.mot_de_passe_hash.startsWith('$2')) {
        patient.mot_de_passe_hash = await bcrypt.hash(patient.mot_de_passe_hash, 10);
      }
    },
    beforeUpdate: async (patient) => {
      if (patient.changed('mot_de_passe_hash') && !patient.mot_de_passe_hash.startsWith('$2')) {
        patient.mot_de_passe_hash = await bcrypt.hash(patient.mot_de_passe_hash, 10);
      }
    }
  }
});

Patient.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.mot_de_passe_hash);
};

module.exports = Patient;