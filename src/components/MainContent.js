import React, { useState, useEffect } from "react";
import { getAllTipoTickets } from "../services/tipoTicketService";
import { createTicket, hayTicketMaestroEnProceso } from "../services/ticketService";
import { useNotifications } from '../contexts/NotificationContext'; // 1. Importa el hook
import '../components/Styles/mainContent.css';

const MainContent = () => {
    const [issue, setIssue] = useState("");
    const [messages, setMessages] = useState([]);
    const [tipoTickets, setTipoTickets] = useState([]);
    const [loadingTipos, setLoadingTipos] = useState(true);
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

    // 2. Obtén la función addNotification del contexto
    const { addNotification } = useNotifications();

    const staticData = {
        usuario: "Pedro",
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

    const handleTipoClick = (tipo) => {
        setTicketSeleccionado(tipo);
        setMessages(prev => [
            ...prev,
            { text: `Describe tu problema relacionado con: ${tipo.tipo}`, sender: "system" }
        ]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ticketSeleccionado) {
            setMessages(prev => [
                ...prev,
                { text: "⚠️ Primero selecciona un tipo de ticket.", sender: "system" }
            ]);
            return;
        }

        const userInput = issue.trim();
        if (!userInput) return;

        setMessages(prev => [...prev, { text: userInput, sender: "user" }]);
        setIssue("");

        const requestBody = {
            ...staticData,
            estatus: "Abierto",
            tipo_ticket: ticketSeleccionado.tipo,
            descripcion: userInput,
            fechaCreacion: new Date().toISOString(),
        };

        try {
            const maestroActivo = await hayTicketMaestroEnProceso(ticketSeleccionado.tipo);
            if (maestroActivo) {
                const continuar = window.confirm(
                    "Ya hay un Ticket Maestro en proceso para este tipo de ticket. ¿Deseas continuar y crear tu ticket?"
                );
                if (!continuar) {
                    setMessages(prev => [
                        ...prev,
                        { text: "Se canceló la creación del ticket.", sender: "system" }
                    ]);
                    setTicketSeleccionado(null);
                    return;
                }
            }

            const createdTicket = await createTicket(requestBody);

            // 3. Llama a la función de notificación
            // Avisamos al sistema de notificaciones que se creó un nuevo ticket
            addNotification(
                createdTicket.folio,
                `Tu nuevo ticket ha sido creado y asignado al ingeniero ${createdTicket.ingeniero}.`
            );

            // Mostrar mensaje de éxito en el chat
            setMessages(prev => [
                ...prev,
                {
                    text: `✅ Ticket enviado con éxito.
                    Folio: ${createdTicket.folio}
                    Estatus: ${createdTicket.estatus}
                    Ingeniero asignado: ${createdTicket.ingeniero}`,
                    sender: "system"
                }
            ]);

            setTicketSeleccionado(null);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                { text: "❌ Error al enviar el ticket. Revisa el servidor.", sender: "system" }
            ]);
        }
    };

    // Esta función no es usada en el componente MainContent
    // pero la mantendré en caso de que la uses en otro lugar.
    const getDescripcionResumen = (descripcion) => {
        const maxLength = 25;
        if (descripcion.length > maxLength) {
            return descripcion.substring(0, maxLength) + '...';
        }
        return descripcion;
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
        </main>
    );
};

export default MainContent;