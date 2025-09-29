import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Sidebar2 from './components/SidebarIngeener';
import Header from './components/Header';
import MainContent from './components/MainContent';
import TicketDetailChat from './components/TicketDetailChat';
import TicketList from './components/TicketList';
import Perfil from './components/PerfilScreen';
import Ingeniero from './components/Engineer';
import Admin from './components/Admin';
import Trac from './components/Tracking';
import TrackUsr from './components/TrackingUser';
import Table  from './components/TicketTable'
import './components/App.css';
import { NotificationProvider } from './contexts/NotificationContext';

function getUserRoleFromToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch {
    return null;
  }
}

function AppWrapper() {
  return (
    <NotificationProvider>
      <Router>
        <App />
      </Router>
    </NotificationProvider>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);

    const usuarioGuardado = localStorage.getItem('usuario');
    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);
      const decodedRole = getUserRoleFromToken(usuario.token);
      setRole(decodedRole);

      // redirigir según rol
      if (decodedRole === 'INGENIERO') {
        navigate('/ingeniero');
      } else if (decodedRole === 'USUARIO') {
        navigate('/');
      } 
    }
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="container">
      {/* Sidebar dinámico */}
      {role === 'INGENIERO' ? <Sidebar2 /> : <Sidebar />}

      <div className="main-content-wrapper">
        <Header />
        <Routes>
          <Route path="/" element={<MainContent />} />
          <Route path="/ingeniero" element={<Ingeniero />} />
          <Route path="/all-tickets" element={<TicketList />} />
          <Route path="/ticket/:folio" element={<TicketDetailChat />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/seguimiento" element={<Trac />} />
          <Route path="/seguimientoUsr" element={<TrackUsr />} />
          <Route path="/tabla" element={<Table />} />
        </Routes>
      </div>
    </div>
  );
}

export default AppWrapper;
