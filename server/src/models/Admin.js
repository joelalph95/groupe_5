const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Admin = sequelize.define('Admin', {
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
    allowNull: false,
    validate: {
      isEmail: true
    }
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
  niveau_acces: {
    type: DataTypes.ENUM('ADMIN_PRINCIPAL', 'ADMIN_STANDARD', 'SUPERVISEUR'),
    defaultValue: 'ADMIN_STANDARD'
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  dernier_connexion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('ACTIF', 'INACTIF', 'SUSPENDU'),
    defaultValue: 'ACTIF'
  }
}, {
  tableName: 'admins',
  timestamps: false,
  hooks: {
    beforeCreate: async (admin) => {
      if (admin.mot_de_passe_hash && !admin.mot_de_passe_hash.startsWith('$2')) {
        admin.mot_de_passe_hash = await bcrypt.hash(admin.mot_de_passe_hash, 10);
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('mot_de_passe_hash') && !admin.mot_de_passe_hash.startsWith('$2')) {
        admin.mot_de_passe_hash = await bcrypt.hash(admin.mot_de_passe_hash, 10);
      }
    }
  }
});

Admin.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.mot_de_passe_hash);
};

module.exports = Admin;