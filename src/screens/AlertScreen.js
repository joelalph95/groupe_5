import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Switch
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import smsService from '../services/smsService'; // Utilisation de ton service SMS centralisé

const AlertScreen = ({ route, navigation }) => {
  const [patientName, setPatientName] = useState('');
  const [emergencyType, setEmergencyType] = useState('');
  const [description, setDescription] = useState('');
  const [useAutoSMS, setUseAutoSMS] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const emergencyTypes = [
    { id: 'accident', label: 'Accident', icon: 'car-crash' },
    { id: 'heart', label: 'Crise cardiaque', icon: 'heart-pulse' },
    { id: 'avc', label: 'AVC', icon: 'brain' },
    { id: 'respiratory', label: 'Détresse respiratoire', icon: 'lungs' },
    { id: 'trauma', label: 'Traumatisme', icon: 'bone' },
    { id: 'obstetric', label: 'Urgence obstétrique', icon: 'baby-carriage' },
    { id: 'bleeding', label: 'Hémorragie', icon: 'blood-bag' },
    { id: 'unconscious', label: 'Perte de connaissance', icon: 'account-off' }
  ];

  const handleSendAlert = async () => {
    if (!patientName.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner le nom du patient.');
      return;
    }

    setIsSending(true);
    const location = route.params?.location || { latitude: 0, longitude: 0 };
    
    const patientInfo = {
      name: patientName,
      description: description,
      phone: 'Appel direct' // Optionnel: récupérer depuis le profil utilisateur
    };

    try {
      // Utilisation du service SMS centralisé
      const result = await smsService.sendEmergencySMS(
        patientInfo, 
        location, 
        emergencyType
      );

      if (result.success) {
        Alert.alert(
          'Alerte Transmise',
          'Les secours ont été notifiés. Une ambulance est en route.',
          [{ text: 'Compris', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'alerte. Utilisez le mode BIP.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.warningBanner}>
        <MaterialCommunityIcons name="alert-decagram" size={32} color="#fff" />
        <Text style={styles.warningText}>PROTOCOLE D'URGENCE</Text>
        <Text style={styles.warningSubtext}>Demande d'intervention immédiate</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nom du patient</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Jean Rakoto"
            value={patientName}
            onChangeText={setPatientName}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nature de l'urgence</Text>
          <View style={styles.emergencyGrid}>
            {emergencyTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.emergencyButton,
                  emergencyType === type.label && styles.selectedEmergency
                ]}
                onPress={() => setEmergencyType(type.label)}
              >
                <MaterialCommunityIcons 
                  name={type.icon} 
                  size={20} 
                  color={emergencyType === type.label ? '#fff' : '#444'} 
                />
                <Text style={[
                  styles.emergencyButtonText,
                  emergencyType === type.label && styles.selectedText
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observations complémentaires</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Précisez les symptômes ou l'état du patient..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.switchGroup}>
          <View>
            <Text style={styles.switchLabel}>Canal SMS redondant</Text>
            <Text style={styles.switchSublabel}>Envoi automatique aux numéros prioritaires</Text>
          </View>
          <Switch 
            value={useAutoSMS} 
            onValueChange={setUseAutoSMS}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={useAutoSMS ? "#2196F3" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton, 
            (!patientName || !emergencyType || isSending) && styles.disabledButton
          ]}
          onPress={handleSendAlert}
          disabled={!patientName || !emergencyType || isSending}
        >
          {isSending ? (
            <Text style={styles.sendButtonText}>TRANSMISSION EN COURS...</Text>
          ) : (
            <>
              <MaterialCommunityIcons name="broadcast" size={24} color="#fff" style={{marginRight: 10}} />
              <Text style={styles.sendButtonText}>ACTIVER L'ALERTE</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <View style={styles.infoTitleRow}>
            <Ionicons name="information-circle" size={20} color="#1976d2" />
            <Text style={styles.infoTitle}>Consignes de sécurité</Text>
          </View>
          <Text style={styles.infoText}>• Gardez votre calme pour rassurer le patient.</Text>
          <Text style={styles.infoText}>• Ne déplacez pas le blessé sauf danger immédiat.</Text>
          <Text style={styles.infoText}>• Dégagez l'accès pour l'arrivée de l'ambulance.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  warningBanner: {
    backgroundColor: '#d32f2f',
    padding: 25,
    alignItems: 'center',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15
  },
  warningText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: 1
  },
  warningSubtext: {
    color: '#fff',
    fontSize: 13,
    marginTop: 4,
    opacity: 0.9
  },
  form: {
    padding: 20
  },
  inputGroup: {
    marginBottom: 25
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 10
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#dcdde1',
    color: '#2f3640'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5
  },
  emergencyButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 5,
    borderWidth: 1,
    borderColor: '#dcdde1',
    width: '47%' // Permet un affichage propre en colonnes
  },
  selectedEmergency: {
    backgroundColor: '#2196F3',
    borderColor: '#1976d2'
  },
  emergencyButtonText: {
    fontSize: 12,
    color: '#444',
    marginLeft: 8,
    fontWeight: '500'
  },
  selectedText: {
    color: '#fff'
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#ebf5ff',
    borderRadius: 10
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1976d2'
  },
  switchSublabel: {
    fontSize: 11,
    color: '#54a0ff'
  },
  sendButton: {
    backgroundColor: '#d32f2f',
    padding: 18,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  disabledButton: {
    backgroundColor: '#bdc3c7',
    elevation: 0
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d8e0'
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginLeft: 8
  },
  infoText: {
    fontSize: 13,
    color: '#4b6584',
    marginBottom: 6,
    lineHeight: 18
  }
});

export default AlertScreen;