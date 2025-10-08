import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css'; // Elimina o comenta esta línea
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// import reportWebVitals from './reportWebVitals'; // Elimina o comenta esta línea

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// reportWebVitals(); // Elimina o comenta esta línea