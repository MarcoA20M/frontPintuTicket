const BASE_URL = "http://localhost:8080/tickets";

// Crear un ticket normal
export const createTicket = async (ticketData) => {
    try {
        const response = await fetch(`${BASE_URL}/createTicket`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticketData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Error al crear el ticket");
        }

        const createdTicket = await response.json();
        return createdTicket; // Devuelve el ticket creado con su folio, etc.
    } catch (error) {
        console.error("Error en ticketService:", error);
        throw error;
    }
};

// Verificar si hay un Ticket Maestro en proceso
export const hayTicketMaestroEnProceso = async (tipoTicket) => {
    try {
        const response = await fetch(`${BASE_URL}/maestroEnProceso?tipoTicket=${tipoTicket}`);
        const resultado = await response.json();
        return resultado; // true o false
    } catch (error) {
        console.error("Error al verificar ticket maestro:", error);
        return false; // en caso de error asumimos que no hay maestro
    }
};
