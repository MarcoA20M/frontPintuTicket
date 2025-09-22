// src/components/Login/LoginForm.js
import React, { useState } from 'react';
import './styles/LoginForm.css';

function LoginForm({ onClose, onSubmit, message }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData); // Pasa los datos al componente Login principal
  };

  // Tus íconos SVG (manteniendo tu código original)
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
    <main className="login-form">
      <div onClick={onClose} className="close-login-form">&times;</div>
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        
        {/* Mensaje de error/éxito */}
        {message && <div className="login-message">{message}</div>}
        
        <div className="input-group">
          <input 
            type="text" 
            name="username"
            placeholder="Username" 
            required
            value={formData.username}
            onChange={handleChange}
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
            onChange={handleChange}
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
              onChange={handleChange}
            />
            <label>Remember me</label>
          </div>
          <a href="#">forgot password</a>
        </div>
        
        <button type="submit" className="login-button">login</button>
        <p>Don't have an account? <a className="sing-up" href="#">Sign up</a></p>
      </form>
    </main>
  );
};

export default LoginForm;