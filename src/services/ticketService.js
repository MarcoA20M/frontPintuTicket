const BASE_URL = "http://localhost:8080/tickets";

// Alternativa: crear ticket usando endpoint /tickets/createTicket
export const createTicketCreate = async (ticketData) => {
    try {
        console.log('createTicketCreate: payload ->', ticketData);
        const response = await fetch(`${BASE_URL}/createTicket`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticketData),
        });
        if (!response.ok) {
            let errorText = '';
            try {
                const errorData = await response.json();
                errorText = errorData.message || JSON.stringify(errorData);
            } catch (e) {
                errorText = await response.text().catch(() => 'No body');
            }
            console.error(`createTicketCreate: response not ok (status=${response.status}) ->`, errorText);
            throw new Error(errorText || "Error al crear el ticket (create)");
        }

        const createdTicket = await response.json();
        console.log('createTicketCreate: success ->', createdTicket);
        return createdTicket;
    } catch (error) {
        console.error("Error en ticketService (createTicketCreate):", error);
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
        const response = await fetch(`${BASE_URL}/usuario/${encodeURIComponent(nombreUsuario)}`);
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
// Obtener ticket por folio usando query param ?folio=
export const getTicketById = async (folio) => {
    try {
        const response = await fetch(`${BASE_URL}/TicketById?folio=${encodeURIComponent(folio)}`);
        if (!response.ok) throw new Error("Ticket no encontrado");
        const ticket = await response.json();
        return ticket;
    } catch (error) {
        console.error("Error en getTicketById:", error);
        throw error;
    }
};

// Actualizar estatus de un ticket
// --- NUEVO ---
// Actualizar campos de un ticket (prioridad, ingeniero u otros) por id o folio
export const updateTicket = async (ticketData) => {
    // ticketData debe contener al menos el identificador (id o folio) y los campos a actualizar
    try {
        const response = await fetch(`${BASE_URL}/updateTicket`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ticketData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Error al actualizar el ticket');
        }

        const updatedTicket = await response.json();
        return updatedTicket;
    } catch (error) {
        console.error('Error en updateTicket:', error);
        throw error;
    }
};

// Ejemplo de uso (estilo similar a createTicket):
// await updateTicket({ id: 123, prioridad: 'Media', ingeniero: 'Juan Perez' });

