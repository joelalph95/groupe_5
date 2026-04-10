import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../../utils/constants';
import { isOnline, syncData } from '../../services/offlineService';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = isOnline().then(online => setIsOffline(!online));
    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  const handleRetry = () => {
    syncData();
    Alert.alert('Mode hors ligne', 'Données mises en cache utilisées. Vérifiez connexion.');
  };

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚠️ Hors ligne - Mode déconnecté</Text>
      <TouchableOpacity onPress={handleRetry} style={styles.retryButton}>
        <Text style={styles.retryText}>Rétablir</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: COLORS.warning,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default OfflineBanner;
