import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUsuarioById } from "../services/usuarioService";
import { getTicketById } from "../services/ticketService";

const TicketDetailChat = () => {
  const { folio } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const usuarioGuardado = localStorage.getItem('usuario');
  const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const usuarioId = usuarioObj?.id ?? usuarioObj?.userId ?? usuarioObj?.idUsuario ?? usuarioObj?.id_usuario ?? null;

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        // intentar endpoint directo por folio primero
        try {
          const t = await getTicketById(folio);
          if (t) {
            setTicket(t);
            setLoading(false);
            return;
          }
        } catch (err) {
          // no encontrado por folio, intentar por usuario
        }

        if (!usuarioId) {
          setTicket(null);
          setLoading(false);
          return;
        }

        const usuarioData = await getUsuarioById(usuarioId);
        const tickets = usuarioData?.tickets || usuarioData?.misTickets || usuarioData?.ticketsUsuario || [];
        const foundTicket = (tickets || []).find(t => String(t.folio) === String(folio));
        setTicket(foundTicket || null);
        setLoading(false);
      } catch (error) {
        console.error("Error al cargar el ticket:", error);
      }
    };
    fetchTicket();
  }, [folio, usuarioId]);

  if (loading) return <p>Cargando ticket...</p>;
  if (!ticket) return <p>Ticket no encontrado</p>;

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
