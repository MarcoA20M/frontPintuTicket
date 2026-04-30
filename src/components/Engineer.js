import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Styles/engineer.css';
import { getAllTickets,getTicketsByIngenieroId } from '../services/ticketService';
import * as echarts from 'echarts';

const monthLabels = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'sep',
    'octubre',
    'nov',
    'dic',
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
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: monthLabels[d.getMonth()],
            year: d.getFullYear(),
            month: d.getMonth(),
        };
    });
};


const Engineer = () => {
    const [usuario, setUsuario] = useState(null);
    const [summaryViewMode, setSummaryViewMode] = useState('semanal');
    const [summaryMonthKey, setSummaryMonthKey] = useState(() => {
        const buckets = getSixMonthBuckets();
        return buckets[buckets.length - 1]?.key ?? '';
    });
    const navigate = useNavigate();
    const pieChartRef = useRef(null);
    const gaugeChartRef = useRef(null);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            setUsuario(JSON.parse(usuarioGuardado));
        }
    }, []);

    // tickets del backend
    const [tickets, setTickets] = useState([]);
    useEffect(() => {
        const fetchTickets = async () => {
            try {
                // intentar obtener identificador del ingeniero desde localStorage
                const raw = localStorage.getItem('usuario');
                let loaded = [];
                if (raw) {
                    try {
                        const u = JSON.parse(raw);
                        const candidates = [u.id, u.idUsuario, u.id_ingeniero, u.userId, u.userName, u.user, u.username, u.nombre].filter(Boolean).map(String);
                        const uniq = Array.from(new Set(candidates));
                        let got = false;
                        for (const c of uniq) {
                            try {
                                const t = await getTicketsByIngenieroId(c);
                                if (Array.isArray(t)) {
                                    loaded = t;
                                    got = true;
                                    break;
                                }
                            } catch (e) {
                                console.warn('Engineer: intento getTicketsByIngenieroId falló para', c, e?.message || e);
                            }
                        }
                        if (!got) {
                            // fallback: obtener todos
                            const all = await getAllTickets();
                            loaded = all || [];
                        }
                    } catch (e) {
                        console.error('Engineer: error parseando usuario o llamando service:', e);
                        const all = await getAllTickets();
                        loaded = all || [];
                    }
                } else {
                    const all = await getAllTickets();
                    loaded = all || [];
                }

                setTickets(loaded);
            } catch (err) {
                console.error('No se pudieron cargar tickets en Engineer:', err);
            }
        };
        fetchTickets();
    }, []);

    const engineerTickets = tickets.filter((ticket) => usuario && ticket.ingeniero === usuario.nombre);

    useEffect(() => {
        if (!usuario || (!pieChartRef.current && !gaugeChartRef.current)) return;

        const pieDom = pieChartRef.current;
        const pieChart = pieDom ? (echarts.getInstanceByDom(pieDom) ?? echarts.init(pieDom)) : null;

        const gaugeDom = gaugeChartRef.current;
        const gaugeChart = gaugeDom ? (echarts.getInstanceByDom(gaugeDom) ?? echarts.init(gaugeDom)) : null;

        const sixMonths = getSixMonthBuckets();
        const selectedSummaryMonth =
            sixMonths.find((bucket) => bucket.key === summaryMonthKey) ??
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

        const filteredSummaryTickets = engineerTickets.filter((ticket) => {
            const date = getTicketDate(ticket);
            if (!date) return false;

            if (summaryViewMode === 'mensual') {
                return (
                    date.getFullYear() === selectedSummaryMonth.year &&
                    date.getMonth() === selectedSummaryMonth.month
                );
            }

            return date >= weekStart && date <= weekEnd;
        });

        const enProgreso = filteredSummaryTickets.filter((ticket) => ticket.estatus === 'En Progreso').length;
        const cerrados = filteredSummaryTickets.filter(
            (ticket) => ticket.estatus === 'Cerrado' || ticket.estatus === 'Cerrados'
        ).length;
        const pendientes = filteredSummaryTickets.filter((ticket) => ticket.estatus === 'Abierto').length;

        pieChart?.setOption(
            {
                tooltip: {
                    trigger: 'item',
                },
                legend: {
                    orient: 'horizontal',
                    left: 'center',
                    bottom: 'bottom',
                    padding: 10,
                    textStyle: {
                        color: '#fff',
                    },
                },
                series: [
                    {
                        name: 'Tickets',
                        type: 'pie',
                        radius: '65%',
                        center: ['50%', '48%'],
                        data: [
                            { value: enProgreso, name: 'En progreso' },
                            { value: cerrados, name: 'Cerrados' },
                            { value: pendientes, name: 'Pendientes' },
                        ],
                        label: {
                            color: '#fff',
                        },
                        emphasis: {
                            itemStyle: {
                                shadowBlur: 10,
                                shadowOffsetX: 0,
                            },
                        },
                    },
                ],
            },
            true
        );

        const closedStatuses = new Set(['cerrado', 'cerrados']);
        const closedTickets = filteredSummaryTickets.filter((ticket) =>
            closedStatuses.has(String(ticket?.estatus ?? '').toLowerCase().trim())
        );
        const ratedValues = closedTickets
            .map((ticket) => {
                const raw = ticket?.calificacion ?? ticket?.rating ?? ticket?.score ?? ticket?.puntuacion ?? ticket?.calificacionTicket;
                const value = Number(raw);
                return Number.isFinite(value) ? value : null;
            })
            .filter((value) => value != null && value > 0);

        const ratedCount = ratedValues.length;
        const avgRating = ratedCount ? ratedValues.reduce((acc, value) => acc + value, 0) / ratedValues.length : 0;

        gaugeChart?.setOption(
            {
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
                                    [0.2, '#ff4d4f'],
                                    [0.4, '#fa8c16'],
                                    [0.6, '#facc15'],
                                    [0.8, '#52c41a'],
                                    [1, '#1890ff'],
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
                                const rounded = Math.round(value);
                                if (rounded === 0) return '';
                                if (rounded < 0 || rounded > 5) return '';
                                return String(rounded);
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
            },
            true
        );

        const onResize = () => {
            pieChart?.resize();
            gaugeChart?.resize();
        };

        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            pieChart?.dispose();
            gaugeChart?.dispose();
        };
    }, [usuario, engineerTickets, summaryMonthKey, summaryViewMode]);

    if (!usuario) {
        return (
            <div className="perfil-container">
                <p className="perfil-loading">Cargando información...</p>
            </div>
        );
    }

    return (
        <div className="perfil-container" style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'flex-start', gap: '10px' }}>
            {/* Sidebar could be enabled here */}
            {/* <Sidebar /> */}

            <div>
                {/* <Header /> */}

                <div className="engineer-cards">
                    {/* Cards informativas */}
                    <div className="pending" >
                        <div className="engineer-card green">
                            <div className="icon">
                                <h3>Tickets asignados</h3>
                                <p>{engineerTickets.length}</p>
                            </div>
                            <div className="icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="100" height="90" fill="currentColor" class="bi bi-file-text" viewBox="0 0 16 16">
                                    <path d="M5 4a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm-.5 2.5A.5.5 0 0 1 5 6h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5M5 8a.5.5 0 0 0 0 1h6a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1z" />
                                    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1" />
                                </svg>
                            </div>
                        </div>

                        <div className="engineer-card green-2">
                            <div className="icon">
                                <h3>En proceso</h3>
                                <p>{engineerTickets.filter(t => t.estatus === 'En Progreso').length}</p>
                            </div>
                            <div className="icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="100" height="90" fill="currentColor" class="bi bi-gear" viewBox="0 0 16 16">
                                    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0" />
                                    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z" />
                                </svg>
                            </div>
                        </div>

                        <div className="engineer-card green-2" style={{ padding: '24px' }}>
                            <div className="icon">
                                <h3>Cerrados</h3>
                                <p>{engineerTickets.filter(t => t.estatus === 'Cerrado' || t.estatus === 'Cerrados').length}</p>
                            </div>
                            <div className="icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" fill="currentColor" class="bi bi-x-square" viewBox="0 0 16 16">
                                    <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Contenido principal: panel bien amplio */}
                    <div style={{
                        background: 'rgba(255,255,255,0.18)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                        borderRadius: '18px',
                        padding: '28px 32px',
                        width: '110%',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '20px',
                        backdropFilter: 'blur(8px)',
                        border: '1.5px solid rgba(255,255,255,0.35)',
                        WebkitBackdropFilter: 'blur(8px)',
                        transition: 'box-shadow 0.3s',
                        marginTop: '30px',
                    }}>
                        <div style={{ textAlign: 'left' }}>
                            <h1 style={{ color: '#fff', marginBottom: '8px' }}>¡Bienvenido Ingeniero! {usuario.nombre} </h1>
                            <p style={{ color: '#fff', marginBottom: '0' }}>¿Qué tickets deseas revisar hoy?</p>
                        </div>
                        <button
                            style={{ padding: '10px 32px', borderRadius: '8px', border: 'none', background: '#a50659ff', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                            onClick={() => console.log('Continuar')}
                        >
                            Continuar
                        </button>
                    </div>

                    {/* Sección de resumen: ocupando todo el ancho */}
                    <div style={{ display: 'flex', gap: '32px', marginTop: '40px', width: '110%', justifyContent: 'space-between', alignItems: 'stretch' }}>
                        {/* Resumen de tickets levantados */}
                        <div style={{
                            flex: 1,
                            background: 'rgba(244, 242, 242, 0.18)',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            borderRadius: '18px',
                            padding: '24px',
                            minHeight: '480px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                <h2 style={{ color: '#fff', marginTop: 0, fontWeight: 600, fontSize: '2rem', marginBottom: '18px' }}>Resumen de tickets levantados</h2>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <select
                                        value={summaryViewMode}
                                        onChange={(e) => setSummaryViewMode(e.target.value)}
                                        style={{
                                            background: 'rgba(255,255,255,0.12)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            color: '#fff',
                                            borderRadius: 8,
                                            padding: '6px 10px',
                                            fontSize: 12,
                                        }}
                                    >
                                        <option value="semanal" style={{ color: '#000' }}>Semana</option>
                                        <option value="mensual" style={{ color: '#000' }}>Mes</option>
                                    </select>
                                    {summaryViewMode === 'mensual' ? (
                                        <select
                                            value={summaryMonthKey}
                                            onChange={(e) => setSummaryMonthKey(e.target.value)}
                                            style={{
                                                background: 'rgba(255,255,255,0.12)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                color: '#fff',
                                                borderRadius: 8,
                                                padding: '6px 10px',
                                                fontSize: 12,
                                            }}
                                        >
                                            {getSixMonthBuckets().map((bucket) => (
                                                <option key={bucket.key} value={bucket.key} style={{ color: '#000' }}>
                                                    {String(bucket.label).toUpperCase()}
                                                </option>
                                            ))}
                                        </select>
                                    ) : null}
                                </div>
                            </div>
                            <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8, marginTop: 6, color: '#fff' }}>
                                Distribución por estatus de tus tickets
                            </div>
                            <div ref={pieChartRef} style={{ width: '100%', flex: 1, minHeight: 0 }} />
                        </div>

                        {/* Calificación promedio */}
                        <div style={{
                            flex: 1,
                            background: 'rgba(244, 242, 242, 0.18)',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            borderRadius: '18px',
                            padding: '24px',
                            minHeight: '480px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            <h2 style={{ color: '#fff', marginTop: 0, fontWeight: 600, fontSize: '2rem', textAlign: 'center', marginBottom: '18px' }}>Calificación promedio</h2>
                            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8, marginBottom: 8, color: '#fff' }}>
                                Promedio de tus tickets cerrados calificados
                            </div>
                            <div ref={gaugeChartRef} style={{ width: '100%', flex: 1, minHeight: 0 }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Engineer;
