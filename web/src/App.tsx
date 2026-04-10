import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import PatientPage from './pages/PatientPage';
import AmbulancePage from './pages/AmbulancePage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import './styles/globals.css';
import { ThemeProvider } from './contexts/ThemeContexte';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/patient" element={
            <ProtectedRoute allowedRoles={['PATIENT']}>
              <PatientPage />
            </ProtectedRoute>
          } />
          <Route path="/ambulance" element={
            <ProtectedRoute allowedRoles={['AMBULANCIER']}>
              <AmbulancePage />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;