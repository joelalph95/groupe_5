import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import Chart from 'chart.js/auto';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { adminService, pharmacyService, emergencyService } from '../services/api';
import socketService from '../services/socket';
import Toast from '../components/common/Toast';
import Loading from '../components/common/Loading';

const TANA: [number, number] = [-18.8792, 47.5200];

interface Medicine {
  id: number;
  name: string;
  desc: string;
  cat: string;
  price: number;
  stock: number;
  rx: boolean;
}

interface Ambulance {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: string;
  driver: string;
  phone: string;
}

interface Hospital {
  id: number;
  name: string;
  lat: number;
  lng: number;
  phone: string;
  capacity: number;
  emergency: boolean;
}

interface Pharmacy {
  id: number;
  name: string;
  lat: number;
  lng: number;
  phone: string;
  online: boolean;
  delivery: boolean;
}

interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: string;
  gender: string;
  blood: string;
  active: boolean;
  created: string;
}

interface Order {
  id: number;
  user: string;
  items: { name: string; qty: number }[];
  total: number;
  status: string;
  date: string;
  pharmacy: string;
}

interface Emergency {
  id: number;
  patient: string;
  type: string;
  severity: string;
  status: string;
  time: string;
  location: string;
  phone: string;
  assigned: string | null;
}

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toasts, showToast, removeToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  
  // Data
  const [medicines, setMedicines] = useState<Medicine[]>([
    { id: 1, name: 'Paracétamol 500mg', desc: 'Antalgique fébrifuge', cat: 'Antalgique', price: 5000, stock: 45, rx: false },
    { id: 2, name: 'Amoxicilline 500mg', desc: 'Antibiotique large spectre', cat: 'Antibiotique', price: 8000, stock: 12, rx: true },
    { id: 3, name: 'Ibuprofène 400mg', desc: 'Anti-inflammatoire', cat: 'AINS', price: 6000, stock: 78, rx: false },
    { id: 4, name: 'Doliprane 1000mg', desc: 'Antalgique fort', cat: 'Antalgique', price: 7000, stock: 120, rx: false },
    { id: 5, name: 'Aspirine 100mg', desc: 'Anticoagulant', cat: 'Cardiovasculaire', price: 4000, stock: 200, rx: false },
    { id: 6, name: 'Oméprazole 20mg', desc: 'Anti-ulcéreux', cat: 'Gastro', price: 6500, stock: 8, rx: true },
    { id: 7, name: 'Azithromycine 250mg', desc: 'Antibiotique', cat: 'Antibiotique', price: 12000, stock: 5, rx: true },
    { id: 8, name: 'Vitamine C 500mg', desc: 'Supplément', cat: 'Vitamines', price: 3500, stock: 150, rx: false }
  ]);
  
  const [ambulances, setAmbulances] = useState<Ambulance[]>([
    { id: 1, name: 'AMB-001', lat: -18.8800, lng: 47.5180, status: 'DISPONIBLE', driver: 'Rakoto P.', phone: '+261 34 12 345 67' },
    { id: 2, name: 'AMB-002', lat: -18.8750, lng: 47.5250, status: 'DISPONIBLE', driver: 'Razafy M.', phone: '+261 34 23 456 78' },
    { id: 3, name: 'AMB-003', lat: -18.8900, lng: 47.5100, status: 'EN_INTERVENTION', driver: 'Andry T.', phone: '+261 34 34 567 89' },
    { id: 4, name: 'AMB-004', lat: -18.8700, lng: 47.5350, status: 'DISPONIBLE', driver: 'Hasina V.', phone: '+261 34 45 678 90' },
    { id: 5, name: 'AMB-005', lat: -18.8950, lng: 47.5250, status: 'DISPONIBLE', driver: 'Naina R.', phone: '+261 34 56 789 01' }
  ]);
  
  const [hospitals, setHospitals] = useState<Hospital[]>([
    { id: 1, name: 'CHU HJRA', lat: -18.8850, lng: 47.5150, phone: '+261 20 22 326 19', capacity: 500, emergency: true },
    { id: 2, name: 'CHU Androva', lat: -18.8720, lng: 47.5080, phone: '+261 20 22 412 68', capacity: 350, emergency: true },
    { id: 3, name: 'Clinique MMN', lat: -18.8900, lng: 47.5300, phone: '+261 20 22 632 00', capacity: 150, emergency: true },
    { id: 4, name: 'CSB Anosy', lat: -18.8850, lng: 47.5100, phone: '+261 20 22 445 56', capacity: 80, emergency: false }
  ]);
  
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([
    { id: 1, name: 'Pharmacie Central Tana', lat: -18.8792, lng: 47.5200, phone: '+261 20 22 123 45', online: true, delivery: true },
    { id: 2, name: 'Pharmacie Ville', lat: -18.8800, lng: 47.5300, phone: '+261 20 22 234 56', online: true, delivery: true },
    { id: 3, name: 'Pharmacie Anosy', lat: -18.8850, lng: 47.5100, phone: '+261 20 22 345 67', online: false, delivery: false }
  ]);
  
  const [users, setUsers] = useState<User[]>([
    { id: 1, email: 'patient@miaina.mg', name: 'Rakoto Marie', phone: '+261 34 00 123 45', role: 'PATIENT', gender: 'FEMININ', blood: 'A+', active: true, created: '2024-01-15' },
    { id: 2, email: 'homme@miaina.mg', name: 'Razafi Jean', phone: '+261 34 00 678 90', role: 'PATIENT', gender: 'MASCULIN', blood: 'O+', active: true, created: '2024-02-20' },
    { id: 3, email: 'admin@miaina.mg', name: 'Admin System', phone: '+261 34 00 000 01', role: 'ADMIN', gender: 'MASCULIN', blood: 'B+', active: true, created: '2024-01-01' }
  ]);
  
  const [orders, setOrders] = useState<Order[]>([
    { id: 101, user: 'Rakoto Marie', items: [{ name: 'Paracétamol 500mg', qty: 2 }], total: 10000, status: 'DELIVERED', date: '2024-12-10', pharmacy: 'Pharmacie Central Tana' },
    { id: 102, user: 'Razafi Jean', items: [{ name: 'Amoxicilline 500mg', qty: 1 }], total: 8000, status: 'CONFIRMED', date: '2024-12-12', pharmacy: 'Pharmacie Ville' },
    { id: 103, user: 'Rakoto Marie', items: [{ name: 'Vitamine C', qty: 3 }], total: 10500, status: 'PREPARED', date: '2024-12-13', pharmacy: 'Pharmacie Central Tana' }
  ]);
  
  const [emergencies, setEmergencies] = useState<Emergency[]>([
    { id: 1, patient: 'Rakoto Marie', type: 'Accident', severity: 'CRITIQUE', status: 'IN_PROGRESS', time: '14:23', location: 'Analakely', phone: '+261 34 00 123 45', assigned: 'AMB-001' },
    { id: 2, patient: 'Razafi Jean', type: 'Malaise', severity: 'MOYEN', status: 'ASSIGNED', time: '14:45', location: 'Isotry', phone: '+261 34 00 678 90', assigned: 'AMB-002' },
    { id: 3, patient: 'Andry Solo', type: 'Douleur aiguë', severity: 'ÉLEVÉ', status: 'PENDING', time: '15:02', location: '67ha', phone: '+261 34 11 111 11', assigned: null },
    { id: 4, patient: 'Hasina Voara', type: 'Accouchement', severity: 'CRITIQUE', status: 'RESOLVED', time: '13:30', location: 'Anosy', phone: '+261 34 22 222 22', assigned: 'AMB-003' }
  ]);
  
  // Filters
  const [stockCategoryFilter, setStockCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [stockSearch, setStockSearch] = useState('');
  const [emergencyFilter, setEmergencyFilter] = useState('ALL');
  
  // Map and charts refs
  const adminMapRef = useRef<L.Map | null>(null);
  const chartRefs = useRef<{ [key: string]: Chart | null }>({});

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (currentPage === 'ambulances') {
      setTimeout(initAmbulanceMap, 100);
    }
    if (currentPage === 'dashboard') {
      setTimeout(renderCharts, 100);
    }
    if (currentPage === 'stock') {
      renderStock();
    }
  }, [currentPage, medicines, stockCategoryFilter, stockStatusFilter, stockSearch]);

  const handleNewEmergency = (data: any) => {
    showToast(`Nouvelle urgence: ${data.type_urgence}`, 'warn');
    const newEmergency: Emergency = {
      id: Date.now(),
      patient: data.Patient?.nom || 'Inconnu',
      type: data.type_urgence || 'Urgence',
      severity: data.niveau_priorite || 'MOYEN',
      status: 'PENDING',
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      location: data.localisation || 'Inconnu',
      phone: data.Patient?.telephone || '',
      assigned: null
    };
    setEmergencies(prev => [newEmergency, ...prev]);
  };

  const handleNewBIP = (data: any) => {
    showToast(`📞 BIP reçu de: ${data.expediteur}`, 'warn');
  };

  const initAmbulanceMap = () => {
    const mapEl = document.getElementById('adminAmbulanceMap');
    if (!mapEl) return;
    
    if (adminMapRef.current) {
      adminMapRef.current.remove();
      adminMapRef.current = null;
    }
    
    adminMapRef.current = L.map('adminAmbulanceMap', { attributionControl: false }).setView(TANA, 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(adminMapRef.current);
    
    ambulances.forEach(a => {
      const color = a.status === 'DISPONIBLE' ? '#10b981' : '#52525b';
      const icon = L.divIcon({
        className: '',
        html: `<div class="ambulance-marker" style="background:${color}"><i class="fas fa-ambulance text-white"></i></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      L.marker([a.lat, a.lng], { icon }).addTo(adminMapRef.current!).bindPopup(`<b>${a.name}</b><br>${a.driver}<br>Statut: ${a.status === 'DISPONIBLE' ? 'Disponible' : 'En intervention'}`);
    });
    
    setTimeout(() => adminMapRef.current?.invalidateSize(), 200);
  };

  const renderCharts = () => {
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
    
    const ctx4 = document.getElementById('chartGender') as HTMLCanvasElement;
    if (ctx4) {
      if (chartRefs.current.gender) chartRefs.current.gender.destroy();
      chartRefs.current.gender = new Chart(ctx4, {
        type: 'bar',
        data: {
          labels: ['Femmes', 'Hommes', 'Autre'],
          datasets: [{ label: 'Utilisateurs', data: [680, 520, 84], backgroundColor: ['#ec4899', '#06b6d4', '#a855f7'], borderRadius: 8 }]
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
    
    const ctx6 = document.getElementById('chartStockCategory') as HTMLCanvasElement;
    if (ctx6) {
      if (chartRefs.current.stockCat) chartRefs.current.stockCat.destroy();
      const categories = medicines.map(m => m.cat).filter((v, i, a) => a.indexOf(v) === i);
      const stockByCat = categories.map(cat => medicines.filter(m => m.cat === cat).reduce((sum, m) => sum + m.stock, 0));
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
      if (stockCategoryFilter !== 'ALL' && m.cat !== stockCategoryFilter) return false;
      if (stockStatusFilter === 'LOW' && m.stock >= 20) return false;
      if (stockStatusFilter === 'MEDIUM' && (m.stock < 20 || m.stock > 50)) return false;
      if (stockStatusFilter === 'GOOD' && m.stock <= 50) return false;
      if (stockSearch && !m.name.toLowerCase().includes(stockSearch.toLowerCase()) && !m.desc.toLowerCase().includes(stockSearch.toLowerCase())) return false;
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
                <p class="font-semibold">${m.name}</p>
                <p class="text-xs text-zinc-400">${m.desc}</p>
                <div class="flex gap-2 mt-1">
                  <span class="badge bg-zinc-700 text-zinc-300">${m.cat}</span>
                  ${m.rx ? '<span class="badge bg-danger/20 text-danger">Ordonnance</span>' : '<span class="badge bg-success/20 text-success">Libre</span>'}
                </div>
              </div>
            </div>
            <div class="text-right">
              <p class="text-info font-bold">${m.price.toLocaleString('fr-MG')} Ar</p>
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
    
    // Update stats
    const totalProducts = document.getElementById('totalProducts');
    if (totalProducts) totalProducts.textContent = medicines.length.toString();
    const lowStockCount = document.getElementById('lowStockCount');
    if (lowStockCount) lowStockCount.textContent = medicines.filter(m => m.stock < 20).length.toString();
    const mediumStockCount = document.getElementById('mediumStockCount');
    if (mediumStockCount) mediumStockCount.textContent = medicines.filter(m => m.stock >= 20 && m.stock <= 50).length.toString();
    const goodStockCount = document.getElementById('goodStockCount');
    if (goodStockCount) goodStockCount.textContent = medicines.filter(m => m.stock > 50).length.toString();
  };

  const updateStockQuantity = (id: number, delta: number) => {
    setMedicines(prev => prev.map(m => {
      if (m.id === id) {
        const newStock = Math.max(0, m.stock + delta);
        if (newStock < 20) showToast(`⚠️ Stock faible: ${m.name} (${newStock} restants)`, 'warn');
        else showToast(`Stock mis à jour: ${m.name}`, 'success');
        return { ...m, stock: newStock };
      }
      return m;
    }));
    renderStock();
  };

  const editStock = (id: number) => {
    const med = medicines.find(m => m.id === id);
    if (med) {
      const newStock = prompt(`Nouveau stock pour ${med.name}:`, med.stock.toString());
      if (newStock !== null && !isNaN(parseInt(newStock))) {
        setMedicines(prev => prev.map(m => m.id === id ? { ...m, stock: parseInt(newStock) } : m));
        renderStock();
        showToast(`Stock de ${med.name} mis à jour`, 'success');
      }
    }
  };

  const addMedicine = () => {
    const name = (document.getElementById('medName') as HTMLInputElement)?.value.trim();
    const cat = (document.getElementById('medCategory') as HTMLSelectElement)?.value;
    const desc = (document.getElementById('medDesc') as HTMLTextAreaElement)?.value.trim();
    const price = parseInt((document.getElementById('medPrice') as HTMLInputElement)?.value);
    const stock = parseInt((document.getElementById('medStock') as HTMLInputElement)?.value);
    const rx = (document.getElementById('medRx') as HTMLInputElement)?.checked;
    
    if (!name || !price || isNaN(stock)) {
      showToast('Veuillez remplir tous les champs obligatoires', 'error');
      return;
    }
    
    const newId = Math.max(...medicines.map(m => m.id)) + 1;
    setMedicines(prev => [...prev, { id: newId, name, desc: desc || 'Nouveau médicament', cat, price, stock, rx }]);
    setShowMedicineModal(false);
    showToast('Médicament ajouté avec succès', 'success');
    renderStock();
    renderCharts();
  };

  const toggleAmbulance = (id: number) => {
    setAmbulances(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'DISPONIBLE' ? 'EN_INTERVENTION' : 'DISPONIBLE' } : a));
    initAmbulanceMap();
    showToast(`Ambulance mise à jour`, 'info');
  };

  const togglePharmacy = (id: number) => {
    setPharmacies(prev => prev.map(p => p.id === id ? { ...p, online: !p.online } : p));
    showToast(`Pharmacie mise à jour`, 'info');
  };

  const updateEmergency = (id: number, status: string) => {
    setEmergencies(prev => prev.map(e => {
      if (e.id === id) {
        const updated = { ...e, status };
        if (status === 'ASSIGNED' && !e.assigned) {
          const availableAmbulance = ambulances.find(a => a.status === 'DISPONIBLE');
          if (availableAmbulance) updated.assigned = availableAmbulance.name;
        }
        return updated;
      }
      return e;
    }));
    showToast(`Urgence #${id} mise à jour`, 'success');
  };

  const updateOrder = (id: number, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    showToast(`Commande #${id} ${status}`, 'success');
  };

  const toggleUser = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
    showToast(`Utilisateur mis à jour`, 'info');
  };

  const exportReport = (type: string) => {
    showToast(`Export ${type} en cours...`, 'success');
    setTimeout(() => showToast(`Rapport ${type} téléchargé`, 'info'), 1000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Expose functions to window
  React.useEffect(() => {
    (window as any).editStock = editStock;
    (window as any).updateStockQuantity = updateStockQuantity;
    (window as any).filterStock = renderStock;
    (window as any).showPage = (page: string) => {
      setCurrentPage(page);
      setMobileMenuOpen(false);
    };
    (window as any).toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    (window as any).showAddMedicine = () => setShowMedicineModal(true);
    (window as any).closeModal = (id: string) => {
      if (id === 'medicineModal') setShowMedicineModal(false);
    };
    (window as any).addMedicine = addMedicine;
    (window as any).toggleAmbulance = toggleAmbulance;
    (window as any).togglePharmacy = togglePharmacy;
    (window as any).updateEmergency = updateEmergency;
    (window as any).updateOrder = updateOrder;
    (window as any).toggleUser = toggleUser;
    (window as any).exportReport = exportReport;
    (window as any).filterEmergencies = (filter: string) => setEmergencyFilter(filter);
    (window as any).showStockAlert = () => {
      const lowStock = medicines.filter(m => m.stock < 20);
      if (lowStock.length === 0) showToast('Aucun stock faible détecté', 'success');
      else showToast(`${lowStock.length} médicament(s) en stock faible`, 'warn');
    };
  }, [medicines, ambulances, pharmacies, emergencies, mobileMenuOpen]);

  const filteredEmergencies = emergencyFilter === 'ALL' ? emergencies : emergencies.filter(e => e.status === emergencyFilter);

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
              <button onClick={handleLogout} className="text-zinc-400 hover:text-danger transition"><i className="fas fa-sign-out-alt"></i></button>
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
          <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><i className="fas fa-sign-out-alt text-zinc-400"></i></button>
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
          {/* Dashboard Page */}
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
                  <p className="text-2xl md:text-3xl font-bold">{emergencies.length}</p>
                  <p className="text-xs text-zinc-400 mt-1">Urgences ce mois</p>
                </div>
                <div className="stat-card card p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-info/15 flex items-center justify-center"><i className="fas fa-shopping-bag text-info text-lg md:text-xl"></i></div>
                    <span className="badge bg-info/20 text-info">+18%</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">{orders.length}</p>
                  <p className="text-xs text-zinc-400 mt-1">Commandes ce mois</p>
                </div>
                <div className="stat-card card p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-success/15 flex items-center justify-center"><i className="fas fa-users text-success text-lg md:text-xl"></i></div>
                    <span className="badge bg-success/20 text-success">+23%</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">{users.filter(u => u.active).length}</p>
                  <p className="text-xs text-zinc-400 mt-1">Utilisateurs actifs</p>
                </div>
                <div className="stat-card card p-4 md:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-warn/15 flex items-center justify-center"><i className="fas fa-boxes text-warn text-lg md:text-xl"></i></div>
                    <span className="badge bg-warn/20 text-warn">-5%</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold">{medicines.length}</p>
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

          {/* Ambulances Page */}
          {currentPage === 'ambulances' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des ambulances</h1><p className="text-zinc-400 text-sm">Suivi en temps réel</p></div>
                <button onClick={() => showToast('Formulaire d\'ajout d\'ambulance', 'info')} className="px-5 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition"><i className="fas fa-plus mr-2"></i>Ajouter</button>
              </div>
              <div id="adminAmbulanceMap" className="h-72 md:h-80 rounded-2xl overflow-hidden border border-zinc-800 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ambulances.map(a => (
                  <div key={a.id} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${a.status === 'DISPONIBLE' ? 'bg-success/15' : 'bg-zinc-800'} flex items-center justify-center`}>
                          <i className={`fas fa-ambulance ${a.status === 'DISPONIBLE' ? 'text-success' : 'text-zinc-600'} text-xl`}></i>
                        </div>
                        <div><p className="font-semibold">{a.name}</p><p className="text-xs text-zinc-400">{a.driver}</p></div>
                      </div>
                      <span className={`badge ${a.status === 'DISPONIBLE' ? 'bg-success/20 text-success' : 'bg-zinc-700 text-zinc-400'}`}>{a.status === 'DISPONIBLE' ? 'Disponible' : 'En intervention'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4"><i className="fas fa-phone text-xs"></i>{a.phone}</div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleAmbulance(a.id)} className={`flex-1 py-2 rounded-xl ${a.status === 'DISPONIBLE' ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'} text-xs font-semibold`}>
                        {a.status === 'DISPONIBLE' ? 'Mettre en intervention' : 'Rendre disponible'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hospitals Page */}
          {currentPage === 'hospitals' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des hôpitaux</h1><p className="text-zinc-400 text-sm">Établissements partenaires</p></div>
                <button onClick={() => showToast('Formulaire d\'ajout d\'hôpital', 'info')} className="px-5 py-2.5 bg-info text-white rounded-xl text-sm font-semibold hover:bg-cyan-600 transition"><i className="fas fa-plus mr-2"></i>Ajouter</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hospitals.map(h => (
                  <div key={h.id} className="card p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-info/15 flex items-center justify-center"><i className="fas fa-hospital text-info text-xl"></i></div>
                      <div><p className="font-semibold">{h.name}</p><p className="text-xs text-zinc-400">{h.phone}</p></div>
                    </div>
                    <div className="mt-3 flex justify-between">
                      <span className="text-sm text-zinc-400">Capacité: {h.capacity} lits</span>
                      <span className={`badge ${h.emergency ? 'bg-danger/20 text-danger' : 'bg-zinc-700'}`}>{h.emergency ? 'Urgences 24/7' : 'Standard'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pharmacies Page */}
          {currentPage === 'pharmacies' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des pharmacies</h1><p className="text-zinc-400 text-sm">Pharmacies partenaires</p></div>
                <button onClick={() => showToast('Formulaire d\'ajout de pharmacie', 'info')} className="px-5 py-2.5 bg-warn text-black rounded-xl text-sm font-semibold hover:bg-amber-600 transition"><i className="fas fa-plus mr-2"></i>Ajouter</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pharmacies.map(p => (
                  <div key={p.id} className="card p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-warn/15 flex items-center justify-center"><i className="fas fa-pills text-warn text-xl"></i></div>
                      <div><p className="font-semibold">{p.name}</p><p className="text-xs text-zinc-400">{p.phone}</p></div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span className={`badge ${p.online ? 'bg-success/20 text-success' : 'bg-zinc-700'}`}>{p.online ? '🟢 En ligne' : '🔴 Hors ligne'}</span>
                      <button onClick={() => togglePharmacy(p.id)} className={`text-xs ${p.online ? 'text-warn' : 'text-success'}`}>
                        <i className="fas fa-power-off mr-1"></i>{p.online ? 'Désactiver' : 'Activer'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock Page */}
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

          {/* Emergencies Page */}
          {currentPage === 'emergencies' && (
            <div>
              <div className="mb-6"><h1 className="text-2xl font-bold">Gestion des urgences</h1><p className="text-zinc-400 text-sm">Alertes en temps réel</p></div>
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                {['ALL', 'PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'].map(filter => (
                  <button key={filter} className={`tab-btn ${emergencyFilter === filter ? 'active' : ''}`} onClick={() => setEmergencyFilter(filter)}>
                    {filter === 'ALL' ? 'Toutes' : filter === 'PENDING' ? 'En attente' : filter === 'ASSIGNED' ? 'Assignées' : filter === 'IN_PROGRESS' ? 'En cours' : 'Résolues'}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {filteredEmergencies.map(e => {
                  const statusColors: { [key: string]: string } = {
                    PENDING: 'bg-warn/20 text-warn',
                    ASSIGNED: 'bg-info/20 text-info',
                    IN_PROGRESS: 'bg-purple-500/20 text-purple-400',
                    RESOLVED: 'bg-success/20 text-success'
                  };
                  return (
                    <div key={e.id} className="card p-5">
                      <div className="flex items-center justify-between">
                        <div><p className="font-semibold">{e.patient}</p><p className="text-xs text-zinc-400">{e.type} — {e.location} — {e.time}</p></div>
                        <span className={`badge ${statusColors[e.status] || 'bg-zinc-700'}`}>{e.status}</span>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <a href={`tel:${e.phone}`} className="text-xs text-info"><i className="fas fa-phone mr-1"></i>{e.phone}</a>
                        {e.assigned && <span className="text-xs text-zinc-500"><i className="fas fa-ambulance mr-1"></i>{e.assigned}</span>}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={() => updateEmergency(e.id, 'ASSIGNED')} className="flex-1 py-2 rounded-xl bg-info/15 text-info text-xs">Assigner</button>
                        <button onClick={() => updateEmergency(e.id, 'IN_PROGRESS')} className="flex-1 py-2 rounded-xl bg-purple-500/15 text-purple-400 text-xs">En cours</button>
                        <button onClick={() => updateEmergency(e.id, 'RESOLVED')} className="flex-1 py-2 rounded-xl bg-success/15 text-success text-xs">Résoudre</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Orders Page */}
          {currentPage === 'orders' && (
            <div>
              <div className="mb-6"><h1 className="text-2xl font-bold">Gestion des commandes</h1><p className="text-zinc-400 text-sm">Commandes de médicaments</p></div>
              <div className="space-y-3">
                {orders.map(o => {
                  const statusColors: { [key: string]: string } = {
                    DELIVERED: 'bg-success/20 text-success',
                    PREPARED: 'bg-warn/20 text-warn',
                    CONFIRMED: 'bg-info/20 text-info',
                    CART: 'bg-zinc-700 text-zinc-300',
                    CANCELLED: 'bg-danger/20 text-danger'
                  };
                  const statusLabels: { [key: string]: string } = {
                    CART: 'Panier', CONFIRMED: 'Confirmée', PREPARED: 'Préparée', DELIVERED: 'Livrée', CANCELLED: 'Annulée'
                  };
                  return (
                    <div key={o.id} className="card p-5">
                      <div className="flex justify-between">
                        <div><p className="font-semibold">Commande #{o.id}</p><p className="text-xs text-zinc-400">{o.date} — {o.pharmacy}</p><p className="text-sm mt-1">{o.user}</p></div>
                        <span className={`badge ${statusColors[o.status]}`}>{statusLabels[o.status] || o.status}</span>
                      </div>
                      <div className="mt-2 text-sm">{o.items.map(i => `${i.name} x${i.qty}`).join(', ')}</div>
                      <div className="mt-3 flex justify-between">
                        <span className="text-info font-bold">{o.total.toLocaleString('fr-MG')} Ar</span>
                        <div className="flex gap-2">
                          <button onClick={() => updateOrder(o.id, 'PREPARED')} className="px-3 py-1 rounded-lg bg-warn/15 text-warn text-xs">Préparer</button>
                          <button onClick={() => updateOrder(o.id, 'DELIVERED')} className="px-3 py-1 rounded-lg bg-success/15 text-success text-xs">Livrer</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Users Page */}
          {currentPage === 'users' && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div><h1 className="text-2xl font-bold">Gestion des utilisateurs</h1><p className="text-zinc-400 text-sm">Patients et personnel</p></div>
                <button onClick={() => showToast('Formulaire d\'ajout d\'utilisateur', 'info')} className="px-5 py-2.5 bg-success text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition"><i className="fas fa-user-plus mr-2"></i>Ajouter</button>
              </div>
              <div className="space-y-3">
                {users.map(u => (
                  <div key={u.id} className="card p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-danger to-orange-500 flex items-center justify-center text-lg font-bold">{u.name[0]}</div>
                      <div><p className="font-semibold">{u.name}</p><p className="text-xs text-zinc-400">{u.email}</p></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleUser(u.id)} className={`px-3 py-1.5 rounded-lg ${u.active ? 'bg-warn/15 text-warn' : 'bg-success/15 text-success'} text-xs`}>{u.active ? 'Désactiver' : 'Activer'}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Page */}
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
              <button onClick={addMedicine} className="w-full bg-success text-white py-3 rounded-xl font-semibold">Ajouter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;