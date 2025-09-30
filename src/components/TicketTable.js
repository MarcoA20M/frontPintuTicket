import React, { useEffect, useState } from "react";
import { getAllTickets } from "../services/ticketService";
import { Box, Table, Thead, Tbody, Tr, Th, Td, Badge } from "@chakra-ui/react";

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
        <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6"> Lista de Tickets</h2>

            {/* Filtros */}
            <div className="flex flex-wrap gap-4 items-center mb-6 bg-gray-100 p-4 rounded-lg shadow-sm">
                <label className="text-gray-700 font-medium" >
                    Prioridad:
                    <select
                        className="ml-2 p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 text-gray-700"
                        value={filtroPrioridad}
                        onChange={(e) => setFiltroPrioridad(e.target.value)} style={{color: "black"}}
                    >
                        <option value="" style={{color: "black"}}>Todas</option>
                        {prioridades.map((p) => (
                            <option key={p} value={p} style={{color: "black"}}>
                                {p}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="text-gray-700 font-medium">
                    Tipo:
                    <select
                        className="ml-2 p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 text-gray-700"
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)} style={{color: "black"}}
                    >
                        <option value="">Todos</option>
                        {tipos.map((t) => (
                            <option key={t} value={t} style={{color: "black"}}>
                                {t}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="text-gray-700 font-medium">
                    Ingeniero:
                    <select
                        className="ml-2 p-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-300 text-gray-700"
                        value={filtroIngeniero}
                        onChange={(e) => setFiltroIngeniero(e.target.value)} style={{color: "black"}}
                    >
                        <option value="">Todos</option>
                        {ingenieros.map((i) => (
                            <option key={i} value={i} style={{color: "black"}}>
                                {i}
                            </option>
                        ))}
                    </select>
                </label>

                <label >
                    Ordenar por:
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="" >--</option>
                        <option value="prioridad" style={{color: "black"}}>Prioridad</option>
                        <option value="tipo_ticket" style={{color: "black"}}>Tipo</option>
                        <option value="ingeniero" style={{color: "black"}}>Ingeniero</option>
                    </select>
                </label>

                <button
                    className="ml-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow transition" style={{color: "white", background : "purple", padding: "0.5rem", borderRadius:"0.5rem"}}
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

            {/* Tabla */}
            <div className="overflow-x-auto rounded-lg shadow border border-gray-300 bg-white">
                <table className="min-w-full table-auto font-sans text-gray-900">
                    <thead className="" style={{background : "purple"}}>
                        <tr>
                            <th className="px- py-3 text-left font-semibold">Folios</th>
                            <th className="px-4 py-3 text-left font-semibold">Usuario</th>
                            <th className="px-4 py-3 text-left font-semibold">Tipo de Ticket</th>
                            <th className="px-4 py-3 text-left font-semibold">Fecha de Creación</th>
                            <th className="px-4 py-3 text-left font-semibold">Estatus</th>
                            <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                            <th className="px-4 py-3 text-left font-semibold">Ingeniero</th>
                            <th className="px-4 py-3 text-left font-semibold">Ticket Maestro</th>
                            <th className="px-4 py-3 text-left font-semibold">Prioridad</th>
                        </tr>
                    </thead>
                    <tbody style={{background : "blue"}}>
                        {filteredTickets.length > 0 ? (
                            filteredTickets.map((ticket, idx) => (
                                <tr
                                    key={ticket.folio}
                                    className={`border-b border-gray-200 ${idx % 2 === 0 ? "bg-white" : "bg-blue-50"} hover:bg-blue-100 transition-colors duration-150`}
                                >
                                    <td className="px-4 py-3 font-medium align-middle">{ticket.folio}</td>
                                    <td className="px-4 py-3 align-middle">{ticket.usuario}</td>
                                    <td className="px-4 py-3 align-middle">{ticket.tipo_ticket}</td>
                                    <td className="px-4 py-3 align-middle">{ticket.fechaCreacion}</td>
                                    <td className="px-4 py-3 font-medium align-middle">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${ticket.estatus === "Abierto" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{ticket.estatus}</span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-pre-line max-w-xs align-middle">{ticket.descripcion}</td>
                                    <td className="px-4 py-3 align-middle">{ticket.ingeniero}</td>
                                    <td className="px-4 py-3 align-middle">{ticket.ticketMaestro ?? "N/A"}</td>
                                    <td className="px-4 py-3 font-semibold align-middle">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${ticket.prioridad === "Alta" ? "bg-red-100 text-red-700" : ticket.prioridad === "Media" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{ticket.prioridad}</span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="px-4 py-6 text-center text-gray-500">
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
