// Servicio para manejar los tipos de ticket
const API_URL = process.env.REACT_APP_API_URL?.replace(/\/+$/, '');

if (!API_URL) {
    throw new Error('Error al conectarse a la API');
}

const BASE_URL = `${API_URL}/tipoTicket`;

export const getAllTipoTickets = async () => {
    try {
        const response = await fetch(`${BASE_URL}/allTipo`);
        if (!response.ok) {
            throw new Error("Error al obtener los tipos de ticket");
        }
        const data = await response.json();
        return data; // Devuelve un array de objetos { idTipoTicket, tipo }
    } catch (error) {
        console.error("Error en tipoTicketService:", error);
        throw error;
    }
};
