import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const cardStyle = {
    background: 'rgba(255,255,255,0.12)',
    padding: 24,
    borderRadius: 10,
    color: '#000',
    minWidth: 260
};

const TrackingUser = () => {
    const navigate = useNavigate();

    const handleView = (folio) => {
        // navegar a la vista de ticket
        navigate(`/ticket/${folio}`);
    };

    const handleStatusClick = (folio) => {
        // placeholder: mostrar modal o acción rápida
        alert(`Mostrar opciones de estado para folio ${folio}`);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <div style={{ flex: 1, padding: 28, color: '#fff' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    </div>
                </header>

                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', marginBottom: 28 }}>
                    <div style={{ ...cardStyle, color: '#000', background: '#cfe9d9' }}>
                        <div style={{ fontSize: 14 }}>Tickets totales</div>
                        <div style={{ fontSize: 48, fontWeight: 800 }}>1</div>
                    </div>

                    <div style={{ ...cardStyle, color: '#000', background: '#f7c6cd' }}>
                        <div style={{ fontSize: 14 }}>Tickets cerrados</div>
                        <div style={{ fontSize: 48, fontWeight: 800, color: '#e74c3c' }}>0</div>
                    </div>

                    <div style={{ marginLeft: 'auto' }}>
                        <input placeholder="Folio" style={{ padding: '10px 14px', borderRadius: 20, border: 'none', outline: 'none', minWidth: 220 }} />
                    </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.12)', padding: 24, borderRadius: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.6fr', gap: 12, alignItems: 'center' }}>
                        <div style={{ fontWeight: 700 }}>Asignado a</div>
                        <div style={{ fontWeight: 700 }}>Fecha</div>
                        <div style={{ fontWeight: 700 }}>Fecha de solucionado</div>
                        <div style={{ fontWeight: 700 }}>Folio</div>
                        <div style={{ fontWeight: 700 }}>Seguimiento</div>
                        <div style={{ fontWeight: 700 }}>Status</div>
                    </div>

                    <hr style={{ border: 'none', height: 2, background: 'rgba(255,255,255,0.06)', margin: '12px 0' }} />

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 0.6fr', gap: 12, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff' }} />
                            <div>
                                <div style={{ fontWeight: 700 }}>Diana Herrera</div>
                                <div style={{ fontSize: 12 }}>sistemas@pintumex.com.mx</div>
                            </div>
                        </div>
                        <div>08/10/2025</div>
                        <div>18/10/2025</div>
                        <div>55453605</div>
                        <div><button onClick={() => handleView('55453605')} style={{ background: '#2ecc71', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>Ver</button></div>
                        <div><button onClick={() => handleStatusClick('55453605')} style={{ background: '#2ecc71', padding: '8px 12px', borderRadius: 6, color: '#000', fontWeight: 700, border: 'none', cursor: 'pointer' }}>Abierto</button></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackingUser;
