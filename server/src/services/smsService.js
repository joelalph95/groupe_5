// Service d'envoi de SMS (à configurer avec Twilio)
const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = null;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    }
  }
  
  async sendEmergencyAlert(to, latitude, longitude, patientInfo = {}) {
    if (!this.client) {
      console.warn('⚠️ Twilio non configuré - SMS non envoyé');
      return false;
    }
    
    try {
      const message = `🚨 MIAINA - ALERTE URGENCE\nPatient: ${patientInfo.nom || 'Inconnu'}\nPosition: https://maps.google.com/?q=${latitude},${longitude}\nContact: ${to}`;
      
      // Envoyer aux centres médicaux préenregistrés
      const emergencyContacts = [
        '+261341234567', // À remplacer par les vrais numéros
        '+261342345678'
      ];
      
      for (const contact of emergencyContacts) {
        await this.client.messages.create({
          body: message,
          from: this.phoneNumber,
          to: contact
        });
      }
      
      console.log(`✅ SMS d'urgence envoyé pour ${to}`);
      return true;
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
      return false;
    }
  }
  
  async sendOrderConfirmation(to, orderDetails) {
    if (!this.client) {
      console.warn('⚠️ Twilio non configuré - SMS non envoyé');
      return false;
    }
    
    try {
      const message = `✅ MIAINA - Commande confirmée\nN°${orderDetails.id}\nMontant: ${orderDetails.total} Ar\nMerci de votre confiance !`;
      
      await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: to
      });
      
      console.log(`✅ SMS de confirmation envoyé à ${to}`);
      return true;
    } catch (error) {
      console.error('Erreur envoi SMS confirmation:', error);
      return false;
    }
  }
}

module.exports = new SMSService();