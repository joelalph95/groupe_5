import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
  Dimensions,
  RefreshControl,
  Platform
} from 'react-native';
import * as Location from 'expo-location';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { getPersonalizedArticles } from '../services/api';

const { width, height } = Dimensions.get('window');

// Import conditionnel pour MapView (uniquement sur mobile)
let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

export default function HomeScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [isConnected, setIsConnected] = useState(true);
  const [user, setUser] = useState(null);
  const [articles, setArticles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [healthData] = useState([68, 72, 70, 85, 75, 90, 72]);

  useEffect(() => {
    loadUserData();
    getLocation();
    checkConnectivity();
    loadArticles();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Erreur chargement user:', error);
    }
  };

  const loadArticles = async () => {
    try {
      const response = await getPersonalizedArticles();
      setArticles(response.data.slice(0, 3));
    } catch (error) {
      console.error('Erreur chargement articles:', error);
      setArticles([
        { id: 1, titre: 'Comprendre son cycle menstruel', categorie: 'FEMME' },
        { id: 2, titre: 'Gérer son stress au quotidien', categorie: 'MENTAL' },
        { id: 3, titre: 'Les bienfaits de l\'activité physique', categorie: 'SPORT' },
      ]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getLocation();
    await loadArticles();
    setRefreshing(false);
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      await AsyncStorage.setItem('lastLocation', JSON.stringify(loc.coords));
    }
  };

  const checkConnectivity = () => {
    NetInfo.addEventListener(state => setIsConnected(state.isConnected));
  };

  const handleEmergency = () => {
    if (!location) {
      Alert.alert('GPS requis', 'Veuillez activer votre GPS');
      return;
    }
    navigation.navigate('Emergency', { location });
  };

  const mathStats = {
    moyenne: Math.round(healthData.reduce((a, b) => a + b, 0) / healthData.length),
    max: Math.max(...healthData),
    min: Math.min(...healthData)
  };

  // Rendu de la carte conditionnel
  const renderMap = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={50} color="#999" />
          <Text style={styles.mapPlaceholderText}>Carte disponible sur mobile</Text>
        </View>
      );
    }

    if (!location) {
      return (
        <View style={styles.mapLoading}>
          <Text style={{ color: '#999' }}>Chargement de la carte...</Text>
        </View>
      );
    }

    return (
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        scrollEnabled={false}
      >
        <Marker 
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="Vous êtes ici"
          pinColor="#FF3B30"
        />
      </MapView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>MIAINA</Text>
          {user && (
            <Text style={styles.welcomeText}>Bonjour {user.prenom || user.nom} 👋</Text>
          )}
        </View>
        <View style={[styles.statusDot, isConnected ? styles.online : styles.offline]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Carte SOS principale */}
        <TouchableOpacity 
          style={styles.sosCard}
          onPress={handleEmergency}
          activeOpacity={0.9}
        >
          <View style={styles.sosContent}>
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosSubtext}>URGENCE</Text>
          </View>
        </TouchableOpacity>

        {/* SECTION : GRAPHIQUE ET STATISTIQUES */}
        <View style={styles.graphCard}>
          <View style={styles.graphHeader}>
            <Text style={styles.graphTitle}>Évolution Santé (BPM)</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HealthTracking')}>
              <Text style={styles.seeMoreText}>Détails</Text>
            </TouchableOpacity>
          </View>

          <LineChart
            data={{
              labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
              datasets: [{ data: healthData }]
            }}
            width={width - 70}
            height={160}
            chartConfig={chartConfig}
            bezier
            style={styles.chartStyle}
          />

          <View style={styles.mathRow}>
            <View style={styles.mathBox}>
              <Text style={styles.mathLabel}>Min</Text>
              <Text style={[styles.mathValue, { color: '#34C759' }]}>{mathStats.min}</Text>
            </View>
            <View style={styles.mathDivider} />
            <View style={styles.mathBox}>
              <Text style={styles.mathLabel}>Moyenne</Text>
              <Text style={styles.mathValue}>{mathStats.moyenne}</Text>
            </View>
            <View style={styles.mathDivider} />
            <View style={styles.mathBox}>
              <Text style={styles.mathLabel}>Max</Text>
              <Text style={[styles.mathValue, { color: '#FF3B30' }]}>{mathStats.max}</Text>
            </View>
          </View>
        </View>

        {/* SECTION : ARTICLES / ACTU SANTE */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actualités Santé</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Bien-être')}>
            <Text style={styles.seeMoreText}>Voir tout</Text>
          </TouchableOpacity>
        </View>

        {articles.map((article) => (
          <TouchableOpacity key={article.id} style={styles.articleCard} activeOpacity={0.8}>
            <View style={styles.articleIconBg}>
              <Ionicons name="newspaper-outline" size={30} color="#5856D6" />
            </View>
            <View style={styles.articleContent}>
              <Text style={styles.articleTag}>{article.categorie}</Text>
              <Text style={styles.articleTitle}>{article.titre}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* SECTION : GÉOLOCALISATION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ma Position Actuelle</Text>
          <Ionicons name="location" size={20} color="#FF3B30" />
        </View>

        <View style={styles.mapContainer}>
          {renderMap()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(255, 59, 48, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(100, 100, 100, ${opacity})`,
  propsForDots: { r: "5", strokeWidth: "2", stroke: "#FF3B30" }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 15 
  },
  logo: { fontSize: 24, fontWeight: 'bold', color: '#FF3B30', letterSpacing: 1 },
  welcomeText: { fontSize: 12, color: '#666', marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  online: { backgroundColor: '#34C759' },
  offline: { backgroundColor: '#FF9500' },
  
  sosCard: {
    marginHorizontal: 20,
    marginVertical: 10,
    height: height * 0.25,
    backgroundColor: '#FF3B30',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10
  },
  sosText: { fontSize: 60, fontWeight: 'bold', color: 'white', letterSpacing: 4 },
  sosSubtext: { fontSize: 16, color: 'white', fontWeight: '600', letterSpacing: 2 },

  graphCard: { backgroundColor: 'white', marginHorizontal: 20, marginTop: 15, borderRadius: 20, padding: 15, elevation: 3 },
  graphHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  graphTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  seeMoreText: { fontSize: 13, color: '#FF3B30', fontWeight: 'bold' },
  chartStyle: { alignSelf: 'center', borderRadius: 16 },
  mathRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  mathBox: { alignItems: 'center' },
  mathLabel: { fontSize: 11, color: '#999', marginBottom: 2 },
  mathValue: { fontSize: 17, fontWeight: 'bold' },
  mathDivider: { width: 1, height: 25, backgroundColor: '#F0F0F0' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 25, marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#333' },

  articleCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    marginBottom: 10
  },
  articleIconBg: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F0EFFF', justifyContent: 'center', alignItems: 'center' },
  articleContent: { flex: 1, marginLeft: 15 },
  articleTag: { fontSize: 10, fontWeight: 'bold', color: '#5856D6', marginBottom: 4 },
  articleTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', lineHeight: 18 },

  mapContainer: { marginHorizontal: 20, height: 180, borderRadius: 20, overflow: 'hidden', elevation: 4, backgroundColor: '#EEE', marginBottom: 20 },
  map: { ...StyleSheet.absoluteFillObject },
  mapLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F0F0' },
  mapPlaceholderText: { marginTop: 10, color: '#999', fontSize: 14 }
});