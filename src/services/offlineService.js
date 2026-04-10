import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const OfflineScreen = ({ navigation }) => {
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  useEffect(() => {
    loadOfflineContacts();
  }, []);

  const loadOfflineContacts = () => {
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
      }
    ];
    setEmergencyContacts(contacts);
  };

  const makeBipCall = (contact) => {
    Alert.alert(
      'Mode BIP',
      `Effectuer un appel court vers ${contact.name} ? Le centre vous rappellera immédiatement.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Lancer le BIP', 
          onPress: () => {
            Linking.openURL(`tel:${contact.phone}`);
            // Note: Le message de confirmation s'affiche après le retour à l'app
          }
        }
      ]
    );
  };

  const renderContactCard = ({ item }) => (
    <View style={styles.contactCard}>
      <View style={styles.contactHeader}>
        <Text style={styles.contactName}>{item.name}</Text>
        <View style={[styles.priorityBadge, item.priority === 'high' ? styles.highPriority : styles.mediumPriority]}>
          <Text style={styles.priorityText}>
            {item.priority === 'high' ? 'URGENT' : 'STABLE'}
          </Text>
        </View>
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={14} color="#666" />
          <Text style={styles.contactType}>{item.type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.contactDistance}>{item.distance}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={14} color="#2196F3" />
          <Text style={styles.contactPhone}>{item.phone}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.bipButton}
        onPress={() => makeBipCall(item)}
      >
        <MaterialCommunityIcons name="cellphone-sound" size={20} color="#fff" />
        <Text style={styles.buttonText}>BIP + RAPPEL AUTOMATIQUE</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="cloud-offline" size={40} color="#fff" />
          <Text style={styles.title}>Mode Hors-Ligne</Text>
          <Text style={styles.subtitle}>
            Internet indisponible. Utilisez le système BIP pour être rappelé par les secours.
          </Text>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoTitleContainer}>
            <Ionicons name="help-circle" size={20} color="#e65100" />
            <Text style={styles.infoTitle}>Comment ça marche ?</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>1.</Text>
            <Text style={styles.infoText}>Choisissez un centre médical.</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>2.</Text>
            <Text style={styles.infoText}>Lancez le BIP (appel de 2 sec).</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>3.</Text>
            <Text style={styles.infoText}>Raccrochez dès que ça sonne.</Text>
          </View>
          <View style={styles.stepRow}>
            <Text style={styles.stepNumber}>4.</Text>
            <Text style={styles.infoText}>Le centre vous rappellera sur ce numéro.</Text>
          </View>
        </View>

        <FlatList
          data={emergencyContacts}
          renderItem={renderContactCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          scrollEnabled={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    backgroundColor: '#ff9800',
    padding: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.9,
    paddingHorizontal: 20
  },
  infoBox: {
    backgroundColor: '#fff3e0',
    margin: 15,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#ff9800',
    elevation: 2
  },
  infoTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e65100',
    marginLeft: 8
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  stepNumber: {
    fontWeight: 'bold',
    color: '#e65100',
    width: 20
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    flex: 1
  },
  list: {
    padding: 15
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  contactName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    flex: 1,
    marginRight: 10
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  highPriority: {
    backgroundColor: '#fee2e2'
  },
  mediumPriority: {
    backgroundColor: '#dcfce7'
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#333'
  },
  detailsContainer: {
    marginBottom: 15
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  contactType: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8
  },
  contactDistance: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8
  },
  contactPhone: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 8
  },
  bipButton: {
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10
  }
});

export default OfflineScreen;