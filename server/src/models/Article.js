const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  titre: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  resume: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  categorie: {
    type: DataTypes.ENUM('GENERAL', 'FEMME', 'HOMME', 'ENFANT', 'MENTAL', 'NUTRITION', 'SPORT', 'VACCINATION'),
    allowNull: false,
    defaultValue: 'GENERAL'
  },
  tags: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  auteur: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'MIAINA'
  },
  date_publication: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  date_modification: {
    type: DataTypes.DATE,
    allowNull: true
  },
  statut: {
    type: DataTypes.ENUM('BROUILLON', 'PUBLIE', 'ARCHIVE'),
    defaultValue: 'PUBLIE'
  },
  vues: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  cible_genre: {
    type: DataTypes.ENUM('TOUS', 'MASCULIN', 'FEMININ'),
    defaultValue: 'TOUS'
  },
  cible_age_min: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  cible_age_max: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'articles',
  timestamps: false
});

module.exports = Article;