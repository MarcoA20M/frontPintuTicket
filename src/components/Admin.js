import React, { useEffect, useRef, useState } from "react";
import { getAllTickets } from "../services/ticketService";
import { useNavigate } from "react-router-dom";
import * as echarts from 'echarts';

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="580" height="580" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16">
    <path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" />
    <path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" />
    <path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="580" height="580" fill="currentColor" class="bi bi-check-all" viewBox="0 0 16 16">
    <path d="M8.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L2.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093L8.95 4.992zm-.92 5.14.92.92a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 1 0-1.091-1.028L9.477 9.417l-.485-.486z" />
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="580" height="580" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="#fff" strokeWidth="1.5" />
    <path d="M8 4.5V8.4" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
    <circle cx="8" cy="11.1" r="0.9" fill="#fff" />
  </svg>
);


const Card = ({ title, value, bgColor, icon }) => (

  <div style={{...glassStyle, background: bgColor || "rgba(255,255,255,0.06)",borderRadius: 14,padding: "28px 35px", minWidth: 240, textAlign: "center", position: "relative" }}>
    {icon ? <div style={iconBadgeStyle}>{icon}</div> : null}
    <div style={{ fontSize: 45, fontWeight: 800, color: "#fff" }}>{value}</div>
    <div style={{ fontSize: 16, color: "#fff", opacity: 0.95, marginTop: 8 }}>
      {title}
    </div>
  </div>
);

const glassStyle = {
  background: "rgba(255, 255, 255, 0.09)",
  boxShadow: "0 10px 32px rgba(0,0,0,0.28)",
  borderRadius: 14,
  padding: 22,
  border: "3px solid rgba(255, 255, 255, 0.12)",
  backdropFilter: "blur(8px)",
};

const iconBadgeStyle = {
  // ...glassStyle,
  position: "absolute",
  top: 10,
  right: 16,
  width: 18,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

const Admin = () => {
  const [usuario, setUsuario] = useState(null);
  const [tickets, setTickets] = useState([]);
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const pieChartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const pieChartInstanceRef = useRef(null);



  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await getAllTickets();
        setTickets(data || []);
      } catch (error) {
        console.error("Error al cargar tickets:", error);
      }
    };
    fetchTickets();
  }, []);

  useEffect(() => {
    if (!chartRef.current && !pieChartRef.current) return;

    const barDom = chartRef.current;
    const barExisting = barDom ? echarts.getInstanceByDom(barDom) : null;
    const barChart = barDom ? (barExisting ?? echarts.init(barDom)) : null;
    chartInstanceRef.current = barChart;

    const pieDom = pieChartRef.current;
    const pieExisting = pieDom ? echarts.getInstanceByDom(pieDom) : null;
    const pieChart = pieDom ? (pieExisting ?? echarts.init(pieDom)) : null;
    pieChartInstanceRef.current = pieChart;

    const ingenieroCounts = tickets.reduce((acc, ticket) => {
      const nombreIngeniero = (ticket?.ingeniero || "Sin asignar").toString().trim() || "Sin asignar";
      acc[nombreIngeniero] = (acc[nombreIngeniero] || 0) + 1;
      return acc;
    }, {});

    const sortedEngineers = Object.entries(ingenieroCounts)
      .map(([nombre, total]) => ({ nombre, total }))
      .sort((a, b) => b.total - a.total);

    const engineerNames = sortedEngineers.map((item) => item.nombre);
    const engineerValues = sortedEngineers.map((item) => item.total);
    const userIconSvg = `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 16 16"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1z"/><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/></svg>'
    )}`;

    const barOption = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      grid: {
        top: 8,
        bottom: 40,
        left: 16,
        right: 60,
        containLabel: true,
      },
      xAxis: {
        type: "value",
        max: "dataMax",
        minInterval: 1,
        axisLabel: {
          color: "#fff",
          formatter: (value) => `${Math.trunc(value)}`,
        },
      },
      yAxis: {
        type: "category",
        data: engineerNames,
        inverse: true,
        animationDuration: 300,
        animationDurationUpdate: 300,
        axisLabel: {
          color: "#fff",
          width: 120,
          overflow: "truncate",
          formatter: (value) => `{icon|} ${value}`,
          rich: {
            icon: {
              width: 14,
              height: 14,
              align: "center",
              backgroundColor: { image: userIconSvg },
            },
          },
        },
      },
      series: [
        {
          realtimeSort: true,
          name: "Tickets",
          type: "bar",
          barWidth: 22,
          barMinHeight: 4,
          data: engineerValues,
          label: {
            show: true,
            position: "right",
            valueAnimation: false,
            color: "#fff",
            formatter: ({ value }) => `${Math.trunc(value)}`,
          },
          itemStyle: {
            color: "#d8d0dc",
            borderRadius: [0, 4, 4, 0],
          },
        },
      ],
      legend: {
        show: true,
        bottom: 0,
        textStyle: { color: "#fff" },
      },
      animationDuration: 0,
      animationDurationUpdate: 1000,
      animationEasing: "linear",
      animationEasingUpdate: "linear",
    };

    const enProgreso = tickets.filter((t) => t.estatus === "En Progreso").length;
    const cerrados = tickets.filter(
      (t) => t.estatus === "Cerrado" || t.estatus === "Cerrados"
    ).length;
    const pendientes = tickets.filter((t) => t.estatus === "Abierto").length;

    const pieOption = {
      tooltip: {
        trigger: "item",
      },
      legend: {
        orient: "horizontal",
        left: "center",
        bottom: "bottom",
        padding: 10,
        textStyle: {
          color: "#fff",
        },
      },
      series: [
        {
          name: "Tickets",
          type: "pie",
          radius: "65%",
          center: ["50%", "48%"],
          data: [
            { value: enProgreso, name: "En progreso" },
            { value: cerrados, name: "Cerrados" },
            { value: pendientes, name: "Pendientes" },
          ],
          label: {
            color: "#fff",
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
            },
          },
        },
      ],
    };

    barChart?.setOption(barOption, true);
    pieChart?.setOption(pieOption, true);

    const onResize = () => {
      barChart?.resize();
      pieChart?.resize();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      barChart?.dispose();
      pieChart?.dispose();
      chartInstanceRef.current = null;
      pieChartInstanceRef.current = null;
    };
  }, [tickets]);

  if (!usuario) {
    return (
      <div style={{ color: "#fff", textAlign: "center", marginTop: "40px" }}>
        Cargando información del usuario...
      </div>
    );
  }
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      <div style={{ flex: 1, padding: "8px 12px", width: "100%", marginLeft: "60px", }}>
        {/* Tarjetas superiores */}
        <div
          style={{ display: "flex", gap: 24, marginBottom: 24, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", }}>
          <Card title="En progreso" value={tickets.filter((t) => t.estatus === "En Progreso").length} bgColor={"rgba(255, 255, 255, 0.12)"} icon={<ClockIcon />} />
          <Card title="Cerrados" value={tickets.filter((t) => t.estatus === "Cerrado" || t.estatus === "Cerrados").length} bgColor={"rgba(255,255,255,0.12)"} icon={<CheckIcon />} />
          <Card title="Pendientes" value={tickets.filter((t) => t.estatus === "Abierto").length} bgColor={"rgba(255,255,255,0.12)"} icon={<AlertIcon />} />
        </div>
        {/* Banner de bienvenida dinámico */}
        <div style={{...glassStyle, padding: "30px 60px", color: "#fff", marginBottom: 28, borderRadius: 14, }}>
          <strong style={{ fontSize: 22 }}>
            BIENVENIDO DE NUEVO {usuario.nombre?.toUpperCase() || "ADMIN"}
          </strong>
        </div>

        {/* Dos paneles: Equipo y Resumen */}
        <div style={{ display: "grid", gridTemplateColumns: "12fr 10fr repeat(4, 1fr)", gridTemplateRows: "270px 270px", gridColumnGap: "15px", gridRowGap: "15px" }}>
          {/* Panel de equipo */}
          <div className="uno" style={{gridArea: "1 / 1 / 2 / 2", ...glassStyle, color: "#fff", display: "flex", flexDirection: "column" }}>
            <h3 style={{ marginTop: 0, marginBottom: 4, fontSize: 19 }}>Equipo de trabajo</h3>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Tickets por ingeniero</div>
            <div ref={chartRef} style={{ width: "100%", flex: 1, minHeight: 0 }}/>
          </div>
          <div className="dos" style={{ gridArea: "2 / 1 / 3 / 2", ...glassStyle, color: "#fff"}}>

          </div>
          <div className="tres" style={{ gridArea: "1 / 2 / 3 / 3", ...glassStyle, color: "#fff", display: "flex", flexDirection: "column" }}>
            <h3 style={{ marginTop: 0, marginBottom: 4, fontSize: 19 }}>Resumen de tickets levantados</h3>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Distribucion por estatus</div>
            <div ref={pieChartRef} style={{ width: "100%", flex: 1, minHeight: 0 }} />
          </div>
          <div className="cuatro" style={{ gridArea: "1 / 3 / 2 / 4", ...glassStyle, color: "#fff" }}>
            
          </div>
          <div className="cinco" style={{ gridArea: "2 / 3 / 3 / 4", ...glassStyle, color: "#fff" }}>
            
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default Admin;
