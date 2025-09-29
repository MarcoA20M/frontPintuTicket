import React from 'react';
import Sidebar from './Sidebar';

const pill = {
    background: 'rgba(255,255,255,0.12)',
    padding: '10px 14px',
    borderRadius: 8,
    color: '#fff'
};

const Tracking = () => {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', color: '#fff' }}>
            <div style={{ flex: 1, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0 }}>Asignación de ticket</h2>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 24, alignItems: 'stretch', flex: 1 }}>
                    {/* Left panel: form */}
                    <div style={{ width: 300, height: 500, ...pill, background: 'rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ fontWeight: 700 }}>Solicitante</div>
                        <div style={{ background: '#fff', color: '#000000ff', padding: '10px 12px', borderRadius: 8 }}>Martín Herrera</div>

                        <div style={{ fontWeight: 700 }}>Ingeniero encargado</div>
                        <select style={{ padding: '10px', borderRadius: 8, color: '#000000ff' }}>
                            <option>Ing. Randall</option>
                            <option>Ing. Diana</option>
                        </select>

                        <div style={{ fontWeight: 700 }}>Prioridad</div>
                        <select style={{ padding: '10px', borderRadius: 8, color: '#000000ff' }}>
                            <option>Sin prioridad</option>
                            <option>Alta</option>
                            <option>Media</option>
                            <option>Baja</option>
                        </select>

                        <div style={{ fontWeight: 700 }}>Tipo</div>
                        <select style={{ padding: '10px', borderRadius: 8, color: '#000000ff' }}>
                            <option>Falla</option>
                            <option>Mantenimiento</option>
                        </select>

                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                            <button style={{ background: '#2ecc71', border: 'none', padding: '12px 16px', borderRadius: 8 }}>Guardar</button>
                            <button style={{ background: '#e74c3c', border: 'none', padding: '12px 16px', borderRadius: 8 }}>Eliminar</button>
                        </div>
                    </div>

                    {/* Center panel: chat */}
                    <div style={{ flex: 1, height: 550, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div>
                                <div style={{ fontWeight: 700 }}>Asunto : Falla de impresora</div>
                                <div style={{ fontSize: 12, opacity: 0.85 }}>Fecha: 01/07/2025 · Departamento: Recursos Humanos</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div>Folio : 10293876</div>
                                <div>Encargado : Sin encargado</div>
                                <div style={{ color: '#2ecc71', fontWeight: 700 }}>Abierto</div>
                            </div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff' }} />
                                <div style={{ background: '#cfe9d9', color: '#000', padding: 12, borderRadius: 12, maxWidth: '70%' }}>
                                    Me falló la impresora y tengo que imprimir los reportes para la lic. Angeles
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                                <div style={{ background: '#cfe9d9', color: '#000', padding: 12, borderRadius: 12, maxWidth: '70%' }}>
                                    En un momento bajo, me puede poner mientras su ultra para ver que tiene la impresora
                                </div>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff' }} />
                            </div>
                        </div>

                        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <input placeholder="Agregar algún comentario" style={{ flex: 1, padding: '12px 16px', borderRadius: 24, border: 'none', outline: 'none' }} />
                            <button style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: 'none' }}>↑</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Tracking;
