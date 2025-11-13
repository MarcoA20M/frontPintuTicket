/*eslint-disable*/
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Sidebar2 from './components/SidebarIngeener';
import SidebarAdmin from './components/SidebarAdmin'; 
import Header from './components/Header';
import MainContent from './components/MainContent';
import TicketDetailChat from './components/TicketDetailChat';
import TicketList from './components/TicketList';
import Perfil from './components/PerfilScreen';
import Ingeniero from './components/Engineer';
import Admin from './components/Admin';
import Trac from './components/Tracking';
import TrackUsr from './components/TrackingUser';
import Table from './components/TicketTable';
import TrakingEng from './components/TrackingEngineer';
import './components/App.css';
import { NotificationProvider } from './contexts/NotificationContext';
import Estadisticas from './components/Estadisticas';

/* =======================
   Función para obtener el rol del usuario desde el token
   ======================= */
function getUserRoleFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch (error) {
    console.error("Error decodificando el token:", error);
    return null;
  }
}

/* =======================
   Aplicación principal (Contiene useNavigate)
   ======================= */
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  // Función para comprobar el estado de login y rol
  const checkLoginStatus = () => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      const token = usuario.accessToken || usuario.token;
      const decodedRole = getUserRoleFromToken(token);
      
      if (token && decodedRole) {
        setIsLoggedIn(true);
        setRole(decodedRole);
        return { isLoggedIn: true, role: decodedRole };
      }
    }
    setIsLoggedIn(false); //para descartivar el login
    setRole(null);
    return { isLoggedIn: false, role: null };
  };

  // ✅ Solo se ejecuta al montar la app, no cada cambio de ruta
  useEffect(() => {
    const { isLoggedIn: isLogged, role: userRole } = checkLoginStatus();

    if (isLogged) {
      console.log("Usuario logueado. Rol detectado:", userRole);
      if (userRole === 'ADMINISTRADOR') {
        navigate('/admin/dashboard', { replace: true });
      } else if (userRole === 'INGENIERO') {
        navigate('/ingeniero', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } else {
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    }
  }, []); // 👈 ← aquí solo corre una vez

  if (!isLoggedIn) {
    return <div className="loading-or-redirecting">Cargando o redirigiendo al Login...</div>;
  }

  // Sidebar dinámico según rol
  const renderSidebar = () => {
    switch (role) {
      case 'ADMINISTRADOR':
        return <SidebarAdmin />;
      case 'INGENIERO':
        return <Sidebar2 />;
      default:
        return <Sidebar />;
    }
  };

  /* =======================
     Render principal después del login
     ======================= */
  return (
    <div className="container">
      {renderSidebar()}

      <div className="main-content-wrapper" style={{ marginLeft: '100px' , marginRight: '-75px' }}>
        <Header />
        <Routes>
          {/* Rutas generales */}
          <Route path="/" element={<MainContent />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/all-tickets" element={<TicketList />} />
          <Route path="/ticket/:folio" element={<TicketDetailChat />} />

          {/* Ingeniero */}
          <Route path="/ingeniero" element={<Ingeniero />} />
          <Route path="/ticketsIngeniero" element={<TrakingEng />} />

          {/* 🔹 Rutas Admin */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<Admin />} />
          <Route path="/admin/tickets" element={<Table />} />
          <Route path="/admin/usuarios" element={<Admin />} />
          <Route path="/admin/crear-ticket" element={<MainContent />} />
          <Route path="/admin/configuracion" element={<Admin />} />
          <Route path="/admin/esta" element={<Estadisticas />} />

          {/* Otras */}
          <Route path="/tabla" element={<Table />} />
          <Route path="/seguimiento" element={<Trac />} />
          <Route path="/seguimientoUsr" element={<TrackUsr />} />
        </Routes>
      </div>
    </div>
  );
}

/* =======================
   Login Wrapper
   ======================= */
function LoginWrapper() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      const token = usuario.accessToken || usuario.token;
      const decodedRole = getUserRoleFromToken(token);

      if (decodedRole === 'ADMINISTRADOR') {
        navigate('/admin/dashboard', { replace: true });
      } else if (decodedRole === 'INGENIERO') {
        navigate('/ingeniero', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  return <Login onLoginSuccess={handleLoginSuccess} />;
}

/* =======================
   Wrapper principal
   ======================= */
function AppWrapper() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginWrapper />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default AppWrapper;
