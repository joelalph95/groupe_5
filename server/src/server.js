require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const db = require('./models');

// Import des routes
const authRoutes = require('./routes/auth');
const emergencyRoutes = require('./routes/emergency');
const pharmacyRoutes = require('./routes/pharmacy');
const wellnessRoutes = require('./routes/wellness');
const adminRoutes = require('./routes/admin');
const articlesRoutes = require('./routes/articles');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:19006'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5117;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/articles', articlesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      websocket: io.engine.clientsCount + ' clients'
    }
  });
});

// Route racine - rediriger vers le frontend React
app.get('/', (req, res) => {
  res.json({ 
    message: 'MIAINA API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      emergency: '/api/emergency',
      pharmacy: '/api/pharmacy',
      wellness: '/api/wellness',
      admin: '/api/admin',
      articles: '/api/articles'
    },
    frontend: 'http://localhost:3000'
  });
});

// WebSocket pour les alertes en temps réel
io.on('connection', (socket) => {
  console.log('🔌 Nouveau client connecté:', socket.id);
  
  socket.on('join-room', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} a rejoint la room ${room}`);
  });
  
  socket.on('emergency-alert', (data) => {
    console.log('🚨 Alerte urgence reçue:', data);
    io.to('centres-medicaux').emit('new-emergency', data);
    io.to('ambulances').emit('new-emergency', data);
  });
  
  socket.on('bip-alert', async (data) => {
    console.log('📞 BIP reçu:', data);
    
    try {
      const urgence = await db.Urgence.create({
        type_urgence: 'BIP_URGENCE',
        niveau_priorite: 'ELEVE',
        localisation: data.position ? `${data.position.latitude}, ${data.position.longitude}` : null,
        latitude: data.position?.latitude,
        longitude: data.position?.longitude,
        description: `BIP reçu du numéro ${data.expediteur}`,
        statut: 'PENDING'
      });
      
      io.to('centres-medicaux').emit('new-bip', { ...data, urgenceId: urgence.id });
    } catch (error) {
      console.error('Erreur sauvegarde BIP:', error);
    }
  });
  
  socket.on('update-location', (data) => {
    socket.broadcast.emit('location-updated', data);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Client déconnecté:', socket.id);
  });
});

// Synchronisation de la base de données
db.sequelize.sync({ alter: true })
  .then(async () => {
    console.log('✅ Base de données synchronisée');
    
    await seedDatabase();
    
    server.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Serveur MIAINA API démarré sur http://localhost:${PORT} ║
║                                                            ║
║   📱 Frontend React:   http://localhost:3000                ║
║   📡 API Endpoints:    http://localhost:${PORT}/api          ║
║   🔌 WebSocket:        ws://localhost:${PORT}                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  })
  .catch(err => {
    console.error('❌ Erreur synchronisation DB:', err);
  });

// Fonction pour insérer des données de démo
async function seedDatabase() {
  try {
    const patientsCount = await db.Patient.count();
    if (patientsCount > 0) return;
    
    console.log('🌱 Insertion des données de démonstration...');
    
    // Créer un patient de test
    await db.Patient.create({
      nom: 'Rakoto',
      prenom: 'Marie',
      telephone: '+261340000000',
      email: 'patient@miaina.mg',
      mot_de_passe_hash: '123456',
      sexe: 'FEMININ',
      date_naissance: '1990-01-01',
      adresse: 'Analakely, Antananarivo',
      groupe_sanguin: 'A+',
      allergies: 'Aucune',
      contact_urgence: '+261341234567'
    });
    
    // Créer un admin par défaut
    await db.Admin.create({
      nom: 'System',
      prenom: 'Admin',
      email: 'admin@miaina.mg',
      telephone: '+261340000001',
      mot_de_passe_hash: 'admin123',
      niveau_acces: 'ADMIN_PRINCIPAL'
    });
    
    // Créer un ambulancier de test
    await db.Ambulancier.create({
      nom: 'Rakoto Pierre',
      telephone: '+261341234567',
      mot_de_passe_hash: 'amb123',
      matricule: 'AMB-001',
      statut: 'DISPONIBLE',
      zone_couverture: 'Tana Nord'
    });
    
    // Créer une pharmacie de test
    const pharmacie = await db.Pharmacien.create({
      nom_pharmacie: 'Pharmacie Central Tana',
      responsable: 'Dr. Rasoanaivo',
      telephone: '+261202212345',
      email: 'pharmacie@miaina.mg',
      mot_de_passe_hash: 'pharma123',
      adresse: 'Analakely, Antananarivo',
      latitude: -18.8792,
      longitude: 47.5200,
      livraison_disponible: true
    });
    
    // Créer des médicaments
    await db.Medicament.bulkCreate([
      { nom: 'Paracétamol 500mg', description: 'Antalgique fébrifuge', categorie: 'Antalgique', prix: 5000, stock: 100, pharmacien_id: pharmacie.id, necessite_ordonnance: false },
      { nom: 'Amoxicilline 500mg', description: 'Antibiotique large spectre', categorie: 'Antibiotique', prix: 8000, stock: 50, pharmacien_id: pharmacie.id, necessite_ordonnance: true },
      { nom: 'Ibuprofène 400mg', description: 'Anti-inflammatoire', categorie: 'AINS', prix: 6000, stock: 80, pharmacien_id: pharmacie.id, necessite_ordonnance: false },
      { nom: 'Vitamine C 500mg', description: 'Supplément vitaminique', categorie: 'Vitamines', prix: 3500, stock: 200, pharmacien_id: pharmacie.id, necessite_ordonnance: false }
    ]);
    
    // Centres de santé
    await db.CentreSante.bulkCreate([
      { nom: 'CHU HJRA', type: 'HOPITAL', telephone: '+261202232619', latitude: -18.8850, longitude: 47.5150, urgences_24_7: true },
      { nom: 'CHU Androva', type: 'HOPITAL', telephone: '+261202241268', latitude: -18.8720, longitude: 47.5080, urgences_24_7: true },
      { nom: 'Clinique MMN', type: 'CLINIQUE', telephone: '+261202263200', latitude: -18.8900, longitude: 47.5300, urgences_24_7: true },
      { nom: 'CSB Anosy', type: 'CSB', telephone: '+261202244556', latitude: -18.8850, longitude: 47.5100, urgences_24_7: false }
    ]);
    
    console.log('✅ Données de démonstration insérées');
    console.log('📝 Comptes de test:');
    console.log('   Patient: +261340000000 / 123456');
    console.log('   Admin: admin@miaina.mg / admin123');
    console.log('   Ambulancier: +261341234567 / amb123');
    console.log('   Pharmacien: +261202212345 / pharma123');
  } catch (error) {
    console.error('Erreur lors du seed:', error);
  }
}

module.exports = { app, server, io };