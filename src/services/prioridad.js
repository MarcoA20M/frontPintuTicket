// Servicio para manejar prioridades
const API_URL = process.env.REACT_APP_API_URL?.replace(/\/+$/, '');

if (!API_URL) {
    throw new Error('Error al conectarse a la API');
}

const PRIORIDAD_BASE_URL = `${API_URL}/prioridades`;

export const getAllPrioridad = async () => {
    try {
        const response = await fetch(`${PRIORIDAD_BASE_URL}/allPrioridad`);
        if (!response.ok) {
            throw new Error('Error al obtener las prioridades');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en prioridadService.getAllPrioridad:', error);
        throw error;
    }
};

export default {
    getAllPrioridad,
};
