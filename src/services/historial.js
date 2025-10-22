const BASE_URL = "http://localhost:8080/historial";

// Obtener todo el historial
export const getAllHistorial = async () => {
    try {
        const response = await fetch(`${BASE_URL}/AllHistorial`);
        if (!response.ok) {
            const txt = await response.text().catch(() => null);
            throw new Error(`Error al obtener historial (status=${response.status}): ${txt}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en historialService (getAllHistorial):', error);
        throw error;
    }
};

// Obtener historial por id_historial
export const getHistorialById = async (id_historial) => {
    try {
        const response = await fetch(`${BASE_URL}/getHistorialById?id_historial=${encodeURIComponent(id_historial)}`);
        if (!response.ok) {
            const txt = await response.text().catch(() => null);
            throw new Error(`Error al obtener historial por id (status=${response.status}): ${txt}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en historialService (getHistorialById):', error);
        throw error;
    }
};

// Obtener historial por folio
export const getHistorialByFolio = async (folio) => {
    try {
        const response = await fetch(`${BASE_URL}/getHistorialByfolio?folio=${encodeURIComponent(folio)}`);
        if (!response.ok) {
            const txt = await response.text().catch(() => null);
            throw new Error(`Error al obtener historial por folio (status=${response.status}): ${txt}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en historialService (getHistorialByFolio):', error);
        throw error;
    }
};



