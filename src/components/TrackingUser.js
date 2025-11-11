import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTicketsByUsuarioId } from '../services/ticketService';
import Sidebar from './Sidebar';
import './Styles/tracking.css';

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
        <div className="tracking-user-root">
            <div className="tracking-user-content">
                <header className="tracking-user-header">
                    <div className="tracking-user-header-left" />
                </header>

                <div className="tracking-user-stats">
                    <div className="tracking-user-card tracking-user-card-total">
                        <div className="tracking-user-card-label">Tickets totales</div>
                        <div className="tracking-user-card-number">{loading ? '...' : totalTickets}</div>
                    </div>

                    <div className="tracking-user-card tracking-user-card-closed">
                        <div className="tracking-user-card-label">Tickets cerrados</div>
                        <div className="tracking-user-card-number tracking-user-card-number-closed">{loading ? '...' : totalCerrados}</div>
                    </div>

                    <div className="tracking-user-filter">
                        <input placeholder="Folio" value={filterFolio} onChange={e => { setFilterFolio(e.target.value); setCurrentPage(1); }} />
                    </div>
                </div>

                <div className="tracking-user-panel">

                    <hr />

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
                                                    <div className="ticket-card-top">
                                                        <div className="ticket-card-left">
                                                            <div className="ticket-card-info">Folio: <strong>{ticket.folio}</strong></div>
                                                            <div className="ticket-card-title">{ticket.tipo_ticket ?? ticket.tipo ?? '—'}</div>
                                                            <div className="ticket-card-desc">{ticket.descripcion}</div>
                                                        </div>
                                                        <div className="ticket-card-right">
                                                            <div className="ticket-card-user">{ticket.usuario ?? ticket.nombre ?? ticket.userName}</div>
                                                            <div className="ticket-card-date">{ticket.fechaCreacion ? new Date(ticket.fechaCreacion).toLocaleString() : ''}</div>
                                                            <div className="ticket-card-badge-wrapper">
                                                                {(() => {
                                                                    const s = String(ticket.estatus ?? '').toLowerCase().trim();
                                                                    const statusClass = s.includes('progres') ? 'status-progress' : (s === 'abierto' ? 'status-open' : 'status-other');
                                                                    return <span className={`status-badge ${statusClass}`}>{ticket.estatus}</span>;
                                                                })()}
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
                                    <nav aria-label="Paginación tickets" className="tracking-user-pagination">
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
                        })()
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrackingUser;
