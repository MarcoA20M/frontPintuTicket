// src/App.js
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';
import TicketDetailChat from './components/TicketDetailChat';
import TicketList from './components/TicketList'; // Importa el nuevo componente
import './components/App.css';

function App() {
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [currentView, setCurrentView] = useState('main'); // Nuevo estado para la vista

    // Función para manejar el clic en un ticket específico
    const handleTicketClick = (ticket) => {
        setSelectedTicket(ticket);
        setCurrentView('ticketDetail'); // Cambia la vista a los detalles del ticket
    };

    // Función para cambiar la vista general (usada por "Historial de tickets")
    const handleViewChange = (viewName) => {
        setCurrentView(viewName);
        setSelectedTicket(null); // Limpiamos el ticket seleccionado al cambiar de vista
    };

    const renderMainContent = () => {
        if (currentView === 'ticketDetail' && selectedTicket) {
            return <TicketDetailChat ticket={selectedTicket} />;
        }
        if (currentView === 'allTickets') {
            return <TicketList />;
        }
        return <MainContent selectedTicket={selectedTicket} />;
    };

    return (
        <div className="container">
            {/* Le pasamos las nuevas props a Sidebar */}
            <Sidebar 
                onTicketClick={handleTicketClick} 
                onViewChange={handleViewChange}
                selectedTicket={selectedTicket}
            /> 
            
            <div className="main-content-wrapper">
                <Header />
                {renderMainContent()}
            </div>
        </div>
    );
}

export default App;