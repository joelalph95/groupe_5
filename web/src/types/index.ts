export interface User {
  id: number;
  nom?: string;
  prenom?: string;
  nom_pharmacie?: string;
  responsable?: string;
  telephone: string;
  email?: string;
  role: 'PATIENT' | 'AMBULANCIER' | 'PHARMACIEN' | 'ADMIN';
  sexe?: 'MASCULIN' | 'FEMININ';
  groupe_sanguin?: string;
  adresse?: string;
  statut?: string;
  niveau_acces?: string;
  livraison_disponible?: boolean;
  zone_couverture?: string;
}

export interface Patient extends User {
  nom: string;
  prenom: string;
  date_naissance?: string;
  allergies?: string;
  maladies_connues?: string;
  contact_urgence?: string;
}

export interface Ambulancier extends User {
  nom: string;
  matricule?: string;
  statut: 'DISPONIBLE' | 'EN_ROUTE' | 'EN_INTERVENTION' | 'EN_HOPITAL' | 'RETOUR_BASE' | 'HORS_SERVICE';
  position_gps?: string;
  zone_couverture?: string;
}

export interface Pharmacien extends User {
  nom_pharmacie: string;
  responsable: string;
  latitude?: number;
  longitude?: number;
  livraison_disponible: boolean;
  horaires_ouverture?: string;
}

export interface Admin extends User {
  nom: string;
  prenom: string;
  niveau_acces: 'ADMIN_PRINCIPAL' | 'ADMIN_STANDARD' | 'SUPERVISEUR';
}

export interface Urgence {
  id: number;
  patient_id?: number;
  type_urgence: string;
  niveau_priorite: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'CRITIQUE';
  localisation?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  statut: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';
  date_alerte: string;
  ambulancier_id?: number;
  Patient?: Patient;
  Ambulancier?: Ambulancier;
}

export interface Medicament {
  id: number;
  nom: string;
  description?: string;
  categorie?: string;
  prix: number;
  stock: number;
  pharmacien_id: number;
  necessite_ordonnance: boolean;
  image_url?: string;
  Pharmacien?: Pharmacien;
}

export interface Commande {
  id: number;
  patient_id: number;
  pharmacien_id?: number;
  montant_total: number;
  statut: 'PANIER' | 'CONFIRMED' | 'PREPARED' | 'EN_LIVRAISON' | 'DELIVERED' | 'CANCELLED';
  date_commande: string;
  adresse_livraison?: string;
  mode_paiement?: string;
  ordonnance_url?: string;
  CommandeDetails?: CommandeDetail[];
  Pharmacien?: Pharmacien;
  Patient?: Patient;
}

export interface CommandeDetail {
  id: number;
  commande_id: number;
  medicament_id: number;
  quantite: number;
  prix_unitaire: number;
  Medicament?: Medicament;
}

export interface CentreSante {
  id: number;
  nom: string;
  type: 'HOPITAL' | 'CLINIQUE' | 'CSB' | 'DISPENSAIRE';
  adresse?: string;
  telephone?: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
  urgences_24_7: boolean;
  capacite_lits?: number;
}

export interface Article {
  id: number;
  titre: string;
  contenu: string;
  resume?: string;
  categorie: 'GENERAL' | 'FEMME' | 'HOMME' | 'ENFANT' | 'MENTAL' | 'NUTRITION' | 'SPORT' | 'VACCINATION';
  tags?: string;
  image_url?: string;
  auteur?: string;
  date_publication: string;
  vues: number;
  likes: number;
  cible_genre: 'TOUS' | 'MASCULIN' | 'FEMININ';
}

export interface CartItem {
  medicament_id: number;
  nom: string;
  prix: number;
  quantite: number;
  necessite_ordonnance: boolean;
}

export interface Notification {
  id: number;
  type: string;
  titre: string;
  message: string;
  date_creation: string;
  lu: boolean;
}

export interface Rappel {
  id: number;
  titre: string;
  description?: string;
  type: 'MEDICAMENT' | 'REGLE' | 'VACCIN' | 'RDV' | 'EXAMEN' | 'AUTRE';
  date_rappel: string;
  heure_rappel?: string;
  recurrence: 'UNE_FOIS' | 'JOURNALIER' | 'HEBDOMADAIRE' | 'MENSUEL';
  actif: boolean;
}

export interface ChatMessage {
  from: 'user' | 'bot';
  text: string;
  timestamp?: Date;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
}

export interface Mission {
  id: string;
  patient: string;
  phone: string;
  location: string;
  severity: string;
  status: 'ASSIGNED' | 'EN_ROUTE' | 'ON_SCENE' | 'EN_HOPITAL' | 'COMPLETED';
  assignedAt: string;
  lat: number;
  lng: number;
  hospital: string;
}

export interface ToastType {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warn';
}