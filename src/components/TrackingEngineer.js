import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllIngenieros } from '../services/ingenieroService';
import { getAllTipoTickets } from '../services/tipoTicketService';
import { getAllEstatus } from '../services/estatus';
import { getAllPrioridad } from '../services/prioridad';
import { getTicketsByIngenieroId, getTicketById, updateTicket, riteTicket } from '../services/ticketService';
import { getHistorialByFolio } from '../services/historial';
import { useNotifications } from '../contexts/NotificationContext';
import AlertModal from './Alerts/AlertModal';
import '../components/Styles/tracking.css';
import './Styles/TicketDetailChatGlass.css';

const TrackingEngineer = () => {
    const { addNotification, subscribeNotifications, subscribeTicketTopic } = useNotifications();
    const messagesEndRef = useRef(null);
    const chatHistoryRef = useRef(null);

    const [ingenieros, setIngenieros] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [prioridades, setPrioridades] = useState([]);
    const [estatusList, setEstatusList] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [ticketsFiltrados, setTicketsFiltrados] = useState([]);

    const [ticketActual, setTicketActual] = useState(null);
    const [usedIdentifier, setUsedIdentifier] = useState(null);
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const requestedFolio = query.get('folio');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 5;

    const [filtroEstatus, setFiltroEstatus] = useState('En progreso');

    // Estado para el buscador inteligente
    const [terminoBusqueda, setTerminoBusqueda] = useState('');

    const [historial, setHistorial] = useState([]);
    const [verHistorial, setVerHistorial] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [ratingLoading, setRatingLoading] = useState(false);
    const [ratingSuccess, setRatingSuccess] = useState("");
    const [showRatingModal, setShowRatingModal] = useState(false);

    const [chatMessage, setChatMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    const formatUsuario = (usuario) => {
        if (!usuario) return '';
        if (typeof usuario === 'string') return usuario;
        if (typeof usuario === 'object') {
            return usuario.nombre || usuario.userName || usuario.username || `${usuario.nombre || ''} ${usuario.apePat || ''} ${usuario.apeMat || ''}`.trim() || JSON.stringify(usuario);
        }
        return String(usuario);
    };

    const formatMessageText = (text) =>
        String(text || "")
            .split("**")
            .map((part, i) =>
                i % 2 ? <strong key={i}>{part}</strong> : part
            );

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
        return items.length ? items : [{ icon: "ℹ️", text: JSON.stringify(h) }];
    };

    // Función para detectar automáticamente si el texto es folio o nombre
    const detectarTipoBusqueda = (texto) => {
        if (!texto.trim()) return 'auto';

        // Verificar si el texto es un número (folio)
        const esNumero = /^\d+$/.test(texto.trim());
        const esFolioFormato = /^[A-Za-z]*[-_]?\d+$/i.test(texto.trim());

        if (esNumero || esFolioFormato) {
            return 'folio';
        }

        // Si no es número, asumimos que es nombre de usuario
        return 'usuario';
    };

    // Función para filtrar tickets por búsqueda inteligente
    const filtrarTicketsPorBusqueda = (ticketsList) => {
        if (!terminoBusqueda.trim()) return ticketsList;

        const busquedaLower = terminoBusqueda.toLowerCase().trim();
        const tipoDetectado = detectarTipoBusqueda(terminoBusqueda);

        return ticketsList.filter(ticket => {
            // Si detectamos que es folio, buscar por folio
            if (tipoDetectado === 'folio') {
                const folio = String(ticket.folio || ticket.id || '').toLowerCase();
                return folio.includes(busquedaLower);
            }
            // Si detectamos que es usuario, buscar por nombre de usuario
            else if (tipoDetectado === 'usuario') {
                const usuario = formatUsuario(ticket.usuario).toLowerCase();
                return usuario.includes(busquedaLower);
            }

            // Fallback: buscar en ambos campos
            const folio = String(ticket.folio || ticket.id || '').toLowerCase();
            const usuario = formatUsuario(ticket.usuario).toLowerCase();
            return folio.includes(busquedaLower) || usuario.includes(busquedaLower);
        });
    };

    // Obtener el placeholder dinámico
    const getPlaceholderTexto = () => {
        if (!terminoBusqueda) {
            return "Buscar por folio o nombre de usuario...";
        }
        const tipo = detectarTipoBusqueda(terminoBusqueda);
        if (tipo === 'folio') {
            return `Buscando por folio: ${terminoBusqueda}`;
        } else if (tipo === 'usuario') {
            return `Buscando por usuario: ${terminoBusqueda}`;
        }
        return "Buscando...";
    };

    // Obtener el ícono según el tipo de búsqueda
    const getIconoBusqueda = () => {
        if (!terminoBusqueda) return "🔍";
        const tipo = detectarTipoBusqueda(terminoBusqueda);
        return tipo === 'folio' ? "🎫" : "👤";
    };

    const [ingenieroEncargado, setIngenieroEncargado] = useState('');
    const [reassign, setReassign] = useState(false);
    const [prioridadSeleccionada, setPrioridadSeleccionada] = useState('');
    const [tipoSeleccionado, setTipoSeleccionado] = useState('');
    const [estatusSeleccionado, setEstatusSeleccionado] = useState('Abierto');
    const [comentario, setComentario] = useState('');
    const [modal, setModal] = useState({ visible: false, title: '', message: '' });

    const scrollToBottom = () => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    };

    const getLoggedIngenieroId = () => {
        try {
            const raw = localStorage.getItem('usuario');
            if (!raw) return null;
            const u = JSON.parse(raw);
            return u.id || u.idUsuario || u.id_ingeniero || u.userId || null;
        } catch (e) {
            return null;
        }
    };

    const aplicarFiltroEstatus = (ticketsList, estatusFiltro) => {
        if (!ticketsList || ticketsList.length === 0) return [];

        if (estatusFiltro === 'Todos') {
            return [...ticketsList];
        }

        return ticketsList.filter(ticket => {
            const estatusTicket = ticket?.estatus || '';
            return estatusTicket.toLowerCase() === estatusFiltro.toLowerCase();
        });
    };

    // Aplicar filtros combinados (estatus + búsqueda)
    useEffect(() => {
        const filtradosPorEstatus = aplicarFiltroEstatus(tickets, filtroEstatus);
        const filtradosPorBusqueda = filtrarTicketsPorBusqueda(filtradosPorEstatus);
        setTicketsFiltrados(filtradosPorBusqueda);
        setCurrentPage(1);

        if (ticketActual && !filtradosPorBusqueda.some(t => t.folio === ticketActual.folio || t.id === ticketActual.id)) {
            setTicketActual(filtradosPorBusqueda.length > 0 ? filtradosPorBusqueda[0] : null);
        }
    }, [tickets, filtroEstatus, terminoBusqueda]);

    useEffect(() => {
        if (!subscribeNotifications) return;
        const unsub = subscribeNotifications(() => {
            if (ticketActual?.folio) {
                getHistorialByFolio(ticketActual.folio).then(setHistorial);
                getTicketById(ticketActual.folio).then(setTicketActual);
            }
            loadTicketsForLoggedIngeniero();
        });
        return () => unsub?.();
    }, [ticketActual?.folio, subscribeNotifications]);

    useEffect(() => {
        let cleanup;
        if (subscribeTicketTopic && ticketActual?.folio) {
            subscribeTicketTopic(ticketActual.folio).then(c => cleanup = c);
        }
        return () => cleanup?.();
    }, [ticketActual?.folio, subscribeTicketTopic]);

    const loadTicketsForLoggedIngeniero = async () => {
        try {
            const raw = localStorage.getItem('usuario');
            if (!raw) {
                setTickets([]);
                return [];
            }
            const u = JSON.parse(raw);
            const candidates = [
                u.id,
                u.idUsuario,
                u.id_ingeniero,
                u.userId,
                u.userName,
                u.user,
                u.username,
                u.nombre
            ].filter(Boolean).map(String);

            const uniq = Array.from(new Set(candidates));

            if (uniq.length === 0) {
                console.debug('TrackingEngineer: no identificador en localStorage.usuario:', u);
                setTickets([]);
                return [];
            }

            let lastErr = null;
            for (const idCandidate of uniq) {
                try {
                    console.debug('TrackingEngineer: probando TicketsByIngenieroId con:', idCandidate);
                    const t = await getTicketsByIngenieroId(idCandidate);
                    if (Array.isArray(t)) {
                        const sortedByDateDesc = (t || []).slice().sort((a, b) => {
                            const da = a && a.fechaCreacion ? new Date(a.fechaCreacion) : null;
                            const db = b && b.fechaCreacion ? new Date(b.fechaCreacion) : null;
                            if (da && db) return db - da;
                            if (da && !db) return -1;
                            if (!da && db) return 1;
                            return 0;
                        });
                        setTickets(sortedByDateDesc);
                        setUsedIdentifier(idCandidate);
                        setTicketActual(prev => prev || (sortedByDateDesc.length ? sortedByDateDesc[0] : null));
                        return sortedByDateDesc;
                    }
                    console.debug(`TrackingEngineer: respuesta no es array para ${idCandidate}`);
                } catch (err) {
                    lastErr = err;
                    console.warn(`TrackingEngineer: error intentando con ${idCandidate}:`, err.message || err);
                }
            }

            if (lastErr) console.error('TrackingEngineer: última excepción al obtener tickets:', lastErr);
            setTickets([]);
            return [];
        } catch (e) {
            console.error('Error cargando tickets del ingeniero:', e);
            setTickets([]);
            return [];
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ing, t, est, prio] = await Promise.all([getAllIngenieros(), getAllTipoTickets(), getAllEstatus(), getAllPrioridad()].map(p => p.catch ? p : p));
                setIngenieros(ing || []);
                setTipos(t || []);
                setEstatusList(est || []);

                if (prio && prio.length > 0) {
                    const normalized = prio.map(p => ({ id_prioridad: p.id_prioridad ?? p.id ?? p.idPrioridad ?? p.id, nombre: p.nombre ?? p.prioridad ?? p.label ?? String(p) }));
                    setPrioridades(normalized);
                } else setPrioridades([]);

                await loadTicketsForLoggedIngeniero();

                setTicketActual(prev => prev || (Array.isArray(tickets) && tickets.length ? tickets[0] : null));
                if (requestedFolio) {
                    const found = (tickets || []).find(x => String(x.folio) === String(requestedFolio) || String(x.id) === String(requestedFolio));
                    if (found) setTicketActual(found);
                }
            } catch (err) {
                console.error('Error cargando datos en TrackingEngineer:', err);
            }
        };
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSelectTicket = async (t) => {
        setTicketActual(t);
        setVerHistorial(true);
        setLoadingHistory(true);
        setChatMessage('');

        try {
            const histResp = await getHistorialByFolio(t.folio);
            setHistorial(Array.isArray(histResp) ? histResp : [histResp]);

            if (t.estatus?.toLowerCase() === 'cerrado' && !t.calificacion) {
                setShowRatingModal(true);
            }
        } catch (error) {
            console.error('Error cargando historial:', error);
            setHistorial([]);
        } finally {
            setLoadingHistory(false);
            setTimeout(scrollToBottom, 100);
        }
    };

    const handleSendMessage = async () => {
        if (!chatMessage.trim() || !ticketActual || sendingMessage) return;

        setSendingMessage(true);

        try {
            const payload = {
                folio: ticketActual.folio,
                comentarios: chatMessage,
                estatus: estatusSeleccionado,
                id_prioridad: prioridadSeleccionada ? Number(prioridadSeleccionada) : undefined,
            };

            const updated = await updateTicket(payload);
            setTicketActual(updated);
            setChatMessage('');

            const histResp = await getHistorialByFolio(ticketActual.folio);
            setHistorial(Array.isArray(histResp) ? histResp : [histResp]);

            setTimeout(scrollToBottom, 100);
        } catch (err) {
            console.error('Error enviando mensaje:', err);
            setModal({ visible: true, title: 'Error', message: `No se pudo enviar el mensaje. ${err?.message || ''}` });
        } finally {
            setSendingMessage(false);
        }
    };

    const handleGuardar = async () => {
        if (!ticketActual) return;
        const prioridadNombre = (prioridades.find(p => String(p.id_prioridad) === String(prioridadSeleccionada)) || {}).nombre || (typeof prioridadSeleccionada === 'string' ? prioridadSeleccionada : undefined);

        let ingenieroNombreToSend = undefined;
        let ingenieroIdToSend = undefined;
        if (reassign && ingenieroEncargado) {
            ingenieroIdToSend = ingenieroEncargado;
            const found = (ingenieros || []).find(i => String(i.id_ingeniero ?? i.id ?? i.idUsuario ?? i.userId ?? i.userName ?? i.nombre) === String(ingenieroEncargado));
            if (found) ingenieroNombreToSend = found.nombre ?? found.userName ?? found.username ?? String(found.nombre ?? found.userName ?? ingenieroEncargado);
            else ingenieroNombreToSend = ingenieroEncargado;
        }

        const payload = {
            folio: ticketActual.folio,
            ingeniero: ingenieroNombreToSend || undefined,
            ingenieroId: ingenieroIdToSend || undefined,
            idIngeniero: ingenieroIdToSend || undefined,
            id_ingeniero: ingenieroIdToSend || undefined,
            prioridad: prioridadNombre,
            estatus: estatusSeleccionado,
            comentarios: comentario || undefined,
            usuario: (typeof ticketActual.usuario === 'string')
                ? ticketActual.usuario
                : (ticketActual.usuario?.userName ?? ticketActual.usuario?.username ?? ticketActual.usuario?.nombre ?? ticketActual.usuario ?? undefined),
            usuario_nombre: (typeof ticketActual.usuario === 'string') ? ticketActual.usuario : (ticketActual.usuario?.nombre ?? undefined),
            usuarioId: ticketActual.usuario?.id ?? ticketActual.usuarioId ?? ticketActual.id_usuario ?? ticketActual.idUsuario ?? undefined,
            idUsuario: ticketActual.usuario?.id ?? ticketActual.idUsuario ?? ticketActual.id_usuario ?? undefined,
            id_usuario: ticketActual.usuario?.id ?? ticketActual.id_usuario ?? ticketActual.idUsuario ?? undefined,
            usuario_id: ticketActual.usuario?.id ?? ticketActual.id_usuario ?? ticketActual.idUsuario ?? undefined,
            correo: ticketActual.correo ?? ticketActual.usuario?.correo ?? ticketActual.email ?? undefined,
            usuario_correo: ticketActual.usuario_correo ?? ticketActual.correo ?? ticketActual.usuario?.correo ?? undefined,
        };

        try {
            const updated = await updateTicket(payload);
            const ingenieroNombreFinal = updated?.ingeniero || ingenieroNombreToSend || '';

            setTicketActual(updated);
            setModal({ visible: true, title: 'Ticket actualizado', message: `El ticket ${updated.folio} fue actualizado correctamente.` });
            await loadTicketsForLoggedIngeniero();

            if (verHistorial) {
                const histResp = await getHistorialByFolio(updated.folio);
                setHistorial(Array.isArray(histResp) ? histResp : [histResp]);
            }
        } catch (err) {
            console.error('Error guardando en TrackingEngineer:', err);
            setModal({ visible: true, title: 'Error', message: `No se pudo actualizar el ticket. ${err?.message || ''}` });
        }
    };

    useEffect(() => {
        if (!ticketActual) {
            setIngenieroEncargado('');
            setPrioridadSeleccionada('');
            setTipoSeleccionado('');
            setEstatusSeleccionado('Abierto');
            setComentario('');
            return;
        }

        try {
            let initialIngenieroId = '';
            if (ticketActual.ingenieroId) initialIngenieroId = String(ticketActual.ingenieroId);
            else if (ticketActual.id_ingeniero) initialIngenieroId = String(ticketActual.id_ingeniero);
            else if (ticketActual.ingeniero) {
                const match = (ingenieros || []).find(i => {
                    const candidates = [i.nombre, i.userName, i.username, i.nombreCompleto].filter(Boolean).map(x => String(x).toLowerCase());
                    return candidates.includes(String(ticketActual.ingeniero).toLowerCase());
                });
                if (match) initialIngenieroId = String(match.id_ingeniero ?? match.id ?? match.idUsuario ?? match.userId ?? match.userName ?? match.nombre ?? '');
            }
            if (!initialIngenieroId && ticketActual.ingeniero) initialIngenieroId = String(ticketActual.ingeniero);
            setIngenieroEncargado(initialIngenieroId);
        } catch (e) {
            setIngenieroEncargado(ticketActual.ingeniero || '');
        }

        if (ticketActual.id_prioridad) {
            setPrioridadSeleccionada(String(ticketActual.id_prioridad));
        } else if (ticketActual.prioridad) {
            const matched = (prioridades || []).find(p => (p.nombre || '').toLowerCase() === String(ticketActual.prioridad).toLowerCase());
            if (matched) setPrioridadSeleccionada(String(matched.id_prioridad ?? matched.id));
            else setPrioridadSeleccionada(String(ticketActual.prioridad));
        } else setPrioridadSeleccionada('');

        setTipoSeleccionado(ticketActual.tipo_ticket || ticketActual.tipo || '');
        setEstatusSeleccionado(ticketActual.estatus || 'Abierto');
        setComentario(ticketActual.comentario ?? ticketActual.comentario ?? ticketActual.note ?? '');
    }, [ticketActual, prioridades]);

    const messages = ticketActual ? [
        { sender: "system", text: `👋 Ticket **${ticketActual.folio}** cargado correctamente.` },
        { sender: "user", text: `🧾 ${ticketActual.descripcion || 'Sin descripción'}` },
        { sender: "system", text: `👨‍🔧 Asignado a: **${ticketActual.ingeniero || 'Sin asignar'}**\n📌 Estado: **${ticketActual.estatus || 'Sin estado'}**` },
    ] : [];

    const statusClass = ticketActual?.estatus?.toLowerCase().replace(" ", "-");

    return (
        <div className="tracking-root">
            <AlertModal visible={modal.visible} title={modal.title} message={modal.message} onClose={() => setModal({ visible: false, title: '', message: '' })} />

            {showRatingModal && (
                <div className="ticket-rating-overlay">
                    <div className="ticket-rating-modal">
                        <h3 className="ticket-rating-header">Califica la atención</h3>
                        <p>Tu ticket <b>{ticketActual?.folio}</b> ha finalizado.</p>
                        <div className="rating-row">
                            <label className="rating-label">Puntuación</label>
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
                                        folio: ticketActual.folio,
                                        calificacion: rating,
                                        comentario_usr: ratingComment,
                                    });
                                    setRatingLoading(false);
                                    setRatingSuccess("¡Gracias por tu opinión!");
                                    setTimeout(() => {
                                        setShowRatingModal(false);
                                        setRating(0);
                                        setRatingComment("");
                                        setRatingSuccess("");
                                    }, 1500);
                                }}
                            >
                                {ratingLoading ? "Enviando..." : "Enviar"}
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowRatingModal(false)}>
                                Cerrar
                            </button>
                        </div>
                        {ratingSuccess && <div className="rating-success">{ratingSuccess}</div>}
                    </div>
                </div>
            )}

            <div className="tracking-main">
                <div className="tracking-header">
                    <h2>Mis tickets asignados</h2>

                    {/* Barra de búsqueda inteligente */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
                        <div style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
                            <div style={{ position: 'relative' }}>
                                <span style={{
                                    position: 'absolute',
                                    left: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: '16px'
                                }}>
                                    {getIconoBusqueda()}
                                </span>
                                <input
                                    type="text"
                                    placeholder={getPlaceholderTexto()}
                                    value={terminoBusqueda}
                                    onChange={(e) => setTerminoBusqueda(e.target.value)}
                                    style={{
                                        padding: '8px 30px 8px 35px',
                                        borderRadius: 6,
                                        border: '1px solid #ccc',
                                        width: '100%',
                                        fontSize: '14px',
                                        backgroundColor: '#fff',
                                        color: '#000'
                                    }}
                                    autoComplete="off"
                                />
                                {terminoBusqueda && (
                                    <button
                                        onClick={() => setTerminoBusqueda('')}
                                        style={{
                                            position: 'absolute',
                                            right: '5px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            color: '#999',
                                            padding: '0 5px'
                                        }}
                                        title="Limpiar búsqueda"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            {terminoBusqueda && (
                                <div style={{
                                    fontSize: '11px',
                                    marginTop: '4px',
                                    color: detectarTipoBusqueda(terminoBusqueda) === 'folio' ? '#2196F3' : '#4CAF50',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <span>🔍</span>
                                    <span>
                                        Buscando por: <strong>
                                            {detectarTipoBusqueda(terminoBusqueda) === 'folio' ? 'Folio' : 'Nombre de usuario'}
                                        </strong>
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Filtro de estatus */}
                        <select
                            value={filtroEstatus}
                            onChange={(e) => setFiltroEstatus(e.target.value)}
                            style={{ padding: '8px 10px', borderRadius: 6 }}
                        >
                            <option value="Todos">Todos los estatus</option>
                            <option value="En progreso">En progreso</option>
                            <option value="Cerrado">Cerrado</option>
                        </select>

                        {/* Mostrar resultados de búsqueda */}
                        {terminoBusqueda && (
                            <span style={{
                                fontSize: '13px',
                                padding: '4px 8px',
                                background: '#e3f2fd',
                                borderRadius: '4px',
                                color: '#1976d2'
                            }}>
                                📊 {ticketsFiltrados.length} resultado(s)
                            </span>
                        )}
                    </div>
                </div>

                <div className="tracking-row">
                    <div className="left-panel pill">
                        <div className="label">Solicitante</div>
                        <div className="requester">{ticketActual ? (formatUsuario(ticketActual.usuario) || '—') : '—'}</div>

                        <div className="label">Prioridad</div>
                        <select value={prioridadSeleccionada} onChange={(e) => setPrioridadSeleccionada(e.target.value)}>
                            <option value="">Sin prioridad</option>
                            {prioridades.map(p => (
                                <option key={p.id_prioridad ?? p.id ?? p.nombre} value={String(p.id_prioridad ?? p.id ?? p.nombre)}>{p.nombre ?? p.prioridad ?? p}</option>
                            ))}
                        </select>

                        <div className="label">Tipo</div>
                        <select value={tipoSeleccionado} onChange={(e) => setTipoSeleccionado(e.target.value)}>
                            <option value="">Selecciona un tipo</option>
                            {tipos.map(t => (
                                <option key={t.idTipoTicket ?? t.id} value={t.tipo}>{t.tipo}</option>
                            ))}
                        </select>

                        <div className="label">Estatus</div>
                        <select value={estatusSeleccionado} onChange={(e) => setEstatusSeleccionado(e.target.value)}>
                            {estatusList && estatusList.length > 0 ? (
                                estatusList.map(es => (
                                    <option key={es.id_estatus ?? es.id} value={es.nombre ?? es.estatus ?? es.value}>{es.nombre ?? es.estatus ?? es.value}</option>
                                ))
                            ) : (
                                <>
                                    <option value="Abierto">Abierto</option>
                                    <option value="En proceso">En proceso</option>
                                    <option value="Cerrado">Cerrado</option>
                                </>
                            )}
                        </select>

                        <div className="label">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={reassign}
                                    onChange={(e) => {
                                        const checked = Boolean(e.target.checked);
                                        setReassign(checked);
                                        if (!checked) setIngenieroEncargado('');
                                    }}
                                />
                                <span>¿Reasignar a otro ingeniero?</span>
                            </label>
                        </div>

                        {reassign && (
                            <select value={ingenieroEncargado} onChange={(e) => setIngenieroEncargado(e.target.value)}>
                                <option value="">Sin encargado</option>
                                {ingenieros.map(ing => {
                                    const ingId = String(ing.id_ingeniero ?? ing.id ?? ing.idUsuario ?? ing.userId ?? ing.userName ?? ing.nombre ?? '');
                                    const label = ing.nombre ?? ing.userName ?? ing.username ?? ing.nombreCompleto ?? ingId;
                                    return (
                                        <option key={ingId} value={ingId}>{label}</option>
                                    );
                                })}
                            </select>
                        )}

                        <div className="left-actions">
                            <button onClick={handleGuardar} className="btn btn-success">Guardar</button>
                            <button onClick={() => { setTicketActual(null); setVerHistorial(false); setTerminoBusqueda(''); }} className="btn btn-info">Limpiar</button>
                        </div>
                    </div>

                    <div className="center-panel">
                        {!verHistorial ? (
                            <>
                                <div className="center-top">
                                    <div>
                                        <div className="subject">Asunto : {ticketActual?.tipo_ticket ?? '—'}</div>
                                        <div className="meta">Fecha: {ticketActual ? new Date(ticketActual.fechaCreacion).toLocaleString() : '—'} · Departamento: {ticketActual?.departamento ?? ticketActual?.area ?? '—'}</div>
                                    </div>
                                    <div className="right-info">
                                        <div>Folio : {ticketActual?.folio ?? '—'}</div>
                                        <div>Encargado : {ticketActual?.ingeniero ?? 'Sin encargado'}</div>
                                        <div className={`status ${ticketActual?.estatus === 'Abierto' ? 'status-open' : 'status-other'}`}>{ticketActual?.estatus ?? '—'}</div>
                                    </div>
                                </div>

                                <div className="messages">
                                    {(() => {
                                        const allSorted = (ticketsFiltrados || []).slice().sort((a, b) => {
                                            const da = a && a.fechaCreacion ? new Date(a.fechaCreacion) : null;
                                            const db = b && b.fechaCreacion ? new Date(b.fechaCreacion) : null;
                                            if (da && db) return db - da;
                                            if (da && !db) return -1;
                                            if (!da && db) return 1;
                                            return 0;
                                        });
                                        const total = allSorted.length;
                                        const totalPages = Math.max(1, Math.ceil(total / perPage));
                                        const start = (currentPage - 1) * perPage;
                                        const pageItems = allSorted.slice(start, start + perPage);

                                        if (!pageItems || pageItems.length === 0) {
                                            const mensajeSinResultados = terminoBusqueda
                                                ? `❌ No se encontraron tickets que coincidan con "${terminoBusqueda}"`
                                                : "📭 No tienes tickets asignados con el estatus seleccionado.";
                                            return (<div className="no-ticket">{mensajeSinResultados}</div>);
                                        }

                                        return (
                                            <>
                                                <div className="ticket-cards">
                                                    {pageItems.map((t) => {
                                                        const isSelected = ticketActual && (ticketActual.folio === t.folio || ticketActual.id === t.id);
                                                        return (
                                                            <div
                                                                key={t.folio ?? t.id}
                                                                className={`ticket-card ${isSelected ? 'selected' : ''}`}
                                                                onClick={() => handleSelectTicket(t)}
                                                            >
                                                                <div className="ticket-card-content">
                                                                    <div className="ticket-card-left">
                                                                        <div className="ticket-folio">Folio: <strong>{t.folio ?? t.id}</strong></div>
                                                                        <div className="ticket-tipo">{t.tipo_ticket ?? t.tipo ?? '—'}</div>
                                                                        <div className="ticket-descripcion">{t.descripcion ?? t.description ?? '—'}</div>
                                                                    </div>
                                                                    <div className="ticket-card-right">
                                                                        <div className="ticket-usuario">{formatUsuario(t.usuario) || 'Solicitante'}</div>
                                                                        <div className={`card-status ${String(t.estatus || '').toLowerCase().replace(/\s+/g, "-")}`}>{t.estatus || 'Sin estado'}</div>
                                                                        <div className="ticket-fecha">{t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleString() : ''}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {totalPages > 1 && (
                                                    <nav aria-label="Paginación tickets" className="pagination-nav">
                                                        <ul className="pagination justify-content-center">
                                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                                <button className="page-link" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} aria-label="Anterior">&laquo;</button>
                                                            </li>
                                                            {Array.from({ length: totalPages }).map((_, i) => {
                                                                const p = i + 1;
                                                                return (
                                                                    <li key={p} className={`page-item ${p === currentPage ? 'active' : ''}`}>
                                                                        <button className="page-link" onClick={() => setCurrentPage(p)}>{p}</button>
                                                                    </li>
                                                                );
                                                            })}
                                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                                <button className="page-link" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} aria-label="Siguiente">&raquo;</button>
                                                            </li>
                                                        </ul>
                                                    </nav>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setVerHistorial(false)}
                                    className="btn-volver-historial"
                                >
                                    ← Volver a tickets
                                </button>

                                <div className="historial-header">
                                    <h3 style={{ color: '#fff', marginBottom: 10 }}>Historial: {ticketActual?.folio}</h3>
                                    <div className={`status-indicator ${statusClass}`}>
                                        ● {ticketActual?.estatus}
                                    </div>
                                </div>

                                {loadingHistory ? (
                                    <p style={{ color: '#fff', flex: 1 }}>Cargando historial...</p>
                                ) : (
                                    <div
                                        ref={chatHistoryRef}
                                        className="chat-history"
                                        style={{
                                            flex: 1,
                                            overflowY: 'auto',
                                            overflowX: 'hidden',
                                            minHeight: 0
                                        }}
                                    >
                                        {messages.map((msg, i) => (
                                            <div key={i} className={`${msg.sender === 'user' ? 'tracking-chat-user' : 'tracking-chat-system'}`}>
                                                <div className="message-text">{formatMessageText(msg.text)}</div>
                                                <span className="timestamp">{new Date(ticketActual.fechaCreacion).toLocaleString()}</span>
                                            </div>
                                        ))}

                                        {historial.map((h, i) => {
                                            const items = formatHistorialText(h);
                                            const esIngeniero = h.ingeniero || h.id_ingeniero || h.usuario?.rol === 'ingeniero';
                                            const esSolicitante = h.usuario && !esIngeniero;
                                            let bubbleClass = 'system';

                                            if (h.comentarios) {
                                                if (esIngeniero) {
                                                    bubbleClass = 'user';
                                                } else if (esSolicitante) {
                                                    bubbleClass = 'user';
                                                }
                                            }

                                            return (
                                                <div key={i} className={`${bubbleClass === 'user' ? 'tracking-chat-history-user' : 'tracking-chat-history-system'}`}>
                                                    <div className="history-card">
                                                        {items.map((it, idx) => (
                                                            <div key={idx} className="history-item">
                                                                <span className="history-icon">{it.icon}</span>
                                                                <span className="history-text">{it.text}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    {h.fecha && (
                                                        <span className="timestamp">{new Date(h.fecha).toLocaleString()}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}

                                <div className="footer-input" style={{ marginTop: 15, flexShrink: 0 }}>
                                    <input
                                        style={{ width: '100%', color: 'black' }}
                                        placeholder={ticketActual?.estatus?.toLowerCase() === 'cerrado' ? 'Ticket cerrado - No se pueden agregar comentarios' : 'Agregar algún comentario'}
                                        value={chatMessage}
                                        onChange={(e) => setChatMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        disabled={ticketActual?.estatus?.toLowerCase() === 'cerrado'}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!chatMessage.trim() || sendingMessage || ticketActual?.estatus?.toLowerCase() === 'cerrado'}
                                    >
                                        ↑
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackingEngineer;