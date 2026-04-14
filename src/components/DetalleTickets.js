import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../components/Styles/detalleTickets.css";
import { getAllTickets } from "../services/ticketService";

const DetalleTickets = () => {

  const { estado } = useParams();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [todos, setTodos] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // 🔥 NORMALIZADOR
  const normalizarEstatus = (estatus) => {
    const e = (estatus || "").toLowerCase().trim();

    if (e.includes("progreso") || e.includes("proceso")) return "progreso";
    if (e.includes("cerrado")) return "cerrado";
    if (e.includes("abierto")) return "abierto";

    return "otro";
  };

  // 🔥 CARGA INICIAL
  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAllTickets();

        const filtrados = data.filter(t =>
          normalizarEstatus(t.estatus) === estado
        );

        setTickets(filtrados);
        setTodos(filtrados);

      } catch (e) {
        console.error(e);
      }
    };

    fetch();
  }, [estado]);

  const filtrarPorFecha = () => {
    if (!startDate || !endDate) return;

    const filtrados = todos.filter(t => {
      const fechaTicket = t.fechaCreacion?.slice(0, 10);
      return fechaTicket >= startDate && fechaTicket <= endDate;
    });

    setTickets(filtrados);
  };

  const generarReporte = async () => {
    try {
      const response = await fetch("https://pintureporte.onrender.com/generate-excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tickets: tickets,
          estado: estado
        })
      });

      if (!response.ok) {
        throw new Error("Error generando reporte");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;

      link.download = `reporte_${estado}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error:", error);
      alert("No se pudo generar el reporte");
    }
  };

  return (
    <div className="detalle-bg">

      {/* HEADER 🔥 */}
      <div className={`detalle-header ${estado}`}>

        <button onClick={() => navigate(-1)} className="back-btn">
          ← Regresar
        </button>

        <h2 className="estado-title">
          {estado.toUpperCase()}
        </h2>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className="total">
            {tickets.length} tickets
          </span>

          {/* 🔥 BOTÓN REPORTE */}
          <button className="report-btn" onClick={generarReporte}>
            📥 Generar Reporte
          </button>
        </div>

      </div>

      {/* FILTRO */}
      <div className="detalle-filter">

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

        <button onClick={filtrarPorFecha}>
          Filtrar
        </button>

      </div>

      {/* GRID */}
      <div className="tickets-grid">

        {tickets.length === 0 ? (
          <p className="no-data">No hay tickets</p>
        ) : (
          tickets.map(t => {

            const estadoNormalizado = normalizarEstatus(t.estatus);

            return (
              <div
                key={t.folio}
                className={`ticket-card ${estadoNormalizado}`}
              >

                <div className="ticket-header">
                  <span className="folio">#{t.folio}</span>

                  <span className={`badge ${estadoNormalizado}`}>
                    {t.estatus}
                  </span>
                </div>

                <h3 className="descripcion">
                  {t.descripcion}
                </h3>

                <div className="ticket-footer">
                  <span className="usuario">{t.usuario}</span>

                  <span className="fecha">
                    {t.fechaCreacion
                      ? new Date(t.fechaCreacion).toLocaleDateString()
                      : "Sin fecha"}
                  </span>
                </div>

              </div>
            );
          })
        )}

      </div>

    </div>
  );
};

export default DetalleTickets;