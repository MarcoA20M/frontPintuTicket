// Servicio para manejar los tipos de ticket
const BASE_URL = "http://localhost:8080/tipoTicket";

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
