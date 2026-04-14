import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTicketById } from "../services/ticketService";
import { getHistorialByFolio } from "../services/historial";
import { useNotifications } from "../contexts/NotificationContext";
import "./Styles/TicketDetailChatGlass.css";
import { riteTicket } from "../services/ticketService";

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

  // =========================
  // 🔥 RESET DEL MODAL (FIX)
  // =========================
  useEffect(() => {
    if (showModal) {
      setRating(0);
      setRatingComment("");
      setRatingSuccess("");
    }
  }, [showModal]);

  // =========================
  // CARGA
  // =========================
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

          if (
            String(ticketResp.estatus || "").toLowerCase() === "cerrado" &&
            !ticketResp.calificacion
          ) {
            setShowModal(true);
          }
        }

        if (histResp) {
          setHistorial(Array.isArray(histResp) ? histResp : [histResp]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (folio) fetchAll();

    return () => {
      mounted = false;
    };
  }, [folio]);

  // =========================
  // NOTIFICACIONES
  // =========================
  useEffect(() => {
    if (!subscribeNotifications) return;

    const unsub = subscribeNotifications(() => {
      getHistorialByFolio(folio).then(setHistorial);

      getTicketById(folio).then((t) => {
        setTicket(t);

        if (t?.estatus?.toLowerCase() === "cerrado" && !t.calificacion) {
          setShowModal(true);
        }
      });
    });

    return () => unsub?.();
  }, [folio, subscribeNotifications]);

  useEffect(() => {
    let cleanup;

    const run = async () => {
      if (subscribeTicketTopic) {
        cleanup = await subscribeTicketTopic(folio);
      }
    };

    run();

    return () => cleanup?.();
  }, [folio, subscribeTicketTopic]);

  if (loading) return <p>Cargando ticket...</p>;
  if (!ticket) return <p>Ticket no encontrado</p>;

  // =========================
  // MENSAJES
  // =========================
  const formatMessageText = (text) =>
    String(text || "")
      .split("**")
      .map((part, i) =>
        i % 2 ? <strong key={i}>{part}</strong> : part
      );

  const messages = [
    {
      sender: "system",
      text: `👋 Ticket **${ticket.folio}** cargado correctamente.`,
    },
    {
      sender: "user",
      text: `🧾 ${ticket.descripcion}`,
    },
    {
      sender: "system",
      text: `👨‍🔧 Asignado a: **${ticket.ingeniero}**
📌 Estado: **${ticket.estatus}**`,
    },
  ];

  if (ticket.solucion && ticket.estatus === "Cerrado") {
    messages.push({
      sender: "system",
      text: `🎉 Ticket resuelto\n\n🛠️ ${ticket.solucion}`,
    });
  }

  // =========================
  // HISTORIAL (SIN CAMBIOS)
  // =========================
  const formatHistorialText = (h) => {
    if (!h) return [];

    const items = [];

    if (h.comentarios) items.push({ icon: "💬", text: h.comentarios });
    if (h.detalle) items.push({ icon: "📌", text: h.detalle });
    if (h.descripcion) items.push({ icon: "📝", text: h.descripcion });
    if (h.change) items.push({ icon: "🔄", text: h.change });

    const cambios = h.cambios || h.changes;

    if (Array.isArray(cambios)) {
      cambios.forEach((c) => {
        const campo = c.field || c.campo;
        if (!campo) return;

        items.push({
          icon: "🔧",
          text: `${campo}: ${c.old ?? "Sin asignar"} → ${c.new ?? "Sin asignar"}`,
        });
      });
    }

    return items.length
      ? items
      : [{ icon: "ℹ️", text: JSON.stringify(h) }];
  };

  const statusClass = ticket.estatus
    ?.toLowerCase()
    .replace(" ", "-");

  return (
    <div className="ticket-detail-chat-container">

      <h2 className="ticket-chat-title">
        Historial de Ticket: {ticket.folio}
      </h2>

      <div className={`status-indicator ${statusClass}`}>
        ● {ticket.estatus}
      </div>

      <div className="chat-history">

        {messages.map((msg, i) => (
          <div key={i} className={`message-bubble ${msg.sender}`}>
            <div className="message-text">
              {formatMessageText(msg.text)}
            </div>

            <span className="timestamp">
              {new Date(ticket.fechaCreacion).toLocaleString()}
            </span>
          </div>
        ))}

        {historial.map((h, i) => {
          const items = formatHistorialText(h);

          return (
            <div
              key={i}
              className={`message-bubble history ${
                h.usuario ? "user" : "system"
              }`}
            >
              <div className="history-card">
                {items.map((it, idx) => (
                  <div key={idx} className="history-item">
                    <span className="history-icon">{it.icon}</span>
                    <span className="history-text">{it.text}</span>
                  </div>
                ))}
              </div>

              {h.fecha && (
                <span className="timestamp">
                  {new Date(h.fecha).toLocaleString()}
                </span>
              )}
            </div>
          );
        })}

      </div>

      {/* ⭐ MODAL */}
      {showModal && (
        <div className="ticket-rating-overlay">
          <div className="ticket-rating-modal">

            <h3 className="ticket-rating-header">
              Califica la atención
            </h3>

            <p>
              Tu ticket <b>{ticket.folio}</b> ha finalizado.
            </p>

            <div className="rating-row">
              <label className="rating-label">Puntuación</label>

              <div
                className="modal-stars"
                style={{ "--rating": `${(rating / 5) * 100}%` }}
                onClick={(e) => {
                  const x =
                    e.clientX -
                    e.currentTarget.getBoundingClientRect().left;

                  setRating(Math.ceil((x / e.currentTarget.offsetWidth) * 5));
                }}
              />

              <select
                className="rating-select"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                <option value={0}>Selecciona</option>
                <option value={1}>1 - Malo</option>
                <option value={2}>2 - Regular</option>
                <option value={3}>3 - Bueno</option>
                <option value={4}>4 - Muy bueno</option>
                <option value={5}>5 - Excelente</option>
              </select>
            </div>

            <textarea
              className="rating-textarea"
              placeholder="Escribe tu comentario..."
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
            />

            <div className="rating-actions">

              <button
                className="btn btn-primary"
                disabled={ratingLoading || rating === 0}
                onClick={async () => {
                  setRatingLoading(true);

                  await riteTicket({
                    folio: ticket.folio,
                    calificacion: rating,
                    comentario_usr: ratingComment,
                  });

                  setRatingLoading(false);
                  setRatingSuccess("¡Gracias por tu opinión!");

                  setTimeout(() => {
                    const modal = document.querySelector(".ticket-rating-modal");
                    if (modal) modal.classList.add("closing");

                    setTimeout(() => {
                      setShowModal(false);
                    }, 300);
                  }, 1000);
                }}
              >
                {ratingLoading ? "Enviando..." : "Enviar"}
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cerrar
              </button>

            </div>

            {ratingSuccess && (
              <div className="rating-success">
                {ratingSuccess}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default TicketDetailChat;