import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTicketsByUsuario  } from '../services/ticketService';
import Sidebar from './Sidebar';

const cardStyle = {
    background: 'rgba(255,255,255,0.12)',
    padding: 24,
    borderRadius: 10,
    color: '#000',
    minWidth: 260
};

const TrackingUser = () => {
    const navigate = useNavigate();

    const handleView = (folio) => {
        // navegar a la vista de ticket
        navigate(`/ticket/${folio}`);
    };

    const handleStatusClick = (folio) => {
        // placeholder: mostrar modal o acción rápida
        alert(`Mostrar opciones de estado para folio ${folio}`);
    };

    // Estado para tickets del usuario
    const [userTickets, setUserTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterFolio, setFilterFolio] = useState('');
    const [debugAttempts, setDebugAttempts] = useState([]);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        (async () => {
            if (!usuarioGuardado) {
                setUserTickets([]);
                setLoading(false);
                return;
            }
            const usuario = JSON.parse(usuarioGuardado);
            const userId = usuario.id || usuario.userId || usuario.idUsuario || usuario.id_usuario || null;
            const userName = usuario.userName || usuario.user || usuario.username || usuario.nombre || '';

            const attempts = [];

            setDebugAttempts(attempts);
            setLoading(false);
        })();
    }, []);

    // Calcular totales
    const totalTickets = userTickets.length;
    const totalCerrados = userTickets.filter(t => t.estatus && t.estatus.toLowerCase() === 'cerrado').length;

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <div style={{ flex: 1, padding: 28, color: '#fff' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    </div>
                </header>

                <div className='' style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 28 }}>
                    <div style={{ ...cardStyle, color: '#000', background: '#267ac8ff' }}>
                        <div style={{ fontSize: 14 }}>Tickets totales</div>
                        <div style={{ fontSize: 48, fontWeight: 800 }}>{loading ? '...' : totalTickets}</div>
                    </div>

                    <div style={{ ...cardStyle, color: '#000', background: '#eb8d9bff' }}>
                        <div style={{ fontSize: 14 }}>Tickets cerrados</div>
                        <div style={{ fontSize: 48, fontWeight: 800, color: '#e74c3c' }}>{loading ? '...' : totalCerrados}</div>
                    </div>

                    <div style={{ marginLeft: 'auto' }}>
                        <input placeholder="Folio" value={filterFolio} onChange={e => setFilterFolio(e.target.value)} style={{ padding: '10px 14px', borderRadius: 20, border: 'none', outline: 'none', minWidth: 220 }} />
                    </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.12)', padding: 24, borderRadius: 10 }}>

                    <hr style={{ border: 'none', height: 2, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

                    {loading ? (
                        <div>Cargando tickets...</div>
                    ) : (
                        (() => {
                            const filtered = userTickets.filter(t => {
                                if (!filterFolio) return true;
                                const f = String(filterFolio).trim().toLowerCase();
                                return String(t.folio ?? t.id ?? '').toLowerCase().includes(f);
                            });

                            return (
                                <div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                <th style={{ padding: '8px' }}>Folio</th>
                                                <th style={{ padding: '8px' }}>Usuario</th>
                                                <th style={{ padding: '8px' }}>Tipo de Ticket</th>
                                                <th style={{ padding: '8px' }}>Fecha de Creación</th>
                                                <th style={{ padding: '8px' }}>Estatus</th>
                                                <th style={{ padding: '8px' }}>Descripción</th>
                                                <th style={{ padding: '8px' }}>Ingeniero</th>
                                                <th style={{ padding: '8px' }}>Ticket Maestro</th>
                                                <th style={{ padding: '8px' }}>Prioridad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered && filtered.length > 0 ? (
                                                filtered.map((ticket) => (
                                                    <tr key={ticket.folio ?? ticket.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <td style={{ padding: '8px' }}>{ticket.folio}</td>
                                                        <td style={{ padding: '8px' }}>{ticket.usuario ?? ticket.nombre ?? ticket.userName}</td>
                                                        <td style={{ padding: '8px' }}>{ticket.tipo_ticket}</td>
                                                        <td style={{ padding: '8px' }}>{ticket.fechaCreacion ? new Date(ticket.fechaCreacion).toLocaleString() : (ticket.fecha ? new Date(ticket.fecha).toLocaleString() : '—')}</td>
                                                        <td style={{ padding: '8px' }}><span style={{ padding: '4px 8px', borderRadius: 6, fontWeight: 700, background: ticket.estatus === 'Abierto' ? '#d1fae5' : '#fee2e2', color: ticket.estatus === 'Abierto' ? '#166534' : '#991b1b' }}>{ticket.estatus}</span></td>
                                                        <td style={{ padding: '8px' }}>{ticket.descripcion}</td>
                                                        <td style={{ padding: '8px' }}>{ticket.ingeniero}</td>
                                                        <td style={{ padding: '8px' }}>{ticket.ticketMaestro ?? 'N/A'}</td>
                                                        <td style={{ padding: '8px' }}><span style={{ padding: '4px 8px', borderRadius: 6, fontWeight: 700, background: ticket.prioridad === 'Alta' ? '#fee2e2' : ticket.prioridad === 'Media' ? '#fef3c7' : '#ecfccb', color: ticket.prioridad === 'Alta' ? '#991b1b' : ticket.prioridad === 'Media' ? '#92400e' : '#14532d' }}>{ticket.prioridad}</span></td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={9} style={{ padding: '12px' }}>No hay tickets registrados</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    {(!filtered || filtered.length === 0) && debugAttempts && debugAttempts.length > 0 && (
                                        <div style={{ marginTop: 12, fontSize: 12, opacity: 0.9 }}>
                                            Intentos realizados (debug):
                                            <ul>
                                                {debugAttempts.map((d, i) => (
                                                    <li key={i} style={{ marginTop: 6 }}>
                                                        <strong>{d.url || 'url n/a'}</strong> — status: {d.status} — ok: {String(d.ok)} — body: {typeof d.body === 'string' ? d.body.slice(0, 160) : (Array.isArray(d.body) ? `Array(${d.body.length})` : JSON.stringify(d.body))}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackingUser;
