import React, { useState, useEffect } from "react";
import { getAllTipoTickets } from "../services/tipoTicketService";
import { createTicket, hayTicketMaestroEnProceso } from "../services/ticketService";

const MainContent = () => {
    const [issue, setIssue] = useState("");
    const [messages, setMessages] = useState([
        { text: "¿En qué te podemos ayudar hoy?", sender: "system" }
    ]);
    const [tipoTickets, setTipoTickets] = useState([]);
    const [loadingTipos, setLoadingTipos] = useState(true);
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

    const staticData = {
        usuario: "Pedro",
        estatus: "Abierto",
        prioridad: "Alta"
    };

    useEffect(() => {
        const fetchTipos = async () => {
            try {
                const data = await getAllTipoTickets();
                setTipoTickets(data);
            } catch (error) {
                console.error("Error cargando tipos de tickets:", error);
            } finally {
                setLoadingTipos(false);
            }
        };
        fetchTipos();
    }, []);

    // Cuando el usuario hace clic en un tipo de ticket
    const handleTipoClick = (tipo) => {
        setTicketSeleccionado(tipo);
        setMessages(prev => [
            ...prev, 
            { text: `Describe tu problema relacionado con: ${tipo.tipo}`, sender: "system" }
        ]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ticketSeleccionado) return;
        const userInput = issue.trim();
        if (!userInput) return;

        setMessages(prev => [...prev, { text: userInput, sender: "user" }]);
        setIssue("");

        const requestBody = {
            ...staticData,
            tipo_ticket: ticketSeleccionado.tipo, // Se asigna dinámicamente
            descripcion: userInput,
            fechaCreacion: new Date().toISOString(),
        };

        try {
            // Verificar si hay un Ticket Maestro en proceso
            const maestroActivo = await hayTicketMaestroEnProceso(ticketSeleccionado.tipo);
            if (maestroActivo) {
                const continuar = window.confirm(
                    "Ya hay un Ticket Maestro en proceso para este tipo de ticket. ¿Deseas continuar y crear tu ticket?"
                );
                if (!continuar) {
                    setMessages(prev => [...prev, { text: "Se canceló la creación del ticket.", sender: "system" }]);
                    setTicketSeleccionado(null);
                    return;
                }
            }

            // Crear el ticket
            const createdTicket = await createTicket(requestBody);
            setMessages(prev => [...prev, { text: `Ticket enviado con éxito. Folio: ${createdTicket.folio}`, sender: "system" }]);
            setTicketSeleccionado(null);
        } catch (error) {
            setMessages(prev => [...prev, { text: "Error al enviar el ticket. Revisa el servidor.", sender: "system" }]);
        }
    };

    return (
        <main className="main-content">
            <h1>¿Cuál es tu necesidad?</h1>

            <div className="chat-history">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message-bubble ${msg.sender}`}>
                        {msg.text.split("\n").map((line, i) => (
                            <p key={i} style={{ margin: 0 }}>{line}</p>
                        ))}
                    </div>
                ))}

                {/* Mostrar los botones de tipos solo si no hay ticket seleccionado */}
                {!ticketSeleccionado && !loadingTipos && (
                    <div className="tipo-container">
                        {tipoTickets.map(tipo => (
                            <button
                                key={tipo.idTipoTicket}
                                className="tipo-button"
                                onClick={() => handleTipoClick(tipo)}
                            >
                                {tipo.tipo}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Input solo después de seleccionar un tipo */}
            {ticketSeleccionado && (
                <form onSubmit={handleSubmit} className="input-container">
                    <input
                        type="text"
                        className="issue-input"
                        placeholder="Describe tu problema..."
                        value={issue}
                        onChange={(e) => setIssue(e.target.value)}
                    />
                    <button type="submit" className="send-button">➤</button>
                </form>
            )}
        </main>
    );
};

export default MainContent;
