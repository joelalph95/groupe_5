// Service de notifications push (à configurer avec Firebase)
class NotificationService {
  async sendPushNotification(token, title, body, data = {}) {
    // TODO: Implémenter avec Firebase Cloud Messaging
    console.log(`📱 Notification envoyée: ${title} - ${body}`);
    return true;
  }
  
  async notifyEmergencyToAmbulances(urgenceData) {
    // TODO: Envoyer des notifications aux ambulanciers disponibles
    console.log('🚑 Notification envoyée aux ambulanciers disponibles');
    return true;
  }
}

module.exports = new NotificationService();