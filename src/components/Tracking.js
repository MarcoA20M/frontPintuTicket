import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar';
import AlertModal from './Alerts/AlertModal';
import io from 'socket.io-client';
import { sendMessage, connect as stompConnect } from '../services/stompService';
import { getAllUsuarios } from '../services/usuarioService';
import {getAllIngenieros} from '../services/ingenieroService'
import { getAllTipoTickets } from '../services/tipoTicketService';
import { getAllTickets, getTicketById, updateTicket } from '../services/ticketService';
import { useNotifications } from '../contexts/NotificationContext';
import { getAllEstatus } from '../services/estatus';
import { getAllPrioridad } from '../services/prioridad';

import '../components/Styles/tracking.css';

const Tracking = () => {
    const socketRef = useRef(null);
    const { addNotification } = useNotifications();

    const [ingenieros, setIngenieros] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [prioridades, setPrioridades] = useState([]);
    const [estatusList, setEstatusList] = useState([]);
    const [tickets, setTickets] = useState([]);

    // ticket actualmente seleccionado/recibido por socket
    const [ticketActual, setTicketActual] = useState(null);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertData, setAlertData] = useState({ title: '', message: '' });

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

    // campos editables
    const [ingenieroEncargado, setIngenieroEncargado] = useState('');
    const [prioridadSeleccionada, setPrioridadSeleccionada] = useState('');
    const [tipoSeleccionado, setTipoSeleccionado] = useState('');
    const [estatusSeleccionado, setEstatusSeleccionado] = useState('Abierto');

    // Conectar socket y listeners (run once)
    useEffect(() => {
        // conectar al servidor socket (ajusta URL si tu servidor usa otro puerto/namespace)
        socketRef.current = io('http://localhost:8080');

        socketRef.current.on('connect', () => {
            console.log('Socket conectado, id=', socketRef.current.id);
        });

        // Evento entrante cuando se crea un ticket (backend debe emitirlo)
        socketRef.current.on('ticketCreated', (newTicket) => {
            console.log('ticketCreated recibido:', newTicket);
            setTicketActual(newTicket);
            // rellenar selects con los valores actuales (mapear prioridad a id si es necesario)
            setIngenieroEncargado(newTicket.ingeniero || '');
            if (newTicket.id_prioridad) {
                setPrioridadSeleccionada(String(newTicket.id_prioridad));
            } else if (newTicket.prioridad) {
                // intentar mapear por nombre usando prioridades ya cargadas
                const matched = (prioridades || []).find(p => (p.nombre || '').toLowerCase() === String(newTicket.prioridad).toLowerCase());
                if (matched) setPrioridadSeleccionada(String(matched.id_prioridad ?? matched.id));
                else setPrioridadSeleccionada('');
            } else {
                setPrioridadSeleccionada('');
            }
            setTipoSeleccionado(newTicket.tipo_ticket || '');
            setEstatusSeleccionado(newTicket.estatus || 'Abierto');
        });

        // también actualizar cuando backend confirme actualización
        socketRef.current.on('ticketUpdated', (updated) => {
            console.log('ticketUpdated recibido:', updated);
            // si coincide con el seleccionado, reemplazar y actualizar selects
            setTicketActual(prev => {
                if (!prev) return prev;
                if (updated.folio === prev.folio || updated.id === prev.id) {
                    // actualizar selects también
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

    // cargar datos necesarios: usuarios, tipos y prioridades (desde tickets existentes)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ing, t, all, est, prio] = await Promise.all([getAllIngenieros(), getAllTipoTickets(), getAllTickets(), getAllEstatus(), getAllPrioridad()]);
                setIngenieros(ing || []);
                setTipos(t || []);
                setTickets(all || []);
                setEstatusList(est || []);

                // prioridades: preferir las que trae el endpoint; si no hay, derivar desde tickets
                if (prio && prio.length > 0) {
                    // normalizar objetos a forma { id_prioridad, nombre }
                    const normalized = prio.map(p => ({ id_prioridad: p.id_prioridad ?? p.id ?? p.idPrioridad ?? p.id, nombre: p.nombre ?? p.prioridad ?? p.label ?? String(p) }));
                    // guardar como arreglo de objetos; para el select usaremos strings en value
                    setPrioridades(normalized);
                } else {
                    const uniqPrio = Array.from(new Set((all || []).map(x => x.prioridad).filter(Boolean)));
                    const fallback = uniqPrio.length ? uniqPrio.map((name, idx) => ({ id_prioridad: idx + 1, nombre: name })) : [{ id_prioridad: 1, nombre: 'Alta' }, { id_prioridad: 2, nombre: 'Media' }, { id_prioridad: 3, nombre: 'Baja' }];
                    setPrioridades(fallback);
                }

                // seleccionar un ticket por defecto para mostrar: preferir uno abierto
                if ((all || []).length > 0) {
                    const firstOpen = (all || []).find(tt => tt.estatus === 'Abierto' || tt.estatus === 'abierto');
                    const chosen = firstOpen || all[0];
                    setTicketActual(chosen);
                    // rellenar selects con los valores actuales del ticket seleccionado
                    setIngenieroEncargado(chosen.ingeniero || '');
                    // si el ticket trae id_prioridad usarlo, si solo trae texto intentar mapear al id
                    if (chosen.id_prioridad) {
                        setPrioridadSeleccionada(String(chosen.id_prioridad));
                    } else if (chosen.prioridad) {
                        const matched = (prio && prio.length ? prio : []).find(p => (p.nombre || p.prioridad || '').toLowerCase() === String(chosen.prioridad).toLowerCase());
                        if (matched) setPrioridadSeleccionada(String(matched.id_prioridad ?? matched.id));
                        // else {
                        //     // intentar con fallback list
                        //     const fb = ((uniqPrio && uniqPrio.length) ? uniqPrio : []).find(n => n.toLowerCase() === String(chosen.prioridad).toLowerCase());
                        //     if (fb) {
                        //         const idx = ((uniqPrio || []).indexOf(fb));
                        //         setPrioridadSeleccionada(idx >= 0 ? idx + 1 : '');
                        //     }
                        // }
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

    const handleGuardar = async () => {
        if (!ticketActual) return;

        const payload = {
            // envia lo que el backend espera para updateTicket: puede ser id o folio
            id: ticketActual.id ?? ticketActual.folio,
            folio: ticketActual.folio,
            ingeniero: ingenieroEncargado,
            // prioridad: nombre legible (opcional), id_prioridad: número si está seleccionado
            prioridad: (prioridades.find(p => String(p.id_prioridad) === String(prioridadSeleccionada)) || {}).nombre || (typeof prioridadSeleccionada === 'string' ? prioridadSeleccionada : undefined),
            id_prioridad: prioridadSeleccionada ? Number(prioridadSeleccionada) : undefined,
            tipo_ticket: tipoSeleccionado,
            estatus: estatusSeleccionado,
        };

        try {
            const updated = await updateTicket(payload);
            // notificar localmente al usuario que ejecutó la acción (ingeniero)
            addNotification(updated.folio, `Tu ticket ${updated.folio} FUE ACTUALIZADO POR: ${updated.ingeniero}`);

            // emitir al servidor para que lo notifique a otros clientes (por ejemplo al solicitante) vía STOMP
            try {
                // conectar STOMP si es necesario
                await stompConnect({ url: 'http://localhost:8080/ws' });

                // evento legacy: también enviar a /app/assignTicket si el backend lo maneja
                await sendMessage('/app/assignTicket', { folio: updated.folio, ingeniero: updated.ingeniero });

                // obtener ticket completo para construir payload
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
            // mostrar modal personalizado en vez de alert nativo
            setAlertData({ title: 'Ticket actualizado', message: `Ticket ${updated.folio} actualizado y notificación enviada.` });
            setAlertVisible(true);
        } catch (err) {
            console.error('Error guardando actualización del ticket:', err);
            const detail = err && err.message ? err.message : 'Error al guardar la asignación.';
            setAlertData({ title: 'Error', message: `No se pudo actualizar el ticket: ${detail}` });
            setAlertVisible(true);
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
                {/* Header */}
                <div className="tracking-header">
                    <h2>Asignación de ticket</h2>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} />
                </div>

                <div className="tracking-row">
                    {/* Left panel: form */}
                    <div className="left-panel pill">
                        <div className="label">Solicitante</div>
                        <div className="requester" style={{ background: '#fff', color: '#000', padding: '10px 12px', borderRadius: 8 }}>{ticketActual ? (formatUsuario(ticketActual.usuario) || '—') : '—'}</div>

                        <div className="label">Ingeniero encargado</div>
                        <select value={ingenieroEncargado} onChange={(e) => setIngenieroEncargado(e.target.value)}>
                            <option style={{color: "black"}} value="">Sin encargado</option>
                            {ingenieros.map(ing => (
                                <option style={{color: "black"}} key={ing.id_ingeniero ?? ing.id ?? ing.idUsuario} value={ing.nombre}>{ing.nombre}</option>
                            ))}
                        </select>

                        <div className="label">Prioridad</div>
                        <select value={prioridadSeleccionada} onChange={(e) => setPrioridadSeleccionada(e.target.value)}>
                            <option style={{color: "black"}} value="">Sin prioridad</option>
                            {prioridades.map(p => (
                                <option style={{color: "black"}}key={p.id_prioridad ?? p.id ?? p.nombre} value={String(p.id_prioridad ?? p.id ?? p.nombre)}>{p.nombre ?? p.prioridad ?? p}</option>
                            ))}
                        </select>

                        <div className="label">Tipo</div>
                        <select value={tipoSeleccionado} onChange={(e) => setTipoSeleccionado(e.target.value)}>
                            <option style={{color: "black"}} value="">Selecciona un tipo</option>
                            {tipos.map(t => (
                                <option style={{color: "black"}} key={t.idTipoTicket ?? t.id} value={t.tipo}>{t.tipo}</option>
                            ))}
                        </select>

                        <div className="label">Estatus</div>
                        <select value={estatusSeleccionado} onChange={(e) => setEstatusSeleccionado(e.target.value)}>
                            {estatusList && estatusList.length > 0 ? (
                                estatusList.map(es => (
                                    <option style={{color: "black"}} key={es.id_estatus ?? es.id} value={es.nombre ?? es.estatus ?? es.value}>{es.nombre ?? es.estatus ?? es.value}</option>
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
                            <button onClick={() => { setTicketActual(null); }} className="btn btn-info">Limpiar</button>
                        </div>
                    </div>

                    {/* Center panel: chat and ticket details */}
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

                        {/* Lista de los 5 tickets en cola (Abiertos) - FIFO: el primero que llegó aparece arriba */}
                        <div className="messages">
                            {(() => {
                                const queue = (tickets || [])
                                    .filter(t => (t.estatus || '').toLowerCase() === 'abierto')
                                    .sort((a, b) => new Date(a.fechaCreacion) - new Date(b.fechaCreacion));
                                const five = queue.slice(0, 5);
                                if (five.length === 0) {
                                    return (
                                        <div className="no-ticket">No hay tickets en cola. Espera a que llegue un ticket nuevo.</div>
                                    );
                                }
                                return (
                                    <div className="ticket-cards" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {five.map((t) => {
                                            const isSelected = ticketActual && (ticketActual.folio === t.folio || ticketActual.id === t.id);
                                            return (
                                                <div
                                                    key={t.folio ?? t.id}
                                                    className={`ticket-card ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        // seleccionar ticket y rellenar panel izquierdo
                                                        setTicketActual(t);
                                                        setIngenieroEncargado(t.ingeniero || '');
                                                        if (t.id_prioridad) setPrioridadSeleccionada(String(t.id_prioridad));
                                                        else if (t.prioridad) {
                                                            const matched = (prioridades || []).find(p => (p.nombre || '').toLowerCase() === String(t.prioridad).toLowerCase());
                                                            if (matched) setPrioridadSeleccionada(String(matched.id_prioridad ?? matched.id));
                                                            else setPrioridadSeleccionada('');
                                                        } else setPrioridadSeleccionada('');
                                                        setTipoSeleccionado(t.tipo_ticket || '');
                                                        setEstatusSeleccionado(t.estatus || 'Abierto');
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
                                );
                            })()}
                        </div>

                        {/* footer-input se mantiene solo con comentario breve (no afecta la selección) */}
                        <div className="footer-input">
                            <input placeholder="Agregar algún comentario" />
                            <button>↑</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tracking;
