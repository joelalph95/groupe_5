import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration avec votre IP
const API_URL = 'http://192.168.0.224:5000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log(`📤 [API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ [API Request Error]', error);
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer l'offline et les erreurs
api.interceptors.response.use(
    response => {
        console.log(`📥 [API Response] ${response.config.url} - ${response.status}`);
        return response;
    },
    async error => {
        console.error('⚠️ [API Error]', error.config?.url, error.message);
        
        if (!error.response) {
            console.log('💾 Mode offline - sauvegarde de la requête');
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
        
        if (error.response?.status === 401) {
            console.log('🔐 Token expiré, déconnexion');
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
        }
        
        throw error;
    }
);

// ==================== AUTHENTIFICATION ====================
export const login = (telephone, mot_de_passe) => {
    return api.post('/auth/login', { telephone, mot_de_passe });
};

export const registerPatient = (userData) => {
    return api.post('/auth/register/patient', userData);
};

export const registerAmbulancier = (userData) => {
    return api.post('/auth/register/ambulancier', userData);
};

export const registerPharmacien = (userData) => {
    return api.post('/auth/register/pharmacien', userData);
};

// ==================== MÉDICAMENTS ====================
export const getMedicaments = async (params) => {
    try {
        const response = await api.get('/pharmacy/medicaments', { params });
        return response.data;
    } catch (error) {
        console.error('Erreur getMedicaments:', error);
        return [];
    }
};

export const getMedicamentById = async (id) => {
    try {
        const response = await api.get(`/pharmacy/medicaments/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur getMedicamentById:', error);
        return null;
    }
};

export const getPharmacies = async (params) => {
    try {
        const response = await api.get('/pharmacy/pharmacies', { params });
        return response.data;
    } catch (error) {
        console.error('Erreur getPharmacies:', error);
        return [];
    }
};

// ==================== COMMANDES ====================
export const createCommande = async (commandeData) => {
    const response = await api.post('/pharmacy/commandes', commandeData);
    return response;
};

export const getCommandes = async () => {
    try {
        const response = await api.get('/pharmacy/commandes');
        return response.data;
    } catch (error) {
        console.error('Erreur getCommandes:', error);
        return [];
    }
};

export const updateCommandeStatus = async (id, statut) => {
    const response = await api.patch(`/pharmacy/commandes/${id}/status`, { statut });
    return response;
};

// ==================== URGENCES ====================
export const createUrgence = async (urgenceData) => {
    const response = await api.post('/emergency', urgenceData);
    return response;
};

export const sendSmsAlert = async (data) => {
    const response = await api.post('/emergency/send-sms-alert', data);
    return response;
};

export const sendBipAlert = async (data) => {
    const response = await api.post('/emergency/bip', data);
    return response;
};

export const getHospitals = async (params) => {
    try {
        const response = await api.get('/emergency/hospitals', { params });
        return response.data;
    } catch (error) {
        console.error('Erreur getHospitals:', error);
        return [];
    }
};

export const getAvailableAmbulances = async (params) => {
    try {
        const response = await api.get('/emergency/ambulances', { params });
        return response.data;
    } catch (error) {
        console.error('Erreur getAvailableAmbulances:', error);
        return [];
    }
};

export const getUrgenceHistory = async () => {
    try {
        const response = await api.get('/emergency/history');
        return response.data;
    } catch (error) {
        console.error('Erreur getUrgenceHistory:', error);
        return [];
    }
};

export const updateUrgenceStatus = async (id, data) => {
    const response = await api.patch(`/emergency/${id}/status`, data);
    return response;
};

// ==================== CHATBOT ====================
export const sendChatMessage = async (message) => {
    const response = await api.post('/wellness/chatbot', { message });
    return response;
};

export const getChatHistory = async () => {
    try {
        const response = await api.get('/wellness/chatbot/history');
        return response.data;
    } catch (error) {
        console.error('Erreur getChatHistory:', error);
        return [];
    }
};

export const getMoodStats = async () => {
    try {
        const response = await api.get('/wellness/mood-stats');
        return response.data;
    } catch (error) {
        console.error('Erreur getMoodStats:', error);
        return [];
    }
};

// ==================== SUIVI GROSSESSE ====================
export const getGrossesse = async () => {
    try {
        const response = await api.get('/wellness/grossesse');
        return response.data;
    } catch (error) {
        console.error('Erreur getGrossesse:', error);
        return null;
    }
};

export const createOrUpdateGrossesse = async (data) => {
    const response = await api.post('/wellness/grossesse', data);
    return response;
};

// ==================== ARTICLES ====================
export const getArticles = async (params) => {
    try {
        const response = await api.get('/articles', { params });
        return response.data;
    } catch (error) {
        console.error('Erreur getArticles:', error);
        return [];
    }
};

export const getPersonalizedArticles = async () => {
    try {
        const response = await api.get('/articles/personnalises');
        return response;
    } catch (error) {
        console.error('Erreur getPersonalizedArticles:', error);
        throw error;
    }
};

export const getArticleById = async (id) => {
    try {
        const response = await api.get(`/articles/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur getArticleById:', error);
        return null;
    }
};

export const likeArticle = async (id) => {
    const response = await api.post(`/articles/${id}/like`);
    return response;
};

// ==================== ADMIN ====================
export const getStats = async () => {
    try {
        const response = await api.get('/admin/stats');
        return response.data;
    } catch (error) {
        console.error('Erreur getStats:', error);
        return null;
    }
};

export const getAllMedicaments = async () => {
    try {
        const response = await api.get('/admin/medicaments');
        return response.data;
    } catch (error) {
        console.error('Erreur getAllMedicaments:', error);
        return [];
    }
};

export const createMedicament = async (data) => {
    const response = await api.post('/admin/medicaments', data);
    return response;
};

export const updateMedicament = async (id, data) => {
    const response = await api.put(`/admin/medicaments/${id}`, data);
    return response;
};

export const deleteMedicament = async (id) => {
    const response = await api.delete(`/admin/medicaments/${id}`);
    return response;
};

export const updateMedicamentStock = async (id, stock) => {
    const response = await api.patch(`/admin/medicaments/${id}/stock`, { stock });
    return response;
};

export const getAllAmbulances = async () => {
    try {
        const response = await api.get('/admin/ambulances');
        return response.data;
    } catch (error) {
        console.error('Erreur getAllAmbulances:', error);
        return [];
    }
};

export const createAmbulance = async (data) => {
    const response = await api.post('/admin/ambulances', data);
    return response;
};

export const updateAmbulance = async (id, data) => {
    const response = await api.put(`/admin/ambulances/${id}`, data);
    return response;
};

export const deleteAmbulance = async (id) => {
    const response = await api.delete(`/admin/ambulances/${id}`);
    return response;
};

export const updateAmbulanceStatus = async (id, statut) => {
    const response = await api.patch(`/admin/ambulances/${id}/status`, { statut });
    return response;
};

export const getAllCentresSante = async () => {
    try {
        const response = await api.get('/admin/centres-sante');
        return response.data;
    } catch (error) {
        console.error('Erreur getAllCentresSante:', error);
        return [];
    }
};

export const createCentreSante = async (data) => {
    const response = await api.post('/admin/centres-sante', data);
    return response;
};

export const updateCentreSante = async (id, data) => {
    const response = await api.put(`/admin/centres-sante/${id}`, data);
    return response;
};

export const deleteCentreSante = async (id) => {
    const response = await api.delete(`/admin/centres-sante/${id}`);
    return response;
};

export const getAllPharmacies = async () => {
    try {
        const response = await api.get('/admin/pharmacies');
        return response.data;
    } catch (error) {
        console.error('Erreur getAllPharmacies:', error);
        return [];
    }
};

export const createPharmacie = async (data) => {
    const response = await api.post('/admin/pharmacies', data);
    return response;
};

export const updatePharmacie = async (id, data) => {
    const response = await api.put(`/admin/pharmacies/${id}`, data);
    return response;
};

export const deletePharmacie = async (id) => {
    const response = await api.delete(`/admin/pharmacies/${id}`);
    return response;
};

export const updatePharmacieStatus = async (id, statut) => {
    const response = await api.patch(`/admin/pharmacies/${id}/status`, { statut });
    return response;
};

export const getAllUsers = async () => {
    try {
        const response = await api.get('/admin/users');
        return response.data;
    } catch (error) {
        console.error('Erreur getAllUsers:', error);
        return null;
    }
};

export const getUserById = async (id, type) => {
    try {
        const response = await api.get(`/admin/users/${id}/${type}`);
        return response.data;
    } catch (error) {
        console.error('Erreur getUserById:', error);
        return null;
    }
};

export const createUser = async (data) => {
    const response = await api.post('/admin/users', data);
    return response;
};

export const updateUser = async (id, type, data) => {
    const response = await api.put(`/admin/users/${id}/${type}`, data);
    return response;
};

// Déconnexion (supprime le token localement)
export const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
};

export const deleteUser = async (id, type) => {
    const response = await api.delete(`/admin/users/${id}/${type}`);
    return response;
};

export const getAllOrders = async () => {
    try {
        const response = await api.get('/admin/orders');
        return response.data;
    } catch (error) {
        console.error('Erreur getAllOrders:', error);
        return [];
    }
};

export const getOrderById = async (id) => {
    try {
        const response = await api.get(`/admin/orders/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur getOrderById:', error);
        return null;
    }
};

export const updateOrderStatus = async (id, statut) => {
    const response = await api.patch(`/admin/orders/${id}/status`, { statut });
    return response;
};

export const getAllEmergencies = async () => {
    try {
        const response = await api.get('/admin/emergencies');
        return response.data;
    } catch (error) {
        console.error('Erreur getAllEmergencies:', error);
        return [];
    }
};

export const getEmergencyById = async (id) => {
    try {
        const response = await api.get(`/admin/emergencies/${id}`);
        return response.data;
    } catch (error) {
        console.error('Erreur getEmergencyById:', error);
        return null;
    }
};

export const updateEmergencyStatus = async (id, data) => {
    const response = await api.patch(`/admin/emergencies/${id}/status`, data);
    return response;
};

// ==================== FONCTIONS OFFLINE ====================
export const syncOfflineRequests = async () => {
    try {
        const offlineRequests = await AsyncStorage.getItem('offlineRequests');
        if (!offlineRequests) return { success: true, synced: 0 };
        
        const requests = JSON.parse(offlineRequests);
        let synced = 0;
        
        for (const request of requests) {
            try {
                await api({
                    url: request.url,
                    method: request.method,
                    data: request.data
                });
                synced++;
            } catch (error) {
                console.error('Erreur synchronisation:', error);
            }
        }
        
        await AsyncStorage.removeItem('offlineRequests');
        return { success: true, synced, total: requests.length };
    } catch (error) {
        console.error('Erreur sync offline:', error);
        return { success: false, error: error.message };
    }
};

export const isOfflineMode = async () => {
    try {
        const offlineRequests = await AsyncStorage.getItem('offlineRequests');
        return offlineRequests ? JSON.parse(offlineRequests).length > 0 : false;
    } catch {
        return false;
    }
};

// ==================== SUIVI SANTE ====================
export const getSuiviSante = async (type) => {
    try {
        const url = type ? `/wellness/suivi-sante/${type}` : '/wellness/suivi-sante';
        const response = await api.get(url);
        return response.data;
    } catch (error) {
        console.error('Erreur getSuiviSante:', error);
        return [];
    }
};

export const createSuiviSante = async (data) => {
    const response = await api.post('/wellness/suivi-sante', data);
    return response;
};

export const updateSuiviSante = async (id, data) => {
    const response = await api.put(`/wellness/suivi-sante/${id}`, data);
    return response;
};

export const deleteSuiviSante = async (id) => {
    const response = await api.delete(`/wellness/suivi-sante/${id}`);
    return response;
};

export default api;