require("dotenv").config();

const db = require("./model");

db.sequelize.authenticate()
.then(() => {
    console.log("Connexion PostgreSQL réussie");
})
.catch(err => {
    console.error("Erreur connexion :", err);
});