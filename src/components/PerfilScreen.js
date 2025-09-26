import React, { useEffect, useState } from "react";
import "./Styles/PerfilScreen.css";
import usuarioIcon from "../assets/usuario.png";

const PerfilScreen = () => {
    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            setUsuario(JSON.parse(usuarioGuardado));
        }
    }, []);

    if (!usuario) {
        return (
            <div className="perfil-container">
                <p className="perfil-loading">Cargando información...</p>
            </div>
        );
    }

    return (
        <div className="perfil-container">
            <h2>Perfil</h2>
            <div className="perfil-info-wrapper">
                <div className="perfil-icon">
                    <img src={usuarioIcon} alt="Ícono de usuario" />
                </div>
                <div className="perfil-details">
                    <p><strong>Nombre:</strong> {usuario.nombre} {usuario.apePat} {usuario.apeMat}</p>
                    <p><strong>Correo:</strong> {usuario.correo}</p>
                    <p><strong>Usuario:</strong> {usuario.userName}</p>
                </div>
            </div>
        </div>
    );
};

export default PerfilScreen;