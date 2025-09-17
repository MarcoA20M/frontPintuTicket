import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';
import TicketDetailChat from './components/TicketDetailChat';
import TicketList from './components/TicketList';
import Perfil from './components/PerfilScreen';
import './components/App.css';

// Proveedor de notificaciones
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="container">
          <Sidebar />

          <div className="main-content-wrapper">
            <Header />
            <Routes>
              {/* Pantalla principal para crear ticket */}
              <Route path="/" element={<MainContent />} />

              {/* Lista de todos los tickets */}
              <Route path="/all-tickets" element={<TicketList />} />

              {/* Detalle de un ticket por folio */}
              <Route path="/ticket/:folio" element={<TicketDetailChat />} />

              {/* Ruta para crear nuevo ticket */}
              <Route path="/new-ticket" element={<MainContent />} />

              {/* Perfil del usuario */}
              <Route path="/perfil" element={<Perfil />} />
            </Routes>
          </div>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;
