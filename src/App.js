import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login'; 
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';
import TicketDetailChat from './components/TicketDetailChat';
import TicketList from './components/TicketList';
import Perfil from './components/PerfilScreen';
import './components/App.css';
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };
  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />; 
  }

  return (
    <NotificationProvider>
      <Router>
        <div className="container">
          <Sidebar />

          <div className="main-content-wrapper">
            <Header />
            <Routes>
              <Route path="/" element={<MainContent />} />
              <Route path="/all-tickets" element={<TicketList />} />
              <Route path="/ticket/:folio" element={<TicketDetailChat />} />
              <Route path="/new-ticket" element={<MainContent />} />
              <Route path="/perfil" element={<Perfil />} />
            </Routes>
          </div>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;