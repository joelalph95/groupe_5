require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;


// TEST CONNEXION SEULEMENT

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log("Connexion PostgreSQL réussie");
  } catch (error) {
    console.error("Connexion échouée :", error);
  }
}

testConnection();

module.exports = db;