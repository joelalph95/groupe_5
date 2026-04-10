import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

// NOUVEL IMPORT : La bibliothèque d'icônes d'Expo
import { Ionicons } from '@expo/vector-icons'; 

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

// Stack pour l'onglet Accueil (avec navigation interne)
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Emergency" 
        component={EmergencyScreen} 
        options={{ title: 'Urgence', headerStyle: { backgroundColor: '#FF3B30' }, headerTintColor: 'white' }}
      />
      <Stack.Screen 
        name="Hospitals" 
        component={HospitalsScreen} 
        options={{ title: 'Hôpitaux proches' }}
      />
      <Stack.Screen 
        name="Ambulances" 
        component={AmbulancesScreen} 
        options={{ title: 'Ambulances disponibles' }}
      />
      <Stack.Screen 
        name="Offline" 
        component={OfflineScreen} 
        options={{ title: 'Mode Hors-ligne' }}
      />
      <Stack.Screen 
        name="HealthStats" 
        component={HealthStatsScreen} 
        options={{ title: 'Bilan Santé' }}
      />
      <Stack.Screen 
        name="HealthTracking" 
        component={HealthTrackingScreen} 
        options={{ title: 'Statistiques' }}
      />
    </Stack.Navigator>
  );
}

// Stack pour l'onglet Pharmacie
function PharmacyStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PharmacyMain" 
        component={PharmacyScreen} 
        options={{ title: 'Pharmacie', headerTitleAlign: 'center' }}
      />
      <Stack.Screen 
        name="MedicineDetail" 
        component={MedicineDetailScreen} 
        options={{ title: 'Détail médicament' }}
      />
      <Stack.Screen 
        name="Order" 
        component={OrderScreen} 
        options={{ title: 'Commande' }}
      />
    </Stack.Navigator>
  );
}

// Stack pour l'onglet Bien-être
function WellnessStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="WellnessMain" 
        component={WellnessScreen} 
        options={{ title: 'Bien-être', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}

// Stack pour l'onglet Chatbot
function ChatbotStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ChatbotMain" 
        component={ChatbotScreen} 
        options={{ title: 'Chatbot Santé', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}

// Stack pour l'onglet Paramètres
function SettingsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="SettingsMain" 
        component={SettingsScreen} 
        options={{ title: 'Paramètres', headerTitleAlign: 'center' }}
      />
    </Stack.Navigator>
  );
}

// Composant principal avec Bottom Tabs
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let iconLabel = '';

            // Configuration des icônes selon l'onglet et l'état (actif ou inactif)
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
              iconLabel = 'Sante Ai';
            } else if (route.name === 'Paramètres') {
              iconName = focused ? 'settings' : 'settings-outline';
              iconLabel = 'Paramètres';
            }

            return (
              <View style={styles.tabItem}>
                {/* Remplacement du texte Emoji par le composant Ionicons */}
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
          tabBarLabel: () => null, // Cacher le label par défaut
          headerShown: false,
        })}
      >
        <Tab.Screen name="Accueil" component={HomeStack} />
        <Tab.Screen name="Pharmacie" component={PharmacyStack} />
        <Tab.Screen name="Bien-être" component={WellnessStack} />
        <Tab.Screen name="Chatbot" component={ChatbotStack} />
        <Tab.Screen name="Paramètres" component={SettingsStack} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5, // Petit ajustement pour centrer verticalement avec les vraies icônes
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
});