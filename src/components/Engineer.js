import React, { useEffect, useState } from "react";
import Sidebar from './Sidebar';
import Header from './Header';


const Engineer = () => {
    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            setUsuario(JSON.parse(usuarioGuardado));
        }
    }, []);

    if (!usuario) {
        return (
            <div className="perfil-container">
                <p className="perfil-loading">Cargando información...</p>
            </div>
        );
    }

    return (
        <div className="perfil-container" style={{ display: 'flex', width: '1000%', justifyContent: 'center', alignItems: 'flex-start', gap: '30px' }}>
            {/* Sidebar could be enabled here */}
            {/* <Sidebar /> */}

            <div >
                {/* <Header /> */}

                <div >
                    {/* Cards informativas */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '110px', marginBottom: '32px', flexWrap: 'wrap' }}>
                        {/* Card: Tickets asignados */}
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
                            <h3 style={{ margin: 0, color: '#ffffffff' }}>Tickets asignados</h3>
                            <p style={{ fontSize: '2rem', margin: '12px 0 0 0' }}>12</p>
                        </div>

                        {/* Card: En proceso */}
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
                            <h3 style={{ margin: 0, color: '#ffffffff' }}>En proceso</h3>
                            <p style={{ fontSize: '2rem', margin: '12px 0 0 0' }}>5</p>
                        </div>

                        {/* Card: Cerrados */}
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
                            <p style={{ fontSize: '2rem', margin: '12px 0 0 0' }}>8</p>
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
                        gap: '24px',
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
                            background: 'rgba(255,255,255,0.18)',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                            borderRadius: '18px',
                            padding: '16px',
                            maxHeight: '480px',
                            overflowY: 'auto',
                            backdropFilter: 'blur(8px)',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            WebkitBackdropFilter: 'blur(8px)',
                            transition: 'box-shadow 0.3s',
                        }}>
                            <h2 style={{ color: '#ffffffff', marginTop: 0 }}>Tickets urgentes</h2>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}><strong>Folio:</strong> 1001 - <span>Equipo caído</span></li>
                                <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}><strong>Folio:</strong> 1002 - <span>Red inestable</span></li>
                                <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}><strong>Folio:</strong> 1003 - <span>Sin acceso a sistema</span></li>
                            </ul>
                        </div>

                        {/* Tickets asignados */}
                        <div style={{
                            flex: 1,
                            marginLeft: '8px',
                            background: 'rgba(255,255,255,0.18)',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                            borderRadius: '18px',
                            padding: '16px',
                            maxHeight: '480px',
                            overflowY: 'auto',
                            backdropFilter: 'blur(8px)',
                            border: '1.5px solid rgba(255,255,255,0.35)',
                            WebkitBackdropFilter: 'blur(8px)',
                            transition: 'box-shadow 0.3s',
                        }}>
                            <h2 style={{ color: '#ffffffff', marginTop: 0 }}>Tickets asignados</h2>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}><strong>Folio:</strong> 2001 - <span>Actualizar software</span></li>
                                <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}><strong>Folio:</strong> 2002 - <span>Revisión de impresora</span></li>
                                <li style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}><strong>Folio:</strong> 2003 - <span>Configuración de correo</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Engineer;
