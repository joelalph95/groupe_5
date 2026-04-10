import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import Chart from 'chart.js/auto';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContexte';
import { useToast } from '../hooks/useToast';
import { emergencyService, pharmacyService, wellnessService } from '../services/api';
import socketService from '../services/socket';
import Toast from '../components/common/Toast';
import Loading from '../components/common/Loading';
import { Urgence, Medicament, CentreSante, Article, CartItem, Notification, Rappel, ChatMessage } from '../types';

const TANA: [number, number] = [-18.8792, 47.5200];

interface Ambulance {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: string;
  driver: string;
  phone: string;
}

interface Pharmacy {
  id: number;
  name: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  online: boolean;
}

const PatientPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toasts, showToast, removeToast } = useToast();
  
  const [currentPage, setCurrentPage] = useState<'home' | 'urgence' | 'pharmacie' | 'bienetre' | 'profil'>('home');
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Data
  const [hospitals, setHospitals] = useState<CentreSante[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [medicines, setMedicines] = useState<Medicament[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [urgences, setUrgences] = useState<Urgence[]>([]);
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [deliveryAddr, setDeliveryAddr] = useState(user?.adresse || 'Analakely, Tana');
  
  // SOS
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosType, setSosType] = useState('Accident');
  const [sosDesc, setSosDesc] = useState('');
  const [sosCount, setSosCount] = useState(0);
  const [sosResolved, setSosResolved] = useState(0);
  
  // Chatbot
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { from: 'bot', text: 'Bonjour ! Je suis MindTrack, votre assistant bien-être. Comment vous sentez-vous aujourd\'hui ? 😊' }
  ]);
  const [chatInput, setChatInput] = useState('');
  
  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  
  // Rappels
  const [rappels, setRappels] = useState<Rappel[]>([]);
  const [showRappelsModal, setShowRappelsModal] = useState(false);
  
  // Wellness
  const [wellnessTab, setWellnessTab] = useState<'femme' | 'homme' | 'mental' | 'articles' | 'stats'>('femme');
  const [pregnancy, setPregnancy] = useState({ week: 24, dueDate: '2025-05-15' });
  const [cycleDays, setCycleDays] = useState<number[]>([1, 2, 3, 4, 5, 28, 29, 30]);
  const [moodHistory, setMoodHistory] = useState([
    { date: 'Lun', score: 7 }, { date: 'Mar', score: 5 }, { date: 'Mer', score: 8 },
    { date: 'Jeu', score: 4 }, { date: 'Ven', score: 6 }, { date: 'Sam', score: 9 }, { date: 'Dim', score: 7 }
  ]);
  
  // Pharmacy filters
  const [medSearch, setMedSearch] = useState('');
  const [pharmTab, setPharmTab] = useState<'medicines' | 'pharmacies' | 'orders'>('medicines');
  const [orders, setOrders] = useState<any[]>([]);
  
  // Map refs
  const homeMapRef = useRef<L.Map | null>(null);
  const urgenceMapRef = useRef<L.Map | null>(null);
  const chartRefs = useRef<{ [key: string]: Chart | null }>({});
  
  // Refs pour les modals
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialData();
    
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
    
    if (user) {
      socketService.connect(localStorage.getItem('token') || '');
      socketService.joinRoom('patient');
      socketService.onNewEmergency(handleNewEmergency);
    }
    
    return () => {
      socketService.off('new-emergency');
    };
  }, []);

  useEffect(() => {
    if (currentPage === 'urgence' && urgenceMapRef.current) {
      setTimeout(() => urgenceMapRef.current?.invalidateSize(), 100);
    }
    if (currentPage === 'bienetre' && wellnessTab === 'stats') {
      setTimeout(initWellnessCharts, 100);
    }
  }, [currentPage, wellnessTab]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [hospitalsData, ambulancesData, pharmaciesData, medicinesData, articlesData] = await Promise.all([
        emergencyService.getHospitals(),
        emergencyService.getAmbulances(),
        pharmacyService.getPharmacies(),
        pharmacyService.getMedicaments(),
        wellnessService.getArticlesPersonnalises().catch(() => []),
      ]);
      
      setHospitals(hospitalsData);
      setAmbulances(ambulancesData);
      setPharmacies(pharmaciesData);
      setMedicines(medicinesData);
      setArticles(articlesData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewEmergency = (data: any) => {
    showToast(`Nouvelle urgence: ${data.type_urgence}`, 'warn');
    addNotification('EMERGENCY_UPDATE', '🚨 Nouvelle urgence', `${data.type_urgence} - ${data.localisation}`);
  };

  const addNotification = (type: string, titre: string, message: string) => {
    const newNotif: Notification = {
      id: Date.now(),
      type,
      titre,
      message,
      date_creation: new Date().toISOString(),
      lu: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MG').format(price) + ' Ar';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const timeAgo = (date: Date) => {
    const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
    return `${Math.floor(diff / 86400)} j`;
  };

  const avgMood = () => {
    return Math.round(moodHistory.reduce((a, b) => a + b.score, 0) / moodHistory.length * 10) / 10;
  };

 const initHomeMap = () => {
  const mapEl = document.getElementById('homeMap');
  if (!mapEl || homeMapRef.current) return;
  
  homeMapRef.current = L.map('homeMap', { zoomControl: false, attributionControl: false }).setView(TANA, 14);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(homeMapRef.current);
  
  const userIcon = L.divIcon({ className: '', html: '<div class="user-marker"></div>', iconSize: [20, 20], iconAnchor: [10, 10] });
  L.marker(TANA, { icon: userIcon }).addTo(homeMapRef.current);
  
  hospitals.slice(0, 3).forEach(h => {
    const lat = h.latitude || -18.88;
    const lng = h.longitude || 47.52;
    if (lat && lng) {
      const icon = L.divIcon({ className: '', html: '<div class="hospital-marker"><i class="fas fa-hospital text-white"></i></div>', iconSize: [32, 32], iconAnchor: [16, 16] });
      L.marker([lat, lng], { icon }).addTo(homeMapRef.current!).bindPopup(`<b>${h.nom}</b>`);
    }
  });
  
  setTimeout(() => homeMapRef.current?.invalidateSize(), 200);
};

  const initUrgenceMap = () => {
    const mapEl = document.getElementById('urgenceMap');
    if (!mapEl) return;
    
    if (urgenceMapRef.current) {
      urgenceMapRef.current.remove();
      urgenceMapRef.current = null;
    }
    
    urgenceMapRef.current = L.map('urgenceMap', { zoomControl: true, attributionControl: false }).setView(TANA, 13);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(urgenceMapRef.current);
    
    const userIcon = L.divIcon({ className: '', html: '<div class="user-marker"></div>', iconSize: [20, 20], iconAnchor: [10, 10] });
    L.marker(TANA, { icon: userIcon }).addTo(urgenceMapRef.current);
    
    renderMapMarkers('all');
  };

const renderMapMarkers = (filter: string) => {
  if (!urgenceMapRef.current) return;
  
  // Nettoyer les markers existants
  urgenceMapRef.current.eachLayer(l => { 
    if (l instanceof L.Marker) {
      urgenceMapRef.current!.removeLayer(l);
    }
  });
  
  // Remettre le marker utilisateur
  const userIcon = L.divIcon({ className: '', html: '<div class="user-marker"></div>', iconSize: [20, 20], iconAnchor: [10, 10] });
  L.marker(TANA, { icon: userIcon }).addTo(urgenceMapRef.current);
  
  // Ajouter les hôpitaux
  if (filter === 'all' || filter === 'hospital') {
    hospitals.forEach(h => {
      const lat = h.latitude || -18.88;
      const lng = h.longitude || 47.52;
      if (lat && lng) {
        const icon = L.divIcon({ className: '', html: '<div class="hospital-marker"><i class="fas fa-hospital text-white"></i></div>', iconSize: [32, 32], iconAnchor: [16, 16] });
        L.marker([lat, lng], { icon }).addTo(urgenceMapRef.current!).bindPopup(`<b>${h.nom}</b><br><i class="fas fa-phone"></i> ${h.telephone}`);
      }
    });
  }
  
  // Ajouter les ambulances
  if (filter === 'all' || filter === 'ambulance') {
    ambulances.forEach(a => {
      const lat = a.lat || -18.88;
      const lng = a.lng || 47.52;
      if (lat && lng) {
        const color = a.status === 'DISPONIBLE' ? '#10b981' : '#52525b';
        const icon = L.divIcon({ className: '', html: `<div class="ambulance-marker" style="background:${color}"><i class="fas fa-ambulance text-white"></i></div>`, iconSize: [40, 40], iconAnchor: [20, 20] });
        L.marker([lat, lng], { icon }).addTo(urgenceMapRef.current!).bindPopup(`<b>${a.name}</b><br>Chauffeur: ${a.driver}<br>Statut: ${a.status}<br><i class="fas fa-phone"></i> ${a.phone}`);
      }
    });
  }
  
  // Ajouter les pharmacies
  if (filter === 'all' || filter === 'pharmacy') {
    pharmacies.forEach(p => {
      const lat = p.lat || -18.88;
      const lng = p.lng || 47.52;
      if (lat && lng) {
        const icon = L.divIcon({ className: '', html: '<div class="pharmacy-marker"><i class="fas fa-pills text-white"></i></div>', iconSize: [32, 32], iconAnchor: [16, 16] });
        L.marker([lat, lng], { icon }).addTo(urgenceMapRef.current!).bindPopup(`<b>${p.name}</b><br><i class="fas fa-phone"></i> ${p.phone}<br>${p.online ? '🟢 En ligne' : '🔴 Hors ligne'}`);
      }
    });
  }
};

  const filterMap = (filter: string) => {
    renderMapMarkers(filter);
  };

  const triggerSOS = () => {
    setShowSOSModal(true);
  };

  const sendSOSOnline = async () => {
    setLoading(true);
    try {
      await emergencyService.sendSMSAlert({
        latitude: TANA[0],
        longitude: TANA[1],
        type_urgence: sosType,
        description: sosDesc,
      });
      
      setSosCount(prev => prev + 1);
      addNotification('EMERGENCY_UPDATE', '🚨 Alerte envoyée', `Urgence ${sosType} — Position envoyée aux secours`);
      showToast('Alerte envoyée aux secours !', 'success');
      setShowSOSModal(false);
    } catch (error) {
      showToast('Erreur lors de l\'envoi de l\'alerte', 'error');
    } finally {
      setLoading(false);
    }
  };

  const bipCentre = () => {
    window.location.href = 'tel:+261202234567';
    setSosCount(prev => prev + 1);
    addNotification('EMERGENCY_UPDATE', '📞 BIP envoyé', 'Appel court au centre médical');
    showToast('BIP envoyé au centre — ils vous rappelleront', 'warn');
    setShowSOSModal(false);
  };

  const addToCart = (med: Medicament) => {
    const existing = cart.find(c => c.medicament_id === med.id);
    if (existing) {
      setCart(prev => prev.map(c => c.medicament_id === med.id ? { ...c, quantite: c.quantite + 1 } : c));
    } else {
      setCart(prev => [...prev, {
        medicament_id: med.id,
        nom: med.nom,
        prix: med.prix,
        quantite: 1,
        necessite_ordonnance: med.necessite_ordonnance,
      }]);
    }
    showToast(`${med.nom} ajouté au panier`, 'info');
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.medicament_id === id) {
        const newQty = c.quantite + delta;
        return newQty > 0 ? { ...c, quantite: newQty } : c;
      }
      return c;
    }).filter(c => c.quantite > 0));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(c => c.medicament_id !== id));
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    
    setLoading(true);
    try {
      await pharmacyService.createCommande({
        pharmacien_id: 1,
        items: cart.map(c => ({ medicament_id: c.medicament_id, quantite: c.quantite })),
        adresse_livraison: deliveryAddr,
        mode_paiement: 'ESPECES',
      });
      
      showToast('Commande confirmée !', 'success');
      addNotification('ORDER_STATUS', 'Commande confirmée', `Votre commande a été confirmée`);
      setCart([]);
      setShowCartModal(false);
    } catch (error) {
      showToast('Erreur lors de la commande', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { from: 'user', text: userMessage }]);
    setChatInput('');
    
    setTimeout(() => {
      chatMessagesRef.current?.scrollTo({ top: chatMessagesRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
    
    try {
      const response = await wellnessService.sendChatMessage(userMessage);
      
      setTimeout(() => {
        setChatMessages(prev => [...prev, { from: 'bot', text: response.response }]);
        setTimeout(() => {
          chatMessagesRef.current?.scrollTo({ top: chatMessagesRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
        
        const critical = ['suicide', 'meurtre', 'mourir', 'mort', 'finir', 'bout', 'déteste', 'détesté'];
        if (critical.some(w => userMessage.toLowerCase().includes(w))) {
          setTimeout(() => {
            setChatMessages(prev => [...prev, { from: 'bot', text: '⚠️ Je sens que vous traversez un moment difficile. Parler à un professionnel peut vraiment aider.\n\n📞 Ligne d\'écoute : 1520 (gratuit)\n🏥 Centre psycho : +261 20 22 000 00\n\nVous n\'êtes pas seul(e).' }]);
          }, 1500);
        }
      }, 800);
    } catch (error) {
      setChatMessages(prev => [...prev, { from: 'bot', text: 'Désolé, je rencontre des difficultés. Pouvez-vous réessayer ?' }]);
    }
  };

  const logMood = (score: number) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    setMoodHistory(prev => {
      const newHistory = [...prev, { date: days[new Date().getDay()], score }];
      if (newHistory.length > 7) newHistory.shift();
      return newHistory;
    });
    showToast(`Humeur enregistrée: ${score}/10`, 'success');
    addNotification('MOOD_ALERT', 'Humeur enregistrée', `Score: ${score}/10`);
  };

  const initWellnessCharts = () => {
    const ctx1 = document.getElementById('chartMood30') as HTMLCanvasElement;
    if (ctx1) {
      if (chartRefs.current.mood30) chartRefs.current.mood30.destroy();
      const data = Array.from({ length: 30 }, () => Math.floor(Math.random() * 5) + 5);
      chartRefs.current.mood30 = new Chart(ctx1, {
        type: 'line',
        data: {
          labels: Array.from({ length: 30 }, (_, i) => i + 1),
          datasets: [{ label: 'Humeur', data, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.1)', fill: true, tension: 0.4, pointRadius: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { display: false } },
          scales: { x: { display: false }, y: { min: 0, max: 10, ticks: { color: '#52525b' }, grid: { color: 'rgba(255,255,255,.05)' } } }
        }
      });
    }
    
    const ctx2 = document.getElementById('chartActivities') as HTMLCanvasElement;
    if (ctx2) {
      if (chartRefs.current.activities) chartRefs.current.activities.destroy();
      chartRefs.current.activities = new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: ['Respiration', 'Méditation', 'Sport', 'Lecture', 'Sommeil'],
          datasets: [{ data: [25, 20, 30, 10, 15], backgroundColor: ['#10b981', '#a855f7', '#06b6d4', '#f59e0b', '#6366f1'], borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa', font: { size: 9 }, padding: 8 } } },
          cutout: '65%'
        }
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Render functions for different tabs
  const renderFemmeTab = () => (
    <>
      <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
          <i className="fas fa-calendar-alt text-danger text-sm sm:text-base"></i>
          <h3 className="text-sm sm:text-base font-semibold">Cycle menstruel</h3>
          <span className="badge bg-danger/20 text-danger ml-auto text-[10px]">Jour 14</span>
        </div>
        <div className="flex gap-0.5 sm:gap-1 flex-wrap mb-2 sm:mb-3">
          {Array.from({ length: 28 }, (_, i) => (
            <div
              key={i}
              className={`cycle-day ${cycleDays.includes(i + 1) ? 'period' : ''} ${i + 1 === 14 ? 'ovulation' : ''} ${i + 1 === new Date().getDate() ? 'today' : ''}`}
              onClick={() => {
                if (cycleDays.includes(i + 1)) {
                  setCycleDays(prev => prev.filter(d => d !== i + 1));
                } else {
                  setCycleDays(prev => [...prev, i + 1]);
                }
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <div className="flex gap-2 sm:gap-4 text-[8px] sm:text-[10px] text-zinc-500 flex-wrap">
          <span><span className="inline-block w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-danger mr-1"></span>Règles</span>
          <span><span className="inline-block w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-warn mr-1"></span>Ovulation</span>
          <span><span className="inline-block w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-info mr-1"></span>Aujourd'hui</span>
        </div>
      </div>
      
      <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
          <i className="fas fa-baby text-pink-400 text-sm sm:text-base"></i>
          <h3 className="text-sm sm:text-base font-semibold">Suivi de grossesse</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-4">
          <div className="text-center p-2 sm:p-3 bg-zinc-800/50 rounded-xl">
            <p className="text-base sm:text-xl font-bold text-pink-400">{pregnancy.week}</p>
            <p className="text-[8px] sm:text-[10px] text-zinc-500">Semaines</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-zinc-800/50 rounded-xl">
            <p className="text-base sm:text-xl font-bold text-info">{pregnancy.week > 6 ? Math.floor((pregnancy.week - 6) / 4) : '-'}</p>
            <p className="text-[8px] sm:text-[10px] text-zinc-500">Mois</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-zinc-800/50 rounded-xl">
            <p className="text-[10px] sm:text-xl font-bold text-success whitespace-normal break-words">{formatDate(pregnancy.dueDate)}</p>
            <p className="text-[8px] sm:text-[10px] text-zinc-500">Accouchement</p>
          </div>
        </div>
        <div className="p-2 sm:p-3 bg-pink-500/10 rounded-xl text-[10px] sm:text-xs text-pink-200">
          <i className="fas fa-lightbulb mr-1"></i>Conseil: Votre bébé mesure environ 30 cm et pèse 600g. Pensez à vos injections de fer.
        </div>
      </div>
    </>
  );

  const renderHommeTab = () => (
    <>
      <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
          <i className="fas fa-shield-alt text-info text-sm sm:text-base"></i>
          <h3 className="text-sm sm:text-base font-semibold">Santé prostate</h3>
        </div>
        <div className="p-2 sm:p-3 bg-zinc-800/50 rounded-xl mb-2 sm:mb-3">
          <p className="text-[10px] sm:text-xs text-zinc-500 mb-0.5 sm:mb-1">Dernier dépistage PSA</p>
          <p className="text-[11px] sm:text-sm font-medium">15 Mars 2024 — Résultat: 1.2 ng/mL (Normal)</p>
        </div>
        <div className="p-2 sm:p-3 bg-info/10 rounded-xl text-[10px] sm:text-xs text-info">
          <i className="fas fa-info-circle mr-1"></i>Prochain dépistage recommandé dans 6 mois
        </div>
      </div>
      
      <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
          <i className="fas fa-running text-success text-sm sm:text-base"></i>
          <h3 className="text-sm sm:text-base font-semibold">Activité physique</h3>
        </div>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2 sm:mb-3">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => {
            const active = i < 3 || i === 4;
            return (
              <div key={i} className="text-center">
                <p className="text-[8px] sm:text-[10px] text-zinc-500 mb-0.5 sm:mb-1">{d}</p>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto rounded-full ${active ? 'bg-success/20 border border-success/40' : 'bg-zinc-800'} flex items-center justify-center`}>
                  <i className={`fas fa-${active ? 'check' : 'times'} text-${active ? 'success' : 'zinc-600'} text-[8px] sm:text-xs`}></i>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] sm:text-xs text-zinc-400">4 jours actifs cette semaine sur 7</p>
      </div>
    </>
  );

  const renderMentalTab = () => (
    <>
      <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
          <i className="fas fa-smile text-success text-sm sm:text-base"></i>
          <h3 className="text-sm sm:text-base font-semibold">Comment vous sentez-vous ?</h3>
        </div>
        <div className="flex justify-between mb-2 sm:mb-4 flex-wrap gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
            const colors = ['text-danger', 'text-red-400', 'text-orange-400', 'text-orange-300', 'text-yellow-400', 'text-lime-400', 'text-lime-300', 'text-green-400', 'text-green-300', 'text-success'];
            return (
              <button
                key={n}
                onClick={() => logMood(n)}
                className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs sm:text-sm font-bold ${colors[n-1]} hover:scale-110 active:scale-95 transition`}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5 sm:gap-3 text-[8px] sm:text-[10px] text-zinc-500 justify-between">
          <span>😢 Très mal</span><span>😐 Neutre</span><span>😊 Super</span>
        </div>
      </div>
      
      <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4">
          <i className="fas fa-chart-line text-info text-sm sm:text-base"></i>
          <h3 className="text-sm sm:text-base font-semibold">Humeur cette semaine</h3>
        </div>
        <div className="flex items-end gap-1 sm:gap-2 h-24 sm:h-32">
          {moodHistory.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5 sm:gap-1">
              <div className="w-full rounded-t-lg transition-all" style={{ height: `${m.score * 8}%`, background: m.score >= 7 ? '#10b981' : m.score >= 5 ? '#f59e0b' : '#ef4444', opacity: 0.7 }}></div>
              <p className="text-[8px] sm:text-[10px] text-zinc-500">{m.date}</p>
            </div>
          ))}
        </div>
      </div>
      
      <button onClick={() => setShowChatModal(true)} className="w-full card p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
          <i className="fas fa-robot text-purple-400 text-base sm:text-lg"></i>
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs sm:text-sm font-semibold">Parler à MindTrack</p>
          <p className="text-[10px] sm:text-xs text-zinc-400">Chatbot émotionnel disponible 24/7</p>
        </div>
        <i className="fas fa-chevron-right text-zinc-600 text-xs sm:text-sm"></i>
      </button>
    </>
  );

  const renderArticlesTab = () => (
    <div className="space-y-2 sm:space-y-3">
      {articles.map(a => {
        const colors: { [key: string]: string } = { FEMME: 'text-pink-400 bg-pink-500/15', HOMME: 'text-info bg-info/15', MENTAL: 'text-purple-400 bg-purple-500/15', GENERAL: 'text-success bg-success/15' };
        const c = colors[a.categorie] || colors.GENERAL;
        return (
          <div key={a.id} className="card p-3 sm:p-4 cursor-pointer">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <span className={`badge ${c} text-[8px] sm:text-[10px]`}>{a.categorie}</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1">{a.titre}</p>
            <p className="text-[10px] sm:text-xs text-zinc-400 line-clamp-2">{a.contenu.substring(0, 80)}...</p>
            <div className="flex gap-0.5 sm:gap-1 mt-1 sm:mt-2 flex-wrap">
              {a.tags?.split(',').map((t, i) => <span key={i} className="text-[7px] sm:text-[10px] text-zinc-600">#{t.trim()}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderStatsTab = () => (
    <>
      <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-4"><i className="fas fa-chart-line text-info mr-1 sm:mr-2"></i>Évolution humeur (30j)</h3>
        <canvas id="chartMood30" height="150" className="sm:h-[180px]"></canvas>
      </div>
      <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-4"><i className="fas fa-chart-pie text-success mr-1 sm:mr-2"></i>Répartition activités bien-être</h3>
        <canvas id="chartActivities" height="150" className="sm:h-[180px]"></canvas>
      </div>
      <div className="card p-4 sm:p-5 mb-3 sm:mb-4">
        <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-4"><i className="fas fa-chart-bar text-warn mr-1 sm:mr-2"></i>Score santé global</h3>
        <div className="space-y-2 sm:space-y-3">
          {[{ label: 'Physique', val: 72, color: 'bg-success' }, { label: 'Mental', val: 65, color: 'bg-purple-500' }, { label: 'Sommeil', val: 58, color: 'bg-info' }, { label: 'Nutrition', val: 70, color: 'bg-warn' }].map(s => (
            <div key={s.label}>
              <div className="flex justify-between text-[10px] sm:text-sm mb-0.5 sm:mb-1">
                <span className="text-zinc-400">{s.label}</span>
                <span className="font-bold text-xs sm:text-sm">{s.val}%</span>
              </div>
              <div className="h-1.5 sm:h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div className={`${s.color} h-full rounded-full transition-all duration-1000`} style={{ width: `${s.val}%` }}></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-zinc-800/50 rounded-xl text-center">
          <p className="text-[10px] sm:text-xs text-zinc-500">Score global</p>
          <p className="text-2xl sm:text-3xl font-bold text-success">66<span className="text-base sm:text-lg text-zinc-500">/100</span></p>
        </div>
      </div>
    </>
  );

  // Main render
  return (
    <div id="patientApp">
      {loading && <Loading />}
      
      <div className="fixed bottom-6 right-6 z-50">
        {toasts.map(toast => <Toast key={toast.id} toast={toast} onClose={removeToast} />)}
      </div>

      <div className="app-container bg-zinc-950 min-h-screen pb-20 md:pb-24">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 glass px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-danger/20 flex items-center justify-center">
              <i className="fas fa-heartbeat text-danger text-xs sm:text-sm"></i>
            </div>
            <div>
              <p className="text-sm sm:text-base font-semibold">MIAINA</p>
              <p className="text-[9px] sm:text-[10px] text-zinc-500">
                Bonjour, {user?.prenom || user?.nom || 'Patient'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={toggleTheme} className="w-9 h-9 sm:w-9 sm:h-9 rounded-full bg-zinc-800 flex items-center justify-center">
              <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-zinc-400 text-xs sm:text-sm`}></i>
            </button>
            <button onClick={() => setShowNotifModal(true)} className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-800 flex items-center justify-center">
              <i className="fas fa-bell text-zinc-400 text-xs sm:text-sm"></i>
              {notifications.filter(n => !n.lu).length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-danger rounded-full text-[8px] sm:text-[10px] font-bold flex items-center justify-center">
                  {notifications.filter(n => !n.lu).length}
                </span>
              )}
            </button>
            <button onClick={handleLogout} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-800 flex items-center justify-center">
              <i className="fas fa-sign-out-alt text-zinc-400 text-xs sm:text-sm"></i>
            </button>
          </div>
        </div>

        {/* Page: Home */}
        {currentPage === 'home' && (
          <div className="px-4 sm:px-5 pt-3 sm:pt-4">
            <div className={`mb-3 sm:mb-4 p-2 sm:p-3 rounded-xl flex items-center gap-2 sm:gap-3 text-xs sm:text-sm ${isOnline ? 'bg-success/10 border border-success/20' : 'bg-warn/10 border border-warn/20'}`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success' : 'bg-warn'}`}></div>
              <span className="text-zinc-300">{isOnline ? 'En ligne — Alertes automatiques activées' : 'Hors-ligne — Mode BIP activé'}</span>
            </div>

            {/* SOS Button */}
            <div className="flex flex-col items-center py-4 sm:py-6">
              <p className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3 sm:mb-4">Urgence médicale</p>
              <div className="relative">
                <div className="sos-ring"></div>
                <div className="sos-ring"></div>
                <div className="sos-ring"></div>
                <button onClick={triggerSOS} className="sos-btn relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex flex-col items-center justify-center gap-1 sm:gap-2 z-10 active:scale-95 transition-transform">
                  <i className="fas fa-phone-volume text-2xl sm:text-4xl text-white"></i>
                  <span className="text-white font-bold text-base sm:text-lg">SOS</span>
                </button>
              </div>
              <p className="text-[10px] sm:text-xs text-zinc-500 mt-3 sm:mt-4">Appuyez pour envoyer une alerte d'urgence</p>
              <div className="flex gap-4 sm:gap-6 mt-3 sm:mt-4">
                <div className="text-center"><p className="text-base sm:text-lg font-bold text-danger">{sosCount}</p><p className="text-[8px] sm:text-[10px] text-zinc-500">Alertes envoyées</p></div>
                <div className="w-px bg-zinc-800"></div>
                <div className="text-center"><p className="text-base sm:text-lg font-bold text-success">{sosResolved}</p><p className="text-[8px] sm:text-[10px] text-zinc-500">Résolues</p></div>
              </div>
            </div>

            {/* Health Summary */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-300 mb-2 sm:mb-3">Mon bilan santé</h3>
              <div className="health-grid">
                <div className="card p-3 sm:p-4 stat-card">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <i className="fas fa-calendar-alt text-danger text-[10px] sm:text-xs"></i>
                    <span className="text-[10px] sm:text-xs text-zinc-400">Cycle</span>
                  </div>
                  <p className="text-base sm:text-xl font-bold">Jour 14</p>
                  <p className="text-[8px] sm:text-[10px] text-zinc-500">Prochaines règles dans ~14j</p>
                </div>
                <div className="card p-3 sm:p-4 stat-card">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <i className="fas fa-baby text-pink-400 text-[10px] sm:text-xs"></i>
                    <span className="text-[10px] sm:text-xs text-zinc-400">Grossesse</span>
                  </div>
                  <p className="text-base sm:text-xl font-bold">{pregnancy.week} sem</p>
                  <p className="text-[8px] sm:text-[10px] text-zinc-500">Accouchement: {formatDate(pregnancy.dueDate)}</p>
                </div>
                <div className="card p-3 sm:p-4 stat-card">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <i className="fas fa-smile text-success text-[10px] sm:text-xs"></i>
                    <span className="text-[10px] sm:text-xs text-zinc-400">Humeur</span>
                  </div>
                  <p className="text-base sm:text-xl font-bold">{avgMood()}/10</p>
                  <p className="text-[8px] sm:text-[10px] text-zinc-500">Cette semaine</p>
                </div>
                <div className="card p-3 sm:p-4 stat-card">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                    <i className="fas fa-tint text-danger text-[10px] sm:text-xs"></i>
                    <span className="text-[10px] sm:text-xs text-zinc-400">Groupe</span>
                  </div>
                  <p className="text-base sm:text-xl font-bold">{user?.groupe_sanguin || 'A+'}</p>
                  <p className="text-[8px] sm:text-[10px] text-zinc-500">Sanguin</p>
                </div>
              </div>
            </div>

            {/* Mini Map */}
            <div className="mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="text-xs sm:text-sm font-semibold text-zinc-300">Proche de moi</h3>
                <button onClick={() => setCurrentPage('urgence')} className="text-[10px] sm:text-xs text-info hover:underline">
                  Voir la carte <i className="fas fa-arrow-right ml-1"></i>
                </button>
              </div>
              <div
                id="homeMap"
                className="h-40 sm:h-48 rounded-2xl overflow-hidden border border-zinc-800"
                ref={(el) => { if (el) { setTimeout(initHomeMap, 100); } }}
              ></div>
            </div>

            {/* Quick Actions */}
            <div className="mb-4 sm:mb-6">
              <h3 className="text-xs sm:text-sm font-semibold text-zinc-300 mb-2 sm:mb-3">Accès rapide</h3>
              <div className="quick-actions">
                <button onClick={() => setCurrentPage('urgence')} className="card p-2 sm:p-3 flex flex-col items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-danger/15 flex items-center justify-center"><i className="fas fa-ambulance text-danger text-xs sm:text-sm"></i></div>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 text-center">Urgence</span>
                </button>
                <button onClick={() => setCurrentPage('pharmacie')} className="card p-2 sm:p-3 flex flex-col items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-info/15 flex items-center justify-center"><i className="fas fa-pills text-info text-xs sm:text-sm"></i></div>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 text-center">Pharmacie</span>
                </button>
                <button onClick={() => setCurrentPage('bienetre')} className="card p-2 sm:p-3 flex flex-col items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-success/15 flex items-center justify-center"><i className="fas fa-heart text-success text-xs sm:text-sm"></i></div>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 text-center">Bien-être</span>
                </button>
                <button onClick={() => setShowChatModal(true)} className="card p-2 sm:p-3 flex flex-col items-center gap-1 sm:gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-500/15 flex items-center justify-center"><i className="fas fa-robot text-purple-400 text-xs sm:text-sm"></i></div>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 text-center">MindTrack</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page: Urgence */}
        {currentPage === 'urgence' && (
          <div className="px-4 sm:px-5 pt-3 sm:pt-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Urgences</h2>
              <button onClick={triggerSOS} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-danger text-white rounded-xl text-xs sm:text-sm font-semibold active:scale-95 transition">
                <i className="fas fa-exclamation-triangle mr-1 sm:mr-2"></i>SOS
              </button>
            </div>
            <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2">
              <button className="tab-btn active" onClick={() => filterMap('all')}>Tout</button>
              <button className="tab-btn" onClick={() => filterMap('hospital')}><i className="fas fa-hospital mr-1"></i>Hôpitaux</button>
              <button className="tab-btn" onClick={() => filterMap('ambulance')}><i className="fas fa-ambulance mr-1"></i>Ambulances</button>
              <button className="tab-btn" onClick={() => filterMap('pharmacy')}><i className="fas fa-pharmacy mr-1"></i>Pharmacies</button>
            </div>
            <div id="urgenceMap" className="h-56 sm:h-72 rounded-2xl overflow-hidden border border-zinc-800 mb-3 sm:mb-4" ref={(el) => { if (el) { setTimeout(initUrgenceMap, 100); } }}></div>
            
            <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
              {hospitals.slice(0, 3).map(h => (
                <div key={h.id} className="card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-info/15 flex items-center justify-center shrink-0">
                    <i className="fas fa-hospital text-info text-xs sm:text-sm"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold truncate">{h.nom}</p>
                    <p className="text-[10px] sm:text-xs text-zinc-400">{h.telephone}</p>
                  </div>
                  <a href={`tel:${h.telephone}`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                    <i className="fas fa-phone text-success text-xs sm:text-sm"></i>
                  </a>
                </div>
              ))}
            </div>
            
            <div className="card p-3 sm:p-4 border-l-4 border-l-warn">
              <div className="flex items-start gap-2 sm:gap-3">
                <i className="fas fa-wifi-slash text-warn mt-0.5 sm:mt-1 text-xs sm:text-sm"></i>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-zinc-200">Mode hors-ligne</p>
                  <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1">
                    Si pas de connexion, utilisez le BIP : appelez le centre médical le plus proche (appel court). Ils vous rappelleront automatiquement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Page: Pharmacie */}
        {currentPage === 'pharmacie' && (
          <div className="px-4 sm:px-5 pt-3 sm:pt-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Pharmacie</h2>
              <button onClick={() => setShowCartModal(true)} className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <i className="fas fa-shopping-cart text-zinc-400 text-xs sm:text-sm"></i>
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-info rounded-full text-[8px] sm:text-[10px] font-bold flex items-center justify-center">
                    {cart.reduce((a, b) => a + b.quantite, 0)}
                  </span>
                )}
              </button>
            </div>
            
            <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2">
              <button className={`tab-btn ${pharmTab === 'medicines' ? 'active' : ''}`} onClick={() => setPharmTab('medicines')}>Médicaments</button>
              <button className={`tab-btn ${pharmTab === 'pharmacies' ? 'active' : ''}`} onClick={() => setPharmTab('pharmacies')}>Pharmacies</button>
              <button className={`tab-btn ${pharmTab === 'orders' ? 'active' : ''}`} onClick={() => setPharmTab('orders')}>Commandes</button>
            </div>
            
            <div className="relative mb-3 sm:mb-4">
              <i className="fas fa-search absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xs sm:text-sm"></i>
              <input
                type="text"
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                placeholder="Rechercher un médicament..."
                className="pl-8 sm:pl-11 text-sm input-modern w-full px-4 py-3 rounded-xl text-white placeholder:text-zinc-600"
              />
            </div>
            
            {pharmTab === 'medicines' && (
              <div className="medicines-grid mb-3 sm:mb-4">
                {medicines.filter(m => m.nom.toLowerCase().includes(medSearch.toLowerCase())).map(m => (
                  <div key={m.id} className="card p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                      <span className={`badge ${m.necessite_ordonnance ? 'bg-danger/20 text-danger' : 'bg-success/20 text-success'} text-[8px] sm:text-[10px]`}>
                        {m.necessite_ordonnance ? 'Ordonnance' : 'Libre'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-semibold mb-1 leading-tight">{m.nom}</p>
                    <p className="text-[8px] sm:text-[10px] text-zinc-500 mb-2 sm:mb-3">{m.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-bold text-info">{formatPrice(m.prix)}</p>
                      <button onClick={() => addToCart(m)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-info/15 flex items-center justify-center active:scale-90 transition">
                        <i className="fas fa-plus text-info text-[10px] sm:text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {pharmTab === 'pharmacies' && (
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                {pharmacies.map(p => (
                  <div key={p.id} className="card p-3 sm:p-4">
                    <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-warn/15 flex items-center justify-center">
                        <i className="fas fa-pills text-warn text-sm sm:text-base"></i>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-semibold">{p.name}</p>
                        <p className="text-[10px] sm:text-xs text-zinc-400">{p.online ? '🟢 En ligne' : '🔴 Hors ligne'}</p>
                      </div>
                      <a href={`tel:${p.phone}`} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-success/15 flex items-center justify-center">
                        <i className="fas fa-phone text-success text-xs sm:text-sm"></i>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Page: Bien-être */}
        {currentPage === 'bienetre' && (
          <div className="px-4 sm:px-5 pt-3 sm:pt-4">
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Bien-être</h2>
            <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2">
              {user?.sexe === 'FEMININ' && <button className={`tab-btn ${wellnessTab === 'femme' ? 'active' : ''}`} onClick={() => setWellnessTab('femme')}>Femme</button>}
              {user?.sexe === 'MASCULIN' && <button className={`tab-btn ${wellnessTab === 'homme' ? 'active' : ''}`} onClick={() => setWellnessTab('homme')}>Homme</button>}
              <button className={`tab-btn ${wellnessTab === 'mental' ? 'active' : ''}`} onClick={() => setWellnessTab('mental')}>Mental</button>
              <button className={`tab-btn ${wellnessTab === 'articles' ? 'active' : ''}`} onClick={() => setWellnessTab('articles')}>Articles</button>
              <button className={`tab-btn ${wellnessTab === 'stats' ? 'active' : ''}`} onClick={() => setWellnessTab('stats')}>Statistiques</button>
            </div>
            
            <div>
              {wellnessTab === 'femme' && renderFemmeTab()}
              {wellnessTab === 'homme' && renderHommeTab()}
              {wellnessTab === 'mental' && renderMentalTab()}
              {wellnessTab === 'articles' && renderArticlesTab()}
              {wellnessTab === 'stats' && renderStatsTab()}
            </div>
          </div>
        )}

        {/* Page: Profil */}
        {currentPage === 'profil' && (
          <div className="px-4 sm:px-5 pt-3 sm:pt-4">
            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Mon profil</h2>
            <div className="flex flex-col items-center mb-4 sm:mb-6">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-danger to-orange-500 flex items-center justify-center text-xl sm:text-2xl font-bold mb-2 sm:mb-3">
                {user?.prenom?.[0] || user?.nom?.[0] || 'P'}
              </div>
              <p className="font-semibold text-base sm:text-lg">{user?.prenom} {user?.nom}</p>
              <p className="text-zinc-400 text-xs sm:text-sm">{user?.email || user?.telephone}</p>
              <span className="badge bg-info/20 text-info mt-1 sm:mt-2 text-[10px] sm:text-xs">{user?.role}</span>
            </div>
            
            <div className="space-y-2 mb-4 sm:mb-6">
              <div className="card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-danger/15 flex items-center justify-center">
                  <i className="fas fa-tint text-danger text-xs sm:text-sm"></i>
                </div>
                <div><p className="text-xs sm:text-sm font-medium">Groupe sanguin</p><p className="text-[10px] sm:text-xs text-zinc-400">{user?.groupe_sanguin || 'A+'}</p></div>
              </div>
              <div className="card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-info/15 flex items-center justify-center">
                  <i className="fas fa-phone text-info text-xs sm:text-sm"></i>
                </div>
                <div><p className="text-xs sm:text-sm font-medium">Téléphone</p><p className="text-[10px] sm:text-xs text-zinc-400">{user?.telephone}</p></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <button onClick={() => setShowNotifModal(true)} className="card p-3 sm:p-4 flex items-center gap-3 sm:gap-4 w-full text-left">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-warn/15 flex items-center justify-center"><i className="fas fa-bell text-warn text-xs sm:text-sm"></i></div>
                <p className="text-xs sm:text-sm font-medium">Mes notifications</p>
                <i className="fas fa-chevron-right text-zinc-600 ml-auto text-xs sm:text-sm"></i>
              </button>
              <button onClick={handleLogout} className="card p-3 sm:p-4 flex items-center gap-3 sm:gap-4 w-full text-left">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-danger/15 flex items-center justify-center"><i className="fas fa-sign-out-alt text-danger text-xs sm:text-sm"></i></div>
                <p className="text-xs sm:text-sm font-medium">Déconnexion</p>
                <i className="fas fa-chevron-right text-zinc-600 ml-auto text-xs sm:text-sm"></i>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          <div className="nav-inner flex items-center justify-around py-1 sm:py-2 px-2 sm:px-4">
            <button className={`nav-item flex flex-col items-center gap-0.5 sm:gap-1 py-1 sm:py-2 px-2 sm:px-3 ${currentPage === 'home' ? 'active' : ''}`} onClick={() => setCurrentPage('home')}>
              <i className="fas fa-home text-base sm:text-lg"></i>
              <span className="text-[8px] sm:text-[10px]">Accueil</span>
              <div className="nav-dot"></div>
            </button>
            <button className={`nav-item flex flex-col items-center gap-0.5 sm:gap-1 py-1 sm:py-2 px-2 sm:px-3 ${currentPage === 'urgence' ? 'active' : ''}`} onClick={() => setCurrentPage('urgence')}>
              <i className="fas fa-ambulance text-base sm:text-lg"></i>
              <span className="text-[8px] sm:text-[10px]">Urgence</span>
              <div className="nav-dot"></div>
            </button>
            <button className={`nav-item flex flex-col items-center gap-0.5 sm:gap-1 py-1 sm:py-2 px-2 sm:px-3 ${currentPage === 'pharmacie' ? 'active' : ''}`} onClick={() => setCurrentPage('pharmacie')}>
              <i className="fas fa-pills text-base sm:text-lg"></i>
              <span className="text-[8px] sm:text-[10px]">Pharmacie</span>
              <div className="nav-dot"></div>
            </button>
            <button className={`nav-item flex flex-col items-center gap-0.5 sm:gap-1 py-1 sm:py-2 px-2 sm:px-3 ${currentPage === 'bienetre' ? 'active' : ''}`} onClick={() => setCurrentPage('bienetre')}>
              <i className="fas fa-heart text-base sm:text-lg"></i>
              <span className="text-[8px] sm:text-[10px]">Bien-être</span>
              <div className="nav-dot"></div>
            </button>
            <button className={`nav-item flex flex-col items-center gap-0.5 sm:gap-1 py-1 sm:py-2 px-2 sm:px-3 ${currentPage === 'profil' ? 'active' : ''}`} onClick={() => setCurrentPage('profil')}>
              <i className="fas fa-user text-base sm:text-lg"></i>
              <span className="text-[8px] sm:text-[10px]">Profil</span>
              <div className="nav-dot"></div>
            </button>
          </div>
        </div>
      </div>

      {/* SOS Modal */}
      {showSOSModal && (
        <div className="modal-overlay" onClick={() => setShowSOSModal(false)}>
          <div className="modal-content p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold text-danger"><i className="fas fa-exclamation-triangle mr-2"></i>Alerte d'urgence</h3>
              <button onClick={() => setShowSOSModal(false)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <i className="fas fa-times text-zinc-400 text-xs sm:text-sm"></i>
              </button>
            </div>
            
            {isOnline ? (
              <>
                <div className="p-3 sm:p-4 rounded-xl bg-danger/10 border border-danger/20 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <i className="fas fa-wifi text-success text-sm"></i>
                    <div><p className="text-xs sm:text-sm font-semibold">Mode en ligne</p><p className="text-[10px] sm:text-xs text-zinc-400">GPS capturé — Alertes automatiques</p></div>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  <div className="card p-3 sm:p-4">
                    <p className="text-[10px] sm:text-xs text-zinc-500 mb-1">Position GPS</p>
                    <p className="text-xs sm:text-sm font-mono">{TANA[0]}, {TANA[1]}</p>
                  </div>
                  <div>
                    <label className="text-[10px] sm:text-xs text-zinc-400 mb-1 block">Type d'urgence</label>
                    <select value={sosType} onChange={(e) => setSosType(e.target.value)} className="input-modern w-full px-4 py-3 rounded-xl text-white text-sm">
                      <option>Accident</option><option>Malaise</option><option>Douleur aiguë</option><option>Problème cardiaque</option><option>Accouchement</option><option>Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] sm:text-xs text-zinc-400 mb-1 block">Description</label>
                    <textarea value={sosDesc} onChange={(e) => setSosDesc(e.target.value)} rows={3} placeholder="Décrivez brièvement l'urgence..." className="input-modern w-full px-4 py-3 rounded-xl text-white text-sm"></textarea>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button onClick={sendSOSOnline} className="bg-danger text-white py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm active:scale-95 transition">
                    <i className="fas fa-paper-plane mr-1 sm:mr-2"></i>Envoyer alerte
                  </button>
                  <button onClick={bipCentre} className="bg-warn text-black py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm active:scale-95 transition">
                    <i className="fas fa-phone mr-1 sm:mr-2"></i>BIP Centre
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 sm:p-4 rounded-xl bg-warn/10 border border-warn/20 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <i className="fas fa-wifi-slash text-warn text-sm"></i>
                    <div><p className="text-xs sm:text-sm font-semibold">Mode hors-ligne</p><p className="text-[10px] sm:text-xs text-zinc-400">Faites un BIP (appel court) au centre le plus proche</p></div>
                  </div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {hospitals.slice(0, 3).map(h => (
                    <a key={h.id} href={`tel:${h.telephone}`} className="card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-warn/15 flex items-center justify-center">
                        <i className="fas fa-phone text-warn text-sm sm:text-base"></i>
                      </div>
                      <div><p className="text-xs sm:text-sm font-semibold">{h.nom}</p><p className="text-[10px] sm:text-xs text-zinc-400">BIP (appel court) puis raccrocher</p></div>
                    </a>
                  ))}
                </div>
                <button onClick={() => setShowSOSModal(false)} className="w-full mt-3 sm:mt-4 py-2 sm:py-3 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs sm:text-sm">Fermer</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCartModal && (
        <div className="modal-overlay" onClick={() => setShowCartModal(false)}>
          <div className="modal-content p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold"><i className="fas fa-shopping-cart mr-2 text-info"></i>Mon panier</h3>
              <button onClick={() => setShowCartModal(false)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <i className="fas fa-times text-zinc-400 text-xs sm:text-sm"></i>
              </button>
            </div>
            
            {cart.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <i className="fas fa-shopping-cart text-2xl sm:text-3xl text-zinc-700 mb-2 sm:mb-3"></i>
                <p className="text-zinc-500 text-xs sm:text-sm">Votre panier est vide</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  {cart.map(c => (
                    <div key={c.medicament_id} className="flex items-center gap-2 sm:gap-3">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium">{c.nom}</p>
                        <p className="text-[10px] sm:text-xs text-zinc-400">{formatPrice(c.prix)} × {c.quantite}</p>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button onClick={() => updateCartQty(c.medicament_id, -1)} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] sm:text-xs">−</button>
                        <span className="text-xs sm:text-sm font-bold w-4 sm:w-5 text-center">{c.quantite}</span>
                        <button onClick={() => updateCartQty(c.medicament_id, 1)} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] sm:text-xs">+</button>
                      </div>
                      <button onClick={() => removeFromCart(c.medicament_id)} className="text-zinc-600 hover:text-danger transition">
                        <i className="fas fa-trash text-[10px] sm:text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-800 pt-3 sm:pt-4">
                  <div className="flex justify-between mb-3 sm:mb-4">
                    <span className="text-zinc-400 text-xs sm:text-sm">Total</span>
                    <span className="text-base sm:text-xl font-bold">{formatPrice(cart.reduce((a, b) => a + b.prix * b.quantite, 0))}</span>
                  </div>
                  <div className="mb-2 sm:mb-3">
                    <label className="text-[10px] sm:text-xs text-zinc-400 mb-1 block">Adresse de livraison</label>
                    <input type="text" value={deliveryAddr} onChange={(e) => setDeliveryAddr(e.target.value)} className="input-modern w-full px-4 py-3 rounded-xl text-white text-sm" />
                  </div>
                  <button onClick={placeOrder} className="w-full bg-info text-white py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm active:scale-95 transition">
                    <i className="fas fa-check mr-1 sm:mr-2"></i>Confirmer la commande
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifModal && (
        <div className="modal-overlay" onClick={() => setShowNotifModal(false)}>
          <div className="modal-content p-4 sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-bold"><i className="fas fa-bell mr-2 text-warn"></i>Notifications</h3>
              <button onClick={() => setShowNotifModal(false)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <i className="fas fa-times text-zinc-400 text-xs sm:text-sm"></i>
              </button>
            </div>
            <div className="space-y-2 sm:space-y-3">
              {notifications.length === 0 ? (
                <p className="text-center text-zinc-500 text-xs sm:text-sm py-3 sm:py-4">Aucune notification</p>
              ) : (
                notifications.map(n => {
                  const icons: { [key: string]: string } = {
                    PERIOD_REMINDER: 'fa-calendar-alt text-pink-400',
                    VACCINATION: 'fa-syringe text-info',
                    MOOD_ALERT: 'fa-smile text-success',
                    EMERGENCY_UPDATE: 'fa-exclamation-triangle text-danger',
                    ORDER_STATUS: 'fa-shopping-bag text-info',
                    GENERAL: 'fa-info-circle text-zinc-400',
                    MEDICAL_REMINDER: 'fa-pills text-warn'
                  };
                  const ic = icons[n.type] || icons.GENERAL;
                  return (
                    <div key={n.id} className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl ${n.lu ? 'bg-zinc-900/50' : 'bg-zinc-800/80 border border-zinc-700'}`}>
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                        <i className={`fas ${ic} text-[10px] sm:text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs sm:text-sm font-semibold ${n.lu ? 'text-zinc-400' : ''}`}>{n.titre}</p>
                        <p className="text-[10px] sm:text-xs text-zinc-500 mt-0.5">{n.message}</p>
                        <p className="text-[8px] sm:text-[10px] text-zinc-600 mt-0.5 sm:mt-1">{timeAgo(new Date(n.date_creation))}</p>
                      </div>
                      {!n.lu && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-danger mt-1 sm:mt-2 shrink-0"></div>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chatbot Modal */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950">
          <div className="glass px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
            <button onClick={() => setShowChatModal(false)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-800 flex items-center justify-center">
              <i className="fas fa-arrow-left text-zinc-400 text-xs sm:text-sm"></i>
            </button>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-500/20 flex items-center justify-center">
              <i className="fas fa-robot text-purple-400 text-xs sm:text-sm"></i>
            </div>
            <div><p className="text-xs sm:text-sm font-semibold">MindTrack</p><p className="text-[8px] sm:text-[10px] text-success">En ligne</p></div>
          </div>
          <div ref={chatMessagesRef} className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
            {chatMessages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.from === 'bot' ? 'chat-bot' : 'chat-user'} text-xs sm:text-sm`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="p-3 sm:p-4 border-t border-zinc-800 flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendChat()}
              placeholder="Écrivez votre message..."
              className="flex-1 input-modern px-4 py-3 rounded-xl text-white text-sm"
            />
            <button onClick={sendChat} className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-purple-500 flex items-center justify-center active:scale-90 transition">
              <i className="fas fa-paper-plane text-white text-xs sm:text-sm"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPage;