import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../components/Styles/estadisticas.css";
import { getAllTickets } from "../services/ticketService";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend
} from "recharts";

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
  const [ticketsPorTipo, setTicketsPorTipo] = useState([]);

  const navigate = useNavigate();

  // Paleta de colores para los tipos
  const TIPO_COLORS = [
    "#8b5cf6", // Morado
    "#3b82f6", // Azul
    "#10b981", // Verde esmeralda
    "#f59e0b", // Ámbar
    "#ef4444", // Rojo
    "#ec4899", // Rosa
    "#06b6d4", // Cian
    "#84cc16", // Lima
    "#f97316", // Naranja
    "#6366f1", // Índigo
  ];

  // =========================
  // 🔥 CARGA DE DATOS
  // =========================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllTickets();
        console.log("Datos recibidos:", data); // Para debug
        setTickets(data);
        calcularEstadisticas(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  // =========================
  // 📊 CALCULAR TICKETS POR TIPO
  // =========================
  const calcularTicketsPorTipo = (dataFiltrada) => {
    const tiposMap = new Map();

    dataFiltrada.forEach((ticket) => {
      // El campo correcto es "tipo_ticket" (con guión bajo)
      let tipo = ticket.tipo_ticket || ticket.tipo || "Sin tipo";

      tipo = tipo.trim();
      if (tipo === "") tipo = "Sin tipo";

      tiposMap.set(tipo, (tiposMap.get(tipo) || 0) + 1);
    });

    const tiposArray = Array.from(tiposMap.entries())
      .map(([name, value]) => ({
        name: name.length > 15 ? name.substring(0, 12) + "..." : name,
        value,
        nombreCompleto: name
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    console.log("Tipos calculados:", tiposArray); // Para debug
    setTicketsPorTipo(tiposArray);
  };

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

    calcularTicketsPorTipo(dataFiltrada);
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
  // 📊 REPORTE
  // =========================
  const generarReporteGeneral = async () => {
    try {
      const response = await fetch("http://10.12.0.10:5001", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tickets: tickets,
          estado: "general",
        }),
      });

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

  const handleCardClick = (estado) => {
    navigate(`/estadisticas/${estado}`);
  };

  // =========================
  // 📊 DATOS GRAFICAS
  // =========================
  const pieData = [
    { name: "En proceso", value: stats.enProceso },
    { name: "Cerrados", value: stats.cerrados },
    { name: "Abiertos", value: stats.abiertos },
  ];

  const barData = [
    { name: "Total", value: stats.total },
    { name: "Este mes", value: stats.creadosEsteMes },
  ];

  const COLORS = ["#edf04c", "#ff4d6d", "#00ffae"];


  // =========================
  // 🎨 UI PRO
  // =========================
  return (
    <div className="stats-background">
      <div className="stats-content-wrapper">

        {/* HEADER */}
        <div className="stats-header">
          <h2 className="stats-title">📊 Dashboard de Tickets</h2>

          <button className="report-button" onClick={generarReporteGeneral}>
            📥 Generar reporte
          </button>
        </div>

        {/* FILTRO CON ESTADÍSTICAS INTEGRADAS */}
        <div className="filter-bar glass">
          <div className="filter-controls">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <button className="filter-button" onClick={handleFilter}>
              Filtrar
            </button>
          </div>

          <div className="filter-stats">
            <div className="filter-stat-item">
              <span className="filter-stat-label">Total</span>
              <span className="filter-stat-value">{stats.total}</span>
            </div>
            <div className="filter-stat-divider"></div>
            <div className="filter-stat-item">
              <span className="filter-stat-label">Este mes</span>
              <span className="filter-stat-value">{stats.creadosEsteMes}</span>
            </div>
          </div>
        </div>



        {/* GRID PRINCIPAL */}
        <div className="dashboard-grid">

          {/* CARDS - ESTILO ORIGINAL */}
          <div className="cards-row">
            <div className="stat-card card-proceso" onClick={() => handleCardClick("progreso")}>
              <span className="icon">⚙️</span>
              <h2>{stats.enProceso}</h2>
              <p>En proceso</p>
            </div>

            <div className="stat-card card-cerrado" onClick={() => handleCardClick("cerrado")}>
              <span className="icon">✅</span>
              <h2>{stats.cerrados}</h2>
              <p>Cerrados</p>
            </div>

            <div className="stat-card card-abierto" onClick={() => handleCardClick("abierto")}>
              <span className="icon">📂</span>
              <h2>{stats.abiertos}</h2>
              <p>Abiertos</p>
            </div>
          </div>

          {/* PIE - Distribución CON LEGEND */}
          <div className="glass chart-big">
            <h3>Distribución de tickets</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} innerRadius={70} outerRadius={110} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value, entry) => <span style={{ color: '#fff' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* BARRA - Resumen */}
          <div className="glass chart-small">
            <h3>Resumen</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Bar dataKey="value" fill="#4895ef" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* NUEVO GRÁFICO - Tickets por tipo */}
          <div className="glass chart-tipos">
            <h3>🎫 Tickets por tipo</h3>
            {ticketsPorTipo.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={ticketsPorTipo}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="#fff" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="#fff"
                    width={80}
                    tick={{ fill: '#fff', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#a878cef8', border: 'none', borderRadius: '8px' }}
                    labelStyle={{ color: '#f1f5f9' }}
                    formatter={(value, name, props) => [`${value} tickets`, props.payload.nombreCompleto]}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 8, 8, 0]}
                  >
                    {ticketsPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={TIPO_COLORS[index % TIPO_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <p>No hay datos de tipos disponibles</p>
              </div>
            )}
          </div>


        </div>

      </div>
    </div>
  );
};

export default Estadisticas;