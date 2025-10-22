import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllIngenieros } from '../services/ingenieroService';
import { getAllTipoTickets } from '../services/tipoTicketService';
import { getAllEstatus } from '../services/estatus';
import { getAllPrioridad } from '../services/prioridad';
import { getTicketsByIngenieroId, getTicketById, updateTicket } from '../services/ticketService';
// import { stompConnect, sendMessage, stompDisconnect } from '../services/stompService';
import { useNotifications } from '../contexts/NotificationContext';
import AlertModal from './AlertModal';

const TrackingEngineer = () => {
    const { addNotification } = useNotifications();

    const [ingenieros, setIngenieros] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [prioridades, setPrioridades] = useState([]);
    const [estatusList, setEstatusList] = useState([]);
    const [tickets, setTickets] = useState([]);

    const [ticketActual, setTicketActual] = useState(null);
    const [usedIdentifier, setUsedIdentifier] = useState(null);
    const location = useLocation();
    const query = new URLSearchParams(location.search);
    const requestedFolio = query.get('folio');
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 5;

    const formatUsuario = (usuario) => {
        if (!usuario) return '';
        if (typeof usuario === 'string') return usuario;
        if (typeof usuario === 'object') {
            return usuario.nombre || usuario.userName || usuario.username || `${usuario.nombre || ''} ${usuario.apePat || ''} ${usuario.apeMat || ''}`.trim() || JSON.stringify(usuario);
        }
        return String(usuario);
    };

    const [ingenieroEncargado, setIngenieroEncargado] = useState('');
    const [prioridadSeleccionada, setPrioridadSeleccionada] = useState('');
    const [tipoSeleccionado, setTipoSeleccionado] = useState('');
    const [estatusSeleccionado, setEstatusSeleccionado] = useState('Abierto');
    const [comentario, setComentario] = useState('');
    const [modal, setModal] = useState({ visible: false, title: '', message: '' });

    // obtener usuario autenticado desde localStorage
    const getLoggedIngenieroId = () => {
        try {
            const raw = localStorage.getItem('usuario');
            if (!raw) return null;
            const u = JSON.parse(raw);
            // posibles campos
            return u.id || u.idUsuario || u.id_ingeniero || u.userId || null;
        } catch (e) {
            return null;
        }
    };

    // Sin sockets: la vista carga los tickets del ingeniero autenticado
    // y después de cada update vuelve a recargar usando el service.

    const loadTicketsForLoggedIngeniero = async () => {
        // Intentar múltiples identificadores que pueda tener el usuario en localStorage
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

            // eliminar duplicados
            const uniq = Array.from(new Set(candidates));

            // si no hay candidatos, dejar vacío
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
                        // Aceptamos arrays vacíos: el endpoint respondió correctamente
                        // ordenar por fechaCreacion descendente (más recientes primero)
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
                        // si aún no tenemos ticketActual, seleccionar el más reciente (o null si vacío)
                        setTicketActual(prev => prev || (sortedByDateDesc.length ? sortedByDateDesc[0] : null));
                        return sortedByDateDesc;
                    }
                    // si la respuesta no es un array, seguir intentando con otros candidatos
                    console.debug(`TrackingEngineer: respuesta no es array para ${idCandidate}`);
                } catch (err) {
                    lastErr = err;
                    console.warn(`TrackingEngineer: error intentando con ${idCandidate}:`, err.message || err);
                }
            }

            // ninguna candidate devolvió tickets
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

                // seleccionar primer ticket si existe
                setTicketActual(prev => prev || (Array.isArray(tickets) && tickets.length ? tickets[0] : null));
                // Si se solicitó un folio por query param, intentar seleccionarlo
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

    const handleGuardar = async () => {
        if (!ticketActual) return;
        // Construir payload compatible con TicketDTOUpdate esperado por el backend
        const prioridadNombre = (prioridades.find(p => String(p.id_prioridad) === String(prioridadSeleccionada)) || {}).nombre || (typeof prioridadSeleccionada === 'string' ? prioridadSeleccionada : undefined);
        const payload = {
            folio: ticketActual.folio,
            ingeniero: ingenieroEncargado || undefined,
            prioridad: prioridadNombre,
            estatus: estatusSeleccionado,
            comentarios: comentario || undefined,
        };

        try {
            // log para depuración: confirmar qué se envía al backend
            
            const updated = await updateTicket(payload);
            // log para depuración: confirmar la respuesta del backend
            
            addNotification(updated.folio, `Tu ticket ${updated.folio} fue actualizado.`);

                // No usamos STOMP/sockets aquí por ahora

            setTicketActual(updated);
            // mostrar modal personalizado
            setModal({ visible: true, title: 'Ticket actualizado', message: `El ticket ${updated.folio} fue actualizado correctamente.` });
            await loadTicketsForLoggedIngeniero();
        } catch (err) {
            console.error('Error guardando en TrackingEngineer:', err);
            setModal({ visible: true, title: 'Error', message: `No se pudo actualizar el ticket. ${err?.message || ''}` });
        }
    };

    // Cuando cambie el ticket seleccionado, rellenar los campos del panel izquierdo
    useEffect(() => {
        if (!ticketActual) {
            setIngenieroEncargado('');
            setPrioridadSeleccionada('');
            setTipoSeleccionado('');
            setEstatusSeleccionado('Abierto');
            setComentario('');
            return;
        }

        setIngenieroEncargado(ticketActual.ingeniero || '');

        if (ticketActual.id_prioridad) {
            setPrioridadSeleccionada(String(ticketActual.id_prioridad));
        } else if (ticketActual.prioridad) {
            const matched = (prioridades || []).find(p => (p.nombre || '').toLowerCase() === String(ticketActual.prioridad).toLowerCase());
            if (matched) setPrioridadSeleccionada(String(matched.id_prioridad ?? matched.id));
            else setPrioridadSeleccionada(String(ticketActual.prioridad));
        } else setPrioridadSeleccionada('');

        setTipoSeleccionado(ticketActual.tipo_ticket || ticketActual.tipo || '');
        setEstatusSeleccionado(ticketActual.estatus || 'Abierto');
        // sincronizar comentario si existe en el ticket
        setComentario(ticketActual.comentario ?? ticketActual.comentario ?? ticketActual.note ?? '');
    }, [ticketActual, prioridades]);

    return (
        <div className="tracking-root">
            <div className="tracking-main">
                <div className="tracking-header">
                    <h2>Mis tickets asignados</h2>
                </div>

                <div className="tracking-row">
                    <div className="left-panel pill">
                        <div className="label">Solicitante</div>
                        <div className="requester" style={{ background: '#fff', color: '#000', padding: '10px 12px', borderRadius: 8 }}>{ticketActual ? (formatUsuario(ticketActual.usuario) || '—') : '—'}</div>

                        {/* <div className="label">Ingeniero encargado</div>
                        <select value={ingenieroEncargado} onChange={(e) => setIngenieroEncargado(e.target.value)}>
                            <option value="">Sin encargado</option>
                            {ingenieros.map(ing => (
                                <option key={ing.id_ingeniero ?? ing.id ?? ing.idUsuario} value={ing.nombre}>{ing.nombre}</option>
                            ))}
                        </select> */}

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
                        <div className="label">Comentarios</div>
                        <div className="mb-2">
                            <textarea
                                className="form-control"
                                rows={3}
                                placeholder="Agregar algún comentario"
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                            />
                        </div>

                        <div className="left-actions">
                            <button onClick={handleGuardar} className="btn btn-success">Guardar</button>
                            <button onClick={() => { setTicketActual(null); }} className="btn btn-info">Limpiar</button>
                        </div>
                    </div>

                    <div className="center-panel">
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
                                // lista completa ordenada por fecha de creación descendente (más recientes primero)
                                const allSorted = (tickets || []).slice().sort((a, b) => {
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

                                if (!pageItems || pageItems.length === 0) return (<div className="no-ticket">No tienes tickets asignados.</div>);

                                const goToPage = (p) => {
                                    const np = Math.max(1, Math.min(totalPages, p));
                                    setCurrentPage(np);
                                    const el = document.querySelector('.ticket-cards');
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                };

                                return (
                                    <>
                                    <div className="ticket-cards" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {pageItems.map((t) => {
                                            const isSelected = ticketActual && (ticketActual.folio === t.folio || ticketActual.id === t.id);
                                            return (
                                                <div
                                                    key={t.folio ?? t.id}
                                                    className={`ticket-card ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setTicketActual(t);
                                                        // los campos del left panel se sincronizan via useEffect
                                                    }}
                                                    style={{
                                                        padding: 12,
                                                        borderRadius: 8,
                                                        width: '100%',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontSize: 12, opacity: 0.85 }}>Folio: <strong>{t.folio ?? t.id}</strong></div>
                                                            <div style={{ marginTop: 6, fontWeight: 700 }}>{t.tipo_ticket ?? t.tipo ?? '—'}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: 13 }}>{t.usuario ?? t.nombre ?? 'Solicitante'}</div>
                                                            <div style={{ fontSize: 12, opacity: 0.8 }}>{t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleString() : ''}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Paginación simple */}
                                        <nav aria-label="Paginación tickets" style={{ marginTop: 12 }}>
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
                                    </>
                                );
                            })()}
                        </div>

                        
                            </div>
                        </div>
                    {/* Modal personalizado para mensajes */}
                    <AlertModal visible={modal.visible} title={modal.title} message={modal.message} onClose={() => setModal({ visible: false, title: '', message: '' })} />
                    </div>
                </div>
            );
        };

        export default TrackingEngineer;
