import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StatusBar, StyleSheet, SafeAreaView } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // <-- Ajout des icônes

import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';
import AmbulanceScreen from './src/screens/AmbulanceScreen';
import AlertScreen from './src/screens/AlertScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack pour l'onglet Urgence
function EmergencyStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#d32f2f' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="EmergencyHome" 
        component={HomeScreen} 
        options={{ title: 'Miaina - Urgence' }}
      />
      <Stack.Screen 
        name="Alert" 
        component={AlertScreen} 
        options={{ 
          title: 'Alerte d\'urgence',
          headerStyle: { backgroundColor: '#ff4444' }
        }}
      />
    </Stack.Navigator>
  );
}

// Stack pour l'onglet Hôpitaux
function HospitalsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#4CAF50' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="HospitalsMap" 
        component={MapScreen} 
        options={{ title: 'Hôpitaux proches' }}
        initialParams={{ type: 'hospitals' }}
      />
    </Stack.Navigator>
  );
}

// Stack pour l'onglet Ambulances
function AmbulancesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#2196F3' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="AmbulancesList" 
        component={AmbulanceScreen} 
        options={{ title: 'Ambulances disponibles' }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const checkInitialConnection = async () => {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected);
    };
    
    checkInitialConnection();

    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isConnected ? '#fff' : '#ff9800' }}>
      <StatusBar barStyle="light-content" backgroundColor="#d32f2f" />
      
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Ionicons name="cloud-offline" size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.offlineText}>
            Mode hors-ligne - Urgence par BIP disponible
          </Text>
        </View>
      )}

      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              if (route.name === 'Urgence') {
                return <Ionicons name={focused ? "alert-circle" : "alert-circle-outline"} size={size + 4} color={color} />;
              } else if (route.name === 'Hôpitaux') {
                return <MaterialCommunityIcons name={focused ? "hospital-marker" : "hospital-building"} size={size + 2} color={color} />;
              } else if (route.name === 'Ambulances') {
                return <MaterialCommunityIcons name={focused ? "ambulance" : "car-emergency"} size={size + 4} color={color} />;
              }
            },
            tabBarActiveTintColor: '#d32f2f',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: {
              backgroundColor: '#fff',
              height: 65,
              paddingBottom: 10,
              paddingTop: 5,
              borderTopWidth: 1,
              borderTopColor: '#f0f0f0',
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
            headerShown: false,
          })}
        >
          <Tab.Screen name="Urgence" component={EmergencyStack} />
          <Tab.Screen name="Hôpitaux" component={HospitalsStack} />
          <Tab.Screen name="Ambulances" component={AmbulancesStack} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#ff9800',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  offlineText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
});