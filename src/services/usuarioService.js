// src/services/usuarioService.js
const BASE_URL = "http://localhost:8080/usuario";

// Obtener todos los usuarios
export const getAllUsuarios = async () => {
    try {
        const response = await fetch(`${BASE_URL}/Allusuario`);
        if (!response.ok) {
            throw new Error("Error al obtener los usuarios");
        }
        const usuarios = await response.json();
        return usuarios;
    } catch (error) {
        console.error("Error en usuarioService.getAllUsuarios:", error);
        throw error;
    }
};

// Obtener usuario por ID
export const getUsuarioById = async (idUsuario) => {
    try {
        const response = await fetch(`${BASE_URL}/getUserById?idUsuario=${idUsuario}`);
        if (!response.ok) {
            throw new Error("Error al obtener el usuario");
        }
        const usuario = await response.json();
        return usuario;
    } catch (error) {
        console.error("Error en usuarioService.getUsuarioById:", error);
        throw error;
    }
};

// Crear usuario
export const createUsuario = async (usuarioData) => {
    try {
        const response = await fetch(`${BASE_URL}/createUsuario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuarioData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al crear el usuario");
        }

        const createdUsuario = await response.json();
        return createdUsuario;
    } catch (error) {
        console.error("Error en usuarioService.createUsuario:", error);
        throw error;
    }
};

// Actualizar usuario
export const updateUsuario = async (usuarioData) => {
    try {
        const response = await fetch(`${BASE_URL}/updateUsuario`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuarioData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al actualizar el usuario");
        }

        const updatedUsuario = await response.json();
        return updatedUsuario;
    } catch (error) {
        console.error("Error en usuarioService.updateUsuario:", error);
        throw error;
    }
};

// Eliminar usuario
export const deleteUsuario = async (usuarioData) => {
    try {
        const response = await fetch(`${BASE_URL}/deleteUsuario`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuarioData),
        });

        if (!response.ok) {
            throw new Error("Error al eliminar el usuario");
        }

        return true;
    } catch (error) {
        console.error("Error en usuarioService.deleteUsuario:", error);
        throw error;
    }
};

