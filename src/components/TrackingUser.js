import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTicketsByUsuarioId } from '../services/ticketService';
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
    const [selectedFolio, setSelectedFolio] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const perPage = 10;

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


            try {
                if (userId) {
                    // usar endpoint TicketsByUserId
                    const t = await getTicketsByUsuarioId(userId);
                    setUserTickets(Array.isArray(t) ? t : []);
                    setDebugAttempts(attempts);
                    setLoading(false);
                    return;
                }

                // si sólo hay userName no tenemos endpoint directo aquí; dejar vacío
                if (userName) {
                    setUserTickets([]);
                    setDebugAttempts(attempts);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error('Error obteniendo tickets del usuario:', e);
                setDebugAttempts([{ ok: false, status: 0, body: e.message || String(e), url: `TicketsByUserId?userId=${userId}` }]);
            }

            setDebugAttempts(attempts);
            setLoading(false);
        })();
    }, []);

    // Calcular totales
    const totalTickets = userTickets.length;
    const totalCerrados = userTickets.filter(t => t.estatus && t.estatus.toLowerCase() === 'cerrado').length;

    return (
        <div className="tracking-user-root" style={{ display: 'flex', minHeight: '100vh' }}>
            <div style={{ flex: 1, padding: 28 }}>
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
                        <input placeholder="Folio" value={filterFolio} onChange={e => { setFilterFolio(e.target.value); setCurrentPage(1); }} style={{ padding: '10px 14px', borderRadius: 20, border: 'none', outline: 'none', minWidth: 220 }} />
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

                            // ordenar por fechaCreacion descendente (más recientes primero)
                            const sorted = (filtered || []).slice().sort((a, b) => {
                                const da = a.fechaCreacion ? new Date(a.fechaCreacion) : new Date(0);
                                const db = b.fechaCreacion ? new Date(b.fechaCreacion) : new Date(0);
                                return db - da;
                            });

                            const total = sorted.length;
                            const totalPages = Math.max(1, Math.ceil(total / perPage));
                            const start = (currentPage - 1) * perPage;
                            const pageItems = sorted.slice(start, start + perPage);

                            const goToPage = (p) => {
                                const np = Math.max(1, Math.min(totalPages, p));
                                setCurrentPage(np);
                                // scroll to top of list (optional)
                                const el = document.querySelector('.ticket-cards');
                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            };

                            return (
                                <>
                                    <div className="ticket-cards">
                                        {pageItems && pageItems.length > 0 ? (
                                            pageItems.map(ticket => {
                                            const isSelected = String(selectedFolio) === String(ticket.folio ?? ticket.id);
                                            return (
                                                <div
                                                    key={ticket.folio ?? ticket.id}
                                                    className={`ticket-card ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => { setSelectedFolio(ticket.folio ?? ticket.id); handleView(ticket.folio ?? ticket.id); }}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { setSelectedFolio(ticket.folio ?? ticket.id); handleView(ticket.folio ?? ticket.id); } }}
                                                    >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                        <div>
                                                            <div style={{ fontSize: 12, opacity: 0.85 }}>Folio: <strong>{ticket.folio}</strong></div>
                                                            <div style={{ marginTop: 6, fontWeight: 700 }}>{ticket.tipo_ticket ?? ticket.tipo ?? '—'}</div>
                                                            <div style={{ marginTop: 6 }}>{ticket.descripcion}</div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontSize: 13 }}>{ticket.usuario ?? ticket.nombre ?? ticket.userName}</div>
                                                            <div style={{ fontSize: 12, opacity: 0.8 }}>{ticket.fechaCreacion ? new Date(ticket.fechaCreacion).toLocaleString() : ''}</div>
                                                            <div style={{ marginTop: 8 }}>
                                                                <span style={{ padding: '4px 8px', borderRadius: 6, fontWeight: 700, background: ticket.estatus === 'Abierto' ? '#70e9aaff' : '#ef7d7dff', color: ticket.estatus === 'Abierto' ? '#166534' : '#991b1b' }}>{ticket.estatus}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                        ) : (
                                            <div>No hay tickets registrados</div>
                                        )}
                                    </div>

                                    {/* Paginación estilo Bootstrap */}
                                    <nav aria-label="Page navigation example" style={{ marginTop: 12 }}>
                                        <ul className="pagination justify-content-end" style={{ display: 'flex', gap: 6, listStyle: 'none', padding: 0 }}>
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`} onClick={() => currentPage > 1 && goToPage(currentPage - 1)} style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                                                <a className="page-link" href="#" tabIndex={-1} aria-disabled={currentPage === 1}>Previous</a>
                                            </li>
                                            {Array.from({ length: totalPages }).map((_, idx) => {
                                                const p = idx + 1;
                                                return (
                                                    <li key={p} className={`page-item ${p === currentPage ? 'active' : ''}`} onClick={() => goToPage(p)} style={{ cursor: 'pointer' }}>
                                                        <a className="page-link" href="#">{p}</a>
                                                    </li>
                                                );
                                            })}
                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`} onClick={() => currentPage < totalPages && goToPage(currentPage + 1)} style={{ cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                                                <a className="page-link" href="#">Next</a>
                                            </li>
                                        </ul>
                                    </nav>
                                </>
                            );
                        })()
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackingUser;
