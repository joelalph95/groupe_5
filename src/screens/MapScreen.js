import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';

const MapScreen = ({ route }) => {
  const { type = 'hospitals' } = route.params || {};
  const [region, setRegion] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [mapType, setMapType] = useState(type);

  useEffect(() => {
    loadHospitalsAndLocation();
  }, []);

  const loadHospitalsAndLocation = async () => {
    try {
      // Demander la permission GPS
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Activez la localisation pour voir les hôpitaux');
        setLoading(false);
        return;
      }

      // Obtenir la position actuelle
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      
      setRegion(userLoc);
      setUserLocation(userLoc);
      
      // Hôpitaux simulés
      const mockHospitals = [
        {
          id: '1',
          name: 'CHU Antananarivo',
          type: 'Hôpital public',
          latitude: userLoc.latitude + 0.01,
          longitude: userLoc.longitude + 0.01,
          phone: '+261202212345',
          distance: calculateDistance(userLoc.latitude, userLoc.longitude, userLoc.latitude + 0.01, userLoc.longitude + 0.01),
          eta: '3 min',
          emergency: true,
          address: 'BP 415, Antananarivo 101'
        },
        {
          id: '2',
          name: 'Clinique Saint Michel',
          type: 'Clinique privée',
          latitude: userLoc.latitude - 0.008,
          longitude: userLoc.longitude + 0.015,
          phone: '+261202223456',
          distance: calculateDistance(userLoc.latitude, userLoc.longitude, userLoc.latitude - 0.008, userLoc.longitude + 0.015),
          eta: '2 min',
          emergency: true,
          address: 'Lot II J 1 Bis, Antananarivo'
        },
        {
          id: '3',
          name: 'CSB Andoharanofotsy',
          type: 'Centre de santé',
          latitude: userLoc.latitude + 0.015,
          longitude: userLoc.longitude - 0.012,
          phone: '+261202234567',
          distance: calculateDistance(userLoc.latitude, userLoc.longitude, userLoc.latitude + 0.015, userLoc.longitude - 0.012),
          eta: '5 min',
          emergency: false,
          address: 'Andoharanofotsy, Antananarivo'
        },
        {
          id: '4',
          name: 'Hôpital Joseph Ravoahangy',
          type: 'Hôpital public',
          latitude: userLoc.latitude - 0.012,
          longitude: userLoc.longitude - 0.008,
          phone: '+261202245678',
          distance: calculateDistance(userLoc.latitude, userLoc.longitude, userLoc.latitude - 0.012, userLoc.longitude - 0.008),
          eta: '6 min',
          emergency: true,
          address: 'Andrianampoinimerina, Antananarivo'
        }
      ];

      // Ambulances simulées
      const mockAmbulances = [
        {
          id: 'amb_1',
          name: 'Ambulance SOS 1',
          type: 'Médicalisée',
          latitude: userLoc.latitude + 0.005,
          longitude: userLoc.longitude + 0.003,
          phone: '+261321234567',
          status: 'available',
          eta: '3 min'
        },
        {
          id: 'amb_2',
          name: 'Ambulance Urgence +',
          type: 'Standard',
          latitude: userLoc.latitude - 0.003,
          longitude: userLoc.longitude + 0.008,
          phone: '+261322345678',
          status: 'on_mission',
          eta: '8 min'
        },
        {
          id: 'amb_3',
          name: 'Samu Mobile',
          type: 'Urgences',
          latitude: userLoc.latitude + 0.008,
          longitude: userLoc.longitude - 0.005,
          phone: '+261324567890',
          status: 'available',
          eta: '5 min'
        }
      ];

      setHospitals(mockHospitals);
      setAmbulances(mockAmbulances);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger la carte');
      setLoading(false);
    }
  };

  // Calculer la distance entre deux points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return `${distance.toFixed(1)} km`;
  };

  const callHospital = (phone, name) => {
    Alert.alert(
      'Appel hospitalier',
      `Appeler ${name} au ${phone} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Appeler', 
          onPress: () => {
            Linking.openURL(`tel:${phone}`);
          }
        }
      ]
    );
  };

  const getDirections = (hospital) => {
    if (!userLocation) return;
    
    const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${hospital.latitude},${hospital.longitude}`;
    
    Alert.alert(
      'Itinéraire',
      `Direction ${hospital.name}\nDistance: ${hospital.distance}\nTemps estimé: ${hospital.eta}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Ouvrir Maps', 
          onPress: () => {
            Linking.openURL(url);
          }
        }
      ]
    );
  };

  const callAmbulance = (ambulance) => {
    Alert.alert(
      'Appel ambulance',
      `Contacter ${ambulance.name} ?\nStatut: ${ambulance.status === 'available' ? 'Disponible' : 'En intervention'}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Appeler', 
          onPress: () => {
            Linking.openURL(`tel:${ambulance.phone}`);
          }
        }
      ]
    );
  };

  const centerOnUser = () => {
    if (userLocation) {
      setRegion({
        ...userLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  if (loading || !region) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Chargement de la carte...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
      >
        {/* Marqueurs des hôpitaux */}
        {mapType === 'hospitals' && hospitals.map(hospital => (
          <Marker
            key={hospital.id}
            coordinate={{
              latitude: hospital.latitude,
              longitude: hospital.longitude
            }}
            pinColor={hospital.emergency ? 'red' : 'green'}
            title={hospital.name}
            description={`${hospital.distance} - ${hospital.eta}`}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.hospitalName}>{hospital.name}</Text>
                <Text style={styles.hospitalType}>{hospital.type}</Text>
                <Text style={styles.hospitalInfo}>📏 {hospital.distance}</Text>
                <Text style={styles.hospitalInfo}>⏱️ {hospital.eta}</Text>
                <Text style={styles.hospitalInfo}>📍 {hospital.address}</Text>
                <TouchableOpacity 
                  style={styles.callButton}
                  onPress={() => callHospital(hospital.phone, hospital.name)}
                >
                  <Text style={styles.callButtonText}>📞 Appeler</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.directionsButton}
                  onPress={() => getDirections(hospital)}
                >
                  <Text style={styles.directionsButtonText}>📍 Itinéraire</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Marqueurs des ambulances */}
        {mapType === 'ambulances' && ambulances.map(ambulance => (
          <Marker
            key={ambulance.id}
            coordinate={{
              latitude: ambulance.latitude,
              longitude: ambulance.longitude
            }}
            pinColor={ambulance.status === 'available' ? '#4CAF50' : '#FF9800'}
            title={ambulance.name}
            description={`${ambulance.type} - ${ambulance.status === 'available' ? 'Disponible' : 'En intervention'}`}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.ambulanceName}>🚑 {ambulance.name}</Text>
                <Text style={styles.hospitalType}>{ambulance.type}</Text>
                <Text style={styles.hospitalInfo}>
                  Statut: {ambulance.status === 'available' ? '✅ Disponible' : '⚠️ En intervention'}
                </Text>
                <Text style={styles.hospitalInfo}>⏱️ ETA: {ambulance.eta}</Text>
                <TouchableOpacity 
                  style={styles.callButton}
                  onPress={() => callAmbulance(ambulance)}
                >
                  <Text style={styles.callButtonText}>📞 Appeler</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Bouton centrage position */}
      <TouchableOpacity style={styles.centerButton} onPress={centerOnUser}>
        <Text style={styles.centerButtonText}>📍</Text>
      </TouchableOpacity>

      {/* Sélecteur de type de carte */}
      <View style={styles.typeSelector}>
        <TouchableOpacity 
          style={[styles.typeButton, mapType === 'hospitals' && styles.typeButtonActive]}
          onPress={() => setMapType('hospitals')}
        >
          <Text style={[styles.typeButtonText, mapType === 'hospitals' && styles.typeButtonTextActive]}>
            🏥 Hôpitaux
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeButton, mapType === 'ambulances' && styles.typeButtonActive]}
          onPress={() => setMapType('ambulances')}
        >
          <Text style={[styles.typeButtonText, mapType === 'ambulances' && styles.typeButtonTextActive]}>
            🚑 Ambulances
          </Text>
        </TouchableOpacity>
      </View>

      {/* Légende */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Légende</Text>
        {mapType === 'hospitals' ? (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'red' }]} />
              <Text style={styles.legendText}>Urgences 24/7</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: 'green' }]} />
              <Text style={styles.legendText}>Centre de santé</Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Ambulance disponible</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>Ambulance en intervention</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  map: {
    flex: 1
  },
  callout: {
    width: 220,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333'
  },
  ambulanceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2196F3'
  },
  hospitalType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5
  },
  hospitalInfo: {
    fontSize: 12,
    color: '#333',
    marginBottom: 3
  },
  callButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
    marginTop: 8,
    alignItems: 'center'
  },
  callButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  directionsButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 5,
    marginTop: 5,
    alignItems: 'center'
  },
  directionsButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8
  },
  legendText: {
    fontSize: 11,
    color: '#333'
  },
  centerButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  centerButtonText: {
    fontSize: 24
  },
  typeSelector: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5'
  },
  typeButtonActive: {
    backgroundColor: '#2196F3'
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  typeButtonTextActive: {
    color: '#fff'
  }
});

export default MapScreen;