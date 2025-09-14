// src/components/TicketList.js
import React, { useState, useEffect } from 'react';
import { getAllTickets } from '../services/ticketService';

const TicketList = () => {
    const [allTickets, setAllTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllTickets = async () => {
            try {
                const data = await getAllTickets();
                setAllTickets(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllTickets();
    }, []);

    if (isLoading) {
        return <div>Cargando historial de tickets...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="ticket-list-container">
            <h2>Historial de Tickets</h2>
            {allTickets.length > 0 ? (
                <ul>
                    {allTickets.map(ticket => (
                        <li key={ticket.folio}>
                            Folio: {ticket.folio} - Descripción: {ticket.descripcion} - Estatus: {ticket.estatus}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No hay tickets en el historial.</p>
            )}
        </div>
    );
};

export default TicketList;