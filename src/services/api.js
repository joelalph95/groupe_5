import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api'; // À remplacer par ton IP

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

// Intercepteur pour gérer l'offline
api.interceptors.response.use(
    response => response,
    async error => {
        if (!error.response) {
            // Mode offline - sauvegarder la requête
            const offlineRequests = await AsyncStorage.getItem('offlineRequests');
            const requests = offlineRequests ? JSON.parse(offlineRequests) : [];
            requests.push({
                url: error.config.url,
                method: error.config.method,
                data: error.config.data,
                timestamp: new Date().toISOString()
            });
            await AsyncStorage.setItem('offlineRequests', JSON.stringify(requests));
            throw { offline: true, message: 'Mode offline - requête sauvegardée' };
        }
        throw error;
    }
);

export const getNearbyHospitals = (latitude, longitude) => {
    return api.get(`/ambulance/nearby-hospitals?latitude=${latitude}&longitude=${longitude}`);
};

export const getAvailableAmbulances = (latitude, longitude) => {
    return api.get(`/ambulance/available-ambulances?latitude=${latitude}&longitude=${longitude}`);
};

export const getTransporters = () => {
    return api.get('/ambulance/transporters');
};

export const sendAlert = (data) => {
    return api.post('/ambulance/send-alert', data);
};

export const sendBipAlert = (phoneNumber) => {
    return api.post('/ambulance/bip-alert', { phoneNumber });
};

export default api;