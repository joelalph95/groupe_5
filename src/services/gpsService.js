import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

class GPSService {
  constructor() {
    this.watchId = null;
    this.currentPosition = null;
    this.STORAGE_KEY = 'last_known_user_position';
  }

  /**
   * Demande les permissions d'accès à la localisation
   */
  async requestPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission de localisation refusée');
    }
    return true;
  }

  /**
   * Récupère la position unique actuelle
   */
  async getCurrentPosition() {
    try {
      await this.requestPermission();
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      this.currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp
      };
      
      // Persistance de la position pour usage ultérieur (mode hors-ligne)
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentPosition));
      
      return this.currentPosition;
    } catch (error) {
      console.error('[GPSService] Error fetching current position:', error);
      
      // Stratégie de secours : récupération des dernières coordonnées valides
      const lastPosition = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (lastPosition) {
        return JSON.parse(lastPosition);
      }
      throw error;
    }
  }

  /**
   * Initialise le suivi GPS en temps réel
   * @param {Function} onLocationUpdate Callback de mise à jour
   */
  async startTracking(onLocationUpdate) {
    try {
      await this.requestPermission();
      
      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Mise à jour toutes les 5 secondes
          distanceInterval: 10 // Seuil de déclenchement : 10 mètres
        },
        (location) => {
          const newPos = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp
          };
          
          this.currentPosition = newPos;
          
          if (onLocationUpdate) {
            onLocationUpdate(newPos);
          }
          
          AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(newPos));
        }
      );
      
      return true;
    } catch (error) {
      console.error('[GPSService] Error starting real-time tracking:', error);
      return false;
    }
  }

  /**
   * Interrompt le suivi actif pour économiser la batterie
   */
  stopTracking() {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
      console.log('[GPSService] Tracking stopped');
    }
  }

  /**
   * Calcule la distance orthodromique entre deux points (Haversine)
   * @returns {number} Distance en mètres
   */
  calculateDistance(point1, point2) {
    const R = 6371e3; // Rayon moyen de la Terre en mètres
    const p1 = this.toRadians(point1.latitude);
    const p2 = this.toRadians(point2.latitude);
    const dP = this.toRadians(point2.latitude - point1.latitude);
    const dL = this.toRadians(point2.longitude - point1.longitude);

    const a = Math.sin(dP/2) * Math.sin(dP/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dL/2) * Math.sin(dL/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Formate les coordonnées pour l'affichage UI
   */
  formatPosition(position) {
    if (!position) return "Localisation indisponible";
    return `${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)}`;
  }

  /**
   * Génère un lien externe vers Google Maps
   */
  getGoogleMapsLink(position) {
    if (!position) return null;
    return `https://www.google.com/maps?q=${position.latitude},${position.longitude}`;
  }
}

export default new GPSService();