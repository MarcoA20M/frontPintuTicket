import React, { useState } from 'react';
import '../components/Styles/login.css';
import { login as authLogin } from '../services/authService';
import AlertModal from './Alerts/AlertModalError';

const LoginPage = ({ onLoginSuccess }) => {

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  });

  const [modal, setModal] = useState({
    visible: false,
    title: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authLogin(formData.username, formData.password);

      let usuario = null;

      if (data && data.user) {
        const u = data.user;

        usuario = {
          id: u.id || u.userId || u.idUsuario || u.id_usuario || '',
          idUsuario: u.id || u.userId || u.idUsuario || u.id_usuario || '',
          nombre: u.name || u.nombre || u.displayName || u.username || u.userName || '',
          apePat: u.apePat || u.ape_paterno || '',
          apeMat: u.apeMat || u.ape_materno || '',
          correo: u.email || u.mail || u.correo || '',
          userName: u.username || u.userName || '',
          token: data.token || data.accessToken || data.access_token || '',
          role: u.role || u.rol || ''
        };

      } else {
        const { givenName, sn, displayName, mail, username, accessToken } = data || {};

        usuario = {
          id: data?.id || data?.userId || data?.idUsuario || data?.id_usuario || '',
          idUsuario: data?.id || data?.userId || data?.idUsuario || data?.id_usuario || '',
          nombre: givenName || displayName || username || '',
          apePat: sn ? sn.split(' ')[0] : '',
          apeMat: sn ? sn.split(' ')[1] || '' : '',
          correo: mail || '',
          userName: username || '',
          token: accessToken || ''
        };
      }

      // 🔥 Construir nombre completo
      const nombreCompleto = `${usuario.nombre} ${usuario.apePat || ''} ${usuario.apeMat || ''}`.trim();

      const usuarioFinal = {
        ...usuario,
        nombreCompleto
      };

      localStorage.setItem('usuario', JSON.stringify(usuarioFinal));

      // 🔥 Feedback bonito
      setModal({
        visible: true,
        title: 'Bienvenido',
        message: `Hola ${nombreCompleto} 👋`
      });

      // cerrar modal y continuar
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }, 1200);

    } catch (error) {
      setModal({
        visible: true,
        title: 'Error',
        message: error.message || 'Credenciales incorrectas'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <main className="login-form">
        <form onSubmit={handleSubmit}>
          <h2>Acceso al sistema 🎨</h2>

          <div className="input-group">
            <input
              type="text"
              name="username"
              placeholder="Usuario"
              required
              value={formData.username}
              onChange={handleInputChange}
            />
            <label>Usuario </label>
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Contraseña"
              required
              value={formData.password}
              onChange={handleInputChange}
            />
            <label>Contraseña</label>

            <button type="button" onClick={() => setShowPassword(!showPassword)}>
              👁
            </button>
          </div>

          <div className="remember">
            <div className="checkbox-group">
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleInputChange}
              />
              <label>Recordarme</label>
            </div>

            <a href="#">¿Olvidaste tu contraseña?</a>
          </div>

          <button type="submit" className="login-button">
            {loading ? "Aplicando pintura..." : "Entrar"}
          </button>

          <p>
            ¿No tienes acceso?
            <a className="sing-up" href="#"> Solicítalo</a>
          </p>
        </form>
      </main>

      <AlertModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onClose={() => setModal({ visible: false, title: '', message: '' })}
      />

    </div>
  );
};

export default LoginPage;