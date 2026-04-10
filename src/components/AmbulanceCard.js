import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

const AmbulanceCard = ({ ambulance, onCall, onTrack }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return '#4CAF50';
      case 'on_mission': return '#FF9800';
      case 'busy': return '#f44336';
      default: return '#999';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'available': return 'Disponible';
      case 'on_mission': return 'En intervention';
      case 'busy': return 'Occupée';
      default: return 'Inconnu';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{ambulance.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ambulance.status) }]}>
          <Text style={styles.statusText}>{getStatusText(ambulance.status)}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>🚐 Type:</Text>
        <Text style={styles.value}>{ambulance.type}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>👨‍⚕️ Chauffeur:</Text>
        <Text style={styles.value}>{ambulance.driver}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>📍 Distance:</Text>
        <Text style={styles.value}>{ambulance.distance} km</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>⏱️ ETA:</Text>
        <Text style={styles.value}>{ambulance.eta} min</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>🩺 Équipement:</Text>
        <Text style={styles.value}>{ambulance.equipment}</Text>
      </View>

      {ambulance.status === 'available' && (
        <TouchableOpacity style={styles.callButton} onPress={() => onCall(ambulance)}>
          <Text style={styles.buttonText}>🚨 Appeler cette ambulance</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.trackButton} onPress={() => onTrack(ambulance)}>
        <Text style={styles.trackButtonText}>📍 Suivre en temps réel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8
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
    backgroundColor: '#ff4444',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center'
  },
  trackButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 14
  }
});

export default AmbulanceCard;