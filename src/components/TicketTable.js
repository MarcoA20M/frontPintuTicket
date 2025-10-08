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

    if (loading) return <p>Cargando tickets...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    // opciones únicas para selects
    const prioridades = Array.from(new Set(tickets.map(t => t.prioridad).filter(Boolean)));
    const tipos = Array.from(new Set(tickets.map(t => t.tipo_ticket).filter(Boolean)));
    const ingenieros = Array.from(new Set(tickets.map(t => t.ingeniero).filter(Boolean)));

    // Si los servicios devolvieron opciones, úsalas; si no, fallback a las derivadas de tickets
    const displayPrioridades = (prioridadesOptions && prioridadesOptions.length) ? prioridadesOptions : prioridades;
    const displayTipos = (tiposOptions && tiposOptions.length) ? tiposOptions : tipos;
    const displayIngenieros = (ingenierosOptions && ingenierosOptions.length) ? ingenierosOptions : ingenieros;

    // aplicar filtros
    let filteredTickets = tickets.filter(t => {
        return (
            (!filtroPrioridad || t.prioridad === filtroPrioridad) &&
            (!filtroTipo || t.tipo_ticket === filtroTipo) &&
            (!filtroIngeniero || t.ingeniero === filtroIngeniero)
        );
    });

    // aplicar ordenamiento simple (alfabético o por campo)
    if (sortBy) {
        filteredTickets = [...filteredTickets].sort((a, b) => {
            const va = (a[sortBy] || '').toString().toLowerCase();
            const vb = (b[sortBy] || '').toString().toLowerCase();
            if (va < vb) return -1;
            if (va > vb) return 1;
            return 0;
        });
    }

    return (
        <div className="p-6 ticket-table">
            <h2 className="text-2xl font-semibold text-gray-80 mb-6"> Lista de Tickets</h2>

            {/* Filtros (Bootstrap) */}
            <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
                <div className="form-group mb-0">
                    <label className="form-label">Prioridad</label>
                    <select
                        className="form-select"
                        value={filtroPrioridad}
                        onChange={(e) => setFiltroPrioridad(e.target.value)}
                    >
                        <option value="">Todas</option>
                        {displayPrioridades.map((p) => (
                            <option key={p} value={p}>{p}</option>
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
                        <option value="">Todos</option>
                        {displayTipos.map((t) => (
                            <option key={t} value={t}>{t}</option>
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
                            <option key={i} value={i}>{i}</option>
                        ))}
                    </select>
                </div>

                {/* <div className="form-group mb-0">
                    <label className="form-label">Ordenar por</label>
                    <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="">--</option>
                        <option value="prioridad">Prioridad</option>
                        <option value="tipo_ticket">Tipo</option>
                        <option value="ingeniero">Ingeniero</option>
                    </select>
                </div> */}

                <div className="form-group mb-0">
                    <button
                        className="btn btn-secondary"
                        onClick={() => {
                            setFiltroPrioridad("");
                            setFiltroTipo("");
                            setFiltroIngeniero("");
                            setSortBy("");
                        }}
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* Tabla */}
            <div >
                <table >
                    <thead >
                        <tr>
                            <th>Folios</th>
                            <th >Usuario</th>
                            <th>Tipo de Ticket</th>
                            <th>Fecha de Creación</th>
                            <th >Estatus</th>
                            <th >Descripción</th>
                            <th >Ingeniero</th>
                            <th >Ticket Maestro</th>
                            <th >Prioridad</th>
                        </tr>
                    </thead>
                    <tbody >
                        {filteredTickets.length > 0 ? (
                            filteredTickets.map((ticket, idx) => (
                                <tr
                                    key={ticket.folio}
                                >
                                    <td >{ticket.folio}</td>
                                    <td >{ticket.usuario}</td>
                                    <td >{ticket.tipo_ticket}</td>
                                    <td >{ticket.fechaCreacion}</td>
                                    <td >
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${ticket.estatus === "Abierto" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{ticket.estatus}</span>
                                    </td>
                                    <td >{ticket.descripcion}</td>
                                    <td >{ticket.ingeniero}</td>
                                    <td >{ticket.ticketMaestro ?? "N/A"}</td>
                                    <td >
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${ticket.prioridad === "Alta" ? "bg-red-100 text-red-700" : ticket.prioridad === "Media" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{ticket.prioridad}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td >
                                    No hay tickets registrados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

    );
};

export default TicketTable;
