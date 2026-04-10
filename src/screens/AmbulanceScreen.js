import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Import des icônes

const AmbulanceScreen = ({ route }) => {
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(route.params?.location);

  useEffect(() => {
    loadAmbulances();
  }, []);

  const loadAmbulances = async () => {
    if (!userLocation) {
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
    }

    // Simulation d'ambulances disponibles
    setTimeout(() => {
      const mockAmbulances = [
        {
          id: '1',
          name: 'Ambulance SOS 1',
          driver: 'Jean Rakoto',
          phone: '+261321234567',
          distance: 1.2,
          eta: 3,
          status: 'available',
          type: 'Médicalisée',
          equipment: 'Défibrillateur, Oxygène'
        },
        {
          id: '2',
          name: 'Ambulance Urgence +',
          driver: 'Marie Rasoa',
          phone: '+261322345678',
          distance: 2.5,
          eta: 5,
          status: 'available',
          type: 'Standard',
          equipment: 'Trousse secours, Brancard'
        },
        {
          id: '3',
          name: 'Ambulance VSAV',
          driver: 'Paul Randria',
          phone: '+261323456789',
          distance: 3.8,
          eta: 8,
          status: 'on_mission',
          type: 'Médicalisée',
          equipment: 'Complet'
        },
        {
          id: '4',
          name: 'Samu Mobile',
          driver: 'Claudine Rajaonary',
          phone: '+261324567890',
          distance: 0.8,
          eta: 2,
          status: 'available',
          type: 'Urgences',
          equipment: 'Réanimation'
        }
      ];
      setAmbulances(mockAmbulances);
      setLoading(false);
    }, 1500);
  };

  const callAmbulance = (ambulance) => {
    Alert.alert(
      'Appel ambulance',
      `Contacter ${ambulance.name} ?\nChauffeur: ${ambulance.driver}\nETA: ${ambulance.eta} min`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Appeler', 
          onPress: () => {
            Alert.alert('Appel en cours', `Connexion avec ${ambulance.phone}`);
            sendSOSAlert(ambulance);
          }
        }
      ]
    );
  };

  const sendSOSAlert = (ambulance) => {
    Alert.alert(
      'Alerte envoyée',
      `Position GPS envoyée à ${ambulance.name}\nL'ambulance arrive dans ${ambulance.eta} minutes`
    );
  };

  const renderAmbulanceCard = ({ item }) => (
    <View style={[styles.card, item.status === 'on_mission' && styles.disabledCard]}>
      <View style={styles.cardHeader}>
        <Text style={styles.ambulanceName}>{item.name}</Text>
        <View style={[styles.statusBadge, item.status === 'available' ? styles.available : styles.busy]}>
          <Text style={styles.statusText}>
            {item.status === 'available' ? 'Disponible' : 'En intervention'}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="van-utility" size={18} color="#666" style={styles.rowIcon} />
        <Text style={styles.label}>Type:</Text>
        <Text style={styles.value}>{item.type}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="person-outline" size={18} color="#666" style={styles.rowIcon} />
        <Text style={styles.label}>Chauffeur:</Text>
        <Text style={styles.value}>{item.driver}</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={18} color="#666" style={styles.rowIcon} />
        <Text style={styles.label}>Distance:</Text>
        <Text style={styles.value}>{item.distance} km</Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={18} color="#666" style={styles.rowIcon} />
        <Text style={styles.label}>ETA:</Text>
        <Text style={styles.value}>{item.eta} minutes</Text>
      </View>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="medical-bag" size={18} color="#666" style={styles.rowIcon} />
        <Text style={styles.label}>Équipement:</Text>
        <Text style={styles.value}>{item.equipment}</Text>
      </View>

      {item.status === 'available' && (
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => callAmbulance(item)}
        >
          <MaterialCommunityIcons name="phone-plus" size={20} color="#fff" style={{marginRight: 8}} />
          <Text style={styles.callButtonText}>Appeler cette ambulance</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.trackButton}
        onPress={() => Alert.alert('Suivi', `Suivi GPS de ${item.name} activé`)}
      >
        <Ionicons name="map-outline" size={18} color="#fff" style={{marginRight: 8}} />
        <Text style={styles.trackButtonText}>Suivre en temps réel</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Recherche des ambulances disponibles...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <MaterialCommunityIcons name="ambulance" size={28} color="#2196F3" style={{marginRight: 10}} />
          <Text style={styles.title}>Ambulances disponibles</Text>
        </View>
        <Text style={styles.subtitle}>
          {ambulances.filter(a => a.status === 'available').length} ambulances à proximité
        </Text>
      </View>

      <FlatList
        data={ambulances}
        renderItem={renderAmbulanceCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333'
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  list: {
    padding: 15
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  disabledCard: {
    opacity: 0.7
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10
  },
  ambulanceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  available: {
    backgroundColor: '#4CAF50'
  },
  busy: {
    backgroundColor: '#FF9800'
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  rowIcon: {
    width: 25,
    marginRight: 5
  },
  label: {
    width: 90,
    fontSize: 14,
    color: '#666'
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  callButton: {
    backgroundColor: '#E53935',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  trackButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666'
  }
});

export default AmbulanceScreen;