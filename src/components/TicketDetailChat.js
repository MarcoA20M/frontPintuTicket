

import React from 'react';

const TicketDetailChat = ({ ticket }) => {
    
    const messages = [
        { sender: 'system', text: `¡Hola! Aquí está el ticket que creaste con el folio **${ticket.folio}**.` },
        { sender: 'user', text: ticket.descripcion },
        { sender: 'system', text: `El ticket ha sido asignado al ingeniero **${ticket.ingeniero}** y el estatus actual es **${ticket.estatus}**.` },
    ];

    if (ticket.solucion && ticket.estatus === 'Cerrado') {
        messages.push({ sender: 'system', text: `El problema ha sido resuelto. Solución: "${ticket.solucion}"` });
    }

    const formatMessageText = (text) => {
       
        return text.split('**').map((part, index) => {
            if (index % 2 === 1) {
                return <strong key={index}>{part}</strong>;
            }
            return part;
        });
    };

    return (
        <div className="ticket-detail-chat-container">
            <h2 className="ticket-chat-title">Ticket Folio: {ticket.folio}</h2>
            <div className="chat-history">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-bubble ${msg.sender}`}>
                        <p className="message-text">
                            {formatMessageText(msg.text)}
                        </p>
                        <span className="timestamp">{new Date(ticket.fechaCreacion).toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TicketDetailChat;