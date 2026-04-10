import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Dimensions,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from "react-native-chart-kit";
import * as Location from 'expo-location';
import ambulanceService from '../services/ambulanceService';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // <-- Ajout des icônes

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundColor: "#fff",
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
  propsForDots: { r: "4", strokeWidth: "2", stroke: "#2196F3" },
  style: { borderRadius: 16 }
};

const HomeScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [ambulanceStatus, setAmbulanceStatus] = useState({
    available: 0,
    onMission: 0,
    nearest: null,
    eta: null
  });
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackedAmbulance, setTrackedAmbulance] = useState(null);
  const watchId = useRef(null);

  const chartData = {
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
    datasets: [{
      data: [5, 4.5, 6, 3.5, 4, 3],
      color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
      strokeWidth: 3
    }]
  };

  useEffect(() => {
    getLocation();
    loadAmbulanceStatus();
    startLocationTracking();
    
    const interval = setInterval(() => {
      if (location) {
        loadAmbulanceStatus();
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      stopLocationTracking();
    };
  }, []);

  useEffect(() => {
    if (location) {
      loadAmbulanceStatus();
    }
  }, [location]);

  const getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Activez la localisation');
      return;
    }
    let location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });
    setLocation(location);
    await ambulanceService.saveUserLocation(location.coords);
  };

  const startLocationTracking = async () => {
    let { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') return;

    watchId.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 50,
      },
      async (newLocation) => {
        setLocation(newLocation);
        await ambulanceService.updateUserLocation(newLocation.coords);
      }
    );
  };

  const stopLocationTracking = () => {
    if (watchId.current) {
      watchId.current.remove();
    }
  };

  const loadAmbulanceStatus = async () => {
    if (!location) return;

    try {
      const ambulances = await ambulanceService.getNearbyAmbulances(
        location.coords.latitude,
        location.coords.longitude,
        10
      );

      const available = ambulances.filter(a => a.status === 'available').length;
      const onMission = ambulances.filter(a => a.status === 'on_mission').length;
      
      const nearest = ambulances.length > 0 ? ambulances.reduce((prev, curr) => 
        prev.distance < curr.distance ? prev : curr
      ) : null;

      setAmbulanceStatus({
        available,
        onMission,
        nearest: nearest,
        eta: nearest ? nearest.eta : null
      });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getLocation();
    await loadAmbulanceStatus();
    setRefreshing(false);
  };

  const trackAmbulance = async () => {
    if (!ambulanceStatus.nearest) {
      Alert.alert('Info', 'Aucune ambulance disponible');
      return;
    }
    setTrackedAmbulance(ambulanceStatus.nearest);
    setShowTrackingModal(true);
  };

  const callEmergency = () => {
    if (!location) {
      Alert.alert('Erreur', 'Position non disponible');
      return;
    }
    navigation.navigate('Alert', { location });
  };

  const callSAMU = () => {
    Alert.alert(
      'Appel SAMU',
      'Composez le 124 pour contacter les urgences',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Appeler', onPress: () => Linking.openURL('tel:124') }
      ]
    );
  };

  const callAmbulanceDirect = () => {
    if (!ambulanceStatus.nearest) {
      Alert.alert('Info', 'Aucune ambulance disponible');
      callSAMU();
      return;
    }
    
    Alert.alert(
      'Appeler ambulance',
      `Contacter ${ambulanceStatus.nearest.name} ?\nETA: ${ambulanceStatus.nearest.eta} min`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Appeler', onPress: () => Linking.openURL(`tel:${ambulanceStatus.nearest.phone}`) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour Patient</Text>
            <View style={styles.locationBadge}>
              <Ionicons name="location" size={14} color="#999" style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>
                {location ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` : "Localisation..."}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconCircle}>
            <Ionicons name="notifications-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.emergencyMainButton} onPress={callEmergency}>
          <MaterialCommunityIcons name="alert-decagram" size={36} color="#fff" />
          <View style={styles.emergencyTextContainer}>
            <Text style={styles.emergencyTitle}>APPEL D'URGENCE</Text>
            <Text style={styles.emergencySub}>Assistance immédiate 24/7</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.quickCallRow}>
          <TouchableOpacity style={styles.quickCallButton} onPress={callSAMU}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.quickCallText}>SAMU 124</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.quickCallButton, styles.ambulanceCallButton]} onPress={callAmbulanceDirect}>
            <MaterialCommunityIcons name="ambulance" size={20} color="#fff" />
            <Text style={styles.quickCallText}>
              Ambulance {ambulanceStatus.eta ? `(${ambulanceStatus.eta}min)` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={20} color="#333" style={{ marginRight: 10 }} />
            <Text style={styles.sectionTitle}>Statut des services</Text>
          </View>
          
          <View style={styles.statusRow}>
            <TouchableOpacity style={[styles.statusBox, {borderColor: '#4CAF50'}]}>
              <Text style={[styles.statusVal, {color: '#4CAF50'}]}>{ambulanceStatus.available}</Text>
              <Text style={styles.statusLab}>Libres</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.statusBox, {borderColor: '#FF9800'}]}>
              <Text style={[styles.statusVal, {color: '#FF9800'}]}>{ambulanceStatus.onMission}</Text>
              <Text style={styles.statusLab}>En cours</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.statusBox, {backgroundColor: '#f0f7ff', borderColor: '#2196F3'}]}
              onPress={trackAmbulance}
            >
              <Ionicons name="timer-outline" size={20} color="#2196F3" style={{ marginBottom: 4 }} />
              <Text style={[styles.statusVal, {color: '#2196F3'}]}>{ambulanceStatus.eta || '--'}m</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="trending-up" size={18} color="#666" style={{ marginRight: 8 }} />
            <Text style={styles.chartTitle}>Évolution du temps de réponse (min)</Text>
          </View>
          <LineChart
            data={chartData}
            width={screenWidth - 40}
            height={180}
            chartConfig={chartConfig}
            bezier
            style={styles.chartStyle}
          />
        </View>

        <View style={styles.infoList}>
          <TouchableOpacity 
            style={styles.listItem}
            onPress={() => navigation.navigate('Hôpitaux', { type: 'hospitals' })}
          >
            <MaterialCommunityIcons name="hospital-building" size={24} color="#333" style={{ marginRight: 15 }} />
            <Text style={styles.listItemText}>Hôpitaux à proximité (-5km)</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.listItem}
            onPress={() => navigation.navigate('Ambulances')}
          >
            <MaterialCommunityIcons name="ambulance" size={24} color="#333" style={{ marginRight: 15 }} />
            <Text style={styles.listItemText}>Voir toutes les ambulances</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showTrackingModal} animationType="slide" transparent={true} onRequestClose={() => setShowTrackingModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <Ionicons name="location-sharp" size={24} color="#333" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Suivi Ambulance</Text>
            </View>
            
            {trackedAmbulance ? (
              <>
                <Text style={styles.ambulanceName}>{trackedAmbulance.name}</Text>
                <Text style={styles.ambulanceDriver}>Chauffeur: {trackedAmbulance.driver}</Text>
                <View style={styles.trackingInfo}>
                  <View style={styles.trackingRow}>
                    <Ionicons name="car-outline" size={16} color="#333" style={{ marginRight: 8 }} />
                    <Text style={styles.trackingText}>Distance: {trackedAmbulance.distance} km</Text>
                  </View>
                  <View style={styles.trackingRow}>
                    <Ionicons name="timer-outline" size={16} color="#333" style={{ marginRight: 8 }} />
                    <Text style={styles.trackingText}>ETA: {trackedAmbulance.eta} minutes</Text>
                  </View>
                  <View style={styles.trackingRow}>
                    <MaterialCommunityIcons 
                      name={trackedAmbulance.status === 'available' ? 'check-circle' : 'alert-circle'} 
                      size={16} 
                      color={trackedAmbulance.status === 'available' ? '#4CAF50' : '#FF9800'} 
                      style={{ marginRight: 8, marginTop: 5 }} 
                    />
                    <Text style={[styles.trackingStatus, { color: trackedAmbulance.status === 'available' ? '#4CAF50' : '#FF9800' }]}>
                      Statut: {trackedAmbulance.status === 'available' ? 'Disponible' : 'En intervention'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.callAmbulanceButton} onPress={() => {
                  setShowTrackingModal(false);
                  navigation.navigate('Alert', { location, ambulance: trackedAmbulance });
                }}>
                  <MaterialCommunityIcons name="phone-in-talk" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.callAmbulanceText}>Appeler cette ambulance</Text>
                </TouchableOpacity>
              </>
            ) : (
              <ActivityIndicator size="large" color="#2196F3" />
            )}
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowTrackingModal(false)}>
              <Text style={styles.closeModalText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fcfcfc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, backgroundColor: '#fff', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: '800', color: '#1a1a1a' },
  locationBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  locationText: { fontSize: 12, color: '#999' },
  iconCircle: { width: 45, height: 45, borderRadius: 23, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  emergencyMainButton: { backgroundColor: '#E53935', margin: 20, padding: 20, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: "#E53935", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 8 },
  emergencyTextContainer: { marginLeft: 15 },
  emergencyTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  emergencySub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  quickCallRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 10 },
  quickCallButton: { flex: 1, backgroundColor: '#d32f2f', padding: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ambulanceCallButton: { backgroundColor: '#2196F3' },
  quickCallText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  section: { padding: 20, backgroundColor: '#fff', marginBottom: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusBox: { width: '31%', padding: 15, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  statusVal: { fontSize: 20, fontWeight: '800' },
  statusLab: { fontSize: 10, color: '#666', marginTop: 2, textTransform: 'uppercase' },
  chartTitle: { fontSize: 14, fontWeight: '600', color: '#666' },
  chartStyle: { marginVertical: 8, borderRadius: 16, paddingRight: 40 },
  infoList: { paddingHorizontal: 20, paddingBottom: 20 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: '#fff', borderRadius: 15, marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0' },
  listItemText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#333' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '85%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  ambulanceName: { fontSize: 18, fontWeight: 'bold', color: '#2196F3', marginBottom: 5 },
  ambulanceDriver: { fontSize: 14, color: '#666', marginBottom: 15 },
  trackingInfo: { width: '100%', backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 15 },
  trackingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  trackingText: { fontSize: 14, color: '#333' },
  trackingStatus: { fontSize: 14, fontWeight: 'bold', marginTop: 5 },
  callAmbulanceButton: { backgroundColor: '#ff4444', padding: 12, borderRadius: 10, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  callAmbulanceText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  closeModalButton: { padding: 10 },
  closeModalText: { color: '#666', fontSize: 14, fontWeight: '600' }
});

export default HomeScreen;