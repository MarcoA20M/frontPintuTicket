import React, { useEffect, useState } from "react";
import Sidebar from './Sidebar';
import Header from './Header';
import { getAllTickets } from '../services/ticketService';


const Engineer = () => {
    const [usuario, setUsuario] = useState(null);

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
                const all = await getAllTickets();
                setTickets(all || []);
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
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
                        <div style={{
                            background: 'rgba(104, 190, 53, 1)',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                            borderRadius: '18px',
                            padding: '20px',
                            minWidth: '300px',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,255,255,0.35)',
                            WebkitBackdropFilter: 'blur(8px)',
                            transition: 'box-shadow 0.3s',
                            }}>
                            <h3 style={{ margin: 0, color: '#ffffffff' }}>Tickets asignados</h3>
                            <p style={{ fontSize: '2rem', margin: '12px 0 0 0' }}>{tickets.filter(t => usuario && t.ingeniero === usuario.nombre).length}</p>
                        </div>

                        <div style={{
                            background: 'rgba(104, 179, 61, 1)',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                            borderRadius: '18px',
                            padding: '20px',
                            minWidth: '300px',
                            backdropFilter: 'blur(8px)',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            WebkitBackdropFilter: 'blur(8px)',
                            transition: 'box-shadow 0.3s',
                        }}>
                            <h3 style={{ margin: 0, color: '#ffffffff' }}>En proceso</h3>
                            <p style={{ fontSize: '2rem', margin: '12px 0 0 0' }}>{tickets.filter(t => usuario && t.ingeniero === usuario.nombre && t.estatus === 'En proceso').length}</p>
                        </div>

                        <div style={{
                            background: 'rgba(104, 179, 61, 1)',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                            borderRadius: '18px',
                            padding: '24px',
                            minWidth: '300px',
                            backdropFilter: 'blur(8px)',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            WebkitBackdropFilter: 'blur(8px)',
                            transition: 'box-shadow 0.3s',
                        }}>
                            <h3 style={{ margin: 0, color: '#ffffffff' }}>Cerrados</h3>
                            <p style={{ fontSize: '2rem', margin: '12px 0 0 0' }}>{tickets.filter(t => usuario && t.ingeniero === usuario.nombre && (t.estatus === 'Cerrado' || t.estatus === 'Cerrados')).length}</p>
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
                                {tickets.filter(t => usuario && t.ingeniero === usuario.nombre && t.prioridad === 'Alta').map((ticket) => (
                                    <div key={ticket.folio} style={{ background: '#ffd1db', borderRadius: '22px', padding: '22px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.6rem', color: '#222', marginBottom: '8px' }}>{ticket.tipo_ticket}</div>
                                        <div style={{ color: '#222', fontSize: '1.1rem', marginBottom: '2px' }}>{ticket.usuario}</div>
                                        <div style={{ color: '#222', fontSize: '1.1rem', marginBottom: '12px' }}>{ticket.area ?? ticket.departamento ?? ''}</div>
                                        <button style={{ position: 'absolute', right: '24px', top: '24px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 24px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Ver mas</button>
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
                                {tickets.filter(t => usuario && t.ingeniero === usuario.nombre).map((ticket) => (
                                    <div key={ticket.folio} style={{ background: '#ffd1db', borderRadius: '22px', padding: '22px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.6rem', color: '#222', marginBottom: '8px' }}>{ticket.tipo_ticket}</div>
                                        <div style={{ color: '#222', fontSize: '1.1rem', marginBottom: '2px' }}>{ticket.usuario}</div>
                                        <div style={{ color: '#222', fontSize: '1.1rem', marginBottom: '12px' }}>{ticket.area ?? ticket.departamento ?? ''}</div>
                                        <button style={{ position: 'absolute', right: '24px', top: '24px', background: '#3ce73cff', color: '#fff', border: 'none', borderRadius: '12px', padding: '10px 24px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}>Ver mas</button>
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
