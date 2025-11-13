import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../components/Styles/estadisticas.css";
import { getAllTickets } from "../services/ticketService";

const EstadisticasDetalle = () => {
  const { estado } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await getAllTickets();
        const filtered = data.filter((t) => t.estado === estado);
        setTickets(filtered);
        setFilteredTickets(filtered);
      } catch (error) {
        console.error("Error:", error);
      }
    };
    fetchTickets();
  }, [estado]);

  const handleDateChange = (e) => {
    const value = e.target.value;
    setSelectedDate(value);
    if (value) {
      const filtered = tickets.filter((t) => t.fecha?.startsWith(value));
      setFilteredTickets(filtered);
    } else {
      setFilteredTickets(tickets);
    }
  };

  // --- estadísticas rápidas ---
  const totalTickets = filteredTickets.length;
  const ticketsHoy = filteredTickets.filter((t) => {
    const hoy = new Date().toISOString().split("T")[0];
    return t.fecha?.startsWith(hoy);
  }).length;

  const ticketsAntiguos = filteredTickets.filter((t) => {
    const fecha = new Date(t.fecha);
    const diff = (Date.now() - fecha.getTime()) / (1000 * 60 * 60 * 24);
    return diff > 7;
  }).length;

  return (
    <div className="detalle-container">
      <div className="detalle-header">
        <button className="back-button" onClick={() => navigate("/")}>
          ← Regresar
        </button>
        <h2>Estadísticas de Tickets - {estado}</h2>
      </div>

      <div className="estadisticas-resumen">
        <div className="card-resumen">
          <h3>Total de Tickets</h3>
          <p>{totalTickets}</p>
        </div>
        <div className="card-resumen">
          <h3>Tickets de Hoy</h3>
          <p>{ticketsHoy}</p>
        </div>
        <div className="card-resumen">
          <h3>Tickets +7 días</h3>
          <p>{ticketsAntiguos}</p>
        </div>
      </div>

      <div className="filter-section">
        <label>Filtrar por fecha: </label>
        <input type="date" value={selectedDate} onChange={handleDateChange} />
      </div>

      <table className="tickets-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Descripción</th>
            <th>Fecha</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {filteredTickets.length > 0 ? (
            filteredTickets.map((t) => (
              <tr key={t.idTicket}>
                <td>{t.idTicket}</td>
                <td>{t.titulo}</td>
                <td>{t.descripcion}</td>
                <td>{t.fecha || "—"}</td>
                <td>{t.estado}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No hay tickets en este estado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EstadisticasDetalle;