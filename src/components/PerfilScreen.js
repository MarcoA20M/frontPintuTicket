import React, { useEffect, useState } from "react";
import { getUsuarioById } from "../services/usuarioService";
import "./Styles/PerfilScreen.css";
import usuarioIcon from "../assets/usuario.png"; // ¡Importa la imagen aquí!

const PerfilScreen = () => {
    const [usuario, setUsuario] = useState(null);

    useEffect(() => {
        const fetchUsuario = async () => {
            try {
                // 🚨 aquí debes poner el ID del usuario logueado (ejemplo 1)
                const data = await getUsuarioById(1);
                setUsuario(data);
            } catch (error) {
                console.error("Error al cargar usuario:", error);
            }
        };

        fetchUsuario();
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
                    <p><strong>Departamento:</strong> {usuario.nombreDepto}</p>
                    <p><strong>Correo:</strong> {usuario.correo}</p>
                    <p><strong>Extensión:</strong> {usuario.extension}</p>
                </div>
            </div>
        </div>
    );
};

export default PerfilScreen;