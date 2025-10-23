import React from 'react';
import { createPortal } from 'react-dom';
import ElectricBorder from '../ElectricBorder';
import '../Styles/AlertModal.css';

export default function AlertModalError({ visible, title = 'Alerta', message = '', onClose, backdropOpacity = 0.20, variant = 'default', ebColor = '#d12626ff', ebSpeed = 1, ebChaos = 0.10, ebThickness = 2 }) {
  if (!visible) return null;

  const overlay = {
    position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
  };

  const backdrop = {
    position: 'absolute', inset: 0, background: `rgba(6,10,22,${Number(backdropOpacity)})`, backdropFilter: 'blur(4px)'
  };

  const card = {
    position: 'relative', zIndex: 100000, width: 'min(100%,720px)', borderRadius: 12, overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(4,8,20,0.35)',
    transform: 'translateY(0)', transition: 'opacity 220ms ease, transform 220ms ease',
    background: variant === 'default' ? 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,250,250,0.85))' : '#fff'
  };

  const header = { padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  const titleStyle = { margin: 0, fontSize: 16, fontWeight: 600, color: '#0b1a2b' };
  const body = { padding: '18px', color: '#102030', whiteSpace: 'pre-wrap', lineHeight: 1.45 };
  const footer = { padding: '12px 18px', borderTop: '1px solid rgba(0,0,0,0.04)', textAlign: 'right', background: 'transparent' };

  const closeBtn = {
    border: 'none', background: 'transparent', cursor: 'pointer', width: 36, height: 36, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
  };

  const actionBtn = {
    padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#ff0b0bff', color: '#fff', fontWeight: 600
  };

  const node = (
    <div className="alert-modal" style={overlay} role="dialog" aria-modal="true">
      <div style={backdrop} onClick={onClose} />
      <ElectricBorder color={ebColor} speed={ebSpeed} chaos={ebChaos} thickness={ebThickness} style={{ borderRadius: 12 }}>
        <div style={card} onClick={(e) => e.stopPropagation()}>
          <div style={header}>
            <h4 style={titleStyle}>{title}</h4>
            <button aria-label="Cerrar" onClick={onClose} style={closeBtn}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="#123" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <div style={body}>{message}</div>
          <div style={footer}>
            <button style={actionBtn} onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </ElectricBorder>
    </div>
  );

  return createPortal(node, document.body);
}