import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTicketsByUsuario } from "../services/ticketService";

const TicketDetailChat = () => {
  const { folio } = useParams();
  const [ticket, setTicket] = useState(null);
  const usuario = "Pedro"; // o sacarlo del contexto/auth

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const tickets = await getTicketsByUsuario(usuario);
        const foundTicket = tickets.find(t => t.folio.toString() === folio);
        setTicket(foundTicket);
      } catch (error) {
        console.error("Error al cargar el ticket:", error);
      }
    };
    fetchTicket();
  }, [folio, usuario]);

  if (!ticket) return <p>Cargando ticket...</p>;

  const messages = [
    { sender: 'system', text: `¡Hola! Aquí está el ticket que creaste con el folio **${ticket.folio}**.` },
    { sender: 'user', text: ticket.descripcion },
    { sender: 'system', text: `El ticket ha sido asignado al ingeniero **${ticket.ingeniero}** y el estatus actual es **${ticket.estatus}**.` },
  ];

  if (ticket.solucion && ticket.estatus === 'Cerrado') {
    messages.push({ sender: 'system', text: `El problema ha sido resuelto. Solución: "${ticket.solucion}"` });
  }

  const formatMessageText = (text) => {
    return text.split('**').map((part, index) => index % 2 === 1 ? <strong key={index}>{part}</strong> : part);
  };

  return (
    <div className="ticket-detail-chat-container">
      <h2 className="ticket-chat-title">Ticket Folio: {ticket.folio}</h2>
      <div className="chat-history">
        {messages.map((msg, index) => (
          <div key={index} className={`message-bubble ${msg.sender}`}>
            <p className="message-text">{formatMessageText(msg.text)}</p>
            <span className="timestamp">{new Date(ticket.fechaCreacion).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketDetailChat;
