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
  getStats: async (): Promise<any> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  
  getUsers: async (): Promise<any> => {
    const response = await api.get('/admin/users');
    return response.data;
  },
  
  getEmergencies: async (): Promise<Urgence[]> => {
    const response = await api.get('/admin/emergencies');
    return response.data;
  },
  
  getOrders: async (): Promise<Commande[]> => {
    const response = await api.get('/admin/orders');
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
  
  getCentresSante: async (): Promise<CentreSante[]> => {
    const response = await api.get('/admin/centres-sante');
    return response.data;
  },
  
  createCentreSante: async (data: any): Promise<{ success: boolean; centre: CentreSante }> => {
    const response = await api.post('/admin/centres-sante', data);
    return response.data;
  },
  
  createArticle: async (data: any): Promise<{ success: boolean; article: Article }> => {
    const response = await api.post('/articles', data);
    return response.data;
  },
  
  updateArticle: async (id: number, data: any): Promise<{ success: boolean; article: Article }> => {
    const response = await api.put(`/articles/${id}`, data);
    return response.data;
  },
  
  deleteArticle: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/articles/${id}`);
    return response.data;
  },
};

export default api;