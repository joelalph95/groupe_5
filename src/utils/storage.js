import AsyncStorage from '@react-native-async-storage/async-storage';

// Sauvegarder des données
export const saveData = async (key, data) => {
    try {
        const jsonData = JSON.stringify(data);
        await AsyncStorage.setItem(key, jsonData);
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde:', error);
        return false;
    }
};

// Charger des données
export const loadData = async (key) => {
    try {
        const jsonData = await AsyncStorage.getItem(key);
        return jsonData != null ? JSON.parse(jsonData) : null;
    } catch (error) {
        console.error('Erreur chargement:', error);
        return null;
    }
};

// Supprimer des données
export const removeData = async (key) => {
    try {
        await AsyncStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Erreur suppression:', error);
        return false;
    }
};

// Sauvegarder alerte offline
export const saveOfflineAlert = async (alert) => {
    try {
        const existingAlerts = await loadData('offlineAlerts') || [];
        existingAlerts.push({
            ...alert,
            id: Date.now(),
            timestamp: new Date().toISOString()
        });
        await saveData('offlineAlerts', existingAlerts);
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde alerte:', error);
        return false;
    }
};

// Récupérer alertes offline
export const getOfflineAlerts = async () => {
    return await loadData('offlineAlerts') || [];
};

// Supprimer alerte offline
export const removeOfflineAlert = async (alertId) => {
    try {
        const alerts = await getOfflineAlerts();
        const filteredAlerts = alerts.filter(alert => alert.id !== alertId);
        await saveData('offlineAlerts', filteredAlerts);
        return true;
    } catch (error) {
        console.error('Erreur suppression alerte:', error);
        return false;
    }
};

// Sauvegarder historique des appels d'urgence
export const saveEmergencyCall = async (call) => {
    try {
        const calls = await loadData('emergencyCalls') || [];
        calls.push({
            ...call,
            id: Date.now(),
            timestamp: new Date().toISOString()
        });
        await saveData('emergencyCalls', calls);
        return true;
    } catch (error) {
        console.error('Erreur sauvegarde appel:', error);
        return false;
    }
};

// Sauvegarder dernière position
export const saveLastLocation = async (location) => {
    return await saveData('lastLocation', location);
};

// Charger dernière position
export const getLastLocation = async () => {
    return await loadData('lastLocation');
};

// Sauvegarder liste hôpitaux pour offline
export const saveHospitalsOffline = async (hospitals) => {
    return await saveData('offlineHospitals', hospitals);
};

// Charger hôpitaux offline
export const getHospitalsOffline = async () => {
    return await loadData('offlineHospitals') || [];
};

// Sauvegarder préférences utilisateur
export const saveUserPreferences = async (preferences) => {
    return await saveData('userPreferences', preferences);
};

// Charger préférences utilisateur
export const getUserPreferences = async () => {
    const defaults = {
        notifications: true,
        autoSendLocation: true,
        emergencyContact: null,
        patientName: ''
    };
    
    const saved = await loadData('userPreferences');
    return saved ? { ...defaults, ...saved } : defaults;
};

// Effacer toutes les données
export const clearAllData = async () => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        await AsyncStorage.multiRemove(keys);
        return true;
    } catch (error) {
        console.error('Erreur effacement données:', error);
        return false;
    }
};