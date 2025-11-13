import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './Styles/engineer.css';
import { getAllTickets,getTicketsByIngenieroId } from '../services/ticketService';


const Engineer = () => {
    const [usuario, setUsuario] = useState(null);
    const navigate = useNavigate();

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

    if (!usuario) {
        return (
            <div className="perfil-container">
                <p className="perfil-loading">Cargando información...</p>
            </div>
        );
    }

    return (
        <div className="perfil-container" style={{ display: 'flex', width: '110%', justifyContent: 'center', alignItems: 'flex-start', gap: '10px' }}>
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
                                <p>{tickets.filter(t => usuario && t.ingeniero === usuario.nombre).length}</p>
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
                                <p>{tickets.filter(t => usuario && t.ingeniero === usuario.nombre && t.estatus === 'En proceso').length}</p>
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
                                <p>{tickets.filter(t => usuario && t.ingeniero === usuario.nombre && (t.estatus === 'Cerrado' || t.estatus === 'Cerrados')).length}</p>
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
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '20px',
                        backdropFilter: 'blur(8px)',
                        border: '1.5px solid rgba(255,255,255,0.35)',
                        WebkitBackdropFilter: 'blur(8px)',
                        transition: 'box-shadow 0.3s',
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

                    {/* Sección de tickets: ocupando todo el ancho */}
                    <div style={{ display: 'flex', gap: '32px', marginTop: '40px', width: '100%', justifyContent: 'space-between', alignItems: 'stretch' }}>
                        {/* Tickets urgentes */}
                        <div style={{
                            flex: 1,
                            background: 'rgba(244, 242, 242, 0.18)',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            borderRadius: '18px',
                            padding: '24px',
                            maxHeight: '480px',
                            overflowY: 'auto',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                        }}>
                            <h2 style={{ color: '#fff', marginTop: 0, fontWeight: 600, fontSize: '2rem', textAlign: 'center', marginBottom: '18px' }}>Tus tickets urgentes</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                {tickets.filter(t => usuario && t.ingeniero === usuario.nombre && t.prioridad === 'Alta')
                                    .slice().sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
                                    .map((ticket) => (
                                    <div key={ticket.folio} style={{ background: 'rgba(244, 242, 242, 0.18)', borderRadius: '22px', padding: '22px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.6rem', color: '#ffffffff', marginBottom: '8px' }}>{ticket.tipo_ticket}</div>
                                        <div style={{ color: '#ffffffff', fontSize: '1.1rem', marginBottom: '2px' }}>{ticket.usuario}</div>
                                        <div style={{ color: '#ffffffff', fontSize: '1.1rem', marginBottom: '12px' }}>{ticket.area ?? ticket.departamento ?? ''}</div>
                                        <button onClick={() => navigate(`/ticketsIngeniero?folio=${encodeURIComponent(ticket.folio ?? ticket.id)}`)} style={{ position: 'absolute', right: '24px', top: '24px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 24px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Ver mas</button>
                                        <div style={{ position: 'absolute', right: '24px', bottom: '18px', color: '#222', fontWeight: 500, fontSize: '1.1rem' }}>{new Date(ticket.fechaCreacion).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tickets asignados */}
                        <div style={{
                            flex: 1,
                            background: 'rgba(244, 242, 242, 0.18)',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            borderRadius: '18px',
                            padding: '24px',
                            maxHeight: '480px',
                            overflowY: 'auto',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                        }}>
                            <h2 style={{ color: '#fff', marginTop: 0, fontWeight: 600, fontSize: '2rem', textAlign: 'center', marginBottom: '18px' }}>Tus tickets asignados</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                                {tickets.filter(t => usuario && t.ingeniero === usuario.nombre)
                                    .slice().sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
                                    .map((ticket) => (
                                    <div key={ticket.folio} style={{ background: 'rgba(244, 242, 242, 0.18)', borderRadius: '22px', padding: '22px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.6rem', color: '#ffffffff', marginBottom: '8px' }}>{ticket.tipo_ticket}</div>
                                        <div style={{ color: '#ffffffff', fontSize: '1.1rem', marginBottom: '2px' }}>{ticket.usuario}</div>
                                        <div style={{ color: '#ffffffff', fontSize: '1.1rem', marginBottom: '12px' }}>{ticket.area ?? ticket.departamento ?? ''}</div>
                                        <button onClick={() => navigate(`/ticketsIngeniero?folio=${encodeURIComponent(ticket.folio ?? ticket.id)}`)} style={{ position: 'absolute', right: '24px', top: '24px', background: '#3ce73cff', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 24px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Ver mas</button>
                                        <div style={{ position: 'absolute', right: '24px', bottom: '18px', color: '#222', fontWeight: 500, fontSize: '1.1rem' }}>{new Date(ticket.fechaCreacion).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Engineer;
