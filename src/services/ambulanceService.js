import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

class AmbulanceService {
  /**
   * Récupère les ambulances disponibles dans un rayon donné
   * @param {number} latitude 
   * @param {number} longitude 
   * @param {number} radius Rayon en km
   */
  async getNearbyAmbulances(latitude, longitude, radius = 10) {
    try {
      // Simulation d'appel API vers un backend
      const mockAmbulances = [
        {
          id: 'amb_001',
          name: 'Ambulance SOS 1',
          driver: 'Jean Rakoto',
          phone: '+261321234567',
          latitude: latitude + 0.01,
          longitude: longitude + 0.008,
          distance: this.calculateDistance(latitude, longitude, latitude + 0.01, longitude + 0.008),
          eta: Math.floor(Math.random() * 10) + 2,
          status: 'available',
          type: 'Médicalisée',
          equipment: 'Défibrillateur, Oxygène, Brancard'
        },
        {
          id: 'amb_002',
          name: 'Ambulance Urgence +',
          driver: 'Marie Rasoa',
          phone: '+261322345678',
          latitude: latitude - 0.008,
          longitude: longitude + 0.012,
          distance: this.calculateDistance(latitude, longitude, latitude - 0.008, longitude + 0.012),
          eta: Math.floor(Math.random() * 10) + 3,
          status: 'available',
          type: 'Standard',
          equipment: 'Trousse secours, Brancard'
        },
        {
          id: 'amb_003',
          name: 'Samu Mobile',
          driver: 'Claudine Rajaonary',
          phone: '+261324567890',
          latitude: latitude + 0.005,
          longitude: longitude - 0.003,
          distance: this.calculateDistance(latitude, longitude, latitude + 0.005, longitude - 0.003),
          eta: Math.floor(Math.random() * 10) + 1,
          status: 'available',
          type: 'Urgences',
          equipment: 'Réanimation complète'
        }
      ];
      
      return mockAmbulances.filter(a => a.distance <= radius);
    } catch (error) {
      console.error('[AmbulanceService] Error loading ambulances:', error);
      return [];
    }
  }

  /**
   * Calcul de distance via la formule de Haversine
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  /**
   * Enregistre et simule l'envoi d'une alerte d'urgence
   */
  async sendAmbulanceAlert(ambulanceId, patientInfo, location) {
    try {
      const alertData = {
        ambulanceId,
        patientName: patientInfo.name,
        emergencyType: patientInfo.type,
        description: patientInfo.description,
        location: location,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      // Persistance locale pour historique ou reprise sur erreur
      await AsyncStorage.setItem(`alert_${Date.now()}`, JSON.stringify(alertData));
      
      // Log technique (remplace l'emoji par un tag clair)
      console.log('[API_SIMULATION] Push Alert:', alertData);
      
      return { success: true, message: 'Notification transmise à l\'unité mobile' };
    } catch (error) {
      console.error('[AmbulanceService] Error sending alert:', error);
      return { success: false, message: 'Échec de la transmission réseau' };
    }
  }

  /**
   * Estimation du temps de trajet basé sur une vitesse moyenne urbaine
   * @param {number} distance en km
   */
  getETA(distance) {
    const averageSpeedKmH = 40; 
    const timeInHours = distance / averageSpeedKmH;
    return Math.round(timeInHours * 60);
  }

  /**
   * Vérifie la disponibilité d'une unité spécifique
   */
  async checkAvailability(ambulanceId) {
    // Simulation d'une vérification de statut en temps réel
    return Math.random() > 0.3; 
  }
}

export default new AmbulanceService();