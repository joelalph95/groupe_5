import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OfflineScreen = ({ navigation }) => {
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  useEffect(() => {
    loadOfflineContacts();
  }, []);

  const loadOfflineContacts = () => {
    // Contacts préchargés pour mode offline
    const contacts = [
      {
        id: '1',
        name: 'CHU Antananarivo',
        type: 'Hôpital de référence',
        phone: '+261202212345',
        distance: '5 km',
        priority: 'high'
      },
      {
        id: '2',
        name: 'Centre Médical Andoharanofotsy',
        type: 'Centre de santé',
        phone: '+261202234567',
        distance: '3 km',
        priority: 'medium'
      },
      {
        id: '3',
        name: 'Samu Central',
        type: 'Service ambulance',
        phone: '+261202256789',
        distance: '8 km',
        priority: 'high'
      },
      {
        id: '4',
        name: 'Pharmacie de Garde',
        type: 'Pharmacie 24/7',
        phone: '+261202267890',
        distance: '2 km',
        priority: 'medium'
      }
    ];
    setEmergencyContacts(contacts);
  };

  const makeBipCall = (contact) => {
    Alert.alert(
      'Mode BIP',
      `Effectuer un appel court vers ${contact.name} ?\nLe centre vous rappellera automatiquement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'BIP', 
          onPress: () => {
            Linking.openURL(`tel:${contact.phone}`);
            setTimeout(() => {
              Alert.alert(
                'Appel BIP envoyé',
                'Le centre médical va vous rappeler dans quelques instants.\nRestez à proximité du téléphone.'
              );
            }, 1000);
          }
        }
      ]
    );
  };

  const saveEmergencyRequest = async (contact) => {
    try {
      const request = {
        id: Date.now(),
        contact: contact.name,
        phone: contact.phone,
        timestamp: new Date().toISOString(),
        status: 'pending'
      };
      
      const existingRequests = await AsyncStorage.getItem('emergency_requests');
      const requests = existingRequests ? JSON.parse(existingRequests) : [];
      requests.push(request);
      await AsyncStorage.setItem('emergency_requests', JSON.stringify(requests));
      
      Alert.alert('Demande enregistrée', 'Votre demande sera envoyée dès que la connexion sera rétablie.');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  const renderContactCard = ({ item }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <Text style={styles.contactName}>{item.name}</Text>
        <View style={[styles.priorityBadge, 
          item.priority === 'high' ? styles.highPriority : styles.mediumPriority]}>
          <Text style={styles.priorityText}>
            {item.priority === 'high' ? 'URGENCE' : 'STANDARD'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.contactType}>{item.type}</Text>
      <Text style={styles.contactDistance}>📍 {item.distance}</Text>
      <Text style={styles.contactPhone}>📞 {item.phone}</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.bipButton]}
          onPress={() => makeBipCall(item)}
        >
          <Text style={styles.buttonText}>📱 BIP + Rappel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={() => saveEmergencyRequest(item)}
        >
          <Text style={styles.buttonText}>💾 Enregistrer demande</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📡 Mode Hors-Ligne</Text>
        <Text style={styles.subtitle}>
          Connexion internet indisponible\nUtilisez le mode BIP pour les urgences
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Comment ça marche ?</Text>
        <Text style={styles.infoText}>
          1. Sélectionnez un centre médical\n
          2. Appuyez sur "BIP + Rappel"\n
          3. Laissez sonner 1-2 secondes\n
          4. Raccrochez\n
          5. Le centre vous rappellera automatiquement
        </Text>
      </View>

      <FlatList
        data={emergencyContacts}
        renderItem={renderContactCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ⚠️ En cas d'urgence vitale, composez le 117 (Police) ou le 118 (Pompier)
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#ff9800',
    padding: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff'
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 10
  },
  infoBox: {
    backgroundColor: '#fff3e0',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800'
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginBottom: 10
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22
  },
  list: {
    padding: 15
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  highPriority: {
    backgroundColor: '#ff4444'
  },
  mediumPriority: {
    backgroundColor: '#4CAF50'
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  contactType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5
  },
  contactDistance: {
    fontSize: 12,
    color: '#888',
    marginBottom: 3
  },
  contactPhone: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 12
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  bipButton: {
    backgroundColor: '#ff9800'
  },
  saveButton: {
    backgroundColor: '#4CAF50'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  footer: {
    padding: 15,
    backgroundColor: '#ffebee',
    marginTop: 10
  },
  footerText: {
    textAlign: 'center',
    color: '#c62828',
    fontSize: 12
  }
});

export default OfflineScreen;