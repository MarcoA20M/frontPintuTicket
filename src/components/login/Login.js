// src/components/Login/Login.js
import React, { useState, useRef } from 'react';
import LoginVideo from './LoginVideo';
import LoginHeader from './LoginHeader';
import LoginForm from './LoginForm';
import MainSection from './MainSection';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const videoRef = useRef(null);

  const playVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const toggleLoginForm = () => {
    setShowLoginForm(!showLoginForm);
  };

  const handleFormSubmit = (formData) => {
    // Aquí validas el login
    console.log('Datos del login:', formData);
    
    // Si el login es exitoso, llamas a la función prop
    onLoginSuccess(); // Esto cambia el estado en App.js
  };

  return (
    <div className="login-container">
      <LoginVideo videoRef={videoRef} onPlayVideo={playVideo} />
      <LoginHeader onLoginClick={toggleLoginForm} />
      
      {showLoginForm && (
        <LoginForm 
          onClose={toggleLoginForm} 
          onSubmit={handleFormSubmit}
        />
      )}
      
      <MainSection />
    </div>
  );
}

export default Login;