import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { CartProvider } from './src/context/CartContext';

// Import des écrans d'authentification
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';

// Import des écrans principaux (Tabs)
import HomeScreen from './src/screens/HomeScreen';
import PharmacyScreen from './src/screens/PharmacyScreen';
import WellnessScreen from './src/screens/WellnessScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import des écrans secondaires (Stack)
import EmergencyScreen from './src/screens/EmergencyScreen';
import HospitalsScreen from './src/screens/HospitalsScreen';
import AmbulancesScreen from './src/screens/AmbulancesScreen';
import OfflineScreen from './src/screens/OfflineScreen';
import HealthStatsScreen from './src/screens/HealthStatsScreen';
import HealthTrackingScreen from './src/screens/HealthTrackingScreen';
import MedicineDetailScreen from './src/screens/MedicineDetailScreen';
import OrderScreen from './src/screens/OrderScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack pour l'onglet Accueil
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Emergency" component={EmergencyScreen} options={{ title: 'Urgence', headerStyle: { backgroundColor: '#FF3B30' }, headerTintColor: 'white' }} />
      <Stack.Screen name="Hospitals" component={HospitalsScreen} options={{ title: 'Hôpitaux proches' }} />
      <Stack.Screen name="Ambulances" component={AmbulancesScreen} options={{ title: 'Ambulances disponibles' }} />
      <Stack.Screen name="Offline" component={OfflineScreen} options={{ title: 'Mode Hors-ligne' }} />
      <Stack.Screen name="HealthStats" component={HealthStatsScreen} options={{ title: 'Bilan Santé' }} />
      <Stack.Screen name="HealthTracking" component={HealthTrackingScreen} options={{ title: 'Statistiques' }} />
    </Stack.Navigator>
  );
}

// Stack pour l'onglet Pharmacie (Medical)
function PharmacyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PharmacyMain" component={PharmacyScreen} options={{ title: 'Pharmacie', headerTitleAlign: 'center' }} />
      <Stack.Screen name="MedicineDetail" component={MedicineDetailScreen} options={{ title: 'Détail médicament' }} />
      <Stack.Screen name="Order" component={OrderScreen} options={{ title: 'Commande' }} />
    </Stack.Navigator>
  );
}

// Stack pour l'onglet Bien-être
function WellnessStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="WellnessMain" component={WellnessScreen} options={{ title: 'Bien-être', headerTitleAlign: 'center' }} />
    </Stack.Navigator>
  );
}

// Stack pour l'onglet Chatbot
function ChatbotStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ChatbotMain" component={ChatbotScreen} options={{ title: 'Chatbot Santé', headerTitleAlign: 'center' }} />
    </Stack.Navigator>
  );
}

// Stack pour l'onglet Paramètres
function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SettingsMain" component={SettingsScreen} options={{ title: 'Paramètres', headerTitleAlign: 'center' }} />
    </Stack.Navigator>
  );
}

// Composant des onglets principaux
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          let iconLabel = '';

          if (route.name === 'Accueil') {
            iconName = focused ? 'home' : 'home-outline';
            iconLabel = 'Accueil';
          } else if (route.name === 'Pharmacie') {
            iconName = focused ? 'medkit' : 'medkit-outline';
            iconLabel = 'Medical';
          } else if (route.name === 'Bien-être') {
            iconName = focused ? 'leaf' : 'leaf-outline';
            iconLabel = 'Bien-être';
          } else if (route.name === 'Chatbot') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            iconLabel = 'MindTrack';
          } else if (route.name === 'Paramètres') {
            iconName = focused ? 'settings' : 'settings-outline';
            iconLabel = 'Paramètres';
          }

          return (
            <View style={styles.tabItem}>
              <Ionicons name={iconName} size={24} color={color} />
              <Text style={[styles.tabLabel, { color: color }]}>{iconLabel}</Text>
            </View>
          );
        },
        tabBarActiveTintColor: '#FF3B30',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#E5E5E5',
          height: 70,
          paddingBottom: 10,
          paddingTop: 5,
        },
        tabBarLabel: () => null,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Accueil" component={HomeStack} />
      <Tab.Screen name="Pharmacie" component={PharmacyStack} />
      <Tab.Screen name="Bien-être" component={WellnessStack} />
      <Tab.Screen name="Chatbot" component={ChatbotStack} />
      <Tab.Screen name="Paramètres" component={SettingsStack} />
    </Tab.Navigator>
  );
}

// Stack d'authentification
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Composant principal App
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error('Erreur vérification auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  return (
    <CartProvider>
      <NavigationContainer>
        {isLoggedIn ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
});