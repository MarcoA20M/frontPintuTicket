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

// --- NUEVO ---
// Obtener todos los tickets
export const getAllTickets = async () => {
    try {
        const response = await fetch(`${BASE_URL}/AllTickets`);
        if (!response.ok) {
            throw new Error("Error al obtener todos los tickets");
        }
        const tickets = await response.json();
        return tickets;
    } catch (error) {
        console.error("Error en ticketService:", error);
        throw error;
    }
};

// --- NUEVO ---
// Obtener tickets por usuario
export const getTicketsByUsuario = async (nombreUsuario) => {
    try {
        const response = await fetch(`${BASE_URL}/usuario/${nombreUsuario}`);
        if (!response.ok) {
            throw new Error("Error al obtener los tickets del usuario");
        }
        const tickets = await response.json();
        return tickets;
    } catch (error) {
        console.error("Error en ticketService:", error);
        throw error;
    }
};


// Obtener ticket por ID
export const getTicketById = async (id) => {
    try {
        const response = await fetch(`${BASE_URL}/${id}`);
        if (!response.ok) throw new Error("Ticket no encontrado");
        const ticket = await response.json();
        return ticket;
    } catch (error) {
        console.error("Error en getTicketById:", error);
        throw error;
    }
};
