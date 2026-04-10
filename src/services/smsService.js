import * as SMS from 'expo-sms';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineService from './offlineService';

class SMSService {
  constructor() {
    this.emergencyNumbers = [
      { name: 'SAMU', number: '124', priority: 1 },
      { name: 'Ambulance SOS', number: '+261321234567', priority: 2 },
      { name: 'Hôpital CHU', number: '+261202212345', priority: 3 },
      { name: 'Centre médical', number: '+261202234567', priority: 4 }
    ];
    this.sentSMSLog = [];
    this.LOGS_STORAGE_KEY = 'miania_sms_transmission_logs';
  }

  /**
   * Vérifie la capacité de l'appareil à envoyer des SMS
   */
  async isSMSAvailable() {
    try {
      return await SMS.isAvailableAsync();
    } catch (error) {
      console.error('[SMSService] SMS Availability Check Error:', error);
      return false;
    }
  }

  /**
   * Envoi d'un SMS d'urgence général aux unités prioritaires
   */
  async sendEmergencySMS(patientInfo, location, emergencyType) {
    try {
      const isAvailable = await this.isSMSAvailable();
      
      if (!isAvailable) {
        return await this.saveSMSToOffline(patientInfo, location, emergencyType);
      }

      const message = this.formatEmergencyMessage(patientInfo, location, emergencyType);
      const recipients = this.getEmergencyRecipients();
      
      const { result } = await SMS.sendSMSAsync(recipients, message);
      
      await this.logSentSMS({
        recipients,
        message,
        timestamp: new Date().toISOString(),
        type: 'GENERAL_EMERGENCY',
        status: result
      });
      
      return { success: true, message: 'Protocole SMS d\'urgence initié' };
    } catch (error) {
      console.error('[SMSService] Emergency SMS Transmission Failed:', error);
      return await this.saveSMSToOffline(patientInfo, location, emergencyType);
    }
  }

  /**
   * Formate le message pour les secours (Format compact pour SMS)
   */
  formatEmergencyMessage(patientInfo, location, emergencyType) {
    const mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    
    return `[URGENCE MIANIA]
Patient: ${patientInfo.name}
Type: ${emergencyType}
Note: ${patientInfo.description || 'N/A'}

Position: ${mapsLink}
Coords: ${location.latitude}, ${location.longitude}

Contact: ${patientInfo.phone || 'Non renseigné'}`;
  }

  /**
   * Envoi un "BIP" (Déclenchement d'un appel système)
   */
  async sendBIP(phoneNumber) {
    try {
      const url = Platform.OS === 'android' ? `tel:${phoneNumber}` : `telprompt:${phoneNumber}`;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
        // On enregistre la tentative en offline pour le suivi
        await offlineService.saveBipRequest(`bip_${Date.now()}`, 'Emergency Contact', phoneNumber);
        return { success: true, message: 'Appel initialisé' };
      } else {
        return { success: false, message: 'Numérotation non supportée' };
      }
    } catch (error) {
      console.error('[SMSService] BIP/Call Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupère les 3 premiers numéros par ordre de priorité
   */
  getEmergencyRecipients() {
    return this.emergencyNumbers
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 3)
      .map(contact => contact.number);
  }

  /**
   * Archive localement les logs de transmission
   */
  async logSentSMS(logEntry) {
    try {
      const existingLogsStr = await AsyncStorage.getItem(this.LOGS_STORAGE_KEY);
      let logs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
      
      logs.unshift(logEntry); // Ajoute au début
      const limitedLogs = logs.slice(0, 50); // Garde les 50 derniers
      
      await AsyncStorage.setItem(this.LOGS_STORAGE_KEY, JSON.stringify(limitedLogs));
    } catch (error) {
      console.error('[SMSService] Logging Error:', error);
    }
  }

  /**
   * Gestion du mode offline (Délégation au service dédié)
   */
  async saveSMSToOffline(patientInfo, location, emergencyType) {
    const smsData = {
      type: 'EMERGENCY_SMS_QUEUED',
      patientInfo,
      location,
      emergencyType,
      timestamp: new Date().toISOString()
    };
    
    await offlineService.saveEmergencyRequest(smsData);
    
    return { 
      success: true, 
      offline: true, 
      message: 'Transmission différée (Mode hors-ligne actif)' 
    };
  }
}

export default new SMSService();