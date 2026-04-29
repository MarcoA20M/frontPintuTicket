import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTicketById, riteTicket } from "../services/ticketService";
import { getHistorialByFolio } from "../services/historial";
import { useNotifications } from "../contexts/NotificationContext";
import "./Styles/TicketDetailChatGlass.css";

const TicketDetailChat = () => {
  const { folio } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState([]);

  const { subscribeNotifications, subscribeTicketTopic } = useNotifications();

  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showModal) {
      setRating(0);
      setRatingComment("");
      setRatingSuccess("");
    }
  }, [showModal]);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [ticketResp, histResp] = await Promise.all([
          getTicketById(folio).catch(() => null),
          getHistorialByFolio(folio).catch(() => null),
        ]);
        if (!mounted) return;
        if (ticketResp) {
          setTicket(ticketResp);
          if (String(ticketResp.estatus || "").toLowerCase() === "cerrado" && !ticketResp.calificacion) {
            setShowModal(true);
          }
        }
        if (histResp) setHistorial(Array.isArray(histResp) ? histResp : [histResp]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (folio) fetchAll();
    return () => { mounted = false; };
  }, [folio]);

  // Suscripción en tiempo real: re-fetch cuando llega una notificación de este ticket
  useEffect(() => {
    if (!folio) return;

    let mounted = true;

    const refresh = async () => {
      try {
        const [ticketResp, histResp] = await Promise.all([
          getTicketById(folio).catch(() => null),
          getHistorialByFolio(folio).catch(() => null),
        ]);
        if (!mounted) return;
        if (ticketResp) {
          setTicket(ticketResp);
          if (String(ticketResp.estatus || "").toLowerCase() === "cerrado" && !ticketResp.calificacion) {
            setShowModal(true);
          }
        }
        if (histResp) setHistorial(Array.isArray(histResp) ? histResp : [histResp]);
      } catch (e) {
        console.debug("TicketDetailChat: error en refresh", e);
      }
    };

    // Escuchar notificaciones generales del contexto y filtrar las de este folio
    const unsubNotif = subscribeNotifications((notif) => {
      if (String(notif.ticketId) === String(folio)) {
        refresh();
      }
    });

    // Suscribirse al topic específico del ticket en STOMP
    let unsubTopic = () => {};
    subscribeTicketTopic(folio).then((cleanup) => {
      if (mounted && typeof cleanup === "function") unsubTopic = cleanup;
    });

    return () => {
      mounted = false;
      unsubNotif();
      unsubTopic();
    };
  }, [folio, subscribeNotifications, subscribeTicketTopic]);

  if (loading) return <div className="ticket-detail-chat-container"><p>Cargando ticket...</p></div>;
  if (!ticket) return <div className="ticket-detail-chat-container"><p>Ticket no encontrado</p></div>;

  const statusClass = ticket.estatus?.toLowerCase().replace(" ", "-");

  const formatMessageText = (text) =>
    String(text || "").split("**").map((part, i) => i % 2 ? <strong key={i}>{part}</strong> : part);

  const messages = [
    { sender: "system", text: `👋 Ticket **${ticket.folio}** cargado correctamente.` },
    { sender: "user", text: `🧾 ${ticket.descripcion}` },
    { sender: "system", text: `👨‍🔧 Asignado a: **${ticket.ingeniero}**` },
  ];

  return (
    <div className="ticket-detail-chat-container">
      
      {/* --- ENCABEZADO CON TÍTULO Y ESTADO --- */}
      <header className="ticket-header-inline">
        <h2 className="ticket-chat-title">
          Historial de Ticket: {ticket.folio}
        </h2>
        <div className={`status-indicator ${statusClass}`}>
          ● {ticket.estatus}
        </div>
      </header>

      <div className="chat-history">
        {messages.map((msg, i) => (
          <div key={i} className={`message-bubble ${msg.sender}`}>
            <div className="message-text">{formatMessageText(msg.text)}</div>
            <span className="timestamp">{new Date(ticket.fechaCreacion).toLocaleString()}</span>
          </div>
        ))}

        {historial.map((h, i) => (
          <div key={i} className={`message-bubble history ${h.usuario ? "user" : "system"}`}>
            <div className="history-card">
              {h.comentarios && <div className="history-item">💬 {h.comentarios}</div>}
              {h.detalle && <div className="history-item">📌 {h.detalle}</div>}
            </div>
            {h.fecha && <span className="timestamp">{new Date(h.fecha).toLocaleString()}</span>}
          </div>
        ))}
      </div>

      {/* ⭐ MODAL DE CALIFICACIÓN */}
      {showModal && (
        <div className="ticket-rating-overlay">
          <div className="ticket-rating-modal">
            <h3 className="ticket-rating-header">Califica la atención</h3>
            <p>Tu ticket <b>{ticket.folio}</b> ha finalizado.</p>
            
            <div className="rating-row" style={{textAlign: 'center'}}>
              <div 
                className="modal-stars" 
                style={{ "--rating": `${(rating / 5) * 100}%` }}
                onClick={(e) => {
                  const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
                  setRating(Math.ceil((x / e.currentTarget.offsetWidth) * 5));
                }}
              />
            </div>

            <textarea 
              className="rating-textarea" 
              placeholder="¿Qué te pareció el servicio?"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
            />

            <div className="rating-actions">
              <button 
                className="btn btn-primary" 
                disabled={ratingLoading || rating === 0}
                onClick={async () => {
                  setRatingLoading(true);
                  await riteTicket({ folio: ticket.folio, calificacion: rating, comentario_usr: ratingComment });
                  setRatingLoading(false);
                  setRatingSuccess("¡Enviado!");
                  setTimeout(() => setShowModal(false), 1500);
                }}
              >
                {ratingLoading ? "Enviando..." : "Enviar"}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cerrar</button>
            </div>
            {ratingSuccess && <div className="rating-success">{ratingSuccess}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailChat;