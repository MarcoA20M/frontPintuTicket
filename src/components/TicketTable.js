import React, { useEffect, useState } from "react";
import { getAllTickets } from "../services/ticketService";

const TicketTable = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroPrioridad, setFiltroPrioridad] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("");
    const [filtroIngeniero, setFiltroIngeniero] = useState("");
    const [sortBy, setSortBy] = useState("");

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

    if (loading) return <p>Cargando tickets...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;

    // opciones únicas para selects
    const prioridades = Array.from(new Set(tickets.map(t => t.prioridad).filter(Boolean)));
    const tipos = Array.from(new Set(tickets.map(t => t.tipo_ticket).filter(Boolean)));
    const ingenieros = Array.from(new Set(tickets.map(t => t.ingeniero).filter(Boolean)));

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
        <div style={{ padding: "20px" }}>
            <h2>Lista de Tickets</h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                <label>
                    Prioridad:
                    <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)}>
                        <option value="">Todas</option>
                        {prioridades.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </label>
                <label>
                    Tipo:
                    <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                        <option value="">Todos</option>
                        {tipos.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </label>
                <label>
                    Ingeniero:
                    <select value={filtroIngeniero} onChange={e => setFiltroIngeniero(e.target.value)}>
                        <option value="">Todos</option>
                        {ingenieros.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                </label>
                <label>
                    Ordenar por:
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="">--</option>
                        <option value="prioridad">Prioridad</option>
                        <option value="tipo_ticket">Tipo</option>
                        <option value="ingeniero">Ingeniero</option>
                    </select>
                </label>
                <button onClick={() => { setFiltroPrioridad(''); setFiltroTipo(''); setFiltroIngeniero(''); setSortBy(''); }}>Limpiar</button>
            </div>
            <table
                border="1"
                cellPadding="8"
                cellSpacing="0"
                style={{ width: "100%", borderCollapse: "collapse" }}
            >
                <thead style={{ backgroundColor: "#3150dfff" }}>
                    <tr>
                        <th>Folio</th>
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
                    {filteredTickets.length > 0 ? (
                        filteredTickets.map((ticket) => (
                            <tr key={ticket.folio}>
                                <td>{ticket.folio}</td>
                                <td>{ticket.usuario}</td>
                                <td>{ticket.tipo_ticket}</td>
                                <td>{ticket.fechaCreacion}</td>
                                <td>{ticket.estatus}</td>
                                <td>{ticket.descripcion}</td>
                                <td>{ticket.ingeniero}</td>
                                <td>{ticket.ticketMaestro ?? "N/A"}</td>
                                <td>{ticket.prioridad}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="9" style={{ textAlign: "center" }}>
                                No hay tickets registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TicketTable;
