import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../components/Styles/estadisticas.css";
import { getAllTickets } from "../services/ticketService";

const Estadisticas = () => {

  const [stats, setStats] = useState({
    enProceso: 0,
    cerrados: 0,
    abiertos: 0,
    creadosEsteMes: 0,
    total: 0,
  });

  const [tickets, setTickets] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const navigate = useNavigate();

  // =========================
  // 🔥 CARGA DE DATOS
  // =========================
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

  // =========================
  // 📊 CALCULAR ESTADÍSTICAS
  // =========================
  const calcularEstadisticas = (dataFiltrada) => {
    let enProceso = 0;
    let cerrados = 0;
    let abiertos = 0;
    let creadosEsteMes = 0;

    const hoy = new Date();

    dataFiltrada.forEach((t) => {
      const estatus = (t.estatus || "").toLowerCase().trim();

      if (estatus.includes("progreso") || estatus.includes("proceso")) enProceso++;
      else if (estatus.includes("cerrado")) cerrados++;
      else if (estatus.includes("abierto")) abiertos++;

      if (t.fechaCreacion) {
        const fecha = new Date(t.fechaCreacion);
        if (
          fecha.getMonth() === hoy.getMonth() &&
          fecha.getFullYear() === hoy.getFullYear()
        ) {
          creadosEsteMes++;
        }
      }
    });

    setStats({
      enProceso,
      cerrados,
      abiertos,
      creadosEsteMes,
      total: dataFiltrada.length,
    });
  };

  // =========================
  // 🔥 FILTRO FECHA
  // =========================
  const handleFilter = () => {
    if (!startDate || !endDate) return;

    const filtrados = tickets.filter((t) => {
      const fecha = new Date(t.fechaCreacion);
      return fecha >= new Date(startDate) && fecha <= new Date(endDate);
    });

    calcularEstadisticas(filtrados);
  };

  // =========================
  // 📊 REPORTE GENERAL (FLASK)
  // =========================
  const generarReporteGeneral = async () => {
    try {
      const response = await fetch(
        "https://pintureporte.onrender.com/generate-excel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tickets: tickets,
            estado: "general",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Error generando reporte");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte_general.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error:", error);
      alert("No se pudo generar el reporte");
    }
  };

  // =========================
  // 📌 NAVEGACIÓN POR ESTADO
  // =========================
  const handleCardClick = (estado) => {
    navigate(`/estadisticas/${estado}`);
  };

  // =========================
  // 🎨 UI
  // =========================
  return (
    <div className="stats-background">
      <div className="stats-content-wrapper">

        {/* HEADER */}
        <div className="stats-header">
          <h2 className="stats-title">📊 Dashboard de Tickets</h2>

          <button
            className="report-button"
            onClick={generarReporteGeneral}
          >
            📥 Generar reporte general
          </button>
        </div>

        {/* FILTRO */}
        <div className="filter-bar">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <button className="filter-button" onClick={handleFilter}>
            Filtrar
          </button>
        </div>

        {/* DASHBOARD */}
        <div className="stats-dashboard">

          <div className="stats-main-cards">

            <div
              className="stat-card card-proceso"
              onClick={() => handleCardClick("progreso")}
            >
              <span>⚙️</span>
              <p>En proceso</p>
              <h2>{stats.enProceso}</h2>
            </div>

            <div
              className="stat-card card-cerrado"
              onClick={() => handleCardClick("cerrado")}
            >
              <span>✅</span>
              <p>Cerrados</p>
              <h2>{stats.cerrados}</h2>
            </div>

            <div
              className="stat-card card-abierto"
              onClick={() => handleCardClick("abierto")}
            >
              <span>📂</span>
              <p>Abiertos</p>
              <h2>{stats.abiertos}</h2>
            </div>

          </div>

          <div className="stats-extra">
            <div className="stat-box">
              <p>Total</p>
              <h3>{stats.total}</h3>
            </div>

            <div className="stat-box">
              <p>Este mes</p>
              <h3>{stats.creadosEsteMes}</h3>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Estadisticas;