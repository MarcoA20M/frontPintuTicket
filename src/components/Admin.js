import React from 'react';
import Sidebar from './Sidebar';

const Card = ({ title, value, bgColor }) => (
  <div style={{
    background: bgColor || 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: '28px 35px',
    minWidth: 240,
    textAlign: 'center'
  }}>
    <div style={{ fontSize: 45, fontWeight: 800, color: '#fff' }}>{value}</div>
    <div style={{ fontSize: 16, color: '#fff', opacity: 0.95, marginTop: 8 }}>{title}</div>
  </div>
);

const glassStyle = {
  background: 'rgba(255,255,255,0.09)',
  boxShadow: '0 10px 32px rgba(0,0,0,0.28)',
  borderRadius: 14,
  padding: 22,
  border: '1px solid rgba(255,255,255,0.12)',
  backdropFilter: 'blur(8px)'
};

const Admin = () => {

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      <div style={{ flex: 1, padding: '8px 12px', width: '100%' }}>
        {/* Header */}
        {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/logo192.png" alt="logo" style={{ width: 56 }} />
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>50 AÑOS CONTIGOs
                +
            </div>
          </div>
        </div> */}

        {/* Top cards */}
        <div style={{ display: 'flex', gap: 24, marginBottom: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          <Card title="En proceso" value={6} bgColor={'rgba(255, 255, 255, 0.12)'} />
          <Card title="Cerrados" value={144} bgColor={'rgba(255,255,255,0.12)'} />
          <Card title="Pendientes" value={2} bgColor={'rgba(255,255,255,0.12)'} />
        </div>

        {/* Banner de bienvenida */}
        <div style={{ ...glassStyle, padding: '30px 60px', color: '#fff', marginBottom: 28, borderRadius: 14 }}>
          <strong style={{ fontSize: 22 }}>BIENVENIDO DE NUEVO RAFAEL</strong>
        </div>

        {/* Two panels: Equipo y Resumen */}
  <div style={{ display: 'flex', gap: 28, alignItems: 'stretch', justifyContent: 'space-between' }}>
          <div style={{ flex: 1.6, ...glassStyle, color: '#fff' }}>
            <h3 style={{ marginTop: 0, fontSize: 19 }}>Equipo de trabajo</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
                <div style={{ width: 51, height: 51, borderRadius: '50%', background: '#fff' }} />
                <div>
                  <div><strong style={{ fontSize: 14 }}>José Randall</strong></div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>Programador · Resurrección · En proceso</div>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
                <div style={{ width: 51, height: 51, borderRadius: '50%', background: '#fff' }} />
                <div>
                  <div><strong style={{ fontSize: 14 }}>Diana Herrera</strong></div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>Programadora · Resurrección · En proceso</div>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0' }}>
                <div style={{ width: 51, height: 51, borderRadius: '50%', background: '#fff' }} />
                <div>
                  <div><strong style={{ fontSize: 14 }}>Felix Harol</strong></div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>Programador · Planta · Sin pendientes</div>
                </div>
              </li>
            </ul>   
          </div>

          <div style={{ flex: 1.4, ...glassStyle, color: '#fff' }}>
            <h3 style={{ marginTop: 0, fontSize: 19 }}>Resúmen mensual</h3>
            <div style={{ height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Placeholder para gráfico */}
              <div style={{ width: '80%', height: '84%', background: 'linear-gradient(180deg,#ffdb5c,#ff6ea1)', borderRadius: 10 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
