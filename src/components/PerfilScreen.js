import React, { useEffect, useState } from "react";
import "./Styles/PerfilScreen.css";
import usuarioIcon from "../assets/usuario.png";
import Card from "./Card";

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
            <Card variant="welcome">
                <div className="welcome-header">
                    <h3>Bienvenido de nuevo,</h3>
                    <h2>{usuario.nombre} {usuario.apePat}</h2>
                    <p>Nos alegra verte de nuevo!</p>
                </div>
                <div className="perfil-info-wrapper">
                    <div className="perfil-icon">
                        <img src={usuarioIcon} alt="Ícono de usuario" />
                    </div>
                    <div className="perfil-details">
                        <p><strong>Nombre completo:</strong> {usuario.nombre} {usuario.apePat} {usuario.apeMat}</p>
                        <p><strong>Correo:</strong> {usuario.correo}</p>
                        <p><strong>Usuario:</strong> {usuario.userName}</p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PerfilScreen;