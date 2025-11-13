import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getTicketById } from "../services/ticketService";
import { getHistorialByFolio } from "../services/historial";
import { useNotifications } from '../contexts/NotificationContext';
import './Styles/TicketDetailChatGlass.css';
import { riteTicket } from '../services/ticketService';


const TicketDetailChat = () => {
  const { folio } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historial, setHistorial] = useState([]);
  const { subscribeNotifications, notifications, addNotification } = useNotifications();

  // Estados para calificación (deben estar al tope y no condicionales)
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState('');

  // carga inicial del ticket y del historial al montar o cuando cambie el folio
  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [ticketResp, histResp] = await Promise.all([
          getTicketById(folio).catch(e => { console.warn('getTicketById error', e); return null; }),
          getHistorialByFolio(folio).catch(e => { console.warn('getHistorialByFolio error', e); return null; })
        ]);

        if (!mounted) return;
        if (ticketResp) setTicket(ticketResp);
        if (histResp) setHistorial(Array.isArray(histResp) ? histResp : (histResp ? [histResp] : []));
      } catch (e) {
        console.error('Error cargando ticket/historial', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (folio) fetchAll();
    else setLoading(false);

    return () => { mounted = false; };
  }, [folio]);



  const usuarioGuardado = localStorage.getItem('usuario');
  const usuarioObj = usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  const usuarioId = usuarioObj?.id ?? usuarioObj?.userId ?? usuarioObj?.idUsuario ?? usuarioObj?.id_usuario ?? null;

  useEffect(() => {
    if (!subscribeNotifications) return undefined;

    const unsub = subscribeNotifications((notif) => {
      console.debug('[TicketDetailChat] received notif', notif);
      if (!notif) return;
      const notifFolio = String(notif.ticketId ?? notif.folio ?? '');
      if (notifFolio && String(folio) === notifFolio) {
        // opción A: re-fetch historial completo
        getHistorialByFolio(folio).then(h => setHistorial(Array.isArray(h) ? h : (h ? [h] : []))).catch(e => console.warn(e));
        // opción B: agregar la notificación directamente al historial (si payload tiene detalle)
        // setHistorial(prev => [...prev, { detalle: notif.message, usuario: notif.usuario, fecha: new Date().toISOString() }]);
        // y opcionalmente re-fetch del ticket para actualizar estatus/ingeniero
        getTicketById(folio).then(t => setTicket(t)).catch(() => { });
      }
    });
    return () => {
      try { if (typeof unsub === 'function') unsub(); }
      catch (e) { }
    };
  }, [folio, subscribeNotifications]);

  // Backup: si por alguna razón la suscripción no dispara, reaccionar a cambios en el array `notifications`
  useEffect(() => {
    if (!Array.isArray(notifications) || notifications.length === 0) return;
    try {
      const matched = notifications.find(n => String(n.ticketId ?? n.folio ?? '') === String(folio));
      if (matched) {
        console.debug('[TicketDetailChat] matched notification via notifications array', matched);
        getHistorialByFolio(folio).then(h => setHistorial(Array.isArray(h) ? h : (h ? [h] : []))).catch(e => console.warn(e));
        getTicketById(folio).then(t => setTicket(t)).catch(() => { });
      }
    } catch (e) { console.warn('Error checking notifications array', e); }
  }, [notifications, folio]);

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
    // defensivo: aceptar undefined/null y cualquier tipo
    const s = text == null ? '' : String(text);
    return s.split('**').map((part, index) => index % 2 === 1 ? <strong key={index}>{part}</strong> : part);
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
                  <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
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
      </div >
      {/* Sección de calificación: sólo si está cerrado */}
      {String(ticket.estatus || '').toLowerCase() === 'cerrado' && (
        <div className="ticket-rating">
          <div className="ticket-rating-header">
            Califica la atención del ticket
          </div>
          {ticket.calificacion ? (
            <div>Gracias por sus comentarios<strong></strong> {ticket.calificacionComentario ? <> - {ticket.calificacionComentario}</> : null}</div>
          ) : (
            <>
                <div className="rating-row">
                <label className="rating-label">Puntuación: </label>
                <select className="rating-select" value={rating} onChange={e => setRating(Number(e.target.value))}>
                  <option style={{color: "black"}} value={0}>Selecciona...</option>
                  <option style={{color: "black"}} value={1}>Muy mal</option>
                  <option style={{color: "black"}} value={2}>Mal</option>
                  <option style={{color: "black"}} value={3}>Regular</option>
                  <option style={{color: "black"}} value={4}>Bien</option>
                  <option style={{color: "black"}} value={5}>Excelente</option>
                </select>
              </div>
              <div className="rating-comment">
                <label>Comentario (opcional)</label>
                <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} rows={3} className="rating-textarea" />
              </div>
              <div className="rating-actions">
                <button
                  className="btn btn-primary"
                  disabled={ratingLoading || rating <= 0}
                  onClick={async () => {
                    try {
                      setRatingLoading(true);
                      // Llamar al servicio de calificación
                      // El backend espera los campos `calificacion` y `comentario_usr`
                      const payload = { folio: ticket.folio, calificacion: rating, comentario_usr: ratingComment };
                      const updated = await riteTicket(payload);
                      // Normalizar la respuesta para mantener compatibilidad con la UI
                      if (updated) {
                        const normalized = {
                          ...updated,
                          // algunos backends devuelven nombres distintos; mapeamos a los campos que usa la UI
                          calificacion: updated.calificacion ?? updated.rating ?? updated.score,
                          calificacionComentario: updated.comentario_usr ?? updated.comentarios ?? updated.comentario ?? updated.calificacionComentario,
                        };
                        setTicket(normalized);
                      }
                      setRatingSuccess('Gracias por tu calificación.');
                      // registrar notificación local para que aparezca en la lista
                      try { addNotification(String(ticket.folio), `ticket cerrado`, { skipBroadcast: false }); } catch (e) { }
                    } catch (e) {
                      console.error('Error enviando calificación:', e);
                      setRatingSuccess('No se pudo enviar la calificación. Intenta de nuevo.');
                    } finally {
                      setRatingLoading(false);
                    }
                  }}
                >Enviar calificación</button>
                <button className="btn btn-secondary" onClick={() => { setRating(0); setRatingComment(''); setRatingSuccess(''); }} disabled={ratingLoading}>Limpiar</button>
              </div>
              {ratingLoading && <div style={{ marginTop: 8 }}>Enviando calificación...</div>}
              {ratingSuccess && <div style={{ marginTop: 8 }}>{ratingSuccess}</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TicketDetailChat;
