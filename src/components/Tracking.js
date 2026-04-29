import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar';
import AlertModal from './Alerts/AlertModal';
import io from 'socket.io-client';
import { sendMessage, connect as stompConnect } from '../services/stompService';
import { getAllUsuarios } from '../services/usuarioService';
import { getAllIngenieros } from '../services/ingenieroService';
import { getAllTipoTickets } from '../services/tipoTicketService';
import { getAllTickets, getTicketById, updateTicket, riteTicket } from '../services/ticketService';
import { useNotifications } from '../contexts/NotificationContext';
import { getAllEstatus } from '../services/estatus';
import { getAllPrioridad } from '../services/prioridad';
import { getHistorialByFolio } from '../services/historial';

import '../components/Styles/tracking.css';
import './Styles/TicketDetailChatGlass.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL?.replace(/\/+$/, '');

const Tracking = () => {
    const socketRef = useRef(null);
    const { addNotification, subscribeNotifications, subscribeTicketTopic } = useNotifications();

    const [ingenieros, setIngenieros] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [prioridades, setPrioridades] = useState([]);
    const [estatusList, setEstatusList] = useState([]);
    const [tickets, setTickets] = useState([]);

    // ticket actualmente seleccionado/recibido por socket
    const [ticketActual, setTicketActual] = useState(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ title: '', message: '' });

    // Estados para el historial
    const [historial, setHistorial] = useState([]);
    const [verHistorial, setVerHistorial] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Estados para calificación
    const [rating, setRating] = useState(0);
    const [ratingComment, setRatingComment] = useState("");
    const [ratingLoading, setRatingLoading] = useState(false);
    const [ratingSuccess, setRatingSuccess] = useState("");

    // Estados para el buscador
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [tipoBusquedaDetectado, setTipoBusquedaDetectado] = useState('auto'); // 'folio', 'usuario' o 'auto'

    // Estados para paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5); // Mostrar 5 tickets por página

    // util: formatea un campo usuario que puede ser string o un objeto { nombre, userName, correo, ... }
    const formatUsuario = (usuario) => {
        if (!usuario) return '';
        if (typeof usuario === 'string') return usuario;
        if (typeof usuario === 'object') {
            // preferir nombre completo o userName
            return usuario.nombre || usuario.userName || usuario.username || `${usuario.nombre || ''} ${usuario.apePat || ''} ${usuario.apeMat || ''}`.trim() || JSON.stringify(usuario);
        }
        return String(usuario);
    };

    // Función para detectar automáticamente si el texto es folio o nombre
    const detectarTipoBusqueda = (texto) => {
        if (!texto.trim()) return 'auto';

        // Verificar si el texto es un número (folio)
        // Puede ser número puro o alfanumérico como TICKET-123
        const esNumero = /^\d+$/.test(texto.trim());
        const esFolioFormato = /^[A-Za-z]*[-_]?\d+$/i.test(texto.trim());

        if (esNumero || esFolioFormato) {
            return 'folio';
        }

        // Si no es número, asumimos que es nombre de usuario
        return 'usuario';
    };

    // Función para filtrar tickets por búsqueda
    const filtrarTicketsPorBusqueda = (ticketsList) => {
        if (!terminoBusqueda.trim()) return ticketsList;

        const busquedaLower = terminoBusqueda.toLowerCase().trim();
        const tipoDetectado = detectarTipoBusqueda(terminoBusqueda);

        return ticketsList.filter(ticket => {
            if (tipoDetectado === 'folio') {
                const folio = String(ticket.folio || ticket.id || '').toLowerCase();
                return folio.includes(busquedaLower);
            }
            else if (tipoDetectado === 'usuario') {
                const usuario = formatUsuario(ticket.usuario).toLowerCase();
                return usuario.includes(busquedaLower);
            }

            const folio = String(ticket.folio || ticket.id || '').toLowerCase();
            const usuario = formatUsuario(ticket.usuario).toLowerCase();
            return folio.includes(busquedaLower) || usuario.includes(busquedaLower);
        });
    };

    // Obtener el tipo de búsqueda actual para mostrar en el placeholder
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

    // campos editables
    const [ingenieroEncargado, setIngenieroEncargado] = useState('');
    const [prioridadSeleccionada, setPrioridadSeleccionada] = useState('');
    const [tipoSeleccionado, setTipoSeleccionado] = useState('');
    const [estatusSeleccionado, setEstatusSeleccionado] = useState('Abierto');
    const [filtroEstatus, setFiltroEstatus] = useState('Abierto');
    const [mostrarFiltro, setMostrarFiltro] = useState(true);

    // Timer para detectar doble click
    const clickTimer = useRef(null);

    // Filtrar y paginar tickets
    const ticketsFiltrados = filtrarTicketsPorBusqueda(tickets);
    const ticketsFinales = ticketsFiltrados.filter(t => {
        if (!filtroEstatus) return true;
        return (t.estatus || '').toLowerCase().trim() === filtroEstatus.toLowerCase().trim();
    });

    // Calcular paginación
    const totalItems = ticketsFinales.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const currentTickets = ticketsFinales.slice(startIndex, startIndex + pageSize);

    // Ordenar tickets por fecha (más recientes primero)
    const ticketsOrdenados = [...currentTickets].sort((a, b) => {
        const da = a.fechaCreacion ? new Date(a.fechaCreacion) : new Date(0);
        const db = b.fechaCreacion ? new Date(b.fechaCreacion) : new Date(0);
        return db - da;
    });

    // Resetear página cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [filtroEstatus, terminoBusqueda]);

    // Conectar socket y listeners (run once)
    useEffect(() => {
        // conectar al servidor socket (ajusta URL si tu servidor usa otro puerto/namespace)
        if (!SOCKET_URL) {
            console.warn('Tracking: REACT_APP_SOCKET_URL no esta definida; se omite conexion Socket.IO.');
            return undefined;
        }

        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
        });

        socketRef.current.on('connect', () => {
            console.log('Socket conectado, id=', socketRef.current.id);
        });

        socketRef.current.on('ticketCreated', (newTicket) => {
            console.log('ticketCreated recibido:', newTicket);
            setTicketActual(newTicket);
            setIngenieroEncargado(newTicket.ingeniero || '');
            if (newTicket.id_prioridad) {
                setPrioridadSeleccionada(String(newTicket.id_prioridad));
            } else if (newTicket.prioridad) {
                const matched = (prioridades || []).find(p => (p.nombre || '').toLowerCase() === String(newTicket.prioridad).toLowerCase());
                if (matched) setPrioridadSeleccionada(String(matched.id_prioridad ?? matched.id));
                else setPrioridadSeleccionada('');
            } else {
                setPrioridadSeleccionada('');
            }
            setTipoSeleccionado(newTicket.tipo_ticket || '');
            setEstatusSeleccionado(newTicket.estatus || 'Abierto');
        });

        socketRef.current.on('ticketUpdated', (updated) => {
            console.log('ticketUpdated recibido:', updated);
            setTicketActual(prev => {
                if (!prev) return prev;
                if (updated.folio === prev.folio || updated.id === prev.id) {
                    setIngenieroEncargado(updated.ingeniero || '');
                    if (updated.id_prioridad) {
                        setPrioridadSeleccionada(String(updated.id_prioridad));
                    } else if (updated.prioridad) {
                        const matched = (prioridades || []).find(p => (p.nombre || '').toLowerCase() === String(updated.prioridad).toLowerCase());
                        if (matched) setPrioridadSeleccionada(String(matched.id_prioridad ?? matched.id));
                        else setPrioridadSeleccionada('');
                    } else {
                        setPrioridadSeleccionada('');
                    }
                    setTipoSeleccionado(updated.tipo_ticket || '');
                    setEstatusSeleccionado(updated.estatus || 'Abierto');
                    return updated;
                }
                return prev;
            });
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    // Suscripciones a notificaciones
    useEffect(() => {
        if (!subscribeNotifications) return;

        const unsub = subscribeNotifications(() => {
            if (ticketActual?.folio) {
                getHistorialByFolio(ticketActual.folio).then(setHistorial);
                getTicketById(ticketActual.folio).then(t => {
                    setTicketActual(t);
                });
            }
            getAllTickets().then(setTickets);
        });

        return () => unsub?.();
    }, [ticketActual?.folio, subscribeNotifications]);

    useEffect(() => {
        let cleanup;

        const run = async () => {
            if (subscribeTicketTopic && ticketActual?.folio) {
                cleanup = await subscribeTicketTopic(ticketActual.folio);
            }
        };

        run();

        return () => cleanup?.();
    }, [ticketActual?.folio, subscribeTicketTopic]);

    // cargar datos necesarios: usuarios, tipos y prioridades (desde tickets existentes)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ing, t, all, est, prio] = await Promise.all([getAllIngenieros(), getAllTipoTickets(), getAllTickets(), getAllEstatus(), getAllPrioridad()]);
                setIngenieros(ing || []);
                setTipos(t || []);
                setTickets(all || []);
                setEstatusList(est || []);

                if (prio && prio.length > 0) {
                    const normalized = prio.map(p => ({ id_prioridad: p.id_prioridad ?? p.id ?? p.idPrioridad ?? p.id, nombre: p.nombre ?? p.prioridad ?? p.label ?? String(p) }));
                    setPrioridades(normalized);
                } else {
                    const uniqPrio = Array.from(new Set((all || []).map(x => x.prioridad).filter(Boolean)));
                    const fallback = uniqPrio.length ? uniqPrio.map((name, idx) => ({ id_prioridad: idx + 1, nombre: name })) : [{ id_prioridad: 1, nombre: 'Alta' }, { id_prioridad: 2, nombre: 'Media' }, { id_prioridad: 3, nombre: 'Baja' }];
                    setPrioridades(fallback);
                }

                if ((all || []).length > 0) {
                    const firstOpen = (all || []).find(tt => tt.estatus === 'Abierto' || tt.estatus === 'abierto');
                    const chosen = firstOpen || all[0];
                    setTicketActual(chosen);
                    setIngenieroEncargado(chosen.ingeniero || '');
                    if (chosen.id_prioridad) {
                        setPrioridadSeleccionada(String(chosen.id_prioridad));
                    } else if (chosen.prioridad) {
                        const matched = (prio && prio.length ? prio : []).find(p => (p.nombre || p.prioridad || '').toLowerCase() === String(chosen.prioridad).toLowerCase());
                        if (matched) setPrioridadSeleccionada(String(matched.id_prioridad ?? matched.id));
                    } else {
                        setPrioridadSeleccionada('');
                    }
                    setTipoSeleccionado(chosen.tipo_ticket || '');
                    setEstatusSeleccionado(chosen.estatus || 'Abierto');
                }
            } catch (err) {
                console.error('Error cargando datos en Tracking:', err);
            }
        };
        fetchData();
    }, []);

    // Función para cargar solo los datos del ticket (sin abrir historial)
    const handleSingleClick = (t) => {
        if (clickTimer.current) {
            clearTimeout(clickTimer.current);
            clickTimer.current = null;
        }

        clickTimer.current = setTimeout(() => {
            setTicketActual(t);
            setIngenieroEncargado(t.ingeniero || '');
            if (t.id_prioridad) {
                setPrioridadSeleccionada(String(t.id_prioridad));
            } else if (t.prioridad) {
                const matched = (prioridades || []).find(p => (p.nombre || '').toLowerCase() === String(t.prioridad).toLowerCase());
                if (matched) setPrioridadSeleccionada(String(matched.id_prioridad ?? matched.id));
                else setPrioridadSeleccionada('');
            } else {
                setPrioridadSeleccionada('');
            }
            setTipoSeleccionado(t.tipo_ticket || '');
            setEstatusSeleccionado(t.estatus || 'Abierto');

            if (verHistorial) {
                setVerHistorial(false);
                setMostrarFiltro(true);
            }

            clickTimer.current = null;
        }, 200);
    };

    // Función para abrir el historial (doble click)
    const handleDoubleClick = async (t) => {
        if (clickTimer.current) {
            clearTimeout(clickTimer.current);
            clickTimer.current = null;
        }

        setTicketActual(t);
        setIngenieroEncargado(t.ingeniero || '');
        if (t.id_prioridad) {
            setPrioridadSeleccionada(String(t.id_prioridad));
        } else if (t.prioridad) {
            const matched = (prioridades || []).find(p => (p.nombre || '').toLowerCase() === String(t.prioridad).toLowerCase());
            if (matched) setPrioridadSeleccionada(String(matched.id_prioridad ?? matched.id));
            else setPrioridadSeleccionada('');
        } else {
            setPrioridadSeleccionada('');
        }
        setTipoSeleccionado(t.tipo_ticket || '');
        setEstatusSeleccionado(t.estatus || 'Abierto');

        setVerHistorial(true);
        setMostrarFiltro(false);
        setLoadingHistory(true);

        try {
            const histResp = await getHistorialByFolio(t.folio);
            setHistorial(Array.isArray(histResp) ? histResp : [histResp]);
        } catch (error) {
            console.error('Error cargando historial:', error);
            setHistorial([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleVolverATickets = () => {
        setVerHistorial(false);
        setMostrarFiltro(true);
        setTerminoBusqueda('');
        setCurrentPage(1); // Resetear página al volver
    };

    const handleGuardar = async () => {
        if (!ticketActual) return;

        const payload = {
            id: ticketActual.id ?? ticketActual.folio,
            folio: ticketActual.folio,
            ingeniero: ingenieroEncargado,
            prioridad: (prioridades.find(p => String(p.id_prioridad) === String(prioridadSeleccionada)) || {}).nombre || (typeof prioridadSeleccionada === 'string' ? prioridadSeleccionada : undefined),
            id_prioridad: prioridadSeleccionada ? Number(prioridadSeleccionada) : undefined,
            tipo_ticket: tipoSeleccionado,
            estatus: estatusSeleccionado,
        };

        try {
            const updated = await updateTicket(payload);

            try {
                await stompConnect();

                await sendMessage('/app/assignTicket', {
                    folio: updated.folio,
                    ingeniero: updated.ingeniero,
                    estatus: updated.estatus,
                    event: 'ticket.updated',
                    notificationAudience: 'ingeniero',
                    message: `El ticket ${updated.folio} fue actualizado.`,
                });

                let fullTicket = null;
                try {
                    fullTicket = await getTicketById(updated.folio);
                    console.log('Tracking: full ticket fetched for notify payload:', fullTicket);
                } catch (e) {
                    console.warn('Tracking: no se pudo obtener ticket completo para notificación:', e);
                }

                const notifyPayload = {
                    folio: updated.folio,
                    ingeniero: updated.ingeniero,
                    estatus: updated.estatus,
                    event: 'ticket.assigned',
                    notificationAudience: 'usuario',
                    message: `Ticket ${updated.folio} asignado${updated.ingeniero ? ` a ${updated.ingeniero}` : ''}.`,
                    id_prioridad: updated.id_prioridad ?? payload.id_prioridad,
                    usuario_nombre: formatUsuario(fullTicket?.usuario ?? fullTicket?.nombre ?? fullTicket?.usuario_nombre) || formatUsuario(ticketActual?.usuario) || formatUsuario(updated.usuario) || undefined,
                    usuario_id: fullTicket?.id_usuario ?? fullTicket?.idUsuario ?? fullTicket?.usuario_id ?? ticketActual?.id_usuario ?? ticketActual?.idUsuario ?? updated.id_usuario ?? updated.idUsuario ?? undefined,
                };

                if (notifyPayload.usuario_id) {
                    notifyPayload.userId = notifyPayload.usuario_id;
                    notifyPayload.usuarioId = notifyPayload.usuario_id;
                }

                console.log('Tracking: sending STOMP ticketAssigned payload:', notifyPayload);
                await sendMessage('/app/ticketAssigned', notifyPayload);
            } catch (e) {
                console.error('Tracking: error sending STOMP messages', e);
            }

            setTicketActual(updated);
            setAlertData({ title: 'Ticket actualizado', message: `Ticket ${updated.folio} actualizado y notificación enviada.` });
            setAlertVisible(true);
        } catch (err) {
            console.error('Error guardando actualización del ticket:', err);
            const detail = err && err.message ? err.message : 'Error al guardar la asignación.';
            setAlertData({ title: 'Error', message: `No se pudo actualizar el ticket: ${detail}` });
            setAlertVisible(true);
        }
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

        return items.length
            ? items
            : [{ icon: "ℹ️", text: JSON.stringify(h) }];
    };

    const messages = ticketActual ? [
        {
            sender: "system",
            text: `👋 Ticket **${ticketActual.folio}** cargado correctamente.`,
        },
        {
            sender: "user",
            text: `🧾 ${ticketActual.descripcion || 'Sin descripción'}`,
        },
        {
            sender: "system",
            text: `👨‍🔧 Asignado a: **${ticketActual.ingeniero || 'Sin asignar'}**\n📌 Estado: **${ticketActual.estatus || 'Sin estado'}**`,
        },
    ] : [];

    const statusClass = ticketActual?.estatus
        ?.toLowerCase()
        .replace(" ", "-");

    // Función para cambiar de página
    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="tracking-root">
            <AlertModal
                visible={alertVisible}
                title={alertData.title}
                message={alertData.message}
                onClose={() => setAlertVisible(false)}
                ebColor="#7bd389ff"
            />
            <div className="tracking-main">
                <div className="tracking-header">
                    <h2>Asignación de tickets</h2>

                    {mostrarFiltro && (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
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
                                            fontSize: '14px'
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

                            <select
                                value={filtroEstatus}
                                onChange={(e) => setFiltroEstatus(e.target.value)}
                                style={{ padding: '8px 10px', borderRadius: 6 }}
                            >
                                <option value="">Todos los estatus</option>
                                <option value="Abierto">Abierto</option>
                                <option value="En progreso">En progreso</option>
                            </select>

                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                style={{ padding: '8px 10px', borderRadius: 6 }}
                            >
                                <option value={5}>Mostrar 5</option>
                                <option value={10}>Mostrar 10</option>
                                <option value={15}>Mostrar 15</option>
                                <option value={20}>Mostrar 20</option>
                            </select>

                            {terminoBusqueda && (
                                <span style={{
                                    fontSize: '13px',
                                    padding: '4px 8px',
                                    background: '#e3f2fd',
                                    borderRadius: '4px',
                                    color: '#1976d2'
                                }}>
                                    📊 {totalItems} resultado(s)
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="tracking-row">
                    <div className="left-panel pill">
                        <div className="label">Solicitante</div>
                        <div className="requester" style={{ background: '#fff', color: '#000', padding: '10px 12px', borderRadius: 8 }}>{ticketActual ? (formatUsuario(ticketActual.usuario) || '—') : '—'}</div>

                        <div className="label">Ingeniero encargado</div>
                        <select value={ingenieroEncargado} onChange={(e) => setIngenieroEncargado(e.target.value)}>
                            <option style={{ color: "black" }} value="">Sin encargado</option>
                            {ingenieros.map(ing => (
                                <option style={{ color: "black" }} key={ing.id_ingeniero ?? ing.id ?? ing.idUsuario} value={ing.nombre}>{ing.nombre}</option>
                            ))}
                        </select>

                        <div className="label">Prioridad</div>
                        <select value={prioridadSeleccionada} onChange={(e) => setPrioridadSeleccionada(e.target.value)}>
                            <option style={{ color: "black" }} value="">Sin prioridad</option>
                            {prioridades.map(p => (
                                <option style={{ color: "black" }} key={p.id_prioridad ?? p.id ?? p.nombre} value={String(p.id_prioridad ?? p.id ?? p.nombre)}>{p.nombre ?? p.prioridad ?? p}</option>
                            ))}
                        </select>

                        <div className="label">Tipo</div>
                        <select value={tipoSeleccionado} onChange={(e) => setTipoSeleccionado(e.target.value)}>
                            <option style={{ color: "black" }} value="">Selecciona un tipo</option>
                            {tipos.map(t => (
                                <option style={{ color: "black" }} key={t.idTipoTicket ?? t.id} value={t.tipo}>{t.tipo}</option>
                            ))}
                        </select>

                        <div className="label">Estatus</div>
                        <select value={estatusSeleccionado} onChange={(e) => setEstatusSeleccionado(e.target.value)}>
                            {estatusList && estatusList.length > 0 ? (
                                estatusList.map(es => (
                                    <option style={{ color: "black" }} key={es.id_estatus ?? es.id} value={es.nombre ?? es.estatus ?? es.value}>{es.nombre ?? es.estatus ?? es.value}</option>
                                ))
                            ) : (
                                <>
                                    <option value="Abierto">Abierto</option>
                                    <option value="En proceso">En proceso</option>
                                    <option value="Cerrado">Cerrado</option>
                                </>
                            )}
                        </select>

                        <div className="left-actions">
                            <button onClick={handleGuardar} className="btn btn-success">Guardar</button>
                            <button onClick={() => { setTicketActual(null); setVerHistorial(false); setMostrarFiltro(true); setTerminoBusqueda(''); setCurrentPage(1); }} className="btn btn-info">Limpiar</button>
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
                                    <div style={{ textAlign: 'right' }}>
                                        <div>Folio : {ticketActual?.folio ?? '—'}</div>
                                        <div>Encargado : {ticketActual?.ingeniero ?? 'Sin encargado'}</div>
                                        <div className={`status ${ticketActual?.estatus === 'Abierto' ? 'status-open' : 'status-other'}`}>{ticketActual?.estatus ?? '—'}</div>
                                    </div>
                                </div>

                              <div className="messages">
    {(() => {
        if (ticketsOrdenados.length === 0) {
            return (
                <div className="no-ticket">
                    {terminoBusqueda
                        ? `❌ No se encontraron tickets que coincidan con "${terminoBusqueda}"`
                        : "📭 No hay tickets en cola. Espera a que llegue un ticket nuevo."}
                </div>
            );
        }
        return (
            <div className="ticket-list-container">
                <div className="ticket-cards" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {ticketsOrdenados.map((t) => {
                        const isSelected = ticketActual && (ticketActual.folio === t.folio || ticketActual.id === t.id);
                        return (
                            <div
                                key={t.folio ?? t.id}
                                className={`ticket-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleSingleClick(t)}
                                onDoubleClick={() => handleDoubleClick(t)}
                                style={{
                                    padding: 12,
                                    borderRadius: 8,
                                    width: '100%',
                                    cursor: 'pointer',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, opacity: 0.85 }}>Folio: <strong>{t.folio ?? t.id}</strong></div>
                                        <div style={{ marginTop: 6, fontWeight: 700 }}>{t.tipo_ticket ?? t.tipo ?? '—'}</div>
                                        <div style={{ marginTop: 4, fontSize: 11, opacity: 0.7, color: '#ffffff' }}>
                                            📝 {t.descripcion?.length > 60 ? t.descripcion.substring(0, 60) + '...' : (t.descripcion || 'Sin descripción')}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: 13 }}>{formatUsuario(t.usuario) || 'Solicitante'}</div>
                                        <div style={{ fontSize: 12, opacity: 0.8 }}>{t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleString() : ''}</div>
                                        <div
                                            className={`card-status ${String(t.estatus || '')
                                                .toLowerCase()
                                                .replace(" ", "-")}`}
                                        >
                                            {t.estatus || 'Sin estado'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    })()}
</div>

                                {/* Menú de paginación inferior - Versión Simple */}
                                {totalItems > 0 && (
                                    <div style={{
                                        marginTop: '24px',
                                        paddingTop: '20px',
                                        borderTop: '1px solid rgba(255,255,255,0.06)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        flexWrap: 'wrap',
                                        gap: '16px',
                                        fontFamily: "'Plus Jakarta Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto"
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                                            Mostrando {startIndex + 1} - {Math.min(startIndex + pageSize, totalItems)} de {totalItems} tickets
                                        </div>

                                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => goToPage(1)}
                                                disabled={currentPage === 1}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : '#fff',
                                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.8rem',
                                                    transition: 'all 0.12s'
                                                }}
                                            >
                                                «
                                            </button>

                                            <button
                                                onClick={() => goToPage(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    color: currentPage === 1 ? 'rgba(255,255,255,0.3)' : '#fff',
                                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.8rem',
                                                    transition: 'all 0.12s'
                                                }}
                                            >
                                                ‹
                                            </button>

                                            {(() => {
                                                const pages = [];
                                                const maxVisible = 5;
                                                let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                                                let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                                                if (endPage - startPage + 1 < maxVisible) {
                                                    startPage = Math.max(1, endPage - maxVisible + 1);
                                                }

                                                if (startPage > 1) {
                                                    pages.push(
                                                        <span key="start-dots" style={{ padding: '6px 4px', color: 'rgba(255,255,255,0.4)' }}>...</span>
                                                    );
                                                }

                                                for (let i = startPage; i <= endPage; i++) {
                                                    pages.push(
                                                        <button
                                                            key={i}
                                                            onClick={() => goToPage(i)}
                                                            style={{
                                                                padding: '6px 12px',
                                                                borderRadius: '6px',
                                                                border: '1px solid rgba(255,255,255,0.06)',
                                                                background: i === currentPage
                                                                    ? 'rgba(22, 163, 74, 0.15)'
                                                                    : 'rgba(255,255,255,0.02)',
                                                                color: i === currentPage ? '#16a34a' : '#fff',
                                                                cursor: 'pointer',
                                                                fontSize: '0.85rem',
                                                                fontWeight: i === currentPage ? '600' : '400',
                                                                transition: 'all 0.12s'
                                                            }}
                                                        >
                                                            {i}
                                                        </button>
                                                    );
                                                }

                                                if (endPage < totalPages) {
                                                    pages.push(
                                                        <span key="end-dots" style={{ padding: '6px 4px', color: 'rgba(255,255,255,0.4)' }}>...</span>
                                                    );
                                                }

                                                return pages;
                                            })()}

                                            <button
                                                onClick={() => goToPage(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : '#fff',
                                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.8rem',
                                                    transition: 'all 0.12s'
                                                }}
                                            >
                                                ›
                                            </button>

                                            <button
                                                onClick={() => goToPage(totalPages)}
                                                disabled={currentPage === totalPages}
                                                style={{
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    color: currentPage === totalPages ? 'rgba(255,255,255,0.3)' : '#fff',
                                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.8rem',
                                                    transition: 'all 0.12s'
                                                }}
                                            >
                                                »
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Ir a:</span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={totalPages}
                                                value={currentPage}
                                                onChange={(e) => {
                                                    const page = Number(e.target.value);
                                                    if (page >= 1 && page <= totalPages) {
                                                        goToPage(page);
                                                    }
                                                }}
                                                style={{
                                                    width: '55px',
                                                    padding: '5px 8px',
                                                    borderRadius: '6px',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    background: 'rgba(0,0,0,0.3)',
                                                    color: '#fff',
                                                    textAlign: 'center',
                                                    fontSize: '0.85rem'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="historial-view" style={{ padding: '20px', height: '100%', overflow: 'auto' }}>
                                <button
                                    onClick={handleVolverATickets}
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

                                <div className={`status-indicator ${statusClass}`} style={{ marginBottom: '20px' }}>
                                    ● {ticketActual?.estatus}
                                </div>

                                {loadingHistory ? (
                                    <p style={{ textAlign: 'center', padding: '20px' }}>Cargando historial...</p>
                                ) : (
                                    <div className="chat-history">
                                        {messages.map((msg, i) => (
                                            <div key={i} className={`message-bubble ${msg.sender}`}>
                                                <div className="message-text">
                                                    {formatMessageText(msg.text)}
                                                </div>
                                                <span className="timestamp">
                                                    {new Date(ticketActual.fechaCreacion).toLocaleString()}
                                                </span>
                                            </div>
                                        ))}

                                        {historial.map((h, i) => {
                                            const items = formatHistorialText(h);
                                            return (
                                                <div
                                                    key={i}
                                                    className={`message-bubble history ${h.usuario ? "user" : "system"}`}
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
                                )}

                                {ticketActual?.estatus?.toLowerCase() === 'cerrado' && !ticketActual?.calificacion && (
                                    <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
                                        <h4 style={{ marginBottom: '15px' }}>Califica la atención</h4>
                                        <p style={{ marginBottom: '15px' }}>
                                            Tu ticket <b>{ticketActual.folio}</b> ha finalizado.
                                        </p>

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
                                            style={{ width: '100%', marginTop: '15px' }}
                                        />

                                        <div className="rating-actions" style={{ marginTop: '15px' }}>
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
                                                        handleVolverATickets();
                                                    }, 1500);
                                                }}
                                            >
                                                {ratingLoading ? "Enviando..." : "Enviar"}
                                            </button>
                                        </div>

                                        {ratingSuccess && (
                                            <div className="rating-success" style={{ marginTop: '10px', color: 'green' }}>
                                                {ratingSuccess}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tracking;