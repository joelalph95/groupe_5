// Constantes de l'application
export const COLORS = {
  primary: '#2196F3',
  secondary: '#4CAF50',
  danger: '#ff4444',
  warning: '#FF9800',
  dark: '#333333',
  light: '#f5f5f5',
  white: '#ffffff',
  black: '#000000',
  gray: '#999999'
};

export const API_CONFIG = {
  baseURL: 'https://api.miaina.com/v1',
  timeout: 30000,
  retryAttempts: 3
};

export const GPS_CONFIG = {
  updateInterval: 5000, // 5 secondes
  distanceFilter: 10, // 10 mètres
  accuracy: 'high'
};

export const AMBULANCE_STATUS = {
  AVAILABLE: 'available',
  ON_MISSION: 'on_mission',
  BUSY: 'busy',
  OFFLINE: 'offline'
};

export const EMERGENCY_TYPES = [
  { id: 'cardiac', label: 'Crise cardiaque', color: '#ff4444' },
  { id: 'accident', label: 'Accident', color: '#FF9800' },
  { id: 'stroke', label: 'AVC', color: '#f44336' },
  { id: 'respiratory', label: 'Détresse respiratoire', color: '#9C27B0' },
  { id: 'trauma', label: 'Traumatisme', color: '#FF5722' },
  { id: 'obstetric', label: 'Urgence obstétrique', color: '#E91E63' },
  { id: 'hemorrhage', label: 'Hémorragie', color: '#D32F2F' },
  { id: 'unconscious', label: 'Perte de connaissance', color: '#607D8B' }
];

export const STORAGE_KEYS = {
  USER_DATA: '@miaina_user_data',
  LAST_POSITION: '@miaina_last_position',
  EMERGENCY_REQUESTS: '@miaina_emergency_requests',
  OFFLINE_ORDERS: '@miaina_offline_orders',
  APP_SETTINGS: '@miaina_settings'
};

export const ROUTES = {
  HOME: 'Home',
  MAP: 'Map',
  AMBULANCE: 'Ambulance',
  ALERT: 'Alert',
  OFFLINE: 'Offline'
};

export const DEFAULT_SETTINGS = {
  notifications: true,
  autoSMS: true,
  shareLocation: true,
  offlineMode: true,
  language: 'fr'
};
