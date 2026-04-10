import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../utils/constants';

const HospitalCard = ({ hospital }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{hospital.name}</Text>
      <Text style={styles.detail}>Distance: {hospital.distance}</Text>
      <Text style={styles.beds}>Lits disponibles: {hospital.bedsAvailable}</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Naviguer</Text>
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
    marginBottom: 8,
  },
  detail: {
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 4,
  },
  beds: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 12,
  },
  button: {
    backgroundColor: COLORS.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HospitalCard;
