import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import Chart from 'chart.js/auto';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContexte';
import { useToast } from '../hooks/useToast';
import { adminService, pharmacyService, emergencyService } from '../services/api';
import socketService from '../services/socket';
import Toast from '../components/common/Toast';
import Loading from '../components/common/Loading';

const TANA: [number, number] = [-18.8792, 47.5200];

// Interfaces alignées avec les types de l'API
interface Medicine {
  id: number;
  nom: string;
  description?: string;
  categorie: string;
  prix: number;
  stock: number;
  necessite_ordonnance: boolean;
  pharmacien_id?: number;
  Pharmacien?: { nom_pharmacie: string };
  date_ajout?: string;
}

interface Ambulance {
  id: number;
  nom: string;
  matricule?: string;
  telephone: string;
  statut: string;
  zone_couverture?: string;
  mot_de_passe_hash?: string;
  position_gps?: string;
  urgence_active_id?: number;
}

interface Hospital {
  id: number;
  nom: string;
  type?: string;
  telephone?: string;
  adresse?: string;
  latitude?: number;
  longitude?: number;
  capacite_lits?: number;
  urgences_24_7?: boolean;
}

interface Pharmacy {
  id: number;
  nom_pharmacie: string;
  responsable: string;
  telephone: string;
  email?: string;
  adresse?: string;
  statut: string;
  livraison_disponible: boolean;
  latitude?: number;
  longitude?: number;
  horaires_ouverture?: string;
}

interface User {
  id: number;
  email?: string;
  nom?: string;
  prenom?: string;
  telephone: string;
  role: string;
  sexe?: string;
  groupe_sanguin?: string;
  statut: string;
  date_inscription?: string;
  active?: boolean;
}

interface Order {
  id: number;
  Patient?: { nom: string; prenom: string };
  Pharmacien?: { nom_pharmacie: string };
  date_commande: string;
  montant_total: number;
  statut: string;
  adresse_livraison?: string;
  mode_paiement?: string;
  ordonnance_url?: string;
  CommandeDetails?: Array<{
    id: number;
    quantite: number;
    prix_unitaire: number;
    Medicament?: { nom: string };
  }>;
}

interface Emergency {
  id: number;
  Patient?: { nom: string; prenom: string; telephone: string };
  type_urgence?: string;
  niveau_priorite?: string;
  localisation?: string;
  statut: string;
  date_alerte: string;
  Ambulancier?: { nom: string };
  latitude?: number;
  longitude?: number;
  description?: string;
  centre_sante_id?: number;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toasts, showToast, removeToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Modal states
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Data - Initialisés vides pour charger depuis l'API
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [stats, setStats] = useState<any>({});
  
  // Filters
  const [stockCategoryFilter, setStockCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [stockSearch, setStockSearch] = useState('');
  const [emergencyFilter, setEmergencyFilter] = useState('ALL');
  
  // Map and charts refs
  const adminMapRef = useRef<L.Map | null>(null);
  const chartRefs = useRef<{ [key: string]: Chart | null }>({});

  // ==================== FONCTIONS DE CHARGEMENT API ====================
  
  const loadStats = async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const loadMedicines = async () => {
    try {
      setLoading(true);
      const data = await adminService.getMedicaments();
      setMedicines(data as Medicine[]);
    } catch (error) {
      console.error('Erreur chargement médicaments:', error);
      showToast('Erreur chargement des médicaments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAmbulances = async () => {
    try {
      const data = await adminService.getAmbulances();
      setAmbulances(data as Ambulance[]);
    } catch (error) {
      console.error('Erreur chargement ambulances:', error);
      showToast('Erreur chargement des ambulances', 'error');
    }
  };

  const loadHospitals = async () => {
    try {
      const data = await adminService.getCentresSante();
      setHospitals(data as Hospital[]);
    } catch (error) {
      console.error('Erreur chargement hôpitaux:', error);
    }
  };

  const loadPharmacies = async () => {
    try {
      const data = await adminService.getPharmacies();
      setPharmacies(data as Pharmacy[]);
    } catch (error) {
      console.error('Erreur chargement pharmacies:', error);
      showToast('Erreur chargement des pharmacies', 'error');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await adminService.getUsers();
      const allUsers: User[] = [
        ...(data.patients || []).map((p: any) => ({ ...p, role: 'PATIENT', nom: p.nom, prenom: p.prenom, statut: p.statut || 'ACTIF' })),
        ...(data.ambulanciers || []).map((a: any) => ({ ...a, role: 'AMBULANCIER', nom: a.nom, statut: a.statut === 'DISPONIBLE' ? 'ACTIF' : 'INACTIF' })),
        ...(data.pharmaciens || []).map((ph: any) => ({ ...ph, role: 'PHARMACIEN', nom: ph.nom_pharmacie, statut: ph.statut })),
        ...(data.admins || []).map((a: any) => ({ ...a, role: 'ADMIN', nom: a.nom, prenom: a.prenom, statut: a.statut }))
      ];
      setUsers(allUsers);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await adminService.getOrders();
      setOrders(data as Order[]);
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
    }
  };

  const loadEmergencies = async () => {
    try {
      const data = await adminService.getEmergencies();
      setEmergencies(data as Emergency[]);
    } catch (error) {
      console.error('Erreur chargement urgences:', error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadStats(),
      loadMedicines(),
      loadAmbulances(),
      loadHospitals(),
      loadPharmacies(),
      loadUsers(),
      loadOrders(),
      loadEmergencies()
    ]);
    setLoading(false);
  };

  // ==================== CRUD MÉDICAMENTS ====================
  
  const addMedicine = async () => {
    const nom = (document.getElementById('medName') as HTMLInputElement)?.value.trim();
    const categorie = (document.getElementById('medCategory') as HTMLSelectElement)?.value;
    const description = (document.getElementById('medDesc') as HTMLTextAreaElement)?.value.trim();
    const prix = parseFloat((document.getElementById('medPrice') as HTMLInputElement)?.value);
    const stock = parseInt((document.getElementById('medStock') as HTMLInputElement)?.value);
    const necessite_ordonnance = (document.getElementById('medRx') as HTMLInputElement)?.checked;
    
    if (!nom || !prix || isNaN(stock)) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const result = await adminService.createMedicament({
        nom, description: description || 'Nouveau médicament', categorie, prix, stock, necessite_ordonnance
      });
      
      if (result.success) {
        showToast('Médicament ajouté avec succès', 'success');
        setShowMedicineModal(false);
        await loadMedicines();
        if (currentPage === 'stock') renderStock();
      }
    } catch (error) {
      console.error('Erreur ajout médicament:', error);
      showToast('Erreur lors de l\'ajout', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateMedicineStock = async (id: number, delta: number) => {
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) return;
    
    const newStock = Math.max(0, medicine.stock + delta);
    try {
      const result = await adminService.updateMedicamentStock(id, newStock);
      if (result.success) {
        await loadMedicines();
        if (newStock < 20) showToast(`⚠️ Stock faible: ${medicine.nom} (${newStock} restants)`, 'warn');
        else showToast(`Stock mis à jour: ${medicine.nom}`, 'success');
        if (currentPage === 'stock') renderStock();
      }
    } catch (error) {
      console.error('Erreur mise à jour stock:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const editMedicineStock = async (id: number) => {
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) return;
    
    const newStock = prompt(`Nouveau stock pour ${medicine.nom}:`, medicine.stock.toString());
    if (newStock !== null && !isNaN(parseInt(newStock))) {
      try {
        const result = await adminService.updateMedicamentStock(id, parseInt(newStock));
        if (result.success) {
          await loadMedicines();
          showToast(`Stock de ${medicine.nom} mis à jour`, 'success');
          if (currentPage === 'stock') renderStock();
        }
      } catch (error) {
        console.error('Erreur modification stock:', error);
        showToast('Erreur lors de la modification', 'error');
      }
    }
  };

  // ==================== CRUD AMBULANCES ====================
  
  const addAmbulance = async () => {
    const nom = (document.getElementById('ambName') as HTMLInputElement)?.value;
    const telephone = (document.getElementById('ambPhone') as HTMLInputElement)?.value;
    const matricule = (document.getElementById('ambMatricule') as HTMLInputElement)?.value;
    const zone_couverture = (document.getElementById('ambZone') as HTMLSelectElement)?.value;
    const mot_de_passe = (document.getElementById('ambPassword') as HTMLInputElement)?.value;
    
    if (!nom || !telephone) {
      showToast('Veuillez remplir les champs obligatoires', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const result = await adminService.createAmbulance({
        nom, telephone, matricule, zone_couverture, mot_de_passe
      });
      
      if (result.success) {
        showToast(`Ambulance ${nom} ajoutée`, 'success');
        setShowAmbulanceModal(false);
        await loadAmbulances();
        if (currentPage === 'ambulances') setTimeout(initAmbulanceMap, 100);
      }
    } catch (error) {
      console.error('Erreur ajout ambulance:', error);
      showToast('Erreur lors de l\'ajout', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAmbulanceStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'DISPONIBLE' ? 'EN_INTERVENTION' : 'DISPONIBLE';
    try {
      const result = await adminService.updateAmbulanceStatus(id, newStatus);
      if (result.success) {
        await loadAmbulances();
        showToast(`Ambulance mise à jour`, 'info');
        if (currentPage === 'ambulances') setTimeout(initAmbulanceMap, 100);
      }
    } catch (error) {
      console.error('Erreur mise à jour ambulance:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  // ==================== CRUD PHARMACIES ====================
  
  const addPharmacy = async () => {
    const nom_pharmacie = (document.getElementById('pharmName') as HTMLInputElement)?.value;
    const responsable = (document.getElementById('pharmResp') as HTMLInputElement)?.value;
    const telephone = (document.getElementById('pharmPhone') as HTMLInputElement)?.value;
    const email = (document.getElementById('pharmEmail') as HTMLInputElement)?.value;
    const adresse = (document.getElementById('pharmAddress') as HTMLInputElement)?.value;
    const mot_de_passe = (document.getElementById('pharmPassword') as HTMLInputElement)?.value;
    const livraison_disponible = (document.getElementById('pharmDelivery') as HTMLInputElement)?.checked;
    
    if (!nom_pharmacie || !telephone) {
      showToast('Veuillez remplir les champs obligatoires', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const result = await adminService.createPharmacie({
        nom_pharmacie, responsable, telephone, email, adresse, mot_de_passe, livraison_disponible
      });
      
      if (result.success) {
        showToast(`${nom_pharmacie} ajoutée`, 'success');
        setShowPharmacyModal(false);
        await loadPharmacies();
      }
    } catch (error) {
      console.error('Erreur ajout pharmacie:', error);
      showToast('Erreur lors de l\'ajout', 'error');
    } finally {
      setLoading(false);
    }
  };

  const togglePharmacyStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    try {
      const result = await adminService.updatePharmacieStatus(id, newStatus);
      if (result.success) {
        await loadPharmacies();
        showToast(`Pharmacie mise à jour`, 'info');
      }
    } catch (error) {
      console.error('Erreur mise à jour pharmacie:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  // ==================== CRUD HÔPITAUX ====================
  
  const addHospital = async () => {
    const nom = (document.getElementById('hospName') as HTMLInputElement)?.value;
    const telephone = (document.getElementById('hospPhone') as HTMLInputElement)?.value;
    const adresse = (document.getElementById('hospAddress') as HTMLInputElement)?.value;
    const type = (document.getElementById('hospType') as HTMLSelectElement)?.value;
    const capacite_lits = parseInt((document.getElementById('hospCapacity') as HTMLInputElement)?.value) || 100;
    const urgences_24_7 = (document.getElementById('hospEmergency') as HTMLInputElement)?.checked;
    const latitude = parseFloat((document.getElementById('hospLat') as HTMLInputElement)?.value) || -18.8792;
    const longitude = parseFloat((document.getElementById('hospLng') as HTMLInputElement)?.value) || 47.5200;
    
    if (!nom || !telephone) {
      showToast('Veuillez remplir les champs obligatoires', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const result = await adminService.createCentreSante({
        nom, telephone, adresse, type, capacite_lits, urgences_24_7, latitude, longitude
      });
      
      if (result.success) {
        showToast(`${nom} ajouté`, 'success');
        setShowHospitalModal(false);
        await loadHospitals();
      }
    } catch (error) {
      console.error('Erreur ajout hôpital:', error);
      showToast('Erreur lors de l\'ajout', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==================== CRUD UTILISATEURS ====================
  
  const addUser = async () => {
    const nom = (document.getElementById('userNom') as HTMLInputElement)?.value;
    const prenom = (document.getElementById('userPrenom') as HTMLInputElement)?.value;
    const email = (document.getElementById('userEmail') as HTMLInputElement)?.value;
    const telephone = (document.getElementById('userPhone') as HTMLInputElement)?.value;
    const role = (document.getElementById('userRole') as HTMLSelectElement)?.value;
    const sexe = (document.getElementById('userGender') as HTMLSelectElement)?.value;
    const groupe_sanguin = (document.getElementById('userBlood') as HTMLSelectElement)?.value;
    const mot_de_passe = (document.getElementById('userPassword') as HTMLInputElement)?.value;
    
    if (!nom || !telephone) {
      showToast('Veuillez remplir les champs obligatoires', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const result = await adminService.createUser({
        nom, prenom, email, telephone, mot_de_passe, role, sexe, groupe_sanguin
      });
      
      if (result.success) {
        showToast(`Utilisateur ${prenom} ${nom} ajouté`, 'success');
        setShowUserModal(false);
        await loadUsers();
      }
    } catch (error) {
      console.error('Erreur ajout utilisateur:', error);
      showToast('Erreur lors de l\'ajout', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id: number, type: string, currentActive: boolean) => {
    try {
      const result = await adminService.updateUser(id, type, { statut: currentActive ? 'INACTIF' : 'ACTIF' });
      if (result.success) {
        await loadUsers();
        showToast(`Utilisateur mis à jour`, 'info');
      }
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  // ==================== URGENCES & COMMANDES ====================
  
  const updateEmergencyStatus = async (id: number, statut: string) => {
    try {
      const result = await adminService.updateEmergencyStatus(id, statut);
      if (result.success) {
        await loadEmergencies();
        showToast(`Urgence #${id} mise à jour`, 'success');
      }
    } catch (error) {
      console.error('Erreur mise à jour urgence:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const updateOrderStatus = async (id: number, statut: string) => {
    try {
      const result = await adminService.updateOrderStatus(id, statut);
      if (result.success) {
        await loadOrders();
        showToast(`Commande #${id} ${statut}`, 'success');
      }
    } catch (error) {
      console.error('Erreur mise à jour commande:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  // ==================== UTILITAIRES ====================
  
  const exportReport = (type: string) => {
    showToast(`Export ${type} en cours...`, 'success');
    setTimeout(() => showToast(`Rapport ${type} téléchargé`, 'info'), 1000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNewEmergency = (data: any) => {
    showToast(`Nouvelle urgence: ${data.type_urgence}`, 'warn');
    loadEmergencies();
  };

  const handleNewBIP = (data: any) => {
    showToast(`📞 BIP reçu de: ${data.expediteur}`, 'warn');
  };

  // ==================== MAP ET GRAPHIQUES ====================
  
  const initAmbulanceMap = () => {
    const mapEl = document.getElementById('adminAmbulanceMap');
    if (!mapEl) return;
    
    if (adminMapRef.current) {
      adminMapRef.current.remove();
      adminMapRef.current = null;
    }
    
    adminMapRef.current = L.map('adminAmbulanceMap', { 
      attributionControl: false,
      zoomControl: true 
    }).setView(TANA, 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(adminMapRef.current);
    
    ambulances.forEach(a => {
      const lat = -18.8792 + (Math.random() - 0.5) * 0.05;
      const lng = 47.5200 + (Math.random() - 0.5) * 0.05;
      const color = a.statut === 'DISPONIBLE' ? '#10b981' : '#52525b';
      const icon = L.divIcon({
        className: '',
        html: `<div class="ambulance-marker" style="background:${color}"><i class="fas fa-ambulance text-white"></i></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      L.marker([lat, lng], { icon }).addTo(adminMapRef.current!).bindPopup(`<b>${a.nom}</b><br>Zone: ${a.zone_couverture || 'N/A'}<br>Statut: ${a.statut === 'DISPONIBLE' ? 'Disponible' : 'En intervention'}`);
    });
    
    setTimeout(() => {
      if (adminMapRef.current) {
        adminMapRef.current.invalidateSize();
      }
    }, 200);
  };

  const renderCharts = () => {
    // Graphique des urgences
    const ctx1 = document.getElementById('chartEmergencies') as HTMLCanvasElement;
    if (ctx1) {
      if (chartRefs.current.emerg) chartRefs.current.emerg.destroy();
      chartRefs.current.emerg = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          datasets: [{ label: 'Urgences', data: [4, 6, 3, 8, 5, 7, 4], backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 8 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: { x: { ticks: { color: '#a1a1aa' }, grid: { display: false } }, y: { ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(255,255,255,0.05)' } } }
        }
      });
    }
    
    // Graphique des revenus
    const ctx2 = document.getElementById('chartRevenue') as HTMLCanvasElement;
    if (ctx2) {
      if (chartRefs.current.rev) chartRefs.current.rev.destroy();
      chartRefs.current.rev = new Chart(ctx2, {
        type: 'line',
        data: {
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          datasets: [{ label: 'Revenus (Ar)', data: [45000, 62000, 38000, 81000, 55000, 72000, 48000], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, pointRadius: 4 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: { x: { ticks: { color: '#a1a1aa' }, grid: { display: false } }, y: { ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(255,255,255,0.05)' } } }
        }
      });
    }
    
    // Graphique de sévérité
    const ctx3 = document.getElementById('chartSeverity') as HTMLCanvasElement;
    if (ctx3) {
      if (chartRefs.current.sev) chartRefs.current.sev.destroy();
      chartRefs.current.sev = new Chart(ctx3, {
        type: 'doughnut',
        data: {
          labels: ['Critique', 'Élevé', 'Moyen', 'Faible'],
          datasets: [{ data: [2, 5, 8, 3], backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#10b981'], borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa', font: { size: 11 } } } },
          cutout: '60%'
        }
      });
    }
    
    // Graphique des genres
    const ctx4 = document.getElementById('chartGender') as HTMLCanvasElement;
    if (ctx4) {
      if (chartRefs.current.gender) chartRefs.current.gender.destroy();
      chartRefs.current.gender = new Chart(ctx4, {
        type: 'bar',
        data: {
          labels: ['Femmes', 'Hommes'],
          datasets: [{ label: 'Utilisateurs', data: [users.filter(u => u.sexe === 'FEMININ').length, users.filter(u => u.sexe === 'MASCULIN').length], backgroundColor: ['#ec4899', '#06b6d4'], borderRadius: 8 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: { x: { ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(255,255,255,0.05)' } }, y: { ticks: { color: '#a1a1aa' }, grid: { display: false } } }
        }
      });
    }
    
    // Graphique mensuel
    const ctx5 = document.getElementById('chartMonthly') as HTMLCanvasElement;
    if (ctx5) {
      if (chartRefs.current.monthly) chartRefs.current.monthly.destroy();
      chartRefs.current.monthly = new Chart(ctx5, {
        type: 'line',
        data: {
          labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
          datasets: [
            { label: 'Urgences', data: [12, 15, 18, 22, 25, 28, 32, 35, 38, 42, 45, 48], borderColor: '#ef4444', tension: 0.3 },
            { label: 'Commandes', data: [18, 22, 28, 35, 42, 48, 55, 62, 70, 78, 85, 92], borderColor: '#06b6d4', tension: 0.3 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { position: 'top', labels: { color: '#a1a1aa' } } },
          scales: { x: { ticks: { color: '#a1a1aa' }, grid: { display: false } }, y: { ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(255,255,255,0.05)' } } }
        }
      });
    }
    
    // Graphique stock par catégorie
    const ctx6 = document.getElementById('chartStockCategory') as HTMLCanvasElement;
    if (ctx6) {
      if (chartRefs.current.stockCat) chartRefs.current.stockCat.destroy();
      const categoriesMap = new Map<string, number>();
      medicines.forEach(m => {
        const cat = m.categorie;
        if (cat) {
          categoriesMap.set(cat, (categoriesMap.get(cat) || 0) + m.stock);
        }
      });
      const categories = Array.from(categoriesMap.keys());
      const stockByCat = categories.map(cat => categoriesMap.get(cat) || 0);
      chartRefs.current.stockCat = new Chart(ctx6, {
        type: 'bar',
        data: { labels: categories, datasets: [{ label: 'Stock', data: stockByCat, backgroundColor: 'rgba(16,185,129,0.6)', borderRadius: 8 }] },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: { x: { ticks: { color: '#a1a1aa', font: { size: 10 } }, grid: { display: false } }, y: { ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(255,255,255,0.05)' } } }
        }
      });
    }
  };

  const getStockClass = (stock: number) => {
    if (stock < 20) return 'stock-low';
    if (stock <= 50) return 'stock-medium';
    return 'stock-good';
  };

  const getStockStatus = (stock: number) => {
    if (stock < 20) return { text: 'Stock faible', color: 'bg-danger/20 text-danger' };
    if (stock <= 50) return { text: 'Stock moyen', color: 'bg-warn/20 text-warn' };
    return { text: 'Stock bon', color: 'bg-success/20 text-success' };
  };

  const renderStock = () => {
    const filtered = medicines.filter(m => {
      if (stockCategoryFilter !== 'ALL' && m.categorie !== stockCategoryFilter) return false;
      if (stockStatusFilter === 'LOW' && m.stock >= 20) return false;
      if (stockStatusFilter === 'MEDIUM' && (m.stock < 20 || m.stock > 50)) return false;
      if (stockStatusFilter === 'GOOD' && m.stock <= 50) return false;
      if (stockSearch && !m.nom.toLowerCase().includes(stockSearch.toLowerCase()) && !(m.description || '').toLowerCase().includes(stockSearch.toLowerCase())) return false;
      return true;
    });
    
    const container = document.getElementById('stockList');
    if (!container) return;
    
    if (filtered.length === 0) {
      container.innerHTML = '<div class="text-center py-12 text-zinc-500">Aucun médicament trouvé</div>';
      return;
    }
    
    container.innerHTML = filtered.map(m => {
      const stockStatus = getStockStatus(m.stock);
      return `
        <div class="card p-5 ${getStockClass(m.stock)}">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-info/15 flex items-center justify-center"><i class="fas fa-pills text-info text-xl"></i></div>
              <div>
                <p class="font-semibold">${m.nom}</p>
                <p class="text-xs text-zinc-400">${m.description || ''}</p>
                <div class="flex gap-2 mt-1">
                  <span class="badge bg-zinc-700 text-zinc-300">${m.categorie}</span>
                  ${m.necessite_ordonnance ? '<span class="badge bg-danger/20 text-danger">Ordonnance</span>' : '<span class="badge bg-success/20 text-success">Libre</span>'}
                </div>
              </div>
            </div>
            <div class="text-right">
              <p class="text-info font-bold">${m.prix.toLocaleString('fr-MG')} Ar</p>
              <span class="badge ${stockStatus.color} mt-1">${stockStatus.text}</span>
            </div>
          </div>
          <div class="mt-4">
            <div class="flex justify-between text-sm mb-1"><span>Stock actuel</span><span class="font-bold">${m.stock} unités</span></div>
            <div class="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div class="h-full rounded-full ${m.stock < 20 ? 'bg-danger' : m.stock <= 50 ? 'bg-warn' : 'bg-success'}" style="width: ${Math.min(100, (m.stock / 200) * 100)}%"></div>
            </div>
          </div>
          <div class="flex gap-2 mt-4">
            <button onclick="window.editStock(${m.id})" class="flex-1 py-2 rounded-xl bg-info/15 text-info text-xs font-semibold"><i class="fas fa-edit mr-1"></i>Modifier</button>
            <button onclick="window.updateStockQuantity(${m.id}, -1)" class="px-4 py-2 rounded-xl bg-warn/15 text-warn text-xs"><i class="fas fa-minus"></i></button>
            <button onclick="window.updateStockQuantity(${m.id}, 1)" class="px-4 py-2 rounded-xl bg-success/15 text-success text-xs"><i class="fas fa-plus"></i></button>
          </div>
        </div>
      `;
    }).join('');
    
    const totalProducts = document.getElementById('totalProducts');
    if (totalProducts) totalProducts.textContent = medicines.length.toString();
    const lowStockCount = document.getElementById('lowStockCount');
    if (lowStockCount) lowStockCount.textContent = medicines.filter(m => m.stock < 20).length.toString();
    const mediumStockCount = document.getElementById('mediumStockCount');
    if (mediumStockCount) mediumStockCount.textContent = medicines.filter(m => m.stock >= 20 && m.stock <= 50).length.toString();
    const goodStockCount = document.getElementById('goodStockCount');
    if (goodStockCount) goodStockCount.textContent = medicines.filter(m => m.stock > 50).length.toString();
  };

  // ==================== USE EFFECTS ====================
  
  useEffect(() => {
    loadAllData();
    
    if (user) {
      socketService.connect(localStorage.getItem('token') || '');
      socketService.joinRoom('admin');
      socketService.onNewEmergency(handleNewEmergency);
      socketService.onNewBIP(handleNewBIP);
    }
    
    return () => {
      socketService.off('new-emergency');
      socketService.off('new-bip');
    };
  }, [user]);

  useEffect(() => {
    if (currentPage === 'ambulances' && ambulances.length > 0) {
      setTimeout(initAmbulanceMap, 100);
    }
    if (currentPage === 'dashboard') {
      setTimeout(renderCharts, 100);
    }
    if (currentPage === 'stock') {
      setTimeout(renderStock, 100);
    }
  }, [currentPage, medicines, ambulances, users, stockCategoryFilter, stockStatusFilter, stockSearch]);

  // ==================== EXPOSER FONCTIONS AU GLOBAL ====================
  
  React.useEffect(() => {
    (window as any).editStock = editMedicineStock;
    (window as any).updateStockQuantity = updateMedicineStock;
    (window as any).filterStock = renderStock;
    (window as any).showPage = (page: string) => {
      setCurrentPage(page);
      setMobileMenuOpen(false);
    };
    (window as any).toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    (window as any).showAddMedicine = () => setShowMedicineModal(true);
    (window as any).addMedicine = addMedicine;
    (window as any).toggleAmbulance = (id: number) => {
      const amb = ambulances.find(a => a.id === id);
      if (amb) toggleAmbulanceStatus(id, amb.statut);
    };
    (window as any).togglePharmacy = (id: number) => {
      const pharm = pharmacies.find(p => p.id === id);
      if (pharm) togglePharmacyStatus(id, pharm.statut);
    };
    (window as any).updateEmergency = updateEmergencyStatus;
    (window as any).updateOrder = updateOrderStatus;
    (window as any).toggleUser = (id: number) => {
      const userItem = users.find(u => u.id === id);
      if (userItem) toggleUserStatus(id, userItem.role, userItem.statut === 'ACTIF');
    };
    (window as any).exportReport = exportReport;
    (window as any).filterEmergencies = (filter: string) => setEmergencyFilter(filter);
    (window as any).showStockAlert = () => {
      const lowStock = medicines.filter(m => m.stock < 20);
      if (lowStock.length === 0) showToast('Aucun stock faible détecté', 'success');
      else showToast(`${lowStock.length} médicament(s) en stock faible`, 'warn');
    };
  }, [medicines, ambulances, pharmacies, users]);

  const filteredEmergencies = emergencyFilter === 'ALL' ? emergencies : emergencies.filter(e => e.statut === emergencyFilter);

  // ==================== RENDU JSX ====================
  
  return (
    <div id="adminApp">
      {loading && <Loading />}
      
      <div id="toastContainer" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        {toasts.map(toast => <Toast key={toast.id} toast={toast} onClose={removeToast} />)}
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar Desktop */}
        <div className="w-72 bg-zinc-900 border-r border-zinc-800 fixed h-full z-20 hidden lg:flex flex-col">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-danger to-orange-500 flex items-center justify-center">
                <i className="fas fa-heartbeat text-white text-xl"></i>
              </div>
              <div>
                <p className="font-bold text-lg">MIAINA</p>
                <p className="text-[10px] text-zinc-500">Administration système</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {[
              { page: 'dashboard', icon: 'fa-chart-pie', label: 'Tableau de bord' },
              { page: 'ambulances', icon: 'fa-ambulance', label: 'Ambulances' },
              { page: 'hospitals', icon: 'fa-hospital', label: 'Hôpitaux' },
              { page: 'pharmacies', icon: 'fa-pills', label: 'Pharmacies' },
              { page: 'stock', icon: 'fa-boxes', label: 'Stock Médicaments' },
              { page: 'emergencies', icon: 'fa-exclamation-triangle', label: 'Urgences' },
              { page: 'orders', icon: 'fa-shopping-bag', label: 'Commandes' },
              { page: 'users', icon: 'fa-users', label: 'Utilisateurs' },
              { page: 'reports', icon: 'fa-file-alt', label: 'Rapports' }
            ].map(item => (
              <button
                key={item.page}
                onClick={() => setCurrentPage(item.page)}
                className={`sidebar-item w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition ${currentPage === item.page ? 'active bg-danger/20 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}
              >
                <i className={`fas ${item.icon} w-5`}></i>{item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50">
              <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center"><i className="fas fa-user-shield text-danger"></i></div>
              <div className="flex-1"><p className="text-sm font-semibold">{user?.nom || 'Admin'}</p><p className="text-[10px] text-zinc-500">{user?.niveau_acces || 'Super Admin'}</p></div>
              <div className="flex items-center gap-2">
                <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center mr-1">
                  <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-zinc-400 text-sm`}></i>
                </button>
                <button onClick={handleLogout} className="text-zinc-400 hover:text-danger transition"><i className="fas fa-sign-out-alt"></i></button>
              </div>
            </div>
          </div>
        </div>

        {/* Header Mobile */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 glass px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-bars text-zinc-400"></i></button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-danger to-orange-500 flex items-center justify-center"><i className="fas fa-heartbeat text-white"></i></div>
            <p className="font-bold">MIAINA Admin</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center"><i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-zinc-400 text-sm`}></i></button>
            <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-sign-out-alt text-zinc-400"></i></button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/70" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="absolute left-0 top-0 bottom-0 w-80 bg-zinc-900 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-6 p-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-danger to-orange-500 flex items-center justify-center"><i className="fas fa-heartbeat text-white"></i></div>
                  <div><p className="font-bold">MIAINA</p><p className="text-[10px] text-zinc-500">Administration</p></div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-full bg-zinc-800"><i className="fas fa-times text-zinc-400 text-sm"></i></button>
              </div>
              <div className="space-y-1">
                {['dashboard', 'ambulances', 'hospitals', 'pharmacies', 'stock', 'emergencies', 'orders', 'users', 'reports'].map(page => (
                  <button
                    key={page}
                    onClick={() => { setCurrentPage(page); setMobileMenuOpen(false); }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm flex items-center gap-3 ${currentPage === page ? 'bg-danger/20 text-white' : 'text-zinc-400'}`}
                  >
                    <i className={`fas fa-${page === 'dashboard' ? 'chart-pie' : page === 'ambulances' ? 'ambulance' : page === 'hospitals' ? 'hospital' : page === 'pharmacies' ? 'pills' : page === 'stock' ? 'boxes' : page === 'emergencies' ? 'exclamation-triangle' : page === 'orders' ? 'shopping-bag' : page === 'users' ? 'users' : 'file-alt'} w-5`}></i>
                    {page === 'dashboard' ? 'Tableau de bord' : page === 'ambulances' ? 'Ambulances' : page === 'hospitals' ? 'Hôpitaux' : page === 'pharmacies' ? 'Pharmacies' : page === 'stock' ? 'Stock' : page === 'emergencies' ? 'Urgences' : page === 'orders' ? 'Commandes' : page === 'users' ? 'Utilisateurs' : 'Rapports'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-72 pt-16 lg:pt-0 p-4 md:p-6">
          
          {/* ==================== DASHBOARD ==================== */}
          {currentPage === 'dashboard' && (
            <div>
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold">Tableau de bord</h1>
                <p className="text-zinc-400 text-sm mt-1">Vue d'ensemble du système MIAINA</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
                <div className="stat-card card p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-danger/15 flex items-center justify-center"><i className="fas fa-exclamation-triangle text-danger text-lg md:text-xl"></i></div>
                    <span className="badge bg-danger/20 text-danger">+12%</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">{stats.urgences || 0}</p>
                  <p className="text-xs text-zinc-400 mt-1">Urgences totales</p>
                </div>
                <div className="stat-card card p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-info/15 flex items-center justify-center"><i className="fas fa-shopping-bag text-info text-lg md:text-xl"></i></div>
                    <span className="badge bg-info/20 text-info">+18%</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">{stats.commandes || 0}</p>
                  <p className="text-xs text-zinc-400 mt-1">Commandes totales</p>
                </div>
                <div className="stat-card card p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-success/15 flex items-center justify-center"><i className="fas fa-users text-success text-lg md:text-xl"></i></div>
                    <span className="badge bg-success/20 text-success">+23%</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">{stats.patients || 0}</p>
                  <p className="text-xs text-zinc-400 mt-1">Patients inscrits</p>
                </div>
                <div className="stat-card card p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-warn/15 flex items-center justify-center"><i className="fas fa-boxes text-warn text-lg md:text-xl"></i></div>
                    <span className="badge bg-warn/20 text-warn">-5%</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">{stats.medicaments || 0}</p>
                  <p className="text-xs text-zinc-400 mt-1">Produits en stock</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="card p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Urgences (7 jours)</h3><i className="fas fa-chart-line text-info text-sm"></i></div>
                  <canvas id="chartEmergencies" height="200"></canvas>
                </div>
                <div className="card p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Revenus pharmacie (7j)</h3><i className="fas fa-chart-line text-success text-sm"></i></div>
                  <canvas id="chartRevenue" height="200"></canvas>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-4 md:p-6"><h3 className="font-semibold mb-4">Sévérité des urgences</h3><canvas id="chartSeverity" height="180"></canvas></div>
                <div className="card p-4 md:p-6"><h3 className="font-semibold mb-4">Utilisateurs par genre</h3><canvas id="chartGender" height="180"></canvas></div>
                <div className="card p-4 md:p-6"><h3 className="font-semibold mb-4">Stock par catégorie</h3><canvas id="chartStockCategory" height="180"></canvas></div>
              </div>
            </div>
          )}

          {/* ==================== AMBULANCES ==================== */}
          {currentPage === 'ambulances' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des ambulances</h1><p className="text-zinc-400 text-sm">Suivi en temps réel</p></div>
                <button onClick={() => setShowAmbulanceModal(true)} className="px-5 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition"><i className="fas fa-plus mr-2"></i>Ajouter</button>
              </div>
              <div id="adminAmbulanceMap" className="h-72 md:h-80 rounded-2xl overflow-hidden border border-zinc-800 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ambulances.map(a => (
                  <div key={a.id} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${a.statut === 'DISPONIBLE' ? 'bg-success/15' : 'bg-zinc-800'} flex items-center justify-center`}>
                          <i className={`fas fa-ambulance ${a.statut === 'DISPONIBLE' ? 'text-success' : 'text-zinc-600'} text-xl`}></i>
                        </div>
                        <div><p className="font-semibold">{a.nom}</p><p className="text-xs text-zinc-400">{a.matricule || 'N/A'}</p></div>
                      </div>
                      <span className={`badge ${a.statut === 'DISPONIBLE' ? 'bg-success/20 text-success' : 'bg-zinc-700 text-zinc-400'}`}>{a.statut === 'DISPONIBLE' ? 'Disponible' : 'En intervention'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4"><i className="fas fa-phone text-xs"></i>{a.telephone}</div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleAmbulanceStatus(a.id, a.statut)} className={`flex-1 py-2 rounded-xl ${a.statut === 'DISPONIBLE' ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'} text-xs font-semibold`}>
                        {a.statut === 'DISPONIBLE' ? 'Mettre en intervention' : 'Rendre disponible'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== HÔPITAUX ==================== */}
          {currentPage === 'hospitals' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des hôpitaux</h1><p className="text-zinc-400 text-sm">Établissements partenaires</p></div>
                <button onClick={() => setShowHospitalModal(true)} className="px-5 py-2.5 bg-info text-white rounded-xl text-sm font-semibold hover:bg-cyan-600 transition"><i className="fas fa-plus mr-2"></i>Ajouter</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hospitals.map(h => (
                  <div key={h.id} className="card p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-info/15 flex items-center justify-center"><i className="fas fa-hospital text-info text-xl"></i></div>
                      <div><p className="font-semibold">{h.nom}</p><p className="text-xs text-zinc-400">{h.telephone}</p></div>
                    </div>
                    <div className="mt-3 flex justify-between">
                      <span className="text-sm text-zinc-400">Capacité: {h.capacite_lits || 'N/A'} lits</span>
                      <span className={`badge ${h.urgences_24_7 ? 'bg-danger/20 text-danger' : 'bg-zinc-700'}`}>{h.urgences_24_7 ? 'Urgences 24/7' : 'Standard'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== PHARMACIES ==================== */}
          {currentPage === 'pharmacies' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des pharmacies</h1><p className="text-zinc-400 text-sm">Pharmacies partenaires</p></div>
                <button onClick={() => setShowPharmacyModal(true)} className="px-5 py-2.5 bg-warn text-black rounded-xl text-sm font-semibold hover:bg-amber-600 transition"><i className="fas fa-plus mr-2"></i>Ajouter</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pharmacies.map(p => (
                  <div key={p.id} className="card p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-warn/15 flex items-center justify-center"><i className="fas fa-pills text-warn text-xl"></i></div>
                      <div><p className="font-semibold">{p.nom_pharmacie}</p><p className="text-xs text-zinc-400">{p.telephone}</p></div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span className={`badge ${p.statut === 'ACTIF' ? 'bg-success/20 text-success' : 'bg-zinc-700'}`}>{p.statut === 'ACTIF' ? '🟢 En ligne' : '🔴 Hors ligne'}</span>
                      <button onClick={() => togglePharmacyStatus(p.id, p.statut)} className={`text-xs ${p.statut === 'ACTIF' ? 'text-warn' : 'text-success'}`}>
                        <i className="fas fa-power-off mr-1"></i>{p.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== STOCK MÉDICAMENTS ==================== */}
          {currentPage === 'stock' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des stocks</h1><p className="text-zinc-400 text-sm">Inventaire des médicaments</p></div>
                <div className="flex gap-3">
                  <button onClick={() => setShowMedicineModal(true)} className="px-5 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition"><i className="fas fa-plus mr-2"></i>Ajouter médicament</button>
                  <button onClick={() => {
                    const lowStock = medicines.filter(m => m.stock < 20);
                    if (lowStock.length === 0) showToast('Aucun stock faible détecté', 'success');
                    else showToast(`${lowStock.length} médicament(s) en stock faible`, 'warn');
                  }} className="px-5 py-2.5 bg-danger/20 text-danger rounded-xl text-sm font-semibold hover:bg-danger/30 transition"><i className="fas fa-exclamation-triangle mr-2"></i>Alertes stock</button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <select value={stockCategoryFilter} onChange={(e) => setStockCategoryFilter(e.target.value)} className="w-48 bg-zinc-800 border-zinc-700 rounded-xl text-sm p-3">
                  <option value="ALL">Toutes catégories</option>
                  <option value="Antalgique">Antalgique</option>
                  <option value="Antibiotique">Antibiotique</option>
                  <option value="AINS">AINS</option>
                  <option value="Cardiovasculaire">Cardiovasculaire</option>
                  <option value="Gastro">Gastro</option>
                  <option value="Vitamines">Vitamines</option>
                </select>
                <select value={stockStatusFilter} onChange={(e) => setStockStatusFilter(e.target.value)} className="w-48 bg-zinc-800 border-zinc-700 rounded-xl text-sm p-3">
                  <option value="ALL">Tous les statuts</option>
                  <option value="LOW">Stock faible (&lt;20)</option>
                  <option value="MEDIUM">Stock moyen (20-50)</option>
                  <option value="GOOD">Stock bon (&gt;50)</option>
                </select>
                <div className="relative flex-1 max-w-xs">
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i>
                  <input type="text" value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder="Rechercher un médicament..." className="pl-10 bg-zinc-800 border-zinc-700 rounded-xl text-sm p-3 w-full" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div className="card p-4 text-center"><p className="text-2xl font-bold text-info" id="totalProducts">{medicines.length}</p><p className="text-xs text-zinc-400">Produits total</p></div>
                <div className="card p-4 text-center"><p className="text-2xl font-bold text-danger" id="lowStockCount">{medicines.filter(m => m.stock < 20).length}</p><p className="text-xs text-zinc-400">Stock faible</p></div>
                <div className="card p-4 text-center"><p className="text-2xl font-bold text-warn" id="mediumStockCount">{medicines.filter(m => m.stock >= 20 && m.stock <= 50).length}</p><p className="text-xs text-zinc-400">Stock moyen</p></div>
                <div className="card p-4 text-center"><p className="text-2xl font-bold text-success" id="goodStockCount">{medicines.filter(m => m.stock > 50).length}</p><p className="text-xs text-zinc-400">Stock bon</p></div>
              </div>
              
              <div id="stockList" className="space-y-3"></div>
            </div>
          )}

          {/* ==================== URGENCES ==================== */}
          {currentPage === 'emergencies' && (
            <div>
              <div className="mb-6"><h1 className="text-2xl font-bold">Gestion des urgences</h1><p className="text-zinc-400 text-sm">Alertes en temps réel</p></div>
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'].map(filter => (
                  <button key={filter} className={`tab-btn ${emergencyFilter === filter ? 'active' : ''}`} onClick={() => setEmergencyFilter(filter)}>
                    {filter === 'ALL' ? 'Toutes' : filter === 'PENDING' ? 'En attente' : filter === 'ASSIGNED' ? 'Assignées' : filter === 'IN_PROGRESS' ? 'En cours' : filter === 'RESOLVED' ? 'Résolues' : 'Annulées'}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {filteredEmergencies.map(e => {
                  const statusColors: { [key: string]: string } = {
                    PENDING: 'bg-warn/20 text-warn',
                    ASSIGNED: 'bg-info/20 text-info',
                    IN_PROGRESS: 'bg-purple-500/20 text-purple-400',
                    RESOLVED: 'bg-success/20 text-success',
                    CANCELLED: 'bg-danger/20 text-danger'
                  };
                  return (
                    <div key={e.id} className="card p-5">
                      <div className="flex items-center justify-between">
                        <div><p className="font-semibold">{e.Patient?.nom || 'Inconnu'} {e.Patient?.prenom || ''}</p><p className="text-xs text-zinc-400">{e.type_urgence} — {e.localisation} — {new Date(e.date_alerte).toLocaleTimeString()}</p></div>
                        <span className={`badge ${statusColors[e.statut] || 'bg-zinc-700'}`}>{e.statut}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <a href={`tel:${e.Patient?.telephone}`} className="text-xs text-info"><i className="fas fa-phone mr-1"></i>{e.Patient?.telephone}</a>
                        {e.Ambulancier && <span className="text-xs text-zinc-500"><i className="fas fa-ambulance mr-1"></i>{e.Ambulancier.nom}</span>}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => updateEmergencyStatus(e.id, 'ASSIGNED')} className="flex-1 py-2 rounded-xl bg-info/15 text-info text-xs">Assigner</button>
                        <button onClick={() => updateEmergencyStatus(e.id, 'IN_PROGRESS')} className="flex-1 py-2 rounded-xl bg-purple-500/15 text-purple-400 text-xs">En cours</button>
                        <button onClick={() => updateEmergencyStatus(e.id, 'RESOLVED')} className="flex-1 py-2 rounded-xl bg-success/15 text-success text-xs">Résoudre</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== COMMANDES ==================== */}
          {currentPage === 'orders' && (
            <div>
              <div className="mb-6"><h1 className="text-2xl font-bold">Gestion des commandes</h1><p className="text-zinc-400 text-sm">Commandes de médicaments</p></div>
              <div className="space-y-3">
                {orders.map(o => {
                  const statusColors: { [key: string]: string } = {
                    DELIVERED: 'bg-success/20 text-success',
                    PREPARED: 'bg-warn/20 text-warn',
                    CONFIRMED: 'bg-info/20 text-info',
                    PANIER: 'bg-zinc-700 text-zinc-300',
                    CANCELLED: 'bg-danger/20 text-danger',
                    EN_LIVRAISON: 'bg-purple-500/20 text-purple-400'
                  };
                  const statusLabels: { [key: string]: string } = {
                    PANIER: 'Panier', CONFIRMED: 'Confirmée', PREPARED: 'Préparée', EN_LIVRAISON: 'En livraison', DELIVERED: 'Livrée', CANCELLED: 'Annulée'
                  };
                  return (
                    <div key={o.id} className="card p-5">
                      <div className="flex justify-between">
                        <div><p className="font-semibold">Commande #{o.id}</p><p className="text-xs text-zinc-400">{new Date(o.date_commande).toLocaleDateString()} — {o.Pharmacien?.nom_pharmacie || 'N/A'}</p><p className="text-sm mt-1">{o.Patient?.nom} {o.Patient?.prenom}</p></div>
                        <span className={`badge ${statusColors[o.statut]}`}>{statusLabels[o.statut] || o.statut}</span>
                      </div>
                      <div className="mt-2 text-sm">{o.CommandeDetails?.map(d => `${d.Medicament?.nom} x${d.quantite}`).join(', ') || 'Aucun détail'}</div>
                      <div className="mt-3 flex justify-between">
                        <span className="text-info font-bold">{o.montant_total.toLocaleString('fr-MG')} Ar</span>
                        <div className="flex gap-2">
                          {o.statut === 'CONFIRMED' && <button onClick={() => updateOrderStatus(o.id, 'PREPARED')} className="px-3 py-1 rounded-lg bg-warn/15 text-warn text-xs">Préparer</button>}
                          {o.statut === 'PREPARED' && <button onClick={() => updateOrderStatus(o.id, 'DELIVERED')} className="px-3 py-1 rounded-lg bg-success/15 text-success text-xs">Livrer</button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================== UTILISATEURS ==================== */}
          {currentPage === 'users' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des utilisateurs</h1><p className="text-zinc-400 text-sm">Patients et personnel</p></div>
                <button onClick={() => setShowUserModal(true)} className="px-5 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition"><i className="fas fa-user-plus mr-2"></i>Ajouter</button>
              </div>
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-danger to-orange-500 flex items-center justify-center text-lg font-bold">{u.nom?.[0] || u.telephone?.[0] || 'U'}</div>
                      <div><p className="font-semibold">{u.nom} {u.prenom || ''}</p><p className="text-xs text-zinc-400">{u.email || u.telephone}</p><p className="text-xs text-zinc-500">{u.role}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleUserStatus(u.id, u.role, u.statut === 'ACTIF')} className={`px-3 py-1.5 rounded-lg ${u.statut === 'ACTIF' ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'} text-xs`}>
                        {u.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== RAPPORTS ==================== */}
          {currentPage === 'reports' && (
            <div>
              <div className="mb-6"><h1 className="text-2xl font-bold">Rapports et analyses</h1><p className="text-zinc-400 text-sm">Export de données</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6">
                {['emergencies', 'orders', 'users', 'stock'].map(type => (
                  <div key={type} className="card p-5 cursor-pointer hover:bg-zinc-800 transition" onClick={() => exportReport(type)}>
                    <div className={`w-12 h-12 rounded-full ${type === 'emergencies' ? 'bg-danger/15' : type === 'orders' ? 'bg-info/15' : type === 'users' ? 'bg-success/15' : 'bg-warn/15'} flex items-center justify-center mb-3`}>
                      <i className={`fas fa-${type === 'emergencies' ? 'exclamation-triangle' : type === 'orders' ? 'shopping-bag' : type === 'users' ? 'users' : 'boxes'} ${type === 'emergencies' ? 'text-danger' : type === 'orders' ? 'text-info' : type === 'users' ? 'text-success' : 'text-warn'} text-xl`}></i>
                    </div>
                    <h3 className="font-semibold">Rapport des {type === 'emergencies' ? 'urgences' : type === 'orders' ? 'commandes' : type === 'users' ? 'utilisateurs' : 'stocks'}</h3>
                    <p className="text-xs text-zinc-500 mt-1">Export CSV</p>
                    <div className="mt-3 text-xs text-info"><i className="fas fa-download mr-1"></i>Télécharger</div>
                  </div>
                ))}
              </div>
              <div className="card p-4 md:p-6">
                <h3 className="font-semibold mb-4">Statistiques mensuelles</h3>
                <canvas id="chartMonthly" height="200"></canvas>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODALS ==================== */}

      {/* Medicine Modal */}
      {showMedicineModal && (
        <div className="modal-overlay show" onClick={() => setShowMedicineModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold"><i className="fas fa-pills mr-2 text-info"></i>Ajouter un médicament</h3>
              <button onClick={() => setShowMedicineModal(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-times text-zinc-400"></i></button>
            </div>
            <div className="space-y-4">
              <input type="text" id="medName" placeholder="Nom du médicament" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <select id="medCategory" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white">
                <option value="Antalgique">Antalgique</option>
                <option value="Antibiotique">Antibiotique</option>
                <option value="AINS">AINS</option>
                <option value="Cardiovasculaire">Cardiovasculaire</option>
                <option value="Gastro">Gastro</option>
                <option value="Vitamines">Vitamines</option>
              </select>
              <textarea id="medDesc" rows={2} placeholder="Description" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white"></textarea>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" id="medPrice" placeholder="Prix (Ar)" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
                <input type="number" id="medStock" placeholder="Quantité en stock" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-2"><input type="checkbox" id="medRx" /> <span className="text-sm">Nécessite ordonnance</span></label>
              </div>
              <button onClick={addMedicine} className="w-full bg-success text-white py-3 rounded-xl font-semibold">Ajouter le médicament</button>
            </div>
          </div>
        </div>
      )}

      {/* Ambulance Modal */}
      {showAmbulanceModal && (
        <div className="modal-overlay show" onClick={() => setShowAmbulanceModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold"><i className="fas fa-ambulance mr-2 text-success"></i>Ajouter une ambulance</h3>
              <button onClick={() => setShowAmbulanceModal(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-times text-zinc-400"></i></button>
            </div>
            <div className="space-y-4">
              <input type="text" id="ambName" placeholder="Nom de l'ambulance" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <input type="tel" id="ambPhone" placeholder="Téléphone" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <input type="text" id="ambMatricule" placeholder="Matricule" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <select id="ambZone" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white">
                <option value="Tana Nord">Zone Tana Nord</option>
                <option value="Tana Sud">Zone Tana Sud</option>
                <option value="Tana Est">Zone Tana Est</option>
                <option value="Tana Ouest">Zone Tana Ouest</option>
              </select>
              <input type="password" id="ambPassword" placeholder="Mot de passe" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <button onClick={addAmbulance} className="w-full bg-success text-white py-3 rounded-xl font-semibold">Ajouter l'ambulance</button>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Modal */}
      {showHospitalModal && (
        <div className="modal-overlay show" onClick={() => setShowHospitalModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold"><i className="fas fa-hospital mr-2 text-info"></i>Ajouter un hôpital</h3>
              <button onClick={() => setShowHospitalModal(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-times text-zinc-400"></i></button>
            </div>
            <div className="space-y-4">
              <input type="text" id="hospName" placeholder="Nom de l'hôpital" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <input type="tel" id="hospPhone" placeholder="Téléphone" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <input type="text" id="hospAddress" placeholder="Adresse" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" id="hospLat" placeholder="Latitude" step="0.000001" defaultValue="-18.8792" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
                <input type="number" id="hospLng" placeholder="Longitude" step="0.000001" defaultValue="47.5200" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" id="hospCapacity" placeholder="Capacité (lits)" defaultValue="100" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
                <select id="hospType" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white">
                  <option value="HOPITAL">Hôpital</option>
                  <option value="CLINIQUE">Clinique</option>
                  <option value="CSB">CSB</option>
                  <option value="DISPENSAIRE">Dispensaire</option>
                </select>
              </div>
              <div className="flex gap-2">
                <label className="flex items-center gap-2"><input type="checkbox" id="hospEmergency" defaultChecked /> <span className="text-sm">Urgences 24/7</span></label>
              </div>
              <button onClick={addHospital} className="w-full bg-info text-white py-3 rounded-xl font-semibold">Ajouter l'hôpital</button>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacy Modal */}
      {showPharmacyModal && (
        <div className="modal-overlay show" onClick={() => setShowPharmacyModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold"><i className="fas fa-pills mr-2 text-warn"></i>Ajouter une pharmacie</h3>
              <button onClick={() => setShowPharmacyModal(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-times text-zinc-400"></i></button>
            </div>
            <div className="space-y-4">
              <input type="text" id="pharmName" placeholder="Nom de la pharmacie" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <input type="text" id="pharmResp" placeholder="Nom du responsable" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <input type="tel" id="pharmPhone" placeholder="Téléphone" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <input type="email" id="pharmEmail" placeholder="Email" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <input type="text" id="pharmAddress" placeholder="Adresse" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <input type="password" id="pharmPassword" placeholder="Mot de passe" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <div className="flex gap-2">
                <label className="flex items-center gap-2"><input type="checkbox" id="pharmDelivery" defaultChecked /> <span className="text-sm">Livraison disponible</span></label>
              </div>
              <button onClick={addPharmacy} className="w-full bg-warn text-black py-3 rounded-xl font-semibold">Ajouter la pharmacie</button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay show" onClick={() => setShowUserModal(false)}>
          <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold"><i className="fas fa-user-plus mr-2 text-success"></i>Ajouter un utilisateur</h3>
              <button onClick={() => setShowUserModal(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-times text-zinc-400"></i></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" id="userNom" placeholder="Nom" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
                <input type="text" id="userPrenom" placeholder="Prénom" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              </div>
              <input type="email" id="userEmail" placeholder="Email" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <input type="tel" id="userPhone" placeholder="Téléphone" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <select id="userRole" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white">
                <option value="PATIENT">Patient</option>
                <option value="AMBULANCIER">Ambulancier</option>
                <option value="PHARMACIEN">Pharmacien</option>
                <option value="ADMIN">Administrateur</option>
              </select>
              <select id="userGender" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white">
                <option value="MASCULIN">Masculin</option>
                <option value="FEMININ">Féminin</option>
              </select>
              <select id="userBlood" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white">
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
              <input type="password" id="userPassword" placeholder="Mot de passe" className="w-full bg-zinc-800 border-zinc-700 rounded-xl p-3 text-white" />
              <button onClick={addUser} className="w-full bg-success text-white py-3 rounded-xl font-semibold">Ajouter l'utilisateur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;