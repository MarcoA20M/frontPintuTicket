// Servicio para manejar estatus
const ESTATUS_BASE_URL = "http://localhost:8080/estatus";

export const getAllEstatus = async () => {
    try {
        const response = await fetch(`${ESTATUS_BASE_URL}/allEstatus`);
        if (!response.ok) {
            throw new Error('Error al obtener los estatus');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en estatusService.getAllEstatus:', error);
        throw error;
    }
};

export const getEstatusById = async (id) => {
    try {
        const response = await fetch(`${ESTATUS_BASE_URL}/getEstatusById?id=${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error('Estatus no encontrado');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en estatusService.getEstatusById:', error);
        throw error;
    }
};

export const createEstatus = async (estatusData) => {
    try {
        const response = await fetch(`${ESTATUS_BASE_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(estatusData),
        });
        if (!response.ok) {
            const err = await response.text().catch(() => 'Error al crear estatus');
            throw new Error(err);
        }
        const created = await response.json();
        return created;
    } catch (error) {
        console.error('Error en createEstatus:', error);
        throw error;
    }
};

export default {
    getAllEstatus,
    getEstatusById,
    createEstatus,
};
