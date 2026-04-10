import axios from 'axios';
import { AuthResponse, User, Urgence, Medicament, Commande, CentreSante, Article, Rappel, ChatMessage } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (telephone: string, mot_de_passe: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { telephone, mot_de_passe });
    return response.data;
  },
  
  registerPatient: async (data: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register/patient', data);
    return response.data;
  },
  
  registerAmbulancier: async (data: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register/ambulancier', data);
    return response.data;
  },
  
  registerPharmacien: async (data: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register/pharmacien', data);
    return response.data;
  },
  
  checkPatient: async (telephone: string): Promise<{ isRegistered: boolean; patient: any }> => {
    const response = await api.get(`/auth/check-patient/${telephone}`);
    return response.data;
  },
};

export const emergencyService = {
  createUrgence: async (data: any): Promise<{ success: boolean; urgence: Urgence; hopitaux_proches: CentreSante[]; ambulances_disponibles: any[] }> => {
    const response = await api.post('/emergency', data);
    return response.data;
  },
  
  sendSMSAlert: async (data: any): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/emergency/send-sms-alert', data);
    return response.data;
  },
  
  sendBIP: async (data: any): Promise<{ success: boolean; urgence: Urgence; isRegistered: boolean; patient?: any }> => {
    const response = await api.post('/emergency/bip', data);
    return response.data;
  },
  
  getHospitals: async (lat?: number, lng?: number): Promise<CentreSante[]> => {
    const params = lat && lng ? { lat, lng } : {};
    const response = await api.get('/emergency/hospitals', { params });
    return response.data;
  },
  
  getAmbulances: async (): Promise<any[]> => {
    const response = await api.get('/emergency/ambulances');
    return response.data;
  },
  
  getHistory: async (): Promise<Urgence[]> => {
    const response = await api.get('/emergency/history');
    return response.data;
  },
  
  updateStatus: async (id: number, statut: string, ambulancier_id?: number): Promise<{ success: boolean; urgence: Urgence }> => {
    const response = await api.patch(`/emergency/${id}/status`, { statut, ambulancier_id });
    return response.data;
  },
};

export const pharmacyService = {
  getMedicaments: async (params?: { search?: string; categorie?: string; pharmacie_id?: number }): Promise<Medicament[]> => {
    const response = await api.get('/pharmacy/medicaments', { params });
    return response.data;
  },
  
  getMedicament: async (id: number): Promise<Medicament> => {
    const response = await api.get(`/pharmacy/medicaments/${id}`);
    return response.data;
  },
  
  getPharmacies: async (): Promise<any[]> => {
    const response = await api.get('/pharmacy/pharmacies');
    return response.data;
  },
  
  createCommande: async (data: any): Promise<{ success: boolean; commande: any }> => {
    const response = await api.post('/pharmacy/commandes', data);
    return response.data;
  },
  
  getCommandes: async (): Promise<Commande[]> => {
    const response = await api.get('/pharmacy/commandes');
    return response.data;
  },
  
  updateCommandeStatus: async (id: number, statut: string): Promise<{ success: boolean; commande: Commande }> => {
    const response = await api.patch(`/pharmacy/commandes/${id}/status`, { statut });
    return response.data;
  },
};

export const wellnessService = {
  sendChatMessage: async (message: string): Promise<{ response: string; humeur: string }> => {
    const response = await api.post('/wellness/chatbot', { message });
    return response.data;
  },
  
  getChatHistory: async (): Promise<any[]> => {
    const response = await api.get('/wellness/chatbot/history');
    return response.data;
  },
  
  getGrossesse: async (): Promise<any> => {
    const response = await api.get('/wellness/grossesse');
    return response.data;
  },
  
  createGrossesse: async (data: any): Promise<{ success: boolean; suivi: any }> => {
    const response = await api.post('/wellness/grossesse', data);
    return response.data;
  },
  
  getArticles: async (params?: { categorie?: string; genre?: string }): Promise<Article[]> => {
    const response = await api.get('/articles', { params });
    return response.data;
  },
  
  getArticlesPersonnalises: async (): Promise<Article[]> => {
    const response = await api.get('/articles/personnalises');
    return response.data;
  },
  
  getArticle: async (id: number): Promise<Article> => {
    const response = await api.get(`/articles/${id}`);
    return response.data;
  },
  
  likeArticle: async (id: number): Promise<{ success: boolean; likes: number }> => {
    const response = await api.post(`/articles/${id}/like`);
    return response.data;
  },
  
  getMoodStats: async (): Promise<any[]> => {
    const response = await api.get('/wellness/mood-stats');
    return response.data;
  },
};

export const adminService = {
  // Dashboard
  getStats: async (): Promise<any> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  
  // Médicaments
  getMedicaments: async (): Promise<Medicament[]> => {
    const response = await api.get('/admin/medicaments');
    return response.data;
  },
  
  getMedicament: async (id: number): Promise<Medicament> => {
    const response = await api.get(`/admin/medicaments/${id}`);
    return response.data;
  },
  
  createMedicament: async (data: any): Promise<{ success: boolean; medicament: Medicament }> => {
    const response = await api.post('/admin/medicaments', data);
    return response.data;
  },
  
  updateMedicament: async (id: number, data: any): Promise<{ success: boolean; medicament: Medicament }> => {
    const response = await api.put(`/admin/medicaments/${id}`, data);
    return response.data;
  },
  
  deleteMedicament: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/medicaments/${id}`);
    return response.data;
  },
  
  updateMedicamentStock: async (id: number, stock: number): Promise<{ success: boolean; medicament: Medicament }> => {
    const response = await api.patch(`/admin/medicaments/${id}/stock`, { stock });
    return response.data;
  },
  
  // Ambulances
  getAmbulances: async (): Promise<any[]> => {
    const response = await api.get('/admin/ambulances');
    return response.data;
  },
  
  getAmbulance: async (id: number): Promise<any> => {
    const response = await api.get(`/admin/ambulances/${id}`);
    return response.data;
  },
  
  createAmbulance: async (data: any): Promise<{ success: boolean; ambulance: any }> => {
    const response = await api.post('/admin/ambulances', data);
    return response.data;
  },
  
  updateAmbulance: async (id: number, data: any): Promise<{ success: boolean; ambulance: any }> => {
    const response = await api.put(`/admin/ambulances/${id}`, data);
    return response.data;
  },
  
  deleteAmbulance: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/ambulances/${id}`);
    return response.data;
  },
  
  updateAmbulanceStatus: async (id: number, statut: string): Promise<{ success: boolean; ambulance: any }> => {
    const response = await api.patch(`/admin/ambulances/${id}/status`, { statut });
    return response.data;
  },
  
  // Centres de santé
  getCentresSante: async (): Promise<CentreSante[]> => {
    const response = await api.get('/admin/centres-sante');
    return response.data;
  },
  
  getCentreSante: async (id: number): Promise<CentreSante> => {
    const response = await api.get(`/admin/centres-sante/${id}`);
    return response.data;
  },
  
  createCentreSante: async (data: any): Promise<{ success: boolean; centre: CentreSante }> => {
    const response = await api.post('/admin/centres-sante', data);
    return response.data;
  },
  
  updateCentreSante: async (id: number, data: any): Promise<{ success: boolean; centre: CentreSante }> => {
    const response = await api.put(`/admin/centres-sante/${id}`, data);
    return response.data;
  },
  
  deleteCentreSante: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/centres-sante/${id}`);
    return response.data;
  },
  
  // Pharmacies
  getPharmacies: async (): Promise<any[]> => {
    const response = await api.get('/admin/pharmacies');
    return response.data;
  },
  
  getPharmacie: async (id: number): Promise<any> => {
    const response = await api.get(`/admin/pharmacies/${id}`);
    return response.data;
  },
  
  createPharmacie: async (data: any): Promise<{ success: boolean; pharmacie: any }> => {
    const response = await api.post('/admin/pharmacies', data);
    return response.data;
  },
  
  updatePharmacie: async (id: number, data: any): Promise<{ success: boolean; pharmacie: any }> => {
    const response = await api.put(`/admin/pharmacies/${id}`, data);
    return response.data;
  },
  
  deletePharmacie: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/pharmacies/${id}`);
    return response.data;
  },
  
  updatePharmacieStatus: async (id: number, statut: string): Promise<{ success: boolean; pharmacie: any }> => {
    const response = await api.patch(`/admin/pharmacies/${id}/status`, { statut });
    return response.data;
  },
  
  // Utilisateurs
  getUsers: async (): Promise<any> => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  
  getUser: async (id: number, type: string): Promise<any> => {
    const response = await api.get(`/admin/users/${id}/${type}`);
    return response.data;
  },
  
  createUser: async (data: any): Promise<{ success: boolean; user: any }> => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },
  
  updateUser: async (id: number, type: string, data: any): Promise<{ success: boolean; user: any }> => {
    const response = await api.put(`/admin/users/${id}/${type}`, data);
    return response.data;
  },
  
  deleteUser: async (id: number, type: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/users/${id}/${type}`);
    return response.data;
  },
  
  // Commandes
  getOrders: async (): Promise<Commande[]> => {
    const response = await api.get('/admin/orders');
    return response.data;
  },
  
  getOrder: async (id: number): Promise<Commande> => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },
  
  updateOrderStatus: async (id: number, statut: string): Promise<{ success: boolean; commande: Commande }> => {
    const response = await api.patch(`/admin/orders/${id}/status`, { statut });
    return response.data;
  },
  
  // Urgences
  getEmergencies: async (): Promise<Urgence[]> => {
    const response = await api.get('/admin/emergencies');
    return response.data;
  },
  
  getEmergency: async (id: number): Promise<Urgence> => {
    const response = await api.get(`/admin/emergencies/${id}`);
    return response.data;
  },
  
  updateEmergencyStatus: async (id: number, statut: string, ambulancier_id?: number): Promise<{ success: boolean; urgence: Urgence }> => {
    const response = await api.patch(`/admin/emergencies/${id}/status`, { statut, ambulancier_id });
    return response.data;
  },
};

export default api;