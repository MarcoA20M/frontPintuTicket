
import React, { useState, useRef, useEffect } from 'react';
import '../components/Styles/login.css';
import logo from '../assets/Pintumex.png';
import video from '../assets/video.mp4';
import { login as authLogin } from '../services/authService';
import AlertModal from './AlertModal';

const LoginPage = ({ onLoginSuccess }) => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  });
  const videoRef = useRef(null);

  // Esto reemplaza a window.onload = () => { video.click(); }
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.click();
    }
  }, []);

  
  const toggleLogin = () => {
    // En React, manipulamos clases através del estado
    setShowLoginForm(!showLoginForm);
    
    // Si necesitas manipular clases del body, puedes hacerlo así:
    document.body.classList.toggle("opened");
  };

  const playVideo = () => {
    if (!videoRef.current) return;

    videoRef.current.play().catch(error => {
      console.log("Error attempting to play video: ", error);
    });
  };

  // Reinicia y reproduce el video cuando termina (fallback si loop no funciona)
  const handleVideoEnded = () => {
    if (!videoRef.current) return;
    try {
      // Reiniciar al inicio
      videoRef.current.currentTime = 0;
      // Intentar reproducir de nuevo
      videoRef.current.play().catch(err => console.log('Error replaying video:', err));
    } catch (err) {
      console.log('Error handling video end:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  //esto redirige al componente principal si el login es exitoso
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      
      const data = await authLogin(formData.username, formData.password);
      // Soportar dos formatos de respuesta:
      // 1) Respuesta real del backend con campos { givenName, sn, displayName, mail, username, accessToken }
      // 2) Respuesta maestra de prueba con { user: { ... }, token }
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
      localStorage.setItem('usuario', JSON.stringify(usuario));
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      const msg = error && error.message ? error.message : 'Intenta de nuevo';
      setModal({ visible: true, title: 'Error en login', message: msg });
    }
  };

  const [modal, setModal] = useState({ visible: false, title: '', message: '' });

  // function getUserRoleFromToken(token) {
  //   if (!token) return null;
  //   try {
  //     const payload = JSON.parse(atob(token.split('.')[1]));
  //     return payload.role || null;
  //   } catch {
  //     return null;
  //   }
  // } 
  // Componentes SVG
  const UserIcon = () => (
    <svg width="24px" height="24px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000">
      <path d="M5 20V19C5 15.134 8.13401 12 12 12V12C15.866 12 19 15.134 19 19V20" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
      <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="#000000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
  );

  const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-file-lock" viewBox="0 0 16 16">
      <path d="M8 5a1 1 0 0 1 1 1v1H7V6a1 1 0 0 1 1-1m2 2.076V6a2 2 0 1 0-4 0v1.076c-.54.166-1 .597-1 1.224v2.4c0 .816.781 1.3 1.5 1.3h3c.719 0 1.5-.484 1.5-1.3V8.3c0-.627-.46-1.058-1-1.224M6.105 8.125A.64.64 0 0 1 6.5 8h3a.64.64 0 0 1 .395.125c.085.068.105.133.105.175v2.4c0 .042-.02.107-.105.175A.64.64 0 0 1 9.5 11h-3a.64.64 0 0 1-.395-.125C6.02 10.807 6 10.742 6 10.7V8.3c0-.042.02-.107.105-.175"/>
      <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm0 1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1"/>
    </svg>
  );

  return (
    <div className="login-page">
      <video 
        ref={videoRef}
        id="myVideo" 
        muted 
        onClick={playVideo}
        onEnded={handleVideoEnded}
        loop={false} /* usamos onEnded para controlar el replay y compatibilidad */
        src={video} 
        type="video/mp4"
      ></video>

      {/* Header */}
      <header className="container">
        <a href="#" className="logo">
          <img src={logo} alt="Pintumex Logo" />
        </a>
        <ul>
          <li><a href="">inicio</a></li>
          <li><a href="">nosotros</a></li>
          <li><a href="">servicios</a></li>
          <li><a href="">contacto</a></li>
          {/* Cambiado para usar toggleLogin */}
          <li><a onClick={toggleLogin} className="login" href="#">Iniciar sesión</a></li>
        </ul>
      </header>

      {/* Formulario de Login - controlado por estado */}
      {showLoginForm && (
        <main className="login-form">
          {/* Cambiado para usar toggleLogin */}
          <div onClick={toggleLogin} className="close-login-form">&times;</div>
          <form onSubmit={handleSubmit}>
            <h2>Login</h2>      
            <div className="input-group">
              <input 
                type="text" 
                name="username"
                placeholder="Username" 
                required
                value={formData.username}
                onChange={handleInputChange}
              /> 
              <label>username</label>
              <button type="button">
                <UserIcon />
              </button>
            </div>     
            <div className="input-group">
              <input 
                type="password" 
                name="password"
                placeholder="password" 
                required
                value={formData.password}
                onChange={handleInputChange}
              /> 
              <label>password</label>
              <button type="button">
                <LockIcon />
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
                <label>Remember me</label>
              </div>
              <a href="#">forgot password</a>
            </div>
            <button type="submit" className="login-button">Iniciar sesión</button>
            <p>Don't have an account? <a className="sing-up" href="#">Sign up</a></p>
          </form> 
        </main>
      )}
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