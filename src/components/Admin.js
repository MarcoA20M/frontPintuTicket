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

const monthLabels = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "sep",
  "octubre",
  "nov",
  "dic",
];

const getTicketDate = (ticket) => {
  const rawDate =
    ticket?.fechaCreacion ??
    ticket?.fecha_creacion ??
    ticket?.fecha ??
    ticket?.createdAt ??
    ticket?.created_at ??
    ticket?.fechaAlta;

  if (!rawDate) return null;
  const date = new Date(rawDate);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getSixMonthBuckets = () => {
  const now = new Date();
  return Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: monthLabels[d.getMonth()],
      year: d.getFullYear(),
      month: d.getMonth(),
    };
  });
};

const getWeekOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.ceil((date.getDate() + firstDay.getDay()) / 7);
};

const Admin = () => {
  const [usuario, setUsuario] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [engineerViewMode, setEngineerViewMode] = useState("semanal");
  const [engineerMonthKey, setEngineerMonthKey] = useState(() => {
    const buckets = getSixMonthBuckets();
    return buckets[buckets.length - 1]?.key ?? "";
  });
  const [summaryViewMode, setSummaryViewMode] = useState("semanal");
  const [summaryMonthKey, setSummaryMonthKey] = useState(() => {
    const buckets = getSixMonthBuckets();
    return buckets[buckets.length - 1]?.key ?? "";
  });
  const [trendMode, setTrendMode] = useState("semanal");
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => {
    const buckets = getSixMonthBuckets();
    return buckets[buckets.length - 1]?.key ?? "";
  });
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const pieChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const gaugeChartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const pieChartInstanceRef = useRef(null);
  const trendChartInstanceRef = useRef(null);
  const gaugeChartInstanceRef = useRef(null);



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
    if (!chartRef.current && !pieChartRef.current && !gaugeChartRef.current) return;

    const barDom = chartRef.current;
    const barExisting = barDom ? echarts.getInstanceByDom(barDom) : null;
    const barChart = barDom ? (barExisting ?? echarts.init(barDom)) : null;
    chartInstanceRef.current = barChart;

    const pieDom = pieChartRef.current;
    const pieExisting = pieDom ? echarts.getInstanceByDom(pieDom) : null;
    const pieChart = pieDom ? (pieExisting ?? echarts.init(pieDom)) : null;
    pieChartInstanceRef.current = pieChart;

    const gaugeDom = gaugeChartRef.current;
    const gaugeExisting = gaugeDom ? echarts.getInstanceByDom(gaugeDom) : null;
    const gaugeChart = gaugeDom ? (gaugeExisting ?? echarts.init(gaugeDom)) : null;
    gaugeChartInstanceRef.current = gaugeChart;

    const sixMonths = getSixMonthBuckets();
    const selectedEngineerMonth =
      sixMonths.find((bucket) => bucket.key === engineerMonthKey) ??
      sixMonths[sixMonths.length - 1];

    const now = new Date();
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const filteredEngineerTickets = tickets.filter((ticket) => {
      const d = getTicketDate(ticket);
      if (!d) return false;

      if (engineerViewMode === "mensual") {
        return (
          d.getFullYear() === selectedEngineerMonth.year &&
          d.getMonth() === selectedEngineerMonth.month
        );
      }

      return d >= weekStart && d <= weekEnd;
    });

    const selectedSummaryMonth =
      sixMonths.find((bucket) => bucket.key === summaryMonthKey) ??
      sixMonths[sixMonths.length - 1];

    const filteredSummaryTickets = tickets.filter((ticket) => {
      const d = getTicketDate(ticket);
      if (!d) return false;

      if (summaryViewMode === "mensual") {
        return (
          d.getFullYear() === selectedSummaryMonth.year &&
          d.getMonth() === selectedSummaryMonth.month
        );
      }

      return d >= weekStart && d <= weekEnd;
    });

    const ingenieroCounts = filteredEngineerTickets.reduce((acc, ticket) => {
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

    const enProgreso = filteredSummaryTickets.filter((t) => t.estatus === "En Progreso").length;
    const cerrados = filteredSummaryTickets.filter(
      (t) => t.estatus === "Cerrado" || t.estatus === "Cerrados"
    ).length;
    const pendientes = filteredSummaryTickets.filter((t) => t.estatus === "Abierto").length;

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

    // --- Gauge: promedio de calificaciones (tickets cerrados) ---
    const closedStatuses = new Set(['cerrado', 'cerrados']);
    const closedTickets = filteredSummaryTickets.filter((t) => closedStatuses.has(String(t?.estatus ?? '').toLowerCase().trim()));
    const ratedValues = closedTickets
      .map((t) => {
        const raw = t?.calificacion ?? t?.rating ?? t?.score ?? t?.puntuacion ?? t?.calificacionTicket;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      })
      .filter((n) => n != null && n > 0);

    const ratedCount = ratedValues.length;
    const avgRating = ratedCount ? ratedValues.reduce((a, b) => a + b, 0) / ratedCount : 0;

    const gaugeOption = {
      series: [
        {
          type: 'gauge',
          startAngle: 180,
          endAngle: 0,
          center: ['50%', '90%'],
          radius: '115%',
          min: 0,
          max: 5,
          splitNumber: 5,
          axisLine: {
            lineStyle: {
              width: 10,
              color: [
                [0.2, '#ff4d4f'], // rojo
                [0.4, '#fa8c16'], // naranja
                [0.6, '#facc15'], // amarillo
                [0.8, '#52c41a'], // verde
                [1, '#1890ff'], // azul
              ],
            },
          },
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '12%',
            width: 18,
            offsetCenter: [0, '-55%'],
            itemStyle: { color: 'auto' },
          },
          axisTick: {
            length: 10,
            lineStyle: { color: 'auto', width: 2 },
          },
          splitLine: {
            length: 16,
            lineStyle: { color: 'auto', width: 4 },
          },
          axisLabel: {
            color: '#fff',
            fontSize: 12,
            distance: -38,
            formatter: (value) => {
              // Mostrar 1..5 (ocultar 0 para que no estorbe)
              const v = Math.round(value);
              if (v === 0) return '';
              if (v < 0 || v > 5) return '';
              return String(v);
            },
          },
          title: {
            offsetCenter: [0, '30%'],
            fontSize: 14,
            color: '#fff',
          },
          detail: {
            fontSize: 26,
            offsetCenter: [0, '-6%'],
            valueAnimation: true,
            formatter: (value) => {
              if (!ratedCount) return '--';
              return `${Number(value).toFixed(1)}/5`;
            },
            color: 'inherit',
          },
          data: [
            {
              value: Math.max(0, Math.min(5, avgRating)),
              name: ratedCount ? 'Promedio (cerrados)' : 'Sin calificación',
            },
          ],
        },
      ],
    };

    gaugeChart?.setOption(gaugeOption, true);

    const onResize = () => {
      barChart?.resize();
      pieChart?.resize();
      gaugeChart?.resize();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      barChart?.dispose();
      pieChart?.dispose();
      gaugeChart?.dispose();
      chartInstanceRef.current = null;
      pieChartInstanceRef.current = null;
      gaugeChartInstanceRef.current = null;
    };
  }, [tickets, engineerViewMode, engineerMonthKey, summaryViewMode, summaryMonthKey]);

  useEffect(() => {
    if (!trendChartRef.current) return;

    const dom = trendChartRef.current;
    const existing = echarts.getInstanceByDom(dom);
    const chart = existing ?? echarts.init(dom);
    trendChartInstanceRef.current = chart;

    const sixMonths = getSixMonthBuckets();
    const ticketDates = tickets.map(getTicketDate).filter(Boolean);

    let categories = [];
    let values = [];

    if (trendMode === "semanal") {
      const selectedBucket =
        sixMonths.find((bucket) => bucket.key === selectedMonthKey) ??
        sixMonths[sixMonths.length - 1];

      const weekCounts = [0, 0, 0, 0,0,0,0];
      ticketDates.forEach((date) => {
        if (
          date.getFullYear() === selectedBucket.year &&
          date.getMonth() === selectedBucket.month
        ) {
          const weekIdx = Math.min(Math.max(getWeekOfMonth(date), 1), 6) - 1;
          weekCounts[weekIdx] += 1;
        }
      });

      categories = ["Sem 1", "Sem 2", "Sem 3", "Sem 4"];
      values = weekCounts;
    } else {
      categories = sixMonths.map((bucket) => bucket.label);
      values = sixMonths.map((bucket) => {
        return ticketDates.filter(
          (date) =>
            date.getFullYear() === bucket.year && date.getMonth() === bucket.month
        ).length;
      });
    }

    const trendOption = {
      tooltip: {
        trigger: "axis",
      },
      grid: {
        top: 16,
        right: 16,
        bottom: 24,
        left: 36,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: {
          color: "#fff",
          interval: 0,
          hideOverlap: false,
          formatter: (value) => String(value).toUpperCase(),
        },
        axisLine: {
          lineStyle: {
            color: "rgba(255,255,255,0.35)",
          },
        },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLabel: {
          color: "#fff",
          formatter: (value) => `${Math.trunc(value)}`,
        },
        splitLine: {
          lineStyle: {
            color: "rgba(255,255,255,0.12)",
          },
        },
      },
      series: [
        {
          data: values,
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: "#fff",
          },
          itemStyle: {
            color: "#fff",
          },
          areaStyle: {
            color: "rgba(255,255,255,0.2)",
          },
        },
      ],
    };

    chart.setOption(trendOption, true);

    const onResize = () => chart.resize();
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      chart.dispose();
      trendChartInstanceRef.current = null;
    };
  }, [tickets, trendMode, selectedMonthKey]);

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
        <div style={{ display: "grid", gridTemplateColumns: "95fr 75fr 65fr repeat(4, 1fr)", gridTemplateRows: "270px 370px", gridColumnGap: "15px", gridRowGap: "15px" }}>
          {/* Panel de equipo */}
          <div className="uno" style={{gridArea: "1 / 1 / 2 / 2", ...glassStyle, color: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 19 }}>Equipo de trabajo</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={engineerViewMode}
                  onChange={(e) => setEngineerViewMode(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 12,
                  }}
                >
                  <option value="semanal" style={{ color: "#000" }}>Semana</option>
                  <option value="mensual" style={{ color: "#000" }}>Mes</option>
                </select>
                {engineerViewMode === "mensual" ? (
                  <select
                    value={engineerMonthKey}
                    onChange={(e) => setEngineerMonthKey(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12,
                    }}
                  >
                    {getSixMonthBuckets().map((bucket) => (
                      <option key={bucket.key} value={bucket.key} style={{ color: "#000" }}>
                        {String(bucket.label).toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8, marginTop: 6 }}>
              {engineerViewMode === "semanal" ? "Tickets por ingeniero" : "Tickets por ingeniero"}
            </div>
            <div ref={chartRef} style={{ width: "100%", flex: 1, minHeight: 0 }}/>
          </div>
          <div className="dos" style={{ gridArea: "2 / 1 / 3 / 2", ...glassStyle, color: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Tendencia de tickets</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <select value={trendMode} onChange={(e) => setTrendMode(e.target.value)} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 12, }}>
                  <option value="semanal" style={{ color: "#000" }}>Filtro por semana</option>
                  <option value="mensual" style={{ color: "#000" }}>Ultimos 6 meses</option>
                </select>
                {trendMode === "semanal" ? (
                  <select value={selectedMonthKey} onChange={(e) => setSelectedMonthKey(e.target.value)} style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 8, padding: "6px 10px", fontSize: 12, }}>
                    {getSixMonthBuckets().map((bucket) => (
                      <option key={bucket.key} value={bucket.key} style={{ color: "#000" }}>
                        {bucket.label}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8, marginBottom: 8 }}>
              {trendMode === "mensual" ? "Cantidad de tickets por mes" : "Cantidad de tickets por semana"}
            </div>
            <div ref={trendChartRef} style={{ width: "100%", flex: 1, minHeight: 0 }} />
          </div>
          <div className="tres" style={{ gridArea: "1 / 2 / 3 / 3", ...glassStyle, color: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 19 }}>Resumen de tickets levantados</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  value={summaryViewMode}
                  onChange={(e) => setSummaryViewMode(e.target.value)}
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 12,
                  }}
                >
                  <option value="semanal" style={{ color: "#000" }}>Semana</option>
                  <option value="mensual" style={{ color: "#000" }}>Mes</option>
                </select>
                {summaryViewMode === "mensual" ? (
                  <select
                    value={summaryMonthKey}
                    onChange={(e) => setSummaryMonthKey(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "6px 10px",
                      fontSize: 12,
                    }}
                  >
                    {getSixMonthBuckets().map((bucket) => (
                      <option key={bucket.key} value={bucket.key} style={{ color: "#000" }}>
                        {String(bucket.label).toUpperCase()}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            </div>
            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8, marginTop: 6 }}>
              {summaryViewMode === "semanal" ? "Distribucion por estatus" : "Distribucion por estatus"}
            </div>
            <div ref={pieChartRef} style={{ width: "100%", flex: 1, minHeight: 0 }} />
          </div>
          <div className="cuatro" style={{ gridArea: "1 / 3 / 2 / 4", ...glassStyle, color: "#fff", display: "flex", flexDirection: "column" }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Calificación promedio</h3>
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8, marginBottom: 8 }}>
              Promedio de tickets cerrados calificados
            </div>
            <div ref={gaugeChartRef} style={{ width: '100%', flex: 1, minHeight: 0 }} />
          </div>
          <div className="cinco" style={{ gridArea: "2 / 3 / 3 / 4", ...glassStyle, color: "#fff" }}>
            
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default Admin;