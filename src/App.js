import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import MainContent from './components/MainContent';
import TicketDetailChat from './components/TicketDetailChat';
import TicketList from './components/TicketList';
import './components/App.css';
// 1. Importa el proveedor de notificaciones
import { NotificationProvider } from './contexts/NotificationContext'; 

function App() {
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [currentView, setCurrentView] = useState('main');

    const handleTicketClick = (ticket) => {
        setSelectedTicket(ticket);
        setCurrentView('ticketDetail');
    };

    const handleViewChange = (viewName) => {
        setCurrentView(viewName);
        setSelectedTicket(null);
    };

    const renderMainContent = () => {
        if (currentView === 'ticketDetail' && selectedTicket) {
            return <TicketDetailChat ticket={selectedTicket} />;
        }
        if (currentView === 'allTickets') {
            return <TicketList />;
        }
        // Asumiendo que MainContent es donde se crea el ticket,
        // o que renderiza un componente hijo que lo hace,
        // este componente y sus hijos ahora tendrán acceso al contexto de notificaciones.
        return <MainContent selectedTicket={selectedTicket} />;
    };

    return (
        // 2. Envuelve toda la aplicación con el NotificationProvider
        <NotificationProvider>
            <div className="container">
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
        </NotificationProvider>
    );
}

export default App;