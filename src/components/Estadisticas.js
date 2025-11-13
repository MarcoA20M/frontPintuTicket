import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../components/Styles/estadisticas.css";
import { getAllTickets } from "../services/ticketService";

const Estadisticas = () => {
  const [stats, setStats] = useState({
    enProceso: 0,
    cerrados: 0,
    pendientes: 0,
    creadosEsteMes: 0,
    total: 0,
  });

  const [tickets, setTickets] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllTickets();
        setTickets(data);
        calcularEstadisticas(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const calcularEstadisticas = (dataFiltrada) => {
    const enProceso = dataFiltrada.filter((t) => t.estado === "En Proceso").length;
    const cerrados = dataFiltrada.filter((t) => t.estado === "Cerrado").length;
    const pendientes = dataFiltrada.filter((t) => t.estado === "Abierto").length;

    setStats({
      enProceso,
      cerrados,
      pendientes,
      creadosEsteMes: 22,
      total: dataFiltrada.length,
    });
  };

  const handleFilter = () => {
    if (!startDate || !endDate) return;

    const filtrados = tickets.filter((t) => {
      const fecha = new Date(t.fechaCreacion);
      const inicio = new Date(startDate);
      const fin = new Date(endDate);
      return fecha >= inicio && fecha <= fin;
    });

    calcularEstadisticas(filtrados);
  };

  const handleCardClick = (estado) => {
    navigate(`/estadisticas/${encodeURIComponent(estado)}`);
  };

  return (
    <div className="stats-background">
      <div className="stats-content-wrapper">
        <div className="stats-header">
          <h2 className="stats-title">Historial de tickets</h2>
          <button className="report-button">Generar reporte</button>
        </div>

        {/* === NUEVO FILTRO DE FECHAS === */}
        <div className="filter-bar">
          <label>Desde:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label>Hasta:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button className="filter-button" onClick={handleFilter}>
            Filtrar
          </button>
        </div>

        <div className="stats-dashboard">
          <div className="stats-main-cards">
            <div
              className="stat-card card-proceso"
              onClick={() => handleCardClick("En Proceso")}
            >
              <p className="card-label">En proceso</p>
              <p className="card-number">{stats.enProceso}</p>
            </div>

            <div
              className="stat-card card-cerrado"
              onClick={() => handleCardClick("Cerrado")}
            >
              <p className="card-label">Cerrados</p>
              <p className="card-number">{stats.cerrados}</p>
            </div>

            <div
              className="stat-card card-pendiente"
              onClick={() => handleCardClick("Abierto")}
            >
              <p className="card-label">Pendientes</p>
              <p className="card-number">{stats.pendientes}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estadisticas;
