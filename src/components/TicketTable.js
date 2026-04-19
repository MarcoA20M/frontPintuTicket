import React, { useEffect, useState } from "react";
import { getAllTickets } from "../services/ticketService";
import { getAllTipoTickets } from "../services/tipoTicketService";
import { getAllIngenieros } from "../services/ingenieroService";
import { getAllPrioridad } from "../services/prioridad";
import './Styles/TicketTable.css';


const TicketTable = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroPrioridad, setFiltroPrioridad] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("");
    const [filtroIngeniero, setFiltroIngeniero] = useState("");
    const [sortBy, setSortBy] = useState("");
    // opciones cargadas desde servicios
    const [prioridadesOptions, setPrioridadesOptions] = useState([]);
    const [tiposOptions, setTiposOptions] = useState([]);
    const [ingenierosOptions, setIngenierosOptions] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [terminoBusqueda, setTerminoBusqueda] = useState("");
    const [filtroEstatus, setFiltroEstatus] = useState("");
    const estatus = Array.from(new Set(tickets.map(t => t.estatus).filter(Boolean)));

    useEffect(() => {
        const fetchTickets = async () => {
            try {
                const data = await getAllTickets();
                setTickets(data);
            } catch (err) {
                setError("No se pudieron cargar los tickets.");
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, []);

    // Cargar opciones desde servicios (prioridad, tipos, ingenieros)
    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [pData, tiposData, engenData] = await Promise.all([
                    getAllPrioridad().catch(() => []),
                    getAllTipoTickets().catch(() => []),
                    getAllIngenieros().catch(() => []),
                ]);

                // Normalizar prioridades a strings
                const pOpts = Array.isArray(pData) ? pData.map(p => (typeof p === 'string' ? p : (p.nombre || p.prioridad || p.value || String(p)))).filter(Boolean) : [];

                // Normalizar tipos (tipoTicketService devuelve { idTipoTicket, tipo })
                const tOpts = Array.isArray(tiposData) ? tiposData.map(t => (t.tipo || t.nombre || String(t))).filter(Boolean) : [];

                // Normalizar ingenieros (puede devolver objetos con 'nombre')
                const iOpts = Array.isArray(engenData) ? engenData.map(i => (i.nombre || i.name || i.usuario || String(i))).filter(Boolean) : [];

                setPrioridadesOptions(pOpts);
                setTiposOptions(tOpts);
                setIngenierosOptions(iOpts);
            } catch (err) {
                console.error('Error cargando opciones:', err);
            } finally {
                setLoadingOptions(false);
            }
        };

        fetchOptions();
    }, []);

    // Paginación: tamaño de página y página actual
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [filtroPrioridad, filtroTipo, filtroIngeniero, filtroEstatus, terminoBusqueda, pageSize]);

    if (loading) return <p>Cargando tickets...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;



    const formatUsuario = (usuario) => {
        if (!usuario) return '';
        if (typeof usuario === 'string') return usuario;
        if (typeof usuario === 'object') {
            return usuario.nombre || usuario.userName || usuario.username ||
                `${usuario.nombre || ''} ${usuario.apePat || ''} ${usuario.apeMat || ''}`.trim() ||
                JSON.stringify(usuario);
        }
        return String(usuario);
    };

    const detectarTipoBusqueda = (texto) => {
        if (!texto.trim()) return 'auto';
        const esNumero = /^\d+$/.test(texto.trim());
        const esFolioFormato = /^[A-Za-z]*[-_]?\d+$/i.test(texto.trim());
        if (esNumero || esFolioFormato) return 'folio';
        return 'usuario';
    };

    const filtrarTicketsPorBusqueda = (ticketsList) => {
        if (!terminoBusqueda.trim()) return ticketsList;
        const busquedaLower = terminoBusqueda.toLowerCase().trim();
        const tipoDetectado = detectarTipoBusqueda(terminoBusqueda);
        return ticketsList.filter(ticket => {
            if (tipoDetectado === 'folio') {
                return String(ticket.folio || ticket.id || '').toLowerCase().includes(busquedaLower);
            } else {
                return formatUsuario(ticket.usuario).toLowerCase().includes(busquedaLower);
            }
        });
    };




    // opciones únicas para selects
    const prioridades = Array.from(new Set(tickets.map(t => t.prioridad).filter(Boolean)));
    const tipos = Array.from(new Set(tickets.map(t => t.tipo_ticket).filter(Boolean)));
    const ingenieros = Array.from(new Set(tickets.map(t => t.ingeniero).filter(Boolean)));

    // Si los servicios devolvieron opciones, úsalas; si no, fallback a las derivadas de tickets
    const displayPrioridades = (prioridadesOptions && prioridadesOptions.length) ? prioridadesOptions : prioridades;
    const displayTipos = (tiposOptions && tiposOptions.length) ? tiposOptions : tipos;
    const displayIngenieros = (ingenierosOptions && ingenierosOptions.length) ? ingenierosOptions : ingenieros;

    let filteredTickets = tickets.filter(t => {
        return (
            (!filtroPrioridad || t.prioridad === filtroPrioridad) &&
            (!filtroTipo || t.tipo_ticket === filtroTipo) &&
            (!filtroIngeniero || t.ingeniero === filtroIngeniero) &&
            (!filtroEstatus || (t.estatus || '').toLowerCase() === filtroEstatus.toLowerCase())
        );
    });

    // ========== ESTA ES LA LÍNEA QUE TE FALTABA ==========
    filteredTickets = filtrarTicketsPorBusqueda(filteredTickets);
    // ====================================================





    // ordenar por fechaCreacion descendente (más recientes primero)
    filteredTickets = filteredTickets.slice().sort((a, b) => {
        const da = a.fechaCreacion ? new Date(a.fechaCreacion) : new Date(0);
        const db = b.fechaCreacion ? new Date(b.fechaCreacion) : new Date(0);
        return db - da;
    });

    // Si el usuario seleccionó un sortBy explícito, aplicarlo (manteniendo la prioridad de fecha)
    if (sortBy) {
        filteredTickets = [...filteredTickets].sort((a, b) => {
            const va = (a[sortBy] || '').toString().toLowerCase();
            const vb = (b[sortBy] || '').toString().toLowerCase();
            if (va < vb) return -1;
            if (va > vb) return 1;
            return 0;
        });
    }

    const totalItems = filteredTickets.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const pageItems = filteredTickets.slice(startIndex, startIndex + pageSize);





    return (
        <div className="p-6 ticket-table">
            <h2 className="text-2xl font-semibold text-gray-80 mb-6"> Lista de Tickets</h2>
            <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
                <div className="form-group mb-0">
                    <label className="form-label">Buscador</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por folio o nombre..."
                        value={terminoBusqueda}
                        onChange={(e) => setTerminoBusqueda(e.target.value)}
                        style={{ color: 'black', minWidth: '200px' }}
                    />
                </div>
                <div className="form-group mb-0">
                    <label className="form-label">Prioridad</label>
                    <select style={{ color: 'black' }}
                        className="form-select"
                        value={filtroPrioridad}
                        onChange={(e) => setFiltroPrioridad(e.target.value)}
                    >
                        <option value="" style={{ color: 'black' }}>Todas</option>
                        {displayPrioridades.map((p) => (
                            <option key={p} value={p} style={{ color: 'black' }}>{p}</option>
                        ))}
                    </select>
                </div>



                <div className="form-group mb-0">
                    <label className="form-label">Tipo</label>
                    <select
                        className="form-select"
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                    >
                        <option value="" style={{ color: 'black' }}>Todos</option>
                        {displayTipos.map((t) => (
                            <option key={t} value={t} style={{ color: 'black' }}>{t}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group mb-0">
                    <label className="form-label">Ingeniero</label>
                    <select
                        className="form-select"
                        value={filtroIngeniero}
                        onChange={(e) => setFiltroIngeniero(e.target.value)}
                    >
                        <option value="">Todos</option>
                        {displayIngenieros.map((i) => (
                            <option key={i} value={i} style={{ color: 'black' }}>{i}</option>
                        ))}
                    </select>
                </div>


                <div className="form-group mb-0">
                    <label className="form-label">Estatus</label>
                    <select
                        className="form-select"
                        value={filtroEstatus}
                        onChange={(e) => setFiltroEstatus(e.target.value)}
                    >
                        <option value="">Todos</option>
                        {estatus.map((e) => (
                            <option key={e} value={e} style={{ color: 'black' }}>
                                {e}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group mb-0">
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setFiltroPrioridad("");
                            setFiltroTipo("");
                            setFiltroIngeniero("");
                            setSortBy("");
                            setTerminoBusqueda("");  // <--- agrega esta línea

                        }}
                    >
                        Limpiar
                    </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                        Mostrar
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ margin: '0 8px' }}>
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={20}>20</option>
                        </select>
                        entradas
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div >
                <div className="table-responsive">
                    <table>
                        <thead className="table-light">
                            <tr>
                                <th>Folios</th>
                                <th>Usuario</th>
                                <th>Tipo de Ticket</th>
                                <th>Fecha de Creación</th>
                                <th>Estatus</th>
                                <th>Descripción</th>
                                <th>Ingeniero</th>
                                <th>Ticket Maestro</th>
                                <th>Prioridad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pageItems.length > 0 ? (
                                pageItems.map((ticket) => (
                                    <tr key={ticket.folio}>
                                        <td>{ticket.folio}</td>
                                        {/* Busca la celda de Usuario en tu código y reemplázala por esta */}
                                        <td>
                                            <div className="user-info-container">
                                                {/* Contenedor del círculo blanco */}
                                                <div className="user-avatar-circle">
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    >
                                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                                        <circle cx="12" cy="7" r="4"></circle>
                                                    </svg>
                                                </div>

                                                {/* Nombre del usuario */}
                                                <span>
                                                    {typeof ticket.usuario === 'object'
                                                        ? (ticket.usuario.nombre || ticket.usuario.userName || "N/A")
                                                        : ticket.usuario}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{ticket.tipo_ticket}</td>
                                        <td>{ticket.fechaCreacion}</td>

                                        <td>
                                            <span className={`badge ${ticket.estatus?.toLowerCase().includes("abierto")
                                                ? 'bg-success text-white'
                                                : ticket.estatus?.toLowerCase().includes("progreso")
                                                    ? 'bg-warning text-dark'
                                                    : ticket.estatus?.toLowerCase().includes("cerrado")
                                                        ? 'bg-danger text-white'
                                                        : 'bg-secondary'
                                                }`}>
                                                {ticket.estatus}
                                            </span>
                                        </td>

                                        <td>{ticket.descripcion}</td>
                                        <td>{ticket.ingeniero}</td>
                                        <td>{ticket.ticketMaestro ?? "N/A"}</td>
                                        <td>
                                            <span className={`badge ${ticket.prioridad === "Alta" ? 'bg-danger' : ticket.prioridad === "Media" ? 'bg-warning text-dark' : 'bg-success'}`}>
                                                {ticket.prioridad}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={9} className="text-center">No hay tickets registrados</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <nav aria-label="Paginación tickets" style={{ marginTop: 12 }}>
                    <ul className="pagination justify-content-center">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>&laquo;</button>
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
                            <button className="page-link" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>&raquo;</button>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default TicketTable;