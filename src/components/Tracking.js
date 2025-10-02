import React, { useEffect, useState, useRef } from 'react';
import Sidebar from './Sidebar';
import io from 'socket.io-client';
import { getAllUsuarios } from '../services/usuarioService';
import {getAllIngenieros} from '../services/ingenieroService'
import { getAllTipoTickets } from '../services/tipoTicketService';
import { getAllTickets, updateTicket } from '../services/ticketService';
import { useNotifications } from '../contexts/NotificationContext';
import { getAllEstatus } from '../services/estatus';

const pill = {
    background: 'rgba(255,255,255,0.12)',
    padding: '10px 14px',
    borderRadius: 8,
    color: '#fff'
};

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
            // rellenar selects con los valores actuales
            setIngenieroEncargado(newTicket.ingeniero || '');
            setPrioridadSeleccionada(newTicket.prioridad || '');
            setTipoSeleccionado(newTicket.tipo_ticket || '');
            setEstatusSeleccionado(newTicket.estatus || 'Abierto');
        });

        // también actualizar cuando backend confirme actualización
        socketRef.current.on('ticketUpdated', (updated) => {
            console.log('ticketUpdated recibido:', updated);
            // actualizar el ticketActual solo si coincide con el que está seleccionado (evitar closures stale usando función)
            setTicketActual(prev => {
                if (!prev) return prev;
                if (updated.folio === prev.folio || updated.id === prev.id) {
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
                const [ing, t, all, est] = await Promise.all([getAllIngenieros(), getAllTipoTickets(), getAllTickets(), getAllEstatus()]);
                setIngenieros(ing || []);
                setTipos(t || []);
                setTickets(all || []);
                setEstatusList(est || []);
                // obtener prioridades únicas desde tickets existentes
                const uniqPrio = Array.from(new Set((all || []).map(x => x.prioridad).filter(Boolean)));
                setPrioridades(uniqPrio.length ? uniqPrio : ['Alta','Media','Baja']);

                // seleccionar un ticket por defecto para mostrar: preferir uno abierto
                if ((all || []).length > 0) {
                    const firstOpen = (all || []).find(tt => tt.estatus === 'Abierto' || tt.estatus === 'abierto');
                    setTicketActual(firstOpen || all[0]);
                    // rellenar selects con los valores actuales del ticket seleccionado
                    const chosen = firstOpen || all[0];
                    setIngenieroEncargado(chosen.ingeniero || '');
                    setPrioridadSeleccionada(chosen.prioridad || '');
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
            prioridad: prioridadSeleccionada,
            tipo_ticket: tipoSeleccionado,
            estatus: estatusSeleccionado,
        };

        try {
            const updated = await updateTicket(payload);
            // notificar localmente al usuario que elevó el ticket
            addNotification(updated.folio, `Tu ticket ${updated.folio} fue asignado al ingeniero ${updated.ingeniero}`);

            // emitir al servidor para que lo notifique a otros clientes si aplica
            if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('assignTicket', { folio: updated.folio, ingeniero: updated.ingeniero });
            }

            setTicketActual(updated);
            alert('Ticket actualizado y notificación enviada.');
        } catch (err) {
            console.error('Error guardando actualización del ticket:', err);
            alert('Error al guardar la asignación.');
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', color: '#fff' }}>
            <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Asignación de ticket</h2>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', flex: 1 }}>
                    {/* Left panel: form */}
                        <div style={{ width: 320, minHeight: 500, ...pill, background: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ fontWeight: 700 }}>Solicitante</div>
                            <div style={{ background: '#fff', color: '#000000ff', padding: '10px 12px', borderRadius: 8 }}>{ticketActual?.usuario ?? '—'}</div>

                            <div style={{ fontWeight: 700 }}>Ingeniero encargado</div>
                            <select value={ingenieroEncargado} onChange={(e) => setIngenieroEncargado(e.target.value)} style={{ padding: '10px', borderRadius: 8, color: '#000000ff' }}>
                                <option value="">Sin encargado</option>
                                {ingenieros.map(ing => (
                                    <option style={{color:"black"}} key={ing.id_ingeniero ?? ing.id ?? ing.idUsuario} value={ing.nombre}>{ing.nombre}</option>
                                ))}
                            </select>

                            <div style={{ fontWeight: 700 }}>Prioridad</div>
                            <select value={prioridadSeleccionada} onChange={(e) => setPrioridadSeleccionada(e.target.value)} style={{ padding: '10px', borderRadius: 8, color: '#000000ff' }}>
                                <option value="">Sin prioridad</option>
                                {prioridades.map(p => (
                                    <option style={{color:"black"}} key={p} value={p}>{p}</option>
                                ))}
                            </select>

                            <div style={{ fontWeight: 700 }}>Tipo</div>
                            <select value={tipoSeleccionado} onChange={(e) => setTipoSeleccionado(e.target.value)} style={{ padding: '10px', borderRadius: 8, color: '#000000ff' }}>
                                <option value="">Selecciona un tipo</option>
                                {tipos.map(t => (
                                    <option style={{color:"black"}} key={t.idTipoTicket ?? t.id} value={t.tipo}>{t.tipo}</option>
                                ))}
                            </select>

                            <div style={{ fontWeight: 700 }}>Estatus</div>
                            <select value={estatusSeleccionado} onChange={(e) => setEstatusSeleccionado(e.target.value)} style={{ padding: '10px', borderRadius: 8, color: '#000000ff' }}>
                                {estatusList && estatusList.length > 0 ? (
                                    estatusList.map(es => (
                                        <option style={{color:"black"}} key={es.id_estatus ?? es.id} value={es.nombre ?? es.estatus ?? es.value}>{es.nombre ?? es.estatus ?? es.value}</option>
                                    ))
                                ) : (
                                    <>
                                        <option value="Abierto">Abierto</option>
                                        <option value="En proceso">En proceso</option>
                                        <option value="Cerrado">Cerrado</option>
                                    </>
                                )}
                            </select>

                            <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                                <button onClick={handleGuardar} style={{ background: '#2ecc71', border: 'none', padding: '12px 16px', borderRadius: 8 }}>Guardar</button>
                                <button onClick={() => { setTicketActual(null); }} style={{ background: '#e74c3c', border: 'none', padding: '12px 16px', borderRadius: 8 }}>Limpiar</button>
                            </div>
                        </div>

                    {/* Center panel: chat and ticket details */}
                    <div style={{ flex: 1, minHeight: 550, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontWeight: 700 }}>Asunto : {ticketActual?.tipo_ticket ?? '—'}</div>
                                <div style={{ fontSize: 12, opacity: 0.85 }}>Fecha: {ticketActual ? new Date(ticketActual.fechaCreacion).toLocaleString() : '—'} · Departamento: {ticketActual?.departamento ?? ticketActual?.area ?? '—'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div>Folio : {ticketActual?.folio ?? '—'}</div>
                                <div>Encargado : {ticketActual?.ingeniero ?? 'Sin encargado'}</div>
                                <div style={{ color: ticketActual?.estatus === 'Abierto' ? '#2ecc71' : '#f39c12', fontWeight: 700 }}>{ticketActual?.estatus ?? '—'}</div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {/* Mensajes de ejemplo: si ticketActual tiene conversación, mostrarla */}
                            {(ticketActual?.conversacion || []).length > 0 ? (
                                (ticketActual.conversacion).map((m, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: m.sender === 'user' ? 'flex-start' : 'flex-end' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff' }} />
                                        <div style={{ background: '#cfe9d9', color: '#000', padding: 12, borderRadius: 12, maxWidth: '70%' }}>
                                            {m.text}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                ticketActual ? (
                                    <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>No hay mensajes todavía en este ticket.</div>
                                ) : (
                                    <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>Selecciona o espera a que llegue un ticket nuevo.</div>
                                )
                            )}
                        </div>

                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input placeholder="Agregar algún comentario" style={{color: "black", flex: 1, padding: '12px 16px', borderRadius: 24, border: 'none', outline: 'none' }} />
                            <button style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: 'none' }}>↑</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tracking;
