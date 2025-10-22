import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUsuarioById } from "../services/usuarioService";
import { getTicketById } from "../services/ticketService";
import { getHistorialByFolio } from "../services/historial";

const TicketDetailChat = () => {
  const { folio } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState([]);
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
            // cargar historial asociado al folio
            try {
              const h = await getHistorialByFolio(folio);
              setHistorial(Array.isArray(h) ? h : (h ? [h] : []));
            } catch (err) {
              console.warn('No se pudo cargar historial por folio:', err);
              setHistorial([]);
            }
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
        // si encontramos el ticket, cargar historial por folio
        if (foundTicket) {
          try {
            const h2 = await getHistorialByFolio(folio);
            setHistorial(Array.isArray(h2) ? h2 : (h2 ? [h2] : []));
          } catch (err) {
            console.warn('No se pudo cargar historial por folio (buscando en usuario):', err);
            setHistorial([]);
          }
        } else {
          setHistorial([]);
        }
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

  const formatHistorialText = (h) => {
    if (h == null) return '';
    if (typeof h === 'string') return h;

    // Prefer explicit text fields
    if (h.detalle && typeof h.detalle === 'string') return h.detalle;
    if (h.descripcion && typeof h.descripcion === 'string') return h.descripcion;
    if (h.change && typeof h.change === 'string') return h.change;
    if (h.text && typeof h.text === 'string') return h.text;

    // If there's an array of changes, try to make a readable list
    const changesArr = h.changes || h.cambios || h.diffs || h.modificaciones;
    if (Array.isArray(changesArr) && changesArr.length) {
      return changesArr.map(item => {
        if (typeof item === 'string') return `- ${item}`;
        if (item.field || item.campo) return `${item.field ?? item.campo}: ${item.old ?? ''} → ${item.new ?? ''}`;
        // generic object
        try { return `- ${JSON.stringify(item)}`; } catch (e) { return `- ${String(item)}`; }
      }).join('\n');
    }

    // If there are before/after objects, print differences
    if (h.before && h.after && typeof h.before === 'object' && typeof h.after === 'object') {
      const diffs = [];
      const keys = Array.from(new Set([...Object.keys(h.before), ...Object.keys(h.after)]));
      for (const k of keys) {
        const a = h.before[k];
        const b = h.after[k];
        if (JSON.stringify(a) !== JSON.stringify(b)) {
          diffs.push(`${k}: ${String(a ?? '')} → ${String(b ?? '')}`);
        }
      }
      if (diffs.length) return diffs.join('\n');
    }

    // Fallback: build a simple key: value summary (avoid full JSON blob)
    try {
      return Object.entries(h).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join(' · ');
    } catch (e) {
      return String(h);
    }
  };

  return (
    <div className="ticket-detail-chat-container">
      <h2 className="ticket-chat-title">Historial del ticket con Folio: {ticket.folio}</h2>
      <div className="chat-history">
        {messages.map((msg, index) => (
          <div key={`msg-${index}`} className={`message-bubble ${msg.sender}`}>
            <p className="message-text">{formatMessageText(msg.text)}</p>
            <span className="timestamp">{new Date(ticket.fechaCreacion).toLocaleDateString()}</span>
          </div>
        ))}

        {/* Renderizar historial como burbujas de mensaje */}
        {historial && historial.length > 0 ? (
          historial.map((h, i) => {
            const senderClass = h.usuario || h.user || h.autor ? 'user' : 'system';
            const rawText = formatHistorialText(h);
            const text = typeof rawText === 'string' ? rawText : String(rawText);
            const time = h.fecha ? new Date(h.fecha) : (h.timestamp ? new Date(h.timestamp) : null);

            // historial
            const isStructuredObject = typeof h === 'object' && h !== null && !h.detalle && !h.descripcion && !h.change && !h.text && !Array.isArray(h.changes) && !h.before && !h.after;

            return (
              <div key={`hist-${i}`} className={`message-bubble history ${senderClass}`}>
                {isStructuredObject ? (
                          //componente que muestra el los historiales
                          <div style={{ whiteSpace: 'pre-wrap', marginTop: 8  }}>
                            {Object.entries(h).map(([k, v]) => (
                              <div key={k} style={{ marginBottom: 6 }}>
                                <strong>{k}</strong>: <span>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                              </div>
                            ))}
                          </div>
                ) : (
                  <>
                    {/* Mostrar texto multilínea preservando saltos y formato de bold (** **) */}
                    {String(text).split('\n').map((line, idx) => (
                      <div key={idx} className="message-text-line">{formatMessageText(line)}</div>
                    ))}
                    <div className="timestamp" style={{ marginTop: 6 }}>{time ? time.toLocaleString() : ''}</div>
                  </>
                )}
              </div>
            );
          })
        ) : (
          <div className="no-historial" style={{ marginTop: 12 }}>No hay historial para este folio.</div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailChat;
