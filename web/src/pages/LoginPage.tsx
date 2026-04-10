import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContexte';
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';
import Loading from '../components/common/Loading';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toasts, showToast, removeToast } = useToast();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loginRole, setLoginRole] = useState<'patient' | 'ambulancier' | 'pharmacien'>('patient');
  const [registerRole, setRegisterRole] = useState<'patient' | 'ambulancier' | 'pharmacien'>('patient');
  
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  const [regNom, setRegNom] = useState('');
  const [regPrenom, setRegPrenom] = useState('');
  const [regTelephone, setRegTelephone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regDateNaissance, setRegDateNaissance] = useState('');
  const [regSexe, setRegSexe] = useState('');
  const [regAdresse, setRegAdresse] = useState('');
  const [regGroupeSanguin, setRegGroupeSanguin] = useState('');
  const [regAllergies, setRegAllergies] = useState('');
  const [regContactUrgence, setRegContactUrgence] = useState('');
  
  const [ambNom, setAmbNom] = useState('');
  const [ambTelephone, setAmbTelephone] = useState('');
  const [ambMatricule, setAmbMatricule] = useState('');
  const [ambZone, setAmbZone] = useState('Tana Nord');
  
  const [pharmNomPharmacie, setPharmNomPharmacie] = useState('');
  const [pharmResponsable, setPharmResponsable] = useState('');
  const [pharmTelephone, setPharmTelephone] = useState('');
  const [pharmAdresse, setPharmAdresse] = useState('');
  const [pharmZoneCouverture, setPharmZoneCouverture] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginIdentifier || !loginPassword) {
      showToast('Veuillez remplir tous les champs', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await login(loginIdentifier, loginPassword);
      showToast('Connexion réussie !', 'success');
      
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'AMBULANCIER') {
          navigate('/ambulance');
        } else if (user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/patient');
        }
      }, 1000);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Erreur de connexion', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!regPassword || !regConfirmPassword) {
      showToast('Veuillez saisir un mot de passe', 'error');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      showToast('Les mots de passe ne correspondent pas', 'error');
      return;
    }
    if (regPassword.length < 6) {
      showToast('Le mot de passe doit contenir au moins 6 caractères', 'error');
      return;
    }
    
    let userData: any = {
      mot_de_passe: regPassword,
      email: regEmail || undefined,
    };
    
    if (registerRole === 'patient') {
      if (!regNom || !regPrenom || !regTelephone) {
        showToast('Veuillez remplir les champs obligatoires', 'error');
        return;
      }
      userData = {
        ...userData,
        nom: regNom,
        prenom: regPrenom,
        telephone: regTelephone,
        date_naissance: regDateNaissance || undefined,
        sexe: regSexe || undefined,
        adresse: regAdresse || undefined,
        groupe_sanguin: regGroupeSanguin || undefined,
        allergies: regAllergies || undefined,
        contact_urgence: regContactUrgence || undefined,
      };
    } else if (registerRole === 'ambulancier') {
      if (!ambNom || !ambTelephone) {
        showToast('Veuillez remplir nom et téléphone', 'error');
        return;
      }
      userData = {
        ...userData,
        nom: ambNom,
        telephone: ambTelephone,
        matricule: ambMatricule || undefined,
        zone_couverture: ambZone,
      };
    } else {
      if (!pharmNomPharmacie || !pharmResponsable || !pharmTelephone) {
        showToast('Veuillez remplir les champs obligatoires', 'error');
        return;
      }
      userData = {
        ...userData,
        nom_pharmacie: pharmNomPharmacie,
        responsable: pharmResponsable,
        telephone: pharmTelephone,
        adresse: pharmAdresse || undefined,
        zone_couverture: pharmZoneCouverture || undefined,
      };
    }
    
    setLoading(true);
    try {
      await register(userData, registerRole);
      showToast('Inscription réussie ! Bienvenue sur MIAINA', 'success');
      
      setTimeout(() => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.role === 'AMBULANCIER') {
          navigate('/ambulance');
        } else if (user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/patient');
        }
      }, 1000);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Erreur lors de l\'inscription', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-grid min-h-screen">
      {loading && <Loading />}
      
      <div className="fixed bottom-6 right-6 z-50">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>

      <div className="fixed top-6 right-6 z-50">
        <button onClick={toggleTheme} className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center">
          <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} text-zinc-400 text-sm`}></i>
        </button>
      </div>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-danger/5 rounded-full blur-3xl floating-element"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-info/5 rounded-full blur-3xl floating-element-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-warn/3 rounded-full blur-3xl"></div>
        <div className="absolute top-[10%] right-[5%] w-2 h-2 bg-danger rounded-full opacity-40"></div>
        <div className="absolute bottom-[20%] left-[8%] w-3 h-3 bg-info rounded-full opacity-40"></div>
        <div className="absolute top-[30%] left-[15%] w-1.5 h-1.5 bg-warn rounded-full opacity-60"></div>
        <div className="absolute bottom-[40%] right-[12%] w-2.5 h-2.5 bg-success rounded-full opacity-50"></div>
      </div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-danger to-orange-500 flex items-center justify-center shadow-2xl floating-element">
                <i className="fas fa-heartbeat text-white text-2xl"></i>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">MIAINA</h1>
                <p className="text-xs text-zinc-500 tracking-wide">SYSTÈME DE SANTÉ INTÉGRÉ</p>
              </div>
            </div>
            <p className="text-zinc-400 text-sm max-w-md mx-auto">Plateforme connectée pour patients, ambulanciers et professionnels de santé</p>
          </div>

          <div className="flex justify-center gap-3 mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 ${
                isLogin 
                  ? 'bg-danger text-white shadow-lg shadow-danger/25' 
                  : 'glass-morphism text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className="fas fa-sign-in-alt mr-2"></i>Connexion
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`px-8 py-3 rounded-2xl font-bold transition-all duration-300 ${
                !isLogin 
                  ? 'bg-danger text-white shadow-lg shadow-danger/25' 
                  : 'glass-morphism text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className="fas fa-user-plus mr-2"></i>Inscription
            </button>
          </div>

          {isLogin ? (
            <div className="max-w-md mx-auto card-glow p-1">
              <div className="bg-card rounded-[28px] p-6 md:p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-lock text-danger text-2xl"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Bienvenue</h2>
                  <p className="text-zinc-500 text-sm mt-1">Connectez-vous à votre espace MIAINA</p>
                </div>
                
              
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">Téléphone ou email</label>
                    <div className="relative">
                      <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="ex: +261 34 12 345 67"
                        className="input-modern w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder:text-zinc-600 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-1.5 block">Mot de passe</label>
                    <div className="relative">
                      <i className="fas fa-key absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm"></i>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="input-modern w-full pl-11 pr-12 py-3 rounded-xl text-white placeholder:text-zinc-600 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        <i className={`fas ${showLoginPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-border bg-dark accent-danger" />
                      <span className="text-xs text-zinc-500">Se souvenir de moi</span>
                    </label>
                    <a href="#" className="text-xs text-danger hover:text-danger/80 transition">Mot de passe oublié ?</a>
                  </div>
                  <button type="submit" className="btn-gradient w-full py-3.5 rounded-xl font-bold text-white text-base mt-4">
                    <i className="fas fa-arrow-right-to-bracket mr-2"></i>Se connecter
                  </button>
                </form>
                
                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                  <p className="text-xs text-zinc-500">
                    <i className="fas fa-shield-alt text-danger/60 mr-1"></i>
                    Sécurisé par MIAINA Health System
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-md mx-auto card-glow p-1">
              <div className="bg-card rounded-[28px] p-6 md:p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-user-plus text-success text-2xl"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Créer un compte</h2>
                  <p className="text-zinc-500 text-sm mt-1">Rejoignez la communauté MIAINA</p>
                </div>


                <form onSubmit={handleRegister} className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {registerRole === 'patient' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><input type="text" value={regNom} onChange={(e) => setRegNom(e.target.value)} placeholder="Nom" className="input-modern w-full px-4 py-3 rounded-xl text-white placeholder:text-zinc-600" /></div>
                        <div><input type="text" value={regPrenom} onChange={(e) => setRegPrenom(e.target.value)} placeholder="Prénom" className="input-modern w-full px-4 py-3 rounded-xl text-white placeholder:text-zinc-600" /></div>
                      </div>
                      <input type="tel" value={regTelephone} onChange={(e) => setRegTelephone(e.target.value)} placeholder="Téléphone" className="input-modern w-full px-4 py-3 rounded-xl text-white placeholder:text-zinc-600" />
                      <input type="date" value={regDateNaissance} onChange={(e) => setRegDateNaissance(e.target.value)} className="input-modern w-full px-4 py-3 rounded-xl text-white" />
                      <select value={regSexe} onChange={(e) => setRegSexe(e.target.value)} className="input-modern w-full px-4 py-3 rounded-xl text-white">
                        <option value="" disabled>Sexe</option>
                        <option value="MASCULIN">Masculin</option>
                        <option value="FEMININ">Féminin</option>
                      </select>
                      <input type="text" value={regAdresse} onChange={(e) => setRegAdresse(e.target.value)} placeholder="Adresse" className="input-modern w-full px-4 py-3 rounded-xl text-white placeholder:text-zinc-600" />
                      <select value={regGroupeSanguin} onChange={(e) => setRegGroupeSanguin(e.target.value)} className="input-modern w-full px-4 py-3 rounded-xl text-white">
                        <option value="" disabled>Groupe sanguin</option>
                        <option value="A+">A+</option><option value="A-">A-</option>
                        <option value="B+">B+</option><option value="B-">B-</option>
                        <option value="O+">O+</option><option value="O-">O-</option>
                        <option value="AB+">AB+</option><option value="AB-">AB-</option>
                      </select>
                      <textarea value={regAllergies} onChange={(e) => setRegAllergies(e.target.value)} rows={2} placeholder="Allergies connues (optionnel)" className="input-modern w-full px-4 py-3 rounded-xl text-white placeholder:text-zinc-600"></textarea>
                      <input type="text" value={regContactUrgence} onChange={(e) => setRegContactUrgence(e.target.value)} placeholder="Contact d'urgence" className="input-modern w-full px-4 py-3 rounded-xl text-white placeholder:text-zinc-600" />
                    </div>
                  )}

                  {registerRole === 'ambulancier' && (
                    <div className="space-y-3">
                      <input type="text" value={ambNom} onChange={(e) => setAmbNom(e.target.value)} placeholder="Nom complet" className="input-modern w-full px-4 py-3 rounded-xl text-white" />
                      <input type="tel" value={ambTelephone} onChange={(e) => setAmbTelephone(e.target.value)} placeholder="Téléphone" className="input-modern w-full px-4 py-3 rounded-xl text-white" />
                      <input type="text" value={ambMatricule} onChange={(e) => setAmbMatricule(e.target.value)} placeholder="Matricule / ID Professionnel" className="input-modern w-full px-4 py-3 rounded-xl text-white" />
                      <select value={ambZone} onChange={(e) => setAmbZone(e.target.value)} className="input-modern w-full px-4 py-3 rounded-xl text-white">
                        <option value="Tana Nord">Zone Tana Nord</option>
                        <option value="Tana Sud">Zone Tana Sud</option>
                        <option value="Tana Est">Zone Tana Est</option>
                        <option value="Tana Ouest">Zone Tana Ouest</option>
                      </select>
                    </div>
                  )}

                  {registerRole === 'pharmacien' && (
                    <div className="space-y-3">
                      <input type="text" value={pharmNomPharmacie} onChange={(e) => setPharmNomPharmacie(e.target.value)} placeholder="Nom de la pharmacie" className="input-modern w-full px-4 py-3 rounded-xl text-white" />
                      <input type="text" value={pharmResponsable} onChange={(e) => setPharmResponsable(e.target.value)} placeholder="Nom du responsable" className="input-modern w-full px-4 py-3 rounded-xl text-white" />
                      <input type="tel" value={pharmTelephone} onChange={(e) => setPharmTelephone(e.target.value)} placeholder="Téléphone" className="input-modern w-full px-4 py-3 rounded-xl text-white" />
                      <input type="text" value={pharmAdresse} onChange={(e) => setPharmAdresse(e.target.value)} placeholder="Adresse de la pharmacie" className="input-modern w-full px-4 py-3 rounded-xl text-white" />
                      <input type="text" value={pharmZoneCouverture} onChange={(e) => setPharmZoneCouverture(e.target.value)} placeholder="Zone de couverture" className="input-modern w-full px-4 py-3 rounded-xl text-white" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Email (optionnel)" className="input-modern w-full px-4 py-3 rounded-xl text-white placeholder:text-zinc-600" />
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mot de passe"
                        className="input-modern w-full px-4 py-3 rounded-xl text-white placeholder:text-zinc-600 pr-10"
                      />
                      <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        <i className={`fas ${showRegPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Confirmer le mot de passe"
                        className="input-modern w-full px-4 py-3 rounded-xl text-white placeholder:text-zinc-600 pr-10"
                      />
                      <button type="button" onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                        <i className={`fas ${showRegConfirmPassword ? 'fa-eye' : 'fa-eye-slash'}`}></i>
                      </button>
                    </div>
                  </div>

                  <button type="submit" className="btn-gradient w-full py-3.5 rounded-xl font-bold text-white text-base mt-5">
                    <i className="fas fa-user-check mr-2"></i>S'inscrire
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-[11px] text-zinc-500">
                    En créant un compte, vous acceptez nos <a href="#" className="text-danger">Conditions d'utilisation</a>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;