// src/components/Login.js
import React, { useState } from "react";
import { login } from "../services/authService";

// Recibe la prop 'onLoginSuccess'
const Login = ({ onLoginSuccess }) => { 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await login(username, password);
      setMessage(data.message);
      if (onLoginSuccess) { // 👈 Si la prop existe, la llamamos
        onLoginSuccess();
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div style={{ maxWidth: "300px", margin: "50px auto", textAlign: "center" }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <button type="submit" style={{ width: "100%", padding: "8px" }}>
          Login
        </button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;