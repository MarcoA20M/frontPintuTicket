// Servicio para obtener ingenieros
const INGENIERO_BASE_URL = "http://localhost:8080/ingenieros";

export const getAllIngenieros = async () => {
    try {
        const response = await fetch(`${INGENIERO_BASE_URL}/AllIngenieros`);
        if (!response.ok) {
            throw new Error("Error al obtener los ingenieros");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en ingenieroService.getAllIngenieros:', error);
        throw error;
    }
};

export const getIngenieroById = async (id) => {
    try {
        const response = await fetch(`${INGENIERO_BASE_URL}/getIngenieroById?id_ingeniero=${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error('Ingeniero no encontrado');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error en ingenieroService.getIngenieroById:', error);
        throw error;
    }
};

// Crear ingeniero (helper) - POST a /ingenieros
export const createIngeniero = async (ingenieroData) => {
    try {
        const response = await fetch(`${INGENIERO_BASE_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ingenieroData),
        });
        if (!response.ok) {
            const err = await response.text().catch(() => 'Error al crear ingeniero');
            throw new Error(err);
        }
        const created = await response.json();
        return created;
    } catch (error) {
        console.error('Error en createIngeniero:', error);
        throw error;
    }
};
