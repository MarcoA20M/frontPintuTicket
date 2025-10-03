// Servicio para manejar prioridades
const PRIORIDAD_BASE_URL = "http://localhost:8080/prioridades";

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
