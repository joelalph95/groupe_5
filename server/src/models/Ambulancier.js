const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Ambulancier = sequelize.define('Ambulancier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  matricule: {
    type: DataTypes.STRING(50),
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
  statut: {
    type: DataTypes.ENUM('DISPONIBLE', 'EN_ROUTE', 'EN_INTERVENTION', 'EN_HOPITAL', 'RETOUR_BASE', 'HORS_SERVICE'),
    defaultValue: 'DISPONIBLE'
  },
  position_gps: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  zone_couverture: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  urgence_active_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'ambulanciers',
  timestamps: false,
  hooks: {
    beforeCreate: async (ambulancier) => {
      if (ambulancier.mot_de_passe_hash && !ambulancier.mot_de_passe_hash.startsWith('$2')) {
        ambulancier.mot_de_passe_hash = await bcrypt.hash(ambulancier.mot_de_passe_hash, 10);
      }
    }
  }
});

Ambulancier.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.mot_de_passe_hash);
};

module.exports = Ambulancier;