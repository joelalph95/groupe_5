import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import Chart from 'chart.js/auto';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContexte';
import { useToast } from '../hooks/useToast';
import { adminService } from '../services/api';
import socketService from '../services/socket';
import Toast from '../components/common/Toast';
import Loading from '../components/common/Loading';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const TANA: [number, number] = [-18.8792, 47.5200];

interface Medicine {
  id: number; nom: string; description?: string; categorie: string;
  prix: number; stock: number; necessite_ordonnance: boolean;
  pharmacien_id?: number; Pharmacien?: { nom_pharmacie: string };
}
interface Ambulance {
  id: number; nom: string; matricule?: string; telephone: string;
  statut: string; zone_couverture?: string;
}
interface Hospital {
  id: number; nom: string; type?: string; telephone?: string;
  adresse?: string; latitude?: number; longitude?: number;
  capacite_lits?: number; urgences_24_7?: boolean;
}
interface Pharmacy {
  id: number; nom_pharmacie: string; responsable: string; telephone: string;
  email?: string; adresse?: string; statut: string; livraison_disponible: boolean;
}
interface User {
  id: number; email?: string; nom?: string; prenom?: string;
  telephone: string; role: string; sexe?: string;
  groupe_sanguin?: string; statut: string;
}
interface Order {
  id: number; Patient?: { nom: string; prenom: string };
  Pharmacien?: { nom_pharmacie: string }; date_commande: string;
  montant_total: number; statut: string;
  CommandeDetails?: Array<{ id: number; quantite: number; Medicament?: { nom: string } }>;
}
interface Emergency {
  id: number; Patient?: { nom: string; prenom: string; telephone: string };
  type_urgence?: string; niveau_priorite?: string; localisation?: string;
  statut: string; date_alerte: string; Ambulancier?: { nom: string };
}
interface Article {
  id: number; titre: string; contenu: string; resume?: string;
  categorie: string; tags?: string; auteur?: string; statut: string;
  vues: number; likes: number; cible_genre: string; date_publication?: string;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toasts, showToast, removeToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showAmbulanceModal, setShowAmbulanceModal] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [showPharmacyModal, setShowPharmacyModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [emergencies, setEmergencies] = useState<Emergency[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<any>({});

  // Formulaires contrôlés
  const [medForm, setMedForm] = useState({
    nom: '', categorie: 'Antalgique', description: '', prix: '', stock: '', necessite_ordonnance: false
  });
  const [articleForm, setArticleForm] = useState({
    titre: '', contenu: '', resume: '', categorie: 'GENERAL',
    tags: '', auteur: '', statut: 'PUBLIE', cible_genre: 'TOUS'
  });

  const [stockCategoryFilter, setStockCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [stockSearch, setStockSearch] = useState('');
  const [emergencyFilter, setEmergencyFilter] = useState('ALL');
  const [articleSearch, setArticleSearch] = useState('');
  const [articleCatFilter, setArticleCatFilter] = useState('ALL');

  const adminMapRef = useRef<L.Map | null>(null);
  const chartRefs = useRef<{ [key: string]: Chart | null }>({});

  // ===== CHARGEMENT API =====

  const loadStats = async () => {
    try { const d = await adminService.getStats(); setStats(d); } catch (_) {}
  };
  const loadMedicines = async () => {
    try { const d = await adminService.getMedicaments(); setMedicines(d as Medicine[]); }
    catch (_) { showToast('Erreur chargement médicaments', 'error'); }
  };
  const loadAmbulances = async () => {
    try { const d = await adminService.getAmbulances(); setAmbulances(d as Ambulance[]); }
    catch (_) { showToast('Erreur chargement ambulances', 'error'); }
  };
  const loadHospitals = async () => {
    try { const d = await adminService.getCentresSante(); setHospitals(d as Hospital[]); } catch (_) {}
  };
  const loadPharmacies = async () => {
    try { const d = await adminService.getPharmacies(); setPharmacies(d as Pharmacy[]); }
    catch (_) { showToast('Erreur chargement pharmacies', 'error'); }
  };
  const loadUsers = async () => {
    try {
      const d = await adminService.getUsers();
      setUsers([
        ...(d.patients || []).map((p: any) => ({ ...p, role: 'PATIENT', statut: p.statut || 'ACTIF' })),
        ...(d.ambulanciers || []).map((a: any) => ({ ...a, role: 'AMBULANCIER', statut: a.statut === 'DISPONIBLE' ? 'ACTIF' : 'INACTIF' })),
        ...(d.pharmaciens || []).map((ph: any) => ({ ...ph, role: 'PHARMACIEN', nom: ph.nom_pharmacie, statut: ph.statut })),
        ...(d.admins || []).map((a: any) => ({ ...a, role: 'ADMIN', statut: a.statut }))
      ]);
    } catch (_) {}
  };
  const loadOrders = async () => {
    try { const d = await adminService.getOrders(); setOrders(d as Order[]); } catch (_) {}
  };
  const loadEmergencies = async () => {
    try { const d = await adminService.getEmergencies(); setEmergencies(d as Emergency[]); } catch (_) {}
  };
  const loadArticles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/articles`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      setArticles(Array.isArray(d) ? d : []);
    } catch (_) { showToast('Erreur chargement articles', 'error'); }
  };
  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadMedicines(), loadAmbulances(), loadHospitals(),
      loadPharmacies(), loadUsers(), loadOrders(), loadEmergencies(), loadArticles()]);
    setLoading(false);
  };

  // ===== MÉDICAMENTS =====

const addMedicine = async () => {
  const { nom, categorie, description, prix, stock, necessite_ordonnance } = medForm;
  if (!nom.trim()) { showToast('Le nom est obligatoire', 'error'); return; }
  const prixNum = parseFloat(prix);
  const stockNum = parseInt(stock);
  if (isNaN(prixNum) || prixNum <= 0) { showToast('Prix invalide', 'error'); return; }
  if (isNaN(stockNum) || stockNum < 0) { showToast('Stock invalide', 'error'); return; }
  
  // Get the first active pharmacist or allow selection
  // Option 1: Use the first available pharmacist
  const defaultPharmacistId = pharmacies.find(p => p.statut === 'ACTIF')?.id;
  
  if (!defaultPharmacistId) {
    showToast('Aucun pharmacien disponible. Veuillez d\'abord créer une pharmacie.', 'error');
    return;
  }
  
  try {
    setLoading(true);
    const r = await adminService.createMedicament({
      nom: nom.trim(), 
      description: description.trim() || 'Médicament',
      categorie, 
      prix: prixNum, 
      stock: stockNum, 
      necessite_ordonnance,
      pharmacien_id: defaultPharmacistId  // Add this line
    });
    if (r.success) {
      showToast('Médicament ajouté avec succès', 'success');
      setShowMedicineModal(false);
      setMedForm({ nom: '', categorie: 'Antalgique', description: '', prix: '', stock: '', necessite_ordonnance: false });
      await loadMedicines();
    }
  } catch (e: any) { 
    showToast(e?.response?.data?.error || "Erreur lors de l'ajout", 'error');
  }
  finally { setLoading(false); }
};

  const deleteMedicine = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer "${nom}" ?`)) return;
    try {
      setLoading(true);
      const r = await adminService.deleteMedicament(id);
      if (r.success) { showToast('Médicament supprimé', 'success'); await loadMedicines(); }
    } catch (e: any) { showToast(e?.response?.data?.error || 'Erreur suppression', 'error'); }
    finally { setLoading(false); }
  };

  const updateMedicineStock = async (id: number, delta: number) => {
    const m = medicines.find(x => x.id === id);
    if (!m) return;
    const newStock = Math.max(0, m.stock + delta);
    try {
      const r = await adminService.updateMedicamentStock(id, newStock);
      if (r.success) {
        await loadMedicines();
        if (newStock < 20) showToast(`⚠️ Stock faible: ${m.nom} (${newStock})`, 'warn');
        else showToast(`Stock mis à jour: ${m.nom}`, 'success');
      }
    } catch (_) { showToast('Erreur mise à jour stock', 'error'); }
  };

  const editMedicineStock = async (id: number) => {
    const m = medicines.find(x => x.id === id);
    if (!m) return;
    const v = prompt(`Nouveau stock pour ${m.nom}:`, m.stock.toString());
    if (v !== null && !isNaN(parseInt(v)) && parseInt(v) >= 0) {
      try {
        const r = await adminService.updateMedicamentStock(id, parseInt(v));
        if (r.success) { await loadMedicines(); showToast(`Stock de ${m.nom} mis à jour`, 'success'); }
      } catch (_) { showToast('Erreur modification stock', 'error'); }
    }
  };

  // ===== AMBULANCES =====

  const addAmbulance = async () => {
    const nom = (document.getElementById('ambName') as HTMLInputElement)?.value?.trim();
    const telephone = (document.getElementById('ambPhone') as HTMLInputElement)?.value?.trim();
    const matricule = (document.getElementById('ambMatricule') as HTMLInputElement)?.value?.trim();
    const zone_couverture = (document.getElementById('ambZone') as HTMLSelectElement)?.value;
    const mot_de_passe = (document.getElementById('ambPassword') as HTMLInputElement)?.value;
    if (!nom || !telephone) { showToast('Nom et téléphone obligatoires', 'error'); return; }
    try {
      setLoading(true);
      const r = await adminService.createAmbulance({ nom, telephone, matricule, zone_couverture, mot_de_passe });
      if (r.success) { showToast(`Ambulance ${nom} ajoutée`, 'success'); setShowAmbulanceModal(false); await loadAmbulances(); }
    } catch (e: any) { showToast(e?.response?.data?.error || "Erreur", 'error'); }
    finally { setLoading(false); }
  };
  const deleteAmbulance = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer l'ambulance "${nom}" ?`)) return;
    try { setLoading(true); const r = await adminService.deleteAmbulance(id); if (r.success) { showToast('Supprimée', 'success'); await loadAmbulances(); } }
    catch (_) { showToast('Erreur suppression', 'error'); } finally { setLoading(false); }
  };
  const toggleAmbulanceStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'DISPONIBLE' ? 'EN_INTERVENTION' : 'DISPONIBLE';
    try { const r = await adminService.updateAmbulanceStatus(id, newStatus); if (r.success) { await loadAmbulances(); showToast('Ambulance mise à jour', 'info'); } }
    catch (_) { showToast('Erreur', 'error'); }
  };

  // ===== HÔPITAUX =====

  const addHospital = async () => {
    const nom = (document.getElementById('hospName') as HTMLInputElement)?.value?.trim();
    const telephone = (document.getElementById('hospPhone') as HTMLInputElement)?.value?.trim();
    const adresse = (document.getElementById('hospAddress') as HTMLInputElement)?.value?.trim();
    const type = (document.getElementById('hospType') as HTMLSelectElement)?.value;
    const capacite_lits = parseInt((document.getElementById('hospCapacity') as HTMLInputElement)?.value) || 100;
    const urgences_24_7 = (document.getElementById('hospEmergency') as HTMLInputElement)?.checked;
    const latitude = parseFloat((document.getElementById('hospLat') as HTMLInputElement)?.value) || -18.8792;
    const longitude = parseFloat((document.getElementById('hospLng') as HTMLInputElement)?.value) || 47.5200;
    if (!nom || !telephone) { showToast('Nom et téléphone obligatoires', 'error'); return; }
    try {
      setLoading(true);
      const r = await adminService.createCentreSante({ nom, telephone, adresse, type, capacite_lits, urgences_24_7, latitude, longitude });
      if (r.success) { showToast(`${nom} ajouté`, 'success'); setShowHospitalModal(false); await loadHospitals(); }
    } catch (e: any) { showToast(e?.response?.data?.error || "Erreur", 'error'); }
    finally { setLoading(false); }
  };
  const deleteHospital = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer "${nom}" ?`)) return;
    try { setLoading(true); const r = await adminService.deleteCentreSante(id); if (r.success) { showToast('Hôpital supprimé', 'success'); await loadHospitals(); } }
    catch (_) { showToast('Erreur', 'error'); } finally { setLoading(false); }
  };

  // ===== PHARMACIES =====

  const addPharmacy = async () => {
    const nom_pharmacie = (document.getElementById('pharmName') as HTMLInputElement)?.value?.trim();
    const responsable = (document.getElementById('pharmResp') as HTMLInputElement)?.value?.trim();
    const telephone = (document.getElementById('pharmPhone') as HTMLInputElement)?.value?.trim();
    const email = (document.getElementById('pharmEmail') as HTMLInputElement)?.value?.trim();
    const adresse = (document.getElementById('pharmAddress') as HTMLInputElement)?.value?.trim();
    const mot_de_passe = (document.getElementById('pharmPassword') as HTMLInputElement)?.value;
    const livraison_disponible = (document.getElementById('pharmDelivery') as HTMLInputElement)?.checked;
    if (!nom_pharmacie || !telephone) { showToast('Nom et téléphone obligatoires', 'error'); return; }
    try {
      setLoading(true);
      const r = await adminService.createPharmacie({ nom_pharmacie, responsable, telephone, email, adresse, mot_de_passe, livraison_disponible });
      if (r.success) { showToast(`${nom_pharmacie} ajoutée`, 'success'); setShowPharmacyModal(false); await loadPharmacies(); }
    } catch (e: any) { showToast(e?.response?.data?.error || "Erreur", 'error'); }
    finally { setLoading(false); }
  };
  const deletePharmacy = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer "${nom}" ?`)) return;
    try { setLoading(true); const r = await adminService.deletePharmacie(id); if (r.success) { showToast('Supprimée', 'success'); await loadPharmacies(); } }
    catch (_) { showToast('Erreur', 'error'); } finally { setLoading(false); }
  };
  const togglePharmacyStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    try { const r = await adminService.updatePharmacieStatus(id, newStatus); if (r.success) { await loadPharmacies(); showToast('Mise à jour', 'info'); } }
    catch (_) { showToast('Erreur', 'error'); }
  };

  // ===== UTILISATEURS =====

  const addUser = async () => {
    const nom = (document.getElementById('userNom') as HTMLInputElement)?.value?.trim();
    const prenom = (document.getElementById('userPrenom') as HTMLInputElement)?.value?.trim();
    const email = (document.getElementById('userEmail') as HTMLInputElement)?.value?.trim();
    const telephone = (document.getElementById('userPhone') as HTMLInputElement)?.value?.trim();
    const role = (document.getElementById('userRole') as HTMLSelectElement)?.value;
    const sexe = (document.getElementById('userGender') as HTMLSelectElement)?.value;
    const groupe_sanguin = (document.getElementById('userBlood') as HTMLSelectElement)?.value;
    const mot_de_passe = (document.getElementById('userPassword') as HTMLInputElement)?.value;
    if (!nom || !telephone) { showToast('Nom et téléphone obligatoires', 'error'); return; }
    try {
      setLoading(true);
      const r = await adminService.createUser({ nom, prenom, email, telephone, mot_de_passe, role, sexe, groupe_sanguin });
      if (r.success) { showToast(`Utilisateur ajouté`, 'success'); setShowUserModal(false); await loadUsers(); }
    } catch (e: any) { showToast(e?.response?.data?.error || "Erreur", 'error'); }
    finally { setLoading(false); }
  };
  const deleteUser = async (id: number, role: string, nom: string) => {
    if (!window.confirm(`Supprimer "${nom}" ?`)) return;
    try { setLoading(true); const r = await adminService.deleteUser(id, role); if (r.success) { showToast('Supprimé', 'success'); await loadUsers(); } }
    catch (_) { showToast('Erreur', 'error'); } finally { setLoading(false); }
  };
  const toggleUserStatus = async (id: number, role: string, statut: string) => {
    try { const r = await adminService.updateUser(id, role, { statut: statut === 'ACTIF' ? 'INACTIF' : 'ACTIF' }); if (r.success) { await loadUsers(); showToast('Mis à jour', 'info'); } }
    catch (_) { showToast('Erreur', 'error'); }
  };

  // ===== URGENCES & COMMANDES =====

  const updateEmergencyStatus = async (id: number, statut: string) => {
    try { const r = await adminService.updateEmergencyStatus(id, statut); if (r.success) { await loadEmergencies(); showToast(`Urgence #${id} mise à jour`, 'success'); } }
    catch (_) { showToast('Erreur', 'error'); }
  };
  const updateOrderStatus = async (id: number, statut: string) => {
    try { const r = await adminService.updateOrderStatus(id, statut); if (r.success) { await loadOrders(); showToast(`Commande #${id} mise à jour`, 'success'); } }
    catch (_) { showToast('Erreur', 'error'); }
  };

  // ===== ARTICLES =====

  const openArticleModal = (article?: Article) => {
    if (article) {
      setEditingArticle(article);
      setArticleForm({ titre: article.titre, contenu: article.contenu, resume: article.resume || '', categorie: article.categorie, tags: article.tags || '', auteur: article.auteur || '', statut: article.statut, cible_genre: article.cible_genre });
    } else {
      setEditingArticle(null);
      setArticleForm({ titre: '', contenu: '', resume: '', categorie: 'GENERAL', tags: '', auteur: '', statut: 'PUBLIE', cible_genre: 'TOUS' });
    }
    setShowArticleModal(true);
  };

  const saveArticle = async () => {
    const { titre, contenu } = articleForm;
    if (!titre.trim() || !contenu.trim()) { showToast('Titre et contenu obligatoires', 'error'); return; }
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const body = { ...articleForm, titre: titre.trim(), contenu: contenu.trim(), auteur: articleForm.auteur.trim() || (user as any)?.nom || 'Admin' };
      const url = editingArticle ? `${API_URL}/articles/${editingArticle.id}` : `${API_URL}/articles`;
      const method = editingArticle ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      if (res.ok) {
        showToast(editingArticle ? 'Article mis à jour' : 'Article publié', 'success');
        setShowArticleModal(false);
        await loadArticles();
      } else {
        const err = await res.json();
        showToast(err.error || 'Erreur sauvegarde', 'error');
      }
    } catch (_) { showToast('Erreur sauvegarde', 'error'); }
    finally { setLoading(false); }
  };

  const deleteArticle = async (id: number, titre: string) => {
    if (!window.confirm(`Supprimer "${titre}" ?`)) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/articles/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { showToast('Article supprimé', 'success'); await loadArticles(); }
      else showToast('Erreur suppression', 'error');
    } catch (_) { showToast('Erreur', 'error'); }
    finally { setLoading(false); }
  };

  const toggleArticleStatut = async (article: Article) => {
    const newStatut = article.statut === 'PUBLIE' ? 'ARCHIVE' : 'PUBLIE';
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/articles/${article.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...article, statut: newStatut }) });
      if (res.ok) { showToast('Article mis à jour', 'info'); await loadArticles(); }
    } catch (_) { showToast('Erreur', 'error'); }
    finally { setLoading(false); }
  };

  // ===== MAP & CHARTS =====

  const initAmbulanceMap = () => {
    const mapEl = document.getElementById('adminAmbulanceMap');
    if (!mapEl) return;
    if (adminMapRef.current) { adminMapRef.current.remove(); adminMapRef.current = null; }
    adminMapRef.current = L.map('adminAmbulanceMap', { attributionControl: false, zoomControl: true }).setView(TANA, 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(adminMapRef.current);
    ambulances.forEach(a => {
      const lat = TANA[0] + (Math.random() - 0.5) * 0.05;
      const lng = TANA[1] + (Math.random() - 0.5) * 0.05;
      const color = a.statut === 'DISPONIBLE' ? '#10b981' : '#52525b';
      const icon = L.divIcon({ className: '', html: `<div style="background:${color};width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;"><i class="fas fa-ambulance" style="color:white;font-size:16px;"></i></div>`, iconSize: [40, 40], iconAnchor: [20, 20] });
      L.marker([lat, lng], { icon }).addTo(adminMapRef.current!).bindPopup(`<b>${a.nom}</b><br>${a.statut}`);
    });
    setTimeout(() => adminMapRef.current?.invalidateSize(), 200);
  };

  const renderCharts = () => {
    const mk = (id: string, key: string, cfg: any) => {
      const ctx = document.getElementById(id) as HTMLCanvasElement; if (!ctx) return;
      if (chartRefs.current[key]) chartRefs.current[key]!.destroy();
      chartRefs.current[key] = new Chart(ctx, cfg);
    };
    const ax = { x: { ticks: { color: '#a1a1aa' }, grid: { display: false } }, y: { ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(255,255,255,0.05)' } } };
    mk('chartEmergencies', 'emerg', { type: 'bar', data: { labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], datasets: [{ data: [4, 6, 3, 8, 5, 7, 4], backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: ax } });
    mk('chartRevenue', 'rev', { type: 'line', data: { labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'], datasets: [{ data: [45000, 62000, 38000, 81000, 55000, 72000, 48000], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, pointRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: ax } });
    mk('chartSeverity', 'sev', { type: 'doughnut', data: { labels: ['Critique', 'Élevé', 'Moyen', 'Faible'], datasets: [{ data: [emergencies.filter(e => e.niveau_priorite === 'CRITIQUE').length || 2, emergencies.filter(e => e.niveau_priorite === 'ELEVE').length || 5, emergencies.filter(e => e.niveau_priorite === 'MOYEN').length || 8, 3], backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#10b981'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa', font: { size: 11 } } } }, cutout: '60%' } });
    mk('chartGender', 'gender', { type: 'bar', data: { labels: ['Femmes', 'Hommes'], datasets: [{ data: [users.filter(u => u.sexe === 'FEMININ').length || 0, users.filter(u => u.sexe === 'MASCULIN').length || 0], backgroundColor: ['#ec4899', '#06b6d4'], borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: true, indexAxis: 'y' as const, plugins: { legend: { display: false } }, scales: ax } });
    mk('chartMonthly', 'monthly', { type: 'line', data: { labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'], datasets: [{ label: 'Urgences', data: [12, 15, 18, 22, 25, 28, 32, 35, 38, 42, 45, 48], borderColor: '#ef4444', tension: 0.3 }, { label: 'Commandes', data: [18, 22, 28, 35, 42, 48, 55, 62, 70, 78, 85, 92], borderColor: '#06b6d4', tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top', labels: { color: '#a1a1aa' } } }, scales: ax } });
    const catMap = new Map<string, number>();
    medicines.forEach(m => { if (m.categorie) catMap.set(m.categorie, (catMap.get(m.categorie) || 0) + m.stock); });
    const cats = Array.from(catMap.keys());
    mk('chartStockCategory', 'stockCat', { type: 'bar', data: { labels: cats, datasets: [{ data: cats.map(c => catMap.get(c) || 0), backgroundColor: 'rgba(16,185,129,0.6)', borderRadius: 8 }] }, options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: ax } });
  };

  const getStockStatus = (stock: number) => {
    if (stock < 20) return { text: 'Stock faible', color: 'bg-danger/20 text-danger', bar: 'bg-danger', border: 'border-l-4 border-danger' };
    if (stock <= 50) return { text: 'Stock moyen', color: 'bg-warn/20 text-warn', bar: 'bg-warn', border: 'border-l-4 border-warn' };
    return { text: 'Stock bon', color: 'bg-success/20 text-success', bar: 'bg-success', border: '' };
  };

  const filteredMedicines = medicines.filter(m => {
    if (stockCategoryFilter !== 'ALL' && m.categorie !== stockCategoryFilter) return false;
    if (stockStatusFilter === 'LOW' && m.stock >= 20) return false;
    if (stockStatusFilter === 'MEDIUM' && (m.stock < 20 || m.stock > 50)) return false;
    if (stockStatusFilter === 'GOOD' && m.stock <= 50) return false;
    if (stockSearch && !m.nom.toLowerCase().includes(stockSearch.toLowerCase())) return false;
    return true;
  });
  const filteredEmergencies = emergencyFilter === 'ALL' ? emergencies : emergencies.filter(e => e.statut === emergencyFilter);
  const filteredArticles = articles.filter(a => {
    if (articleCatFilter !== 'ALL' && a.categorie !== articleCatFilter) return false;
    if (articleSearch && !a.titre.toLowerCase().includes(articleSearch.toLowerCase())) return false;
    return true;
  });

  // ===== EFFECTS =====

  useEffect(() => {
    loadAllData();
    if (user) {
      socketService.connect(localStorage.getItem('token') || '');
      socketService.joinRoom('admin');
      socketService.onNewEmergency((data: any) => { showToast(`Nouvelle urgence: ${data.type_urgence}`, 'warn'); loadEmergencies(); });
      socketService.onNewBIP((data: any) => { showToast(`📞 BIP reçu de: ${data.expediteur}`, 'warn'); });
    }
    return () => { socketService.off('new-emergency'); socketService.off('new-bip'); };
  }, []);

  useEffect(() => {
    if (currentPage === 'ambulances' && ambulances.length > 0) setTimeout(initAmbulanceMap, 100);
    if (currentPage === 'dashboard') setTimeout(renderCharts, 100);
  }, [currentPage, ambulances, medicines, users, emergencies]);

  useEffect(() => {
    (window as any).editStock = editMedicineStock;
    (window as any).updateStockQty = updateMedicineStock;
  }, [medicines]);

  // ===== CONSTANTES UI =====

  const navItems = [
    { page: 'dashboard', icon: 'fa-chart-pie', label: 'Tableau de bord' },
    { page: 'ambulances', icon: 'fa-ambulance', label: 'Ambulances' },
    { page: 'hospitals', icon: 'fa-hospital', label: 'Hôpitaux' },
    { page: 'pharmacies', icon: 'fa-pills', label: 'Pharmacies' },
    { page: 'stock', icon: 'fa-boxes', label: 'Stock Médicaments' },
    { page: 'emergencies', icon: 'fa-exclamation-triangle', label: 'Urgences' },
    { page: 'orders', icon: 'fa-shopping-bag', label: 'Commandes' },
    { page: 'users', icon: 'fa-users', label: 'Utilisateurs' },
    { page: 'articles', icon: 'fa-newspaper', label: 'Conseils Santé' },
    { page: 'reports', icon: 'fa-file-alt', label: 'Rapports' }
  ];

  const statusColors: Record<string, string> = { PENDING: 'bg-warn/20 text-warn', ASSIGNED: 'bg-info/20 text-info', IN_PROGRESS: 'bg-purple-500/20 text-purple-400', RESOLVED: 'bg-success/20 text-success', DELIVERED: 'bg-success/20 text-success', PREPARED: 'bg-warn/20 text-warn', CONFIRMED: 'bg-info/20 text-info', PANIER: 'bg-zinc-700 text-zinc-300', CANCELLED: 'bg-danger/20 text-danger', EN_LIVRAISON: 'bg-purple-500/20 text-purple-400' };
  const statusLabels: Record<string, string> = { PANIER: 'Panier', CONFIRMED: 'Confirmée', PREPARED: 'Préparée', EN_LIVRAISON: 'En livraison', DELIVERED: 'Livrée', CANCELLED: 'Annulée', PENDING: 'En attente', ASSIGNED: 'Assignée', IN_PROGRESS: 'En cours', RESOLVED: 'Résolue' };
  const catColors: Record<string, string> = { GENERAL: 'bg-success/20 text-success', FEMME: 'bg-pink-500/20 text-pink-400', HOMME: 'bg-info/20 text-info', MENTAL: 'bg-purple-500/20 text-purple-400', NUTRITION: 'bg-warn/20 text-warn', SPORT: 'bg-orange-500/20 text-orange-400', ENFANT: 'bg-yellow-500/20 text-yellow-400', VACCINATION: 'bg-cyan-500/20 text-cyan-400' };

  const mS: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 };
  const mC: React.CSSProperties = { background: '#18181b', borderRadius: '1rem', padding: '1.5rem', width: '100%', maxWidth: '480px', margin: '1rem', maxHeight: '90vh', overflowY: 'auto', border: '1px solid #27272a' };
  const inp = "w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white placeholder-zinc-500";

  return (
    <div id="adminApp">
      {loading && <Loading />}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        {toasts.map(toast => <Toast key={toast.id} toast={toast} onClose={removeToast} />)}
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-72 bg-zinc-900 border-r border-zinc-800 fixed h-full z-20 hidden lg:flex flex-col">
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-danger to-orange-500 flex items-center justify-center"><i className="fas fa-heartbeat text-white text-xl"></i></div>
              <div><p className="font-bold text-lg">MIAINA</p><p className="text-[10px] text-zinc-500">Administration système</p></div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button key={item.page} onClick={() => setCurrentPage(item.page)} className={`sidebar-item w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 transition ${currentPage === item.page ? 'active bg-danger/20 text-white' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}`}>
                <i className={`fas ${item.icon} w-5`}></i>{item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/50">
              <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center"><i className="fas fa-user-shield text-danger"></i></div>
              <div className="flex-1"><p className="text-sm font-semibold">{(user as any)?.nom || 'Admin'}</p><p className="text-[10px] text-zinc-500">{(user as any)?.niveau_acces || 'Super Admin'}</p></div>
              <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center"><i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-zinc-400 text-sm`}></i></button>
              <button onClick={() => { logout(); navigate('/login'); }} className="text-zinc-400 hover:text-danger"><i className="fas fa-sign-out-alt"></i></button>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 glass px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-bars text-zinc-400"></i></button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-danger to-orange-500 flex items-center justify-center"><i className="fas fa-heartbeat text-white"></i></div>
            <p className="font-bold">MIAINA Admin</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center"><i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-zinc-400 text-sm`}></i></button>
            <button onClick={() => { logout(); navigate('/login'); }} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-sign-out-alt text-zinc-400"></i></button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/70" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="absolute left-0 top-0 bottom-0 w-80 bg-zinc-900 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-6 p-3 border-b border-zinc-800">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gradient-to-br from-danger to-orange-500 flex items-center justify-center"><i className="fas fa-heartbeat text-white"></i></div><div><p className="font-bold">MIAINA</p><p className="text-[10px] text-zinc-500">Administration</p></div></div>
                <button onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-full bg-zinc-800"><i className="fas fa-times text-zinc-400 text-sm"></i></button>
              </div>
              <div className="space-y-1">
                {navItems.map(item => (<button key={item.page} onClick={() => { setCurrentPage(item.page); setMobileMenuOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-sm flex items-center gap-3 ${currentPage === item.page ? 'bg-danger/20 text-white' : 'text-zinc-400'}`}><i className={`fas ${item.icon} w-5`}></i>{item.label}</button>))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-72 pt-16 lg:pt-0 p-4 md:p-6">

          {/* ========== DASHBOARD ========== */}
          {currentPage === 'dashboard' && (
            <div>
              <div className="mb-6 md:mb-8"><h1 className="text-2xl md:text-3xl font-bold">Tableau de bord</h1><p className="text-zinc-400 text-sm mt-1">Vue d'ensemble du système MIAINA</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[{ label: 'Urgences', value: stats.urgences || 0, icon: 'fa-exclamation-triangle', color: 'danger', badge: '+12%' }, { label: 'Commandes', value: stats.commandes || 0, icon: 'fa-shopping-bag', color: 'info', badge: '+18%' }, { label: 'Patients', value: stats.patients || 0, icon: 'fa-users', color: 'success', badge: '+23%' }, { label: 'Médicaments', value: stats.medicaments || 0, icon: 'fa-boxes', color: 'warn', badge: '-5%' }].map((s, i) => (
                  <div key={i} className="stat-card card p-4 md:p-5">
                    <div className="flex items-center justify-between mb-3"><div className={`w-12 h-12 rounded-full bg-${s.color}/15 flex items-center justify-center`}><i className={`fas ${s.icon} text-${s.color} text-xl`}></i></div><span className={`badge bg-${s.color}/20 text-${s.color}`}>{s.badge}</span></div>
                    <p className="text-3xl font-bold">{s.value}</p><p className="text-xs text-zinc-400 mt-1">{s.label} totaux</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="card p-4 md:p-6"><div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Urgences (7 jours)</h3><i className="fas fa-chart-line text-info text-sm"></i></div><canvas id="chartEmergencies" height="200"></canvas></div>
                <div className="card p-4 md:p-6"><div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Revenus pharmacie (7j)</h3><i className="fas fa-chart-line text-success text-sm"></i></div><canvas id="chartRevenue" height="200"></canvas></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card p-4 md:p-6"><h3 className="font-semibold mb-4">Sévérité urgences</h3><canvas id="chartSeverity" height="180"></canvas></div>
                <div className="card p-4 md:p-6"><h3 className="font-semibold mb-4">Utilisateurs par genre</h3><canvas id="chartGender" height="180"></canvas></div>
                <div className="card p-4 md:p-6"><h3 className="font-semibold mb-4">Stock par catégorie</h3><canvas id="chartStockCategory" height="180"></canvas></div>
              </div>
            </div>
          )}

          {/* ========== AMBULANCES ========== */}
          {currentPage === 'ambulances' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des ambulances</h1><p className="text-zinc-400 text-sm">{ambulances.length} ambulances</p></div>
                <button onClick={() => setShowAmbulanceModal(true)} className="px-5 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition"><i className="fas fa-plus mr-2"></i>Ajouter</button>
              </div>
              <div id="adminAmbulanceMap" className="h-72 md:h-80 rounded-2xl overflow-hidden border border-zinc-800 mb-6"></div>
              {ambulances.length === 0 ? (<div className="card p-12 text-center text-zinc-500"><i className="fas fa-ambulance text-4xl mb-3 opacity-30"></i><p>Aucune ambulance enregistrée</p></div>) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ambulances.map(a => (
                    <div key={a.id} className="card p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full ${a.statut === 'DISPONIBLE' ? 'bg-success/15' : 'bg-zinc-800'} flex items-center justify-center`}><i className={`fas fa-ambulance ${a.statut === 'DISPONIBLE' ? 'text-success' : 'text-zinc-600'} text-xl`}></i></div>
                          <div><p className="font-semibold">{a.nom}</p><p className="text-xs text-zinc-400">{a.matricule || 'N/A'} · {a.zone_couverture || 'Zone inconnue'}</p></div>
                        </div>
                        <span className={`badge ${a.statut === 'DISPONIBLE' ? 'bg-success/20 text-success' : 'bg-zinc-700 text-zinc-400'}`}>{a.statut === 'DISPONIBLE' ? 'Disponible' : 'En intervention'}</span>
                      </div>
                      <p className="text-sm text-zinc-400 mb-4"><i className="fas fa-phone text-xs mr-2"></i>{a.telephone}</p>
                      <div className="flex gap-2">
                        <button onClick={() => toggleAmbulanceStatus(a.id, a.statut)} className={`flex-1 py-2 rounded-xl ${a.statut === 'DISPONIBLE' ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'} text-xs font-semibold`}>{a.statut === 'DISPONIBLE' ? 'Mettre en intervention' : 'Rendre disponible'}</button>
                        <button onClick={() => deleteAmbulance(a.id, a.nom)} className="px-3 py-2 rounded-xl bg-danger/15 text-danger text-xs"><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== HÔPITAUX ========== */}
          {currentPage === 'hospitals' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des hôpitaux</h1><p className="text-zinc-400 text-sm">{hospitals.length} établissements</p></div>
                <button onClick={() => setShowHospitalModal(true)} className="px-5 py-2.5 bg-info text-white rounded-xl text-sm font-semibold hover:bg-cyan-600 transition"><i className="fas fa-plus mr-2"></i>Ajouter</button>
              </div>
              {hospitals.length === 0 ? (<div className="card p-12 text-center text-zinc-500"><i className="fas fa-hospital text-4xl mb-3 opacity-30"></i><p>Aucun hôpital enregistré</p></div>) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hospitals.map(h => (
                    <div key={h.id} className="card p-5">
                      <div className="flex items-center gap-3 mb-3"><div className="w-12 h-12 rounded-full bg-info/15 flex items-center justify-center"><i className="fas fa-hospital text-info text-xl"></i></div><div><p className="font-semibold">{h.nom}</p><p className="text-xs text-zinc-400">{h.type || 'Hôpital'}{h.adresse ? ` · ${h.adresse}` : ''}</p></div></div>
                      <p className="text-sm text-zinc-400 mb-3"><i className="fas fa-phone text-xs mr-2"></i>{h.telephone || 'N/A'}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><span className="text-sm text-zinc-400">Lits: {h.capacite_lits || 'N/A'}</span><span className={`badge ${h.urgences_24_7 ? 'bg-danger/20 text-danger' : 'bg-zinc-700 text-zinc-400'}`}>{h.urgences_24_7 ? '🔴 Urgences 24/7' : 'Standard'}</span></div>
                        <button onClick={() => deleteHospital(h.id, h.nom)} className="px-3 py-2 rounded-xl bg-danger/15 text-danger text-xs"><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== PHARMACIES ========== */}
          {currentPage === 'pharmacies' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des pharmacies</h1><p className="text-zinc-400 text-sm">{pharmacies.length} pharmacies</p></div>
                <button onClick={() => setShowPharmacyModal(true)} className="px-5 py-2.5 bg-warn text-black rounded-xl text-sm font-semibold hover:bg-amber-500 transition"><i className="fas fa-plus mr-2"></i>Ajouter</button>
              </div>
              {pharmacies.length === 0 ? (<div className="card p-12 text-center text-zinc-500"><i className="fas fa-pills text-4xl mb-3 opacity-30"></i><p>Aucune pharmacie enregistrée</p></div>) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pharmacies.map(p => (
                    <div key={p.id} className="card p-5">
                      <div className="flex items-center gap-3 mb-3"><div className="w-12 h-12 rounded-full bg-warn/15 flex items-center justify-center"><i className="fas fa-pills text-warn text-xl"></i></div><div><p className="font-semibold">{p.nom_pharmacie}</p><p className="text-xs text-zinc-400">Resp: {p.responsable}</p></div></div>
                      <p className="text-sm text-zinc-400 mb-3"><i className="fas fa-phone text-xs mr-2"></i>{p.telephone}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`badge ${p.statut === 'ACTIF' ? 'bg-success/20 text-success' : 'bg-zinc-700 text-zinc-400'}`}>{p.statut === 'ACTIF' ? '🟢 En ligne' : '🔴 Hors ligne'}</span>
                          {p.livraison_disponible && <span className="badge bg-info/20 text-info">Livraison</span>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => togglePharmacyStatus(p.id, p.statut)} className={`px-3 py-1.5 rounded-lg text-xs ${p.statut === 'ACTIF' ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'}`}><i className="fas fa-power-off mr-1"></i>{p.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}</button>
                          <button onClick={() => deletePharmacy(p.id, p.nom_pharmacie)} className="px-3 py-1.5 rounded-lg bg-danger/15 text-danger text-xs"><i className="fas fa-trash"></i></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== STOCK ========== */}
          {currentPage === 'stock' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des stocks</h1><p className="text-zinc-400 text-sm">Inventaire médicaments</p></div>
                <div className="flex gap-3">
                  <button onClick={() => { setMedForm({ nom: '', categorie: 'Antalgique', description: '', prix: '', stock: '', necessite_ordonnance: false }); setShowMedicineModal(true); }} className="px-5 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition"><i className="fas fa-plus mr-2"></i>Ajouter</button>
                  <button onClick={() => { const l = medicines.filter(m => m.stock < 20); l.length === 0 ? showToast('Aucun stock faible', 'success') : showToast(`${l.length} médicament(s) en stock faible`, 'warn'); }} className="px-5 py-2.5 bg-danger/20 text-danger rounded-xl text-sm font-semibold"><i className="fas fa-exclamation-triangle mr-2"></i>Alertes</button>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mb-6">
                <select value={stockCategoryFilter} onChange={e => setStockCategoryFilter(e.target.value)} className="w-48 bg-zinc-800 border border-zinc-700 rounded-xl text-sm p-3">
                  <option value="ALL">Toutes catégories</option>
                  {Array.from(new Set(medicines.map(m => m.categorie))).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={stockStatusFilter} onChange={e => setStockStatusFilter(e.target.value)} className="w-48 bg-zinc-800 border border-zinc-700 rounded-xl text-sm p-3">
                  <option value="ALL">Tous statuts</option><option value="LOW">Stock faible (&lt;20)</option><option value="MEDIUM">Stock moyen (20-50)</option><option value="GOOD">Stock bon (&gt;50)</option>
                </select>
                <div className="relative flex-1 max-w-xs"><i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i><input type="text" value={stockSearch} onChange={e => setStockSearch(e.target.value)} placeholder="Rechercher..." className="pl-10 bg-zinc-800 border border-zinc-700 rounded-xl text-sm p-3 w-full" /></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[{ label: 'Total', value: medicines.length, color: 'info' }, { label: 'Stock faible', value: medicines.filter(m => m.stock < 20).length, color: 'danger' }, { label: 'Stock moyen', value: medicines.filter(m => m.stock >= 20 && m.stock <= 50).length, color: 'warn' }, { label: 'Stock bon', value: medicines.filter(m => m.stock > 50).length, color: 'success' }].map((s, i) => (
                  <div key={i} className="card p-4 text-center"><p className={`text-2xl font-bold text-${s.color}`}>{s.value}</p><p className="text-xs text-zinc-400 mt-1">{s.label}</p></div>
                ))}
              </div>
              {filteredMedicines.length === 0 ? (<div className="card p-12 text-center text-zinc-500"><i className="fas fa-box-open text-4xl mb-3 opacity-30"></i><p>Aucun médicament trouvé</p></div>) : (
                <div className="space-y-3">
                  {filteredMedicines.map(m => {
                    const ss = getStockStatus(m.stock);
                    return (
                      <div key={m.id} className={`card p-5 ${ss.border}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-info/15 flex items-center justify-center"><i className="fas fa-pills text-info text-xl"></i></div>
                            <div>
                              <p className="font-semibold">{m.nom}</p>
                              <p className="text-xs text-zinc-400">{m.description || ''}</p>
                              <div className="flex gap-2 mt-1"><span className="badge bg-zinc-700 text-zinc-300">{m.categorie}</span>{m.necessite_ordonnance ? <span className="badge bg-danger/20 text-danger">Ordonnance</span> : <span className="badge bg-success/20 text-success">Libre</span>}</div>
                            </div>
                          </div>
                          <div className="text-right"><p className="text-info font-bold">{m.prix.toLocaleString('fr-MG')} Ar</p><span className={`badge ${ss.color} mt-1`}>{ss.text}</span></div>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1"><span>Stock actuel</span><span className="font-bold">{m.stock} unités</span></div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${ss.bar}`} style={{ width: `${Math.min(100, (m.stock / 200) * 100)}%` }}></div></div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => editMedicineStock(m.id)} className="flex-1 py-2 rounded-xl bg-info/15 text-info text-xs font-semibold"><i className="fas fa-edit mr-1"></i>Modifier stock</button>
                          <button onClick={() => updateMedicineStock(m.id, -1)} className="px-4 py-2 rounded-xl bg-warn/15 text-warn text-xs"><i className="fas fa-minus"></i></button>
                          <button onClick={() => updateMedicineStock(m.id, 1)} className="px-4 py-2 rounded-xl bg-success/15 text-success text-xs"><i className="fas fa-plus"></i></button>
                          <button onClick={() => deleteMedicine(m.id, m.nom)} className="px-4 py-2 rounded-xl bg-danger/15 text-danger text-xs"><i className="fas fa-trash"></i></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========== URGENCES ========== */}
          {currentPage === 'emergencies' && (
            <div>
              <div className="mb-6"><h1 className="text-2xl font-bold">Gestion des urgences</h1><p className="text-zinc-400 text-sm">{emergencies.length} urgences</p></div>
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {[{ k: 'ALL', l: 'Toutes' }, { k: 'PENDING', l: 'En attente' }, { k: 'ASSIGNED', l: 'Assignées' }, { k: 'IN_PROGRESS', l: 'En cours' }, { k: 'RESOLVED', l: 'Résolues' }].map(f => (
                  <button key={f.k} onClick={() => setEmergencyFilter(f.k)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${emergencyFilter === f.k ? 'bg-danger text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
                    {f.l} {f.k !== 'ALL' && <span className="ml-1 text-xs opacity-70">({emergencies.filter(e => e.statut === f.k).length})</span>}
                  </button>
                ))}
              </div>
              {filteredEmergencies.length === 0 ? (<div className="card p-12 text-center text-zinc-500"><i className="fas fa-check-circle text-4xl mb-3 opacity-30 text-success"></i><p>Aucune urgence ici</p></div>) : (
                <div className="space-y-3">
                  {filteredEmergencies.map(e => (
                    <div key={e.id} className="card p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2"><p className="font-semibold">{e.Patient ? `${e.Patient.nom} ${e.Patient.prenom}` : 'Inconnu'}</p><span className={`badge ${e.niveau_priorite === 'CRITIQUE' ? 'bg-danger/20 text-danger' : 'bg-warn/20 text-warn'}`}>{e.niveau_priorite || 'N/A'}</span></div>
                          <p className="text-xs text-zinc-400 mt-1">{e.type_urgence || 'Urgence'} · {e.localisation || 'Localisation inconnue'}</p>
                          <p className="text-xs text-zinc-500">{new Date(e.date_alerte).toLocaleString('fr-FR')}</p>
                        </div>
                        <span className={`badge ${statusColors[e.statut] || 'bg-zinc-700'}`}>{statusLabels[e.statut] || e.statut}</span>
                      </div>
                      {e.Patient?.telephone && <p className="text-xs text-info mb-2"><i className="fas fa-phone mr-1"></i><a href={`tel:${e.Patient.telephone}`}>{e.Patient.telephone}</a></p>}
                      {e.Ambulancier && <p className="text-xs text-zinc-500 mb-2"><i className="fas fa-ambulance mr-1"></i>{e.Ambulancier.nom}</p>}
                      {e.statut !== 'RESOLVED' && (
                        <div className="flex gap-2 mt-3">
                          {e.statut === 'PENDING' && <button onClick={() => updateEmergencyStatus(e.id, 'ASSIGNED')} className="flex-1 py-2 rounded-xl bg-info/15 text-info text-xs font-semibold">Assigner</button>}
                          {(e.statut === 'PENDING' || e.statut === 'ASSIGNED') && <button onClick={() => updateEmergencyStatus(e.id, 'IN_PROGRESS')} className="flex-1 py-2 rounded-xl bg-purple-500/15 text-purple-400 text-xs font-semibold">En cours</button>}
                          <button onClick={() => updateEmergencyStatus(e.id, 'RESOLVED')} className="flex-1 py-2 rounded-xl bg-success/15 text-success text-xs font-semibold">Résoudre</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== COMMANDES ========== */}
          {currentPage === 'orders' && (
            <div>
              <div className="mb-6"><h1 className="text-2xl font-bold">Gestion des commandes</h1><p className="text-zinc-400 text-sm">{orders.length} commandes</p></div>
              {orders.length === 0 ? (<div className="card p-12 text-center text-zinc-500"><i className="fas fa-shopping-bag text-4xl mb-3 opacity-30"></i><p>Aucune commande</p></div>) : (
                <div className="space-y-3">
                  {orders.map(o => (
                    <div key={o.id} className="card p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div><p className="font-semibold">Commande #{o.id}</p><p className="text-xs text-zinc-400">{new Date(o.date_commande).toLocaleDateString('fr-FR')} · {o.Pharmacien?.nom_pharmacie || 'N/A'}</p><p className="text-sm mt-1">{o.Patient ? `${o.Patient.nom} ${o.Patient.prenom}` : 'Inconnu'}</p></div>
                        <span className={`badge ${statusColors[o.statut] || 'bg-zinc-700'}`}>{statusLabels[o.statut] || o.statut}</span>
                      </div>
                      {o.CommandeDetails && <p className="text-sm text-zinc-400 mb-3">{o.CommandeDetails.map(d => `${d.Medicament?.nom || 'Médicament'} x${d.quantite}`).join(', ')}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-info font-bold">{Number(o.montant_total).toLocaleString('fr-MG')} Ar</span>
                        <div className="flex gap-2">
                          {o.statut === 'CONFIRMED' && <button onClick={() => updateOrderStatus(o.id, 'PREPARED')} className="px-3 py-1.5 rounded-lg bg-warn/15 text-warn text-xs">Préparer</button>}
                          {(o.statut === 'PREPARED' || o.statut === 'EN_LIVRAISON') && <button onClick={() => updateOrderStatus(o.id, 'DELIVERED')} className="px-3 py-1.5 rounded-lg bg-success/15 text-success text-xs">Livrer</button>}
                          {o.statut !== 'DELIVERED' && o.statut !== 'CANCELLED' && <button onClick={() => updateOrderStatus(o.id, 'CANCELLED')} className="px-3 py-1.5 rounded-lg bg-danger/15 text-danger text-xs">Annuler</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== UTILISATEURS ========== */}
          {currentPage === 'users' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des utilisateurs</h1><p className="text-zinc-400 text-sm">{users.length} utilisateurs</p></div>
                <button onClick={() => setShowUserModal(true)} className="px-5 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition"><i className="fas fa-user-plus mr-2"></i>Ajouter</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {['PATIENT', 'AMBULANCIER', 'PHARMACIEN', 'ADMIN'].map((role, i) => (<div key={i} className="card p-4 text-center"><p className="text-2xl font-bold text-info">{users.filter(u => u.role === role).length}</p><p className="text-xs text-zinc-400 mt-1">{role === 'PATIENT' ? 'Patients' : role === 'AMBULANCIER' ? 'Ambulanciers' : role === 'PHARMACIEN' ? 'Pharmaciens' : 'Admins'}</p></div>))}
              </div>
              {users.length === 0 ? (<div className="card p-12 text-center text-zinc-500"><i className="fas fa-users text-4xl mb-3 opacity-30"></i><p>Aucun utilisateur</p></div>) : (
                <div className="space-y-3">
                  {users.map(u => (
                    <div key={`${u.role}-${u.id}`} className="card p-5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-danger to-orange-500 flex items-center justify-center text-base font-bold text-white">{(u.nom || '?')[0].toUpperCase()}</div>
                        <div>
                          <p className="font-semibold">{u.nom} {u.prenom || ''}</p>
                          <p className="text-xs text-zinc-400">{u.email || u.telephone}</p>
                          <div className="flex gap-1 mt-1"><span className={`badge text-[10px] ${u.role === 'PATIENT' ? 'bg-info/20 text-info' : u.role === 'ADMIN' ? 'bg-danger/20 text-danger' : u.role === 'AMBULANCIER' ? 'bg-success/20 text-success' : 'bg-warn/20 text-warn'}`}>{u.role}</span><span className={`badge text-[10px] ${u.statut === 'ACTIF' ? 'bg-success/20 text-success' : 'bg-zinc-700 text-zinc-400'}`}>{u.statut}</span></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => toggleUserStatus(u.id, u.role, u.statut)} className={`px-3 py-1.5 rounded-lg text-xs ${u.statut === 'ACTIF' ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'}`}>{u.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}</button>
                        <button onClick={() => deleteUser(u.id, u.role, `${u.nom} ${u.prenom || ''}`)} className="px-3 py-1.5 rounded-lg bg-danger/15 text-danger text-xs"><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== CONSEILS SANTÉ (ARTICLES) ========== */}
          {currentPage === 'articles' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Conseils Santé</h1><p className="text-zinc-400 text-sm">{articles.length} articles · visibles par les patients dans l'onglet Bien-être</p></div>
                <button onClick={() => openArticleModal()} className="px-5 py-2.5 bg-info text-white rounded-xl text-sm font-semibold hover:bg-cyan-600 transition"><i className="fas fa-plus mr-2"></i>Nouvel article</button>
              </div>
              <div className="flex flex-wrap gap-3 mb-6">
                <select value={articleCatFilter} onChange={e => setArticleCatFilter(e.target.value)} className="w-48 bg-zinc-800 border border-zinc-700 rounded-xl text-sm p-3">
                  <option value="ALL">Toutes catégories</option>
                  {['GENERAL', 'FEMME', 'HOMME', 'MENTAL', 'NUTRITION', 'SPORT', 'ENFANT', 'VACCINATION'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="relative flex-1 max-w-xs"><i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i><input type="text" value={articleSearch} onChange={e => setArticleSearch(e.target.value)} placeholder="Rechercher un article..." className="pl-10 bg-zinc-800 border border-zinc-700 rounded-xl text-sm p-3 w-full" /></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[{ label: 'Total articles', value: articles.length, color: 'info' }, { label: 'Publiés', value: articles.filter(a => a.statut === 'PUBLIE').length, color: 'success' }, { label: 'Archivés', value: articles.filter(a => a.statut === 'ARCHIVE').length, color: 'zinc-400' }, { label: 'Total vues', value: articles.reduce((s, a) => s + (a.vues || 0), 0), color: 'warn' }].map((s, i) => (
                  <div key={i} className="card p-4 text-center"><p className={`text-2xl font-bold text-${s.color}`}>{s.value}</p><p className="text-xs text-zinc-400 mt-1">{s.label}</p></div>
                ))}
              </div>
              {filteredArticles.length === 0 ? (
                <div className="card p-12 text-center text-zinc-500">
                  <i className="fas fa-newspaper text-4xl mb-3 opacity-30"></i>
                  <p className="mb-4">Aucun article trouvé</p>
                  <button onClick={() => openArticleModal()} className="px-5 py-2.5 bg-info text-white rounded-xl text-sm font-semibold">Créer le premier article</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredArticles.map(a => (
                    <div key={a.id} className="card p-5">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`badge ${catColors[a.categorie] || 'bg-zinc-700'}`}>{a.categorie}</span>
                            {a.cible_genre !== 'TOUS' && <span className={`badge ${a.cible_genre === 'FEMININ' ? 'bg-pink-500/20 text-pink-400' : 'bg-info/20 text-info'}`}>{a.cible_genre === 'FEMININ' ? '♀ Femme' : '♂ Homme'}</span>}
                            <span className={`badge ${a.statut === 'PUBLIE' ? 'bg-success/20 text-success' : 'bg-zinc-700 text-zinc-400'}`}>{a.statut === 'PUBLIE' ? '🟢 Publié' : '📦 Archivé'}</span>
                          </div>
                          <p className="font-semibold text-base">{a.titre}</p>
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{a.resume || a.contenu.substring(0, 100)}...</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                            {a.auteur && <span><i className="fas fa-user mr-1"></i>{a.auteur}</span>}
                            <span><i className="fas fa-eye mr-1"></i>{a.vues || 0} vues</span>
                            <span><i className="fas fa-heart mr-1"></i>{a.likes || 0} likes</span>
                          </div>
                          {a.tags && <p className="text-xs text-zinc-600 mt-1">{a.tags.split(',').map(t => `#${t.trim()}`).join(' ')}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openArticleModal(a)} className="flex-1 py-2 rounded-xl bg-info/15 text-info text-xs font-semibold"><i className="fas fa-edit mr-1"></i>Modifier</button>
                        <button onClick={() => toggleArticleStatut(a)} className={`px-4 py-2 rounded-xl text-xs font-semibold ${a.statut === 'PUBLIE' ? 'bg-zinc-700 text-zinc-400' : 'bg-success/15 text-success'}`}>{a.statut === 'PUBLIE' ? <><i className="fas fa-archive mr-1"></i>Archiver</> : <><i className="fas fa-upload mr-1"></i>Publier</>}</button>
                        <button onClick={() => deleteArticle(a.id, a.titre)} className="px-4 py-2 rounded-xl bg-danger/15 text-danger text-xs"><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== RAPPORTS ========== */}
          {currentPage === 'reports' && (
            <div>
              <div className="mb-6"><h1 className="text-2xl font-bold">Rapports et analyses</h1><p className="text-zinc-400 text-sm">Export de données</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[{ type: 'emergencies', label: 'Urgences', icon: 'fa-exclamation-triangle', color: 'danger', count: stats.urgences || 0 }, { type: 'orders', label: 'Commandes', icon: 'fa-shopping-bag', color: 'info', count: stats.commandes || 0 }, { type: 'users', label: 'Utilisateurs', icon: 'fa-users', color: 'success', count: stats.patients || 0 }, { type: 'stock', label: 'Stocks', icon: 'fa-boxes', color: 'warn', count: stats.medicaments || 0 }].map(r => (
                  <div key={r.type} className="card p-5 cursor-pointer hover:bg-zinc-800 transition" onClick={() => { showToast(`Export ${r.type} en cours...`, 'success'); setTimeout(() => showToast(`Rapport téléchargé`, 'info'), 1000); }}>
                    <div className={`w-12 h-12 rounded-full bg-${r.color}/15 flex items-center justify-center mb-3`}><i className={`fas ${r.icon} text-${r.color} text-xl`}></i></div>
                    <h3 className="font-semibold">Rapport {r.label}</h3>
                    <p className="text-xs text-zinc-500 mt-1">{r.count} entrées · CSV</p>
                    <div className="mt-3 text-xs text-info"><i className="fas fa-download mr-1"></i>Télécharger</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="font-semibold mb-4">Résumé système</h3>
                  <div className="space-y-3">
                    {[{ label: 'Ambulances disponibles', value: ambulances.filter(a => a.statut === 'DISPONIBLE').length, total: ambulances.length, color: 'success' }, { label: 'Pharmacies actives', value: pharmacies.filter(p => p.statut === 'ACTIF').length, total: pharmacies.length, color: 'warn' }, { label: 'Urgences en attente', value: emergencies.filter(e => e.statut === 'PENDING').length, total: emergencies.length, color: 'danger' }, { label: 'Articles publiés', value: articles.filter(a => a.statut === 'PUBLIE').length, total: articles.length, color: 'info' }].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1"><span className="text-zinc-400">{item.label}</span><span className={`font-semibold text-${item.color}`}>{item.value}/{item.total}</span></div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className={`h-full bg-${item.color} rounded-full`} style={{ width: item.total > 0 ? `${(item.value / item.total) * 100}%` : '0%' }}></div></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card p-6"><h3 className="font-semibold mb-4">Tendances mensuelles</h3><canvas id="chartMonthly" height="200"></canvas></div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ========== MODALS ========== */}

      {/* Medicine Modal - FORMULAIRE CONTRÔLÉ */}
      {showMedicineModal && (
        <div style={mS} onClick={() => setShowMedicineModal(false)}>
          <div style={mC} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold"><i className="fas fa-pills mr-2 text-info"></i>Ajouter un médicament</h3><button onClick={() => setShowMedicineModal(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-times text-zinc-400"></i></button></div>
            <div className="space-y-4">
              <div><label className="text-xs text-zinc-400 mb-1 block">Nom du médicament *</label><input type="text" value={medForm.nom} onChange={e => setMedForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: Paracétamol 500mg" className={inp} /></div>
              <div><label className="text-xs text-zinc-400 mb-1 block">Catégorie</label><select value={medForm.categorie} onChange={e => setMedForm(f => ({ ...f, categorie: e.target.value }))} className={inp}>{['Antalgique', 'Antibiotique', 'AINS', 'Cardiovasculaire', 'Gastro', 'Vitamines', 'Autre'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-xs text-zinc-400 mb-1 block">Description</label><textarea value={medForm.description} onChange={e => setMedForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Description du médicament" className={inp + ' resize-none'}></textarea></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-zinc-400 mb-1 block">Prix (Ar) *</label><input type="number" value={medForm.prix} onChange={e => setMedForm(f => ({ ...f, prix: e.target.value }))} placeholder="5000" min="0" className={inp} /></div>
                <div><label className="text-xs text-zinc-400 mb-1 block">Stock initial *</label><input type="number" value={medForm.stock} onChange={e => setMedForm(f => ({ ...f, stock: e.target.value }))} placeholder="100" min="0" className={inp} /></div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={medForm.necessite_ordonnance} onChange={e => setMedForm(f => ({ ...f, necessite_ordonnance: e.target.checked }))} className="w-4 h-4" /><span className="text-sm">Nécessite ordonnance</span></label>
              <button onClick={addMedicine} disabled={loading} className="w-full bg-success text-white py-3 rounded-xl font-semibold hover:bg-green-600 transition disabled:opacity-50">{loading ? 'Ajout en cours...' : 'Ajouter le médicament'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Ambulance Modal */}
      {showAmbulanceModal && (
        <div style={mS} onClick={() => setShowAmbulanceModal(false)}>
          <div style={mC} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold"><i className="fas fa-ambulance mr-2 text-success"></i>Ajouter une ambulance</h3><button onClick={() => setShowAmbulanceModal(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-times text-zinc-400"></i></button></div>
            <div className="space-y-4">
              <input type="text" id="ambName" placeholder="Nom (ex: AMB-006) *" className={inp} />
              <input type="tel" id="ambPhone" placeholder="Téléphone *" className={inp} />
              <input type="text" id="ambMatricule" placeholder="Matricule" className={inp} />
              <select id="ambZone" className={inp}><option value="Tana Nord">Zone Tana Nord</option><option value="Tana Sud">Zone Tana Sud</option><option value="Tana Est">Zone Tana Est</option><option value="Tana Ouest">Zone Tana Ouest</option></select>
              <input type="password" id="ambPassword" placeholder="Mot de passe" className={inp} />
              <button onClick={addAmbulance} disabled={loading} className="w-full bg-success text-white py-3 rounded-xl font-semibold disabled:opacity-50">{loading ? 'Ajout...' : "Ajouter l'ambulance"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Hospital Modal */}
      {showHospitalModal && (
        <div style={mS} onClick={() => setShowHospitalModal(false)}>
          <div style={mC} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold"><i className="fas fa-hospital mr-2 text-info"></i>Ajouter un hôpital</h3><button onClick={() => setShowHospitalModal(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-times text-zinc-400"></i></button></div>
            <div className="space-y-4">
              <input type="text" id="hospName" placeholder="Nom de l'établissement *" className={inp} />
              <input type="tel" id="hospPhone" placeholder="Téléphone *" className={inp} />
              <input type="text" id="hospAddress" placeholder="Adresse" className={inp} />
              <div className="grid grid-cols-2 gap-3"><input type="number" id="hospLat" placeholder="Latitude" step="0.000001" defaultValue="-18.8792" className={inp} /><input type="number" id="hospLng" placeholder="Longitude" step="0.000001" defaultValue="47.5200" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3"><input type="number" id="hospCapacity" placeholder="Capacité (lits)" defaultValue="100" className={inp} /><select id="hospType" className={inp}><option value="HOPITAL">Hôpital</option><option value="CLINIQUE">Clinique</option><option value="CSB">CSB</option><option value="DISPENSAIRE">Dispensaire</option></select></div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="hospEmergency" defaultChecked className="w-4 h-4" /><span className="text-sm">Urgences 24/7</span></label>
              <button onClick={addHospital} disabled={loading} className="w-full bg-info text-white py-3 rounded-xl font-semibold disabled:opacity-50">{loading ? 'Ajout...' : "Ajouter l'hôpital"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Pharmacy Modal */}
      {showPharmacyModal && (
        <div style={mS} onClick={() => setShowPharmacyModal(false)}>
          <div style={mC} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold"><i className="fas fa-pills mr-2 text-warn"></i>Ajouter une pharmacie</h3><button onClick={() => setShowPharmacyModal(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-times text-zinc-400"></i></button></div>
            <div className="space-y-4">
              <input type="text" id="pharmName" placeholder="Nom de la pharmacie *" className={inp} />
              <input type="text" id="pharmResp" placeholder="Responsable" className={inp} />
              <input type="tel" id="pharmPhone" placeholder="Téléphone *" className={inp} />
              <input type="email" id="pharmEmail" placeholder="Email" className={inp} />
              <input type="text" id="pharmAddress" placeholder="Adresse" className={inp} />
              <input type="password" id="pharmPassword" placeholder="Mot de passe" className={inp} />
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="pharmDelivery" defaultChecked className="w-4 h-4" /><span className="text-sm">Livraison disponible</span></label>
              <button onClick={addPharmacy} disabled={loading} className="w-full bg-warn text-black py-3 rounded-xl font-semibold disabled:opacity-50">{loading ? 'Ajout...' : 'Ajouter la pharmacie'}</button>
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div style={mS} onClick={() => setShowUserModal(false)}>
          <div style={mC} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold"><i className="fas fa-user-plus mr-2 text-success"></i>Ajouter un utilisateur</h3><button onClick={() => setShowUserModal(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-times text-zinc-400"></i></button></div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3"><input type="text" id="userNom" placeholder="Nom *" className={inp} /><input type="text" id="userPrenom" placeholder="Prénom" className={inp} /></div>
              <input type="email" id="userEmail" placeholder="Email" className={inp} />
              <input type="tel" id="userPhone" placeholder="Téléphone *" className={inp} />
              <select id="userRole" className={inp}><option value="PATIENT">Patient</option><option value="AMBULANCIER">Ambulancier</option><option value="PHARMACIEN">Pharmacien</option><option value="ADMIN">Administrateur</option></select>
              <select id="userGender" className={inp}><option value="MASCULIN">Masculin</option><option value="FEMININ">Féminin</option></select>
              <select id="userBlood" className={inp}>{['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(b => <option key={b} value={b}>{b}</option>)}</select>
              <input type="password" id="userPassword" placeholder="Mot de passe" className={inp} />
              <button onClick={addUser} disabled={loading} className="w-full bg-success text-white py-3 rounded-xl font-semibold disabled:opacity-50">{loading ? 'Ajout...' : "Ajouter l'utilisateur"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Article Modal - FORMULAIRE CONTRÔLÉ */}
      {showArticleModal && (
        <div style={mS} onClick={() => setShowArticleModal(false)}>
          <div style={{ ...mC, maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold"><i className="fas fa-newspaper mr-2 text-info"></i>{editingArticle ? "Modifier l'article" : 'Nouvel article santé'}</h3><button onClick={() => setShowArticleModal(false)} className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-times text-zinc-400"></i></button></div>
            <div className="space-y-4">
              <div><label className="text-xs text-zinc-400 mb-1 block">Titre *</label><input type="text" value={articleForm.titre} onChange={e => setArticleForm(f => ({ ...f, titre: e.target.value }))} placeholder="Titre de l'article" className={inp} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-zinc-400 mb-1 block">Catégorie</label><select value={articleForm.categorie} onChange={e => setArticleForm(f => ({ ...f, categorie: e.target.value }))} className={inp}>{['GENERAL', 'FEMME', 'HOMME', 'MENTAL', 'NUTRITION', 'SPORT', 'ENFANT', 'VACCINATION'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label className="text-xs text-zinc-400 mb-1 block">Public cible</label><select value={articleForm.cible_genre} onChange={e => setArticleForm(f => ({ ...f, cible_genre: e.target.value }))} className={inp}><option value="TOUS">Tous les patients</option><option value="FEMININ">Femmes seulement</option><option value="MASCULIN">Hommes seulement</option></select></div>
              </div>
              <div><label className="text-xs text-zinc-400 mb-1 block">Résumé (affiché dans la liste)</label><input type="text" value={articleForm.resume} onChange={e => setArticleForm(f => ({ ...f, resume: e.target.value }))} placeholder="Courte description de l'article" className={inp} /></div>
              <div><label className="text-xs text-zinc-400 mb-1 block">Contenu complet *</label><textarea value={articleForm.contenu} onChange={e => setArticleForm(f => ({ ...f, contenu: e.target.value }))} rows={6} placeholder="Rédigez le contenu de l'article ici..." className={inp + ' resize-y'}></textarea></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-zinc-400 mb-1 block">Auteur</label><input type="text" value={articleForm.auteur} onChange={e => setArticleForm(f => ({ ...f, auteur: e.target.value }))} placeholder="Dr. Nom" className={inp} /></div>
                <div><label className="text-xs text-zinc-400 mb-1 block">Tags (séparés par virgule)</label><input type="text" value={articleForm.tags} onChange={e => setArticleForm(f => ({ ...f, tags: e.target.value }))} placeholder="santé,prévention,conseil" className={inp} /></div>
              </div>
              <div><label className="text-xs text-zinc-400 mb-1 block">Statut de publication</label><select value={articleForm.statut} onChange={e => setArticleForm(f => ({ ...f, statut: e.target.value }))} className={inp}><option value="PUBLIE">🟢 Publier maintenant (visible par les patients)</option><option value="BROUILLON">📝 Brouillon (non visible)</option><option value="ARCHIVE">📦 Archiver</option></select></div>
              <button onClick={saveArticle} disabled={loading} className="w-full bg-info text-white py-3 rounded-xl font-semibold hover:bg-cyan-600 transition disabled:opacity-50"><i className="fas fa-save mr-2"></i>{loading ? 'Sauvegarde...' : editingArticle ? "Mettre à jour l'article" : "Publier l'article"}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPage;