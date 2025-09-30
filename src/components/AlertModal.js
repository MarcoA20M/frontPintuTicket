import React from 'react';

const overlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
};

const boxStyle = {
  background: '#fff', borderRadius: 8, padding: 20, maxWidth: 480, width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
};

const titleStyle = { margin: 0, marginBottom: 8, fontSize: 18, color: '#c00' };
const messageStyle = { marginBottom: 16, color: '#c00', whiteSpace: 'pre-wrap' };
const buttonStyle = { padding: '8px 14px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', cursor: 'pointer' };

export default function AlertModal({ visible, title = 'Alerta', message = '', onClose }) {
  if (!visible) return null;

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true">
      <div style={boxStyle}>
        <h3 style={titleStyle}>{title}</h3>
        <div style={messageStyle}>{message}</div>
        <div style={{ textAlign: 'right' }}>
          <button style={{ ...buttonStyle, backgroundColor: '#e00f0fff' }} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
