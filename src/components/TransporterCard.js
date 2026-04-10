import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../utils/constants';
import { callEmergency } from '../../services/smsService';

const TransporterCard = ({ transporter }) => {
  const getStatusColor = (status) => status === 'available' ? COLORS.success : COLORS.warning;

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{transporter.name}</Text>
      <Text style={styles.vehicle}>{transporter.vehicleType}</Text>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transporter.status) }]}>
        <Text style={styles.statusText}>{transporter.status}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => callEmergency(transporter.phone)}>
        <Text style={styles.buttonText}>Contacter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  vehicle: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  button: {
    backgroundColor: COLORS.warning,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default TransporterCard;
