import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContexte';
import { useToast } from '../hooks/useToast';
import { emergencyService } from '../services/api';
import socketService from '../services/socket';
import Toast from '../components/common/Toast';
import Loading from '../components/common/Loading';

interface Mission {
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

interface Hospital {
  name: string;
  lat: number;
  lng: number;
  emergency: boolean;
}

const AmbulancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toasts, showToast, removeToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Driver status
  const [driverStatus, setDriverStatus] = useState<'DISPONIBLE' | 'EN_ROUTE' | 'EN_INTERVENTION' | 'EN_HOPITAL' | 'RETOUR_BASE'>('DISPONIBLE');
  const [ambulanceName] = useState('AMB-001');
  const [driverName] = useState(user?.nom || 'Rakoto Fara');
  
  // Missions
  const [missions, setMissions] = useState<Mission[]>([
    {
      id: "M1024", patient: "Rakoto Marie", phone: "+261 34 00 123 45",
      location: "Analakely, près du marché", severity: "CRITIQUE",
      status: "ASSIGNED",
      assignedAt: new Date(Date.now() - 25 * 60000).toISOString(),
      lat: -18.8800, lng: 47.5180,
      hospital: "CHU HJRA"
    },
    {
      id: "M1025", patient: "Rasoamampionona", phone: "+261 34 11 222 33",
      location: "67ha, près du stade", severity: "ÉLEVÉ",
      status: "COMPLETED",
      assignedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
      lat: -18.8900, lng: 47.5250,
      hospital: "Clinique MMN"
    }
  ]);
  
  const [ambulancePosition, setAmbulancePosition] = useState({ lat: -18.8790, lng: 47.5210 });
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  
  // Hospitals
  const hospitals: Hospital[] = [
    { name: "CHU HJRA", lat: -18.8850, lng: 47.5150, emergency: true },
    { name: "CHU Androva", lat: -18.8720, lng: 47.5080, emergency: true },
    { name: "Clinique MMN", lat: -18.8900, lng: 47.5300, emergency: true }
  ];
  
  // Map refs
  const driverMapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const hospitalMarkersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    initDriverMap();
    updateUIBasedOnStatus();
    renderMissionsList();
    updateStatsAndProgress();
    updateHistoryLog();
    
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    const gpsInterval = setInterval(() => {
      if (driverStatus === 'EN_ROUTE' || driverStatus === 'EN_HOPITAL') {
        setAmbulancePosition(prev => ({
          lat: prev.lat + (Math.random() - 0.5) * 0.002,
          lng: prev.lng + (Math.random() - 0.5) * 0.002
        }));
      }
    }, 8000);
    
    if (user) {
      socketService.connect(localStorage.getItem('token') || '');
      socketService.joinRoom('ambulances');
      socketService.onNewEmergency(handleNewEmergency);
    }
    
    return () => {
      clearInterval(timeInterval);
      clearInterval(gpsInterval);
      socketService.off('new-emergency');
      if (driverMapRef.current) {
        driverMapRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (driverMarkerRef.current && driverMapRef.current) {
      driverMarkerRef.current.setLatLng([ambulancePosition.lat, ambulancePosition.lng]);
      driverMapRef.current.setView([ambulancePosition.lat, ambulancePosition.lng]);
    }
    socketService.emitLocationUpdate({ lat: ambulancePosition.lat, lng: ambulancePosition.lng, ambulanceId: 1 });
  }, [ambulancePosition]);

  const handleNewEmergency = (data: any) => {
    showToast(`Nouvelle urgence: ${data.type_urgence}`, 'warn');
    const newMission: Mission = {
      id: `M${Math.floor(Math.random() * 9000) + 2000}`,
      patient: data.Patient?.nom || "Urgence",
      phone: data.Patient?.telephone || "",
      location: data.localisation || "Position inconnue",
      severity: data.niveau_priorite || "MOYEN",
      status: "ASSIGNED",
      assignedAt: new Date().toISOString(),
      lat: data.latitude || -18.88,
      lng: data.longitude || 47.52,
      hospital: "CHU HJRA"
    };
    setMissions(prev => [newMission, ...prev]);
    renderMissionsList();
    updateStatsAndProgress();
  };

  const initDriverMap = () => {
    const mapEl = document.getElementById('ambulanceDriverMap');
    if (!mapEl || driverMapRef.current) return;
    
    driverMapRef.current = L.map('ambulanceDriverMap').setView([ambulancePosition.lat, ambulancePosition.lng], 14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(driverMapRef.current);
    
    const ambulanceIcon = L.divIcon({
      html: `<div class="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white text-xl shadow-lg border-2 border-white"><i class="fas fa-ambulance"></i></div>`,
      iconSize: [40, 40],
      className: 'pulse-red'
    });
    driverMarkerRef.current = L.marker([ambulancePosition.lat, ambulancePosition.lng], { icon: ambulanceIcon })
      .addTo(driverMapRef.current)
      .bindPopup("Votre ambulance");
    
    hospitals.forEach(h => {
      const icon = L.divIcon({
        html: `<div class="w-7 h-7 rounded-full bg-cyan-700 flex items-center justify-center text-white text-xs"><i class="fas fa-hospital"></i></div>`,
        iconSize: [28, 28]
      });
      const marker = L.marker([h.lat, h.lng], { icon }).addTo(driverMapRef.current!).bindPopup(`🏥 ${h.name}`);
      hospitalMarkersRef.current.push(marker);
    });
    
    setTimeout(() => driverMapRef.current?.invalidateSize(), 200);
  };

  const updateUIBasedOnStatus = () => {
    const statusMap: { [key: string]: { label: string; class: string; actionText: string; actionIcon: string } } = {
      'DISPONIBLE': { label: '✅ Disponible', class: 'status-DISPONIBLE', actionText: 'DÉMARRER UNE INTERVENTION', actionIcon: 'fa-play-circle' },
      'EN_ROUTE': { label: '🚑 En route vers patient', class: 'status-EN_ROUTE', actionText: 'ARRIVÉ SUR PLACE', actionIcon: 'fa-flag-checkered' },
      'EN_INTERVENTION': { label: '🩺 Intervention en cours', class: 'status-EN_INTERVENTION', actionText: 'TRANSFERT VERS HÔPITAL', actionIcon: 'fa-hospital-user' },
      'EN_HOPITAL': { label: '🏥 À l\'hôpital', class: 'status-EN_HOPITAL', actionText: 'RETOUR À LA BASE', actionIcon: 'fa-arrow-left' },
      'RETOUR_BASE': { label: '🏠 Retour base', class: 'status-RETOUR_BASE', actionText: 'DEVENIR DISPONIBLE', actionIcon: 'fa-check-double' }
    };
    
    const current = statusMap[driverStatus] || statusMap['DISPONIBLE'];
    
    const statusLabel = document.getElementById('currentDriverStatusLabel');
    if (statusLabel) statusLabel.innerText = current.label;
    
    const statusBadge = document.getElementById('statusDetailBadge');
    if (statusBadge) {
      statusBadge.className = `status-badge ${current.class}`;
      statusBadge.innerText = current.label;
    }
    
    const actionBtn = document.getElementById('actionPrimaryBtn');
    if (actionBtn) {
      actionBtn.innerHTML = `<i class="fas ${current.actionIcon}"></i> ${current.actionText}`;
    }
    
    const activeMission = missions.find(m => m.status !== 'COMPLETED');
    const activeMissionLabel = document.getElementById('activeMissionLabel');
    if (activeMissionLabel) {
      if (activeMission && driverStatus !== 'DISPONIBLE') {
        activeMissionLabel.innerHTML = `<span class="text-red-300">${activeMission.id}</span> - ${activeMission.patient}`;
      } else {
        activeMissionLabel.innerText = 'Aucune mission en cours';
      }
    }
    
    const ambulanceNameDisplay = document.getElementById('ambulanceNameDisplay');
    if (ambulanceNameDisplay) ambulanceNameDisplay.innerText = ambulanceName;
  };

  const updateStatsAndProgress = () => {
    const todayStr = new Date().toDateString();
    const todayMissions = missions.filter(m => new Date(m.assignedAt).toDateString() === todayStr);
    const completedToday = todayMissions.filter(m => m.status === 'COMPLETED').length;
    const activeCount = missions.filter(m => m.status !== 'COMPLETED').length;
    
    const missionsTodayCount = document.getElementById('missionsTodayCount');
    if (missionsTodayCount) missionsTodayCount.innerText = todayMissions.length.toString();
    
    const activeMissionsCount = document.getElementById('activeMissionsCount');
    if (activeMissionsCount) activeMissionsCount.innerText = activeCount.toString();
    
    const completedMissionsCount = document.getElementById('completedMissionsCount');
    if (completedMissionsCount) completedMissionsCount.innerText = completedToday.toString();
    
    const totalShift = 8;
    const progress = Math.min(100, (completedToday / totalShift) * 100);
    
    const shiftProgress = document.getElementById('shiftProgress');
    if (shiftProgress) shiftProgress.innerHTML = Math.floor(progress) + '%';
    
    const shiftProgressBar = document.getElementById('shiftProgressBar');
    if (shiftProgressBar) shiftProgressBar.style.width = progress + '%';
    
    const missionsQueueCount = document.getElementById('missionsQueueCount');
    if (missionsQueueCount) missionsQueueCount.innerText = missions.filter(m => m.status !== 'COMPLETED').length.toString();
  };

  const renderMissionsList = () => {
    const container = document.getElementById('missionsListContainer');
    if (!container) return;
    
    const pendingMissions = missions.filter(m => m.status !== 'COMPLETED');
    const completedMissions = missions.filter(m => m.status === 'COMPLETED');
    
    if (pendingMissions.length === 0 && completedMissions.length === 0) {
      container.innerHTML = `<div class="text-center text-zinc-500 text-sm py-10">Aucune mission.<br>En attente d'affectation centrale.</div>`;
      return;
    }
    
    let html = '';
    pendingMissions.forEach(m => {
      let statusText = '';
      if (m.status === 'ASSIGNED') statusText = '🔔 Nouvelle affectation';
      else if (m.status === 'EN_ROUTE') statusText = '🚑 En route';
      else if (m.status === 'ON_SCENE') statusText = '🩺 Sur place';
      else if (m.status === 'EN_HOPITAL') statusText = '🏥 Transfert';
      
      html += `
        <div class="mission-card active-mission p-4">
          <div class="flex justify-between items-start mb-2">
            <div><p class="font-bold">${m.patient}</p><p class="text-[10px] text-zinc-400">${m.location}</p></div>
            <span class="text-[10px] bg-red-500/30 text-red-300 px-2 py-1 rounded-full">${m.severity}</span>
          </div>
          <div class="flex justify-between text-xs mt-2">
            <span><i class="fas fa-phone-alt mr-1"></i>${m.phone}</span>
            <span class="text-amber-400">${statusText}</span>
          </div>
          ${m.status === 'ASSIGNED' && driverStatus === 'DISPONIBLE' ? `<button onclick="window.startMission('${m.id}')" class="mt-3 w-full bg-red-600/80 hover:bg-red-600 py-2 rounded-xl text-xs font-bold">PRENDRE EN CHARGE & PARTIR</button>` : ''}
          ${m.status === 'EN_ROUTE' ? `<div class="mt-2 text-[10px] text-info flex items-center gap-1"><i class="fas fa-location-dot animate-pulse"></i> Votre GPS est actif, dirigez-vous vers le patient</div>` : ''}
        </div>
      `;
    });
    
    if (completedMissions.length > 0) {
      html += `<div class="mt-3 text-[11px] text-zinc-500 pt-2 border-t border-white/10">✔️ Missions terminées</div>`;
      completedMissions.slice(0, 2).forEach(m => {
        html += `<div class="mission-card completed p-3 opacity-70"><div class="flex justify-between"><span class="text-sm">${m.patient}</span><span class="text-[10px] text-green-400"><i class="fas fa-check-circle"></i> Terminée</span></div><div class="text-[10px] text-zinc-500">${m.location}</div></div>`;
      });
    }
    
    container.innerHTML = html;
  };

  const updateHistoryLog = () => {
    const completed = missions.filter(m => m.status === 'COMPLETED');
    const historyDiv = document.getElementById('historyLog');
    if (!historyDiv) return;
    
    if (completed.length === 0) {
      historyDiv.innerHTML = '<span class="text-zinc-600 text-xs">Aucune intervention terminée récemment</span>';
      return;
    }
    
    historyDiv.innerHTML = completed.slice(0, 5).map(m => 
      `<span class="bg-zinc-800/60 px-3 py-1.5 rounded-full text-xs"><i class="fas fa-check-circle text-green-500 mr-1"></i>${m.id} - ${m.patient}</span>`
    ).join('');
  };

  const openStartMissionModal = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (mission) {
      setSelectedMission(mission);
      setShowStartModal(true);
    }
  };

  const confirmStartMission = () => {
    if (selectedMission) {
      setMissions(prev => prev.map(m => 
        m.id === selectedMission.id ? { ...m, status: 'EN_ROUTE' } : m
      ));
      setDriverStatus('EN_ROUTE');
      setShowStartModal(false);
      showToast(`🚨 Intervention ${selectedMission.id} : vous êtes EN ROUTE vers le patient`, "success");
      updateUIBasedOnStatus();
      renderMissionsList();
    }
  };

  const markArrivedOnScene = () => {
    const activeMission = missions.find(m => m.status === 'EN_ROUTE');
    if (activeMission) {
      setMissions(prev => prev.map(m => 
        m.id === activeMission.id ? { ...m, status: 'ON_SCENE' } : m
      ));
      setDriverStatus('EN_INTERVENTION');
      showToast(`✅ Arrivé sur place, intervention médicale commencée`, "success");
      updateUIBasedOnStatus();
      renderMissionsList();
    } else {
      showToast("Aucune mission active en route", "info");
    }
  };

  const startTransferToHospital = () => {
    const activeMission = missions.find(m => m.status === 'ON_SCENE');
    if (activeMission) {
      setMissions(prev => prev.map(m => 
        m.id === activeMission.id ? { ...m, status: 'EN_HOPITAL' } : m
      ));
      setDriverStatus('EN_HOPITAL');
      showToast(`🏥 Transfert vers ${activeMission.hospital} en cours`, "success");
      updateUIBasedOnStatus();
      renderMissionsList();
    } else {
      showToast("Aucune intervention active", "info");
    }
  };

  const returnToBase = () => {
    const activeMission = missions.find(m => m.status === 'EN_HOPITAL');
    if (activeMission) {
      setMissions(prev => prev.map(m => 
        m.id === activeMission.id ? { ...m, status: 'COMPLETED' } : m
      ));
      setDriverStatus('RETOUR_BASE');
      showToast(`🏁 Mission ${activeMission.id} terminée, retour à la base`, "success");
      updateUIBasedOnStatus();
      renderMissionsList();
      updateHistoryLog();
      updateStatsAndProgress();
      
      setTimeout(() => {
        if (driverStatus === 'RETOUR_BASE') {
          const newMission: Mission = {
            id: `M${Math.floor(Math.random() * 9000) + 2000}`,
            patient: "Urgence spontanée",
            phone: "+261 34 99 88 77",
            location: "Antaninarenina",
            severity: "MOYEN",
            status: "ASSIGNED",
            assignedAt: new Date().toISOString(),
            lat: -18.8770,
            lng: 47.5270,
            hospital: "CHU HJRA"
          };
          setMissions(prev => [newMission, ...prev]);
          showToast(`📢 Nouvelle mission assignée : ${newMission.id}`, "info");
          renderMissionsList();
          updateStatsAndProgress();
        }
      }, 5000);
    } else {
      showToast("Aucun patient à l'hôpital", "info");
    }
  };

  const setAvailableAfterReturn = () => {
    setDriverStatus('DISPONIBLE');
    updateUIBasedOnStatus();
    showToast(`🟢 Statut mis à jour : Disponible pour nouvelles missions`, "success");
  };

  const updateDriverStatus = (status: 'DISPONIBLE' | 'RETOUR_BASE') => {
    if (status === 'DISPONIBLE' && driverStatus !== 'RETOUR_BASE' && driverStatus !== 'DISPONIBLE') {
      showToast("Terminez d'abord la mission active avant de repasser disponible", "warn");
      return;
    }
    setDriverStatus(status);
    updateUIBasedOnStatus();
    showToast(`Statut changé : ${status}`, "info");
  };

  const triggerPrimaryAction = () => {
    if (driverStatus === 'DISPONIBLE') {
      const pendingMission = missions.find(m => m.status === 'ASSIGNED');
      if (pendingMission) {
        openStartMissionModal(pendingMission.id);
      } else {
        showToast("Aucune mission assignée en attente", "info");
      }
    } else if (driverStatus === 'EN_ROUTE') {
      markArrivedOnScene();
    } else if (driverStatus === 'EN_INTERVENTION') {
      startTransferToHospital();
    } else if (driverStatus === 'EN_HOPITAL') {
      returnToBase();
    } else if (driverStatus === 'RETOUR_BASE') {
      setAvailableAfterReturn();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Expose functions to window for onclick handlers
  React.useEffect(() => {
    (window as any).startMission = openStartMissionModal;
    (window as any).closeStartModal = () => setShowStartModal(false);
    (window as any).confirmStartMission = confirmStartMission;
    (window as any).updateDriverStatus = updateDriverStatus;
    (window as any).triggerPrimaryAction = triggerPrimaryAction;
  }, [missions, driverStatus, selectedMission]);

  return (
    <div className="antialiased">
      {loading && <Loading />}
      
      <div id="toastContainer" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
        {toasts.map(toast => <Toast key={toast.id} toast={toast} onClose={removeToast} />)}
      </div>

      {/* Start Mission Modal */}
      {showStartModal && selectedMission && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#14141e] rounded-3xl max-w-lg w-full mx-4 p-6 border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><i className="fas fa-truck-medical text-red-500"></i> Démarrer l'intervention</h2>
              <button onClick={() => setShowStartModal(false)} className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400"><i className="fas fa-times"></i></button>
            </div>
            <div className="space-y-4">
              <div className="bg-black/30 rounded-xl p-3 space-y-2">
                <p><strong className="text-red-400">Patient :</strong> {selectedMission.patient}</p>
                <p><strong>📍 Lieu :</strong> {selectedMission.location}</p>
                <p><strong>📞 Contact :</strong> {selectedMission.phone}</p>
                <p><strong>⚠️ Sévérité :</strong> <span className="text-red-300">{selectedMission.severity}</span></p>
                <p><strong>🏥 Hôpital cible :</strong> {selectedMission.hospital}</p>
                <div className="text-xs text-zinc-400 mt-2"><i className="fas fa-gps"></i> Vous allez indiquer votre départ immédiat.</div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button onClick={confirmStartMission} className="bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2">
                <i className="fas fa-play"></i> PARTIR EN SERVICE
              </button>
              <button onClick={() => setShowStartModal(false)} className="bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-medium">Annuler</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 driver-avatar rounded-2xl flex items-center justify-center text-3xl shadow-xl">
              <i className="fas fa-user-nurse text-red-400"></i>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">Espace <span className="text-red-500">Ambulancier</span></h1>
              <p className="text-zinc-400 text-sm">{driverName} • <span id="driverAmbulanceName">{ambulanceName}</span> | Statut opérationnel</p>
            </div>
          </div>
          <div className="glass-panel px-5 py-2.5 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <i className="fas fa-circle text-green-500 text-xs animate-pulse"></i>
              <span className="text-sm font-medium" id="currentDriverStatusLabel">Disponible</span>
            </div>
            <div className="w-px h-8 bg-zinc-700"></div>
            <div className="flex items-center gap-2">
              <i className="fas fa-clock text-zinc-500"></i>
              <span className="text-sm" id="currentTimeDisplay">
                {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">
                <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-zinc-300 text-xs`}></i>
              </button>
              <button onClick={handleLogout} className="ml-2 w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600 transition">
                <i className="fas fa-sign-out-alt text-zinc-300 text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Status Card + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-5 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center"><i className="fas fa-ambulance text-red-400 text-xl"></i></div>
              <div><p className="text-sm text-zinc-400">Mon ambulance</p><p className="text-xl font-bold" id="ambulanceNameDisplay">{ambulanceName}</p></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-zinc-400">Statut actuel :</span> <span id="statusDetailBadge" className="status-badge status-DISPONIBLE">Disponible</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Mission en cours :</span> <span id="activeMissionLabel" className="text-zinc-300 text-sm">Aucune</span></div>
              <div className="h-px bg-white/10 my-2"></div>
              <div className="flex flex-col gap-2 mt-2">
                <button id="actionPrimaryBtn" onClick={triggerPrimaryAction} className="btn-action w-full bg-red-600 hover:bg-red-700 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition">
                  <i className="fas fa-play-circle"></i> DÉMARRER UNE INTERVENTION
                </button>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button onClick={() => updateDriverStatus('DISPONIBLE')} className="btn-action bg-green-600/20 hover:bg-green-600/40 text-green-400 py-2 rounded-xl text-sm font-semibold">
                    <i className="fas fa-check-circle"></i> Disponible
                  </button>
                  <button onClick={() => updateDriverStatus('RETOUR_BASE')} className="btn-action bg-info/20 hover:bg-info/40 text-info py-2 rounded-xl text-sm">
                    <i className="fas fa-home"></i> Retour base
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="glass-panel p-5 lg:col-span-2">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><i className="fas fa-chart-simple text-red-400"></i> Aperçu du service</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-2xl font-bold text-red-400" id="missionsTodayCount">0</p><p className="text-xs text-zinc-500">Interventions aujourd'hui</p></div>
              <div><p className="text-2xl font-bold text-amber-400" id="activeMissionsCount">0</p><p className="text-xs text-zinc-500">En cours</p></div>
              <div><p className="text-2xl font-bold text-emerald-400" id="completedMissionsCount">0</p><p className="text-xs text-zinc-500">Terminées</p></div>
            </div>
            <div className="mt-4 bg-black/30 rounded-xl p-3">
              <div className="flex justify-between text-xs text-zinc-400 mb-1"><span>Progression du shift</span><span id="shiftProgress">0%</span></div>
              <div className="w-full bg-zinc-800 rounded-full h-2"><div id="shiftProgressBar" className="bg-red-500 h-2 rounded-full" style={{ width: '0%' }}></div></div>
            </div>
          </div>
        </div>

        {/* Map + Missions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel p-1 rounded-3xl overflow-hidden">
            <div className="p-3 pb-0 flex justify-between items-center">
              <span className="text-sm font-medium"><i className="fas fa-map-marked-alt text-red-400"></i> Suivi intervention / hôpitaux</span>
              <span className="text-[10px] text-zinc-500">Position temps réel</span>
            </div>
            <div id="ambulanceDriverMap" className="h-72 md:h-80 w-full rounded-2xl z-0"></div>
          </div>

          <div className="glass-panel p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2"><i className="fas fa-clipboard-list text-red-400"></i> Mes missions</h3>
              <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded-full" id="missionsQueueCount">0</span>
            </div>
            <div id="missionsListContainer" className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              <div className="text-center text-zinc-500 text-sm py-10">Aucune mission assignée.<br />Attendez une alerte centrale.</div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-center text-[11px] text-zinc-500">
              <i className="fas fa-headset"></i> Coordination MIAINA 24/7
            </div>
          </div>
        </div>

        {/* History */}
        <div className="mt-8 glass-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold"><i className="fas fa-history mr-2 text-zinc-400"></i> Dernières interventions effectuées</h3>
            <span className="text-xs text-zinc-500">Archives</span>
          </div>
          <div id="historyLog" className="flex flex-wrap gap-2 text-xs"></div>
        </div>
      </div>
    </div>
  );
};

export default AmbulancePage;