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
        <div className="perfil-container" style={{ display: 'flex', width: '100%', justifyContent: 'center', alignItems: 'flex-start', gap: '30px' }}>
            {/* Sidebar could be enabled here */}
            {/* <Sidebar /> */}

            <div>
                {/* <Header /> */}

                <div>
                    {/* Cards informativas */}
                    <div className="engineer-cards" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
                        <div className="engineer-card green">
                            <h3>Tickets asignados</h3>
                            <p>{tickets.filter(t => usuario && t.ingeniero === usuario.nombre).length}</p>
                        </div>

                        <div className="engineer-card green-2">
                            <h3>En proceso</h3>
                            <p>{tickets.filter(t => usuario && t.ingeniero === usuario.nombre && t.estatus === 'En proceso').length}</p>
                        </div>

                        <div className="engineer-card green-2" style={{ padding: '24px' }}>
                            <h3>Cerrados</h3>
                            <p>{tickets.filter(t => usuario && t.ingeniero === usuario.nombre && (t.estatus === 'Cerrado' || t.estatus === 'Cerrados')).length}</p>
                        </div>
                    </div>

                    {/* Contenido principal: panel bien amplio */}
                    <div style={{
                        background: 'rgba(255,255,255,0.18)',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                        borderRadius: '18px',
                        padding: '28px 32px',
                        width: '100%',
                        margin: '0 0 32px 0',
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
                            <p style={{ color: '#fff', marginBottom: '0' }}>Esta es tu vista personalizada.</p>
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
                            background: 'linear-gradient(135deg, #8f5de8 0%, #c850c0 100%)',
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
                                    <div key={ticket.folio} style={{ background: '#ffd1db', borderRadius: '22px', padding: '22px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.6rem', color: '#222', marginBottom: '8px' }}>{ticket.tipo_ticket}</div>
                                        <div style={{ color: '#222', fontSize: '1.1rem', marginBottom: '2px' }}>{ticket.usuario}</div>
                                        <div style={{ color: '#222', fontSize: '1.1rem', marginBottom: '12px' }}>{ticket.area ?? ticket.departamento ?? ''}</div>
                                        <button onClick={() => navigate(`/ticketsIngeniero?folio=${encodeURIComponent(ticket.folio ?? ticket.id)}`)} style={{ position: 'absolute', right: '24px', top: '24px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 24px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Ver mas</button>
                                        <div style={{ position: 'absolute', right: '24px', bottom: '18px', color: '#222', fontWeight: 500, fontSize: '1.1rem' }}>{new Date(ticket.fechaCreacion).toLocaleDateString()}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tickets asignados */}
                        <div style={{
                            flex: 1,
                            background: 'linear-gradient(135deg, #8f5de8 0%, #c850c0 100%)',
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
                                    <div key={ticket.folio} style={{ background: '#ffd1db', borderRadius: '22px', padding: '22px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.6rem', color: '#222', marginBottom: '8px' }}>{ticket.tipo_ticket}</div>
                                        <div style={{ color: '#222', fontSize: '1.1rem', marginBottom: '2px' }}>{ticket.usuario}</div>
                                        <div style={{ color: '#222', fontSize: '1.1rem', marginBottom: '12px' }}>{ticket.area ?? ticket.departamento ?? ''}</div>
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
