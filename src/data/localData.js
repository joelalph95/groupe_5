// Données préchargées pour mode offline
export const offlineData = {
  hospitals: [
    {
      id: 'hosp_001',
      name: 'CHU Antananarivo',
      type: 'Hôpital public',
      latitude: -18.8792,
      longitude: 47.5079,
      phone: '+261202212345',
      address: 'BP 415, Antananarivo 101',
      emergencyService: true
    },
    {
      id: 'hosp_002',
      name: 'Clinique Saint Michel',
      type: 'Clinique privée',
      latitude: -18.8923,
      longitude: 47.5234,
      phone: '+261202223456',
      address: 'Lot II J 1 Bis, Antananarivo',
      emergencyService: true
    },
    {
      id: 'hosp_003',
      name: 'CSB Andoharanofotsy',
      type: 'Centre de santé',
      latitude: -18.9654,
      longitude: 47.4987,
      phone: '+261202234567',
      address: 'Andoharanofotsy, Antananarivo',
      emergencyService: false
    }
  ],
  
  ambulances: [
    {
      id: 'amb_001',
      name: 'Ambulance SOS 1',
      driver: 'Jean Rakoto',
      phone: '+261321234567',
      type: 'Médicalisée',
      equipment: ['Défibrillateur', 'Oxygène', 'Brancard']
    },
    {
      id: 'amb_002',
      name: 'Ambulance Urgence +',
      driver: 'Marie Rasoa',
      phone: '+261322345678',
      type: 'Standard',
      equipment: ['Trousse secours', 'Brancard']
    }
  ],
  
  emergencyContacts: [
    {
      name: 'SAMU',
      phone: '124',
      description: 'Service d\'aide médicale urgente'
    },
    {
      name: 'Police Secours',
      phone: '117',
      description: 'Police nationale'
    },
    {
      name: 'Pompiers',
      phone: '118',
      description: 'Sapeurs-pompiers'
    }
  ],
  
  transporters: [
    {
      id: 'trans_001',
      name: 'Taxi-brousse Andrian',
      phone: '+261341234567',
      type: 'Taxi-brousse',
      capacity: 15,
      areas: ['Zone rurale 1', 'Zone rurale 2']
    },
    {
      id: 'trans_002',
      name: 'Véhicule privé Michel',
      phone: '+261342345678',
      type: 'Véhicule 4x4',
      capacity: 4,
      areas: ['Zone rurale 1', 'Zone montagneuse']
    }
  ]
};

// Messages prédéfinis
export const emergencyMessages = {
  sms: {
    alert: (patientName, position, emergencyType) => {
      return `URGENCE -- Patient: ${patientName} -- Position: ${position.latitude},${position.longitude} -- Type: ${emergencyType} -- Besoin ambulance immédiate`;
    },
    followUp: (patientName, eta) => {
      return `Patient: ${patientName} - Ambulance en route, ETA: ${eta} minutes`;
    }
  },
  
  voiceResponses: {
    stress: "Prenez une profonde respiration. Inspirez par le nez, expirez par la bouche. Répétez 5 fois.",
    anxiety: "Vous n'êtes pas seul. Les secours arrivent. Restez calme et suivez nos instructions.",
    emergency: "Restez en ligne. Les secours sont en route. Ne quittez pas le patient."
  }
};

// Conseils d'urgence
export const emergencyTips = [
  {
    title: "Arrêt cardiaque",
    steps: [
      "Appelez immédiatement les secours",
      "Commencez le massage cardiaque",
      "Utilisez un défibrillateur si disponible"
    ]
  },
  {
    title: "Hémorragie",
    steps: [
      "Comprimez la plaie avec un tissu propre",
      "Surélevez le membre si possible",
      "N'enlevez pas d'objet enfoncé"
    ]
  },
  {
    title: "Perte de connaissance",
    steps: [
      "Placez la personne en PLS",
      "Vérifiez la respiration",
      "Ne donnez rien à boire ou manger"
    ]
  }
];