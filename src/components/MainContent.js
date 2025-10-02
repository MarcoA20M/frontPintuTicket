import React, { useState, useEffect } from "react";
import { getAllTipoTickets } from "../services/tipoTicketService";
// import { createTicket, hayTicketMaestroEnProceso } from "../services/ticketService";
import { createTicketCreate } from '../services/ticketService';
import { useNotifications } from '../contexts/NotificationContext';
import '../components/Styles/mainContent.css';

const MainContent = () => {
    // 1. Estados para la lógica de la UI y el chat
    const [messages, setMessages] = useState([]);
    const [issue, setIssue] = useState("");
    const [loadingTipos, setLoadingTipos] = useState(true);
    const [showBackButton, setShowBackButton] = useState(false);

    // 2. Estados para la lógica de selección de tickets
    const [tipoTickets, setTipoTickets] = useState([]);
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
    const [selectedRequerimiento, setSelectedRequerimiento] = useState(false);
    const [subTipoSeleccionado, setSubTipoSeleccionado] = useState(null);

    const { addNotification } = useNotifications();

    // Obtener usuario autenticado de localStorage
    let usuarioLocal = null;
    try {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            usuarioLocal = JSON.parse(usuarioGuardado);
        }
    } catch (e) {
        usuarioLocal = null;
    }

    const staticData = {
        usuario: usuarioLocal ? `${usuarioLocal.nombre}`.trim() : "",
        correo: usuarioLocal ? usuarioLocal.correo : "",
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
        setMessages(prev => [...prev, { text: `Has seleccionado: ${tipo.tipo}`, sender: "user" }]);
        setShowBackButton(true);
        
        if (tipo.tipo === "Requerimiento") {
            setSelectedRequerimiento(true);
            setMessages(prev => [...prev, { text: "Selecciona el tipo de requerimiento:", sender: "system" }]);
        } else {
            setSelectedRequerimiento(false);
            setMessages(prev => [...prev, { text: `Describe tu problema relacionado con: ${tipo.tipo}`, sender: "system" }]);
        }
    };

    const handleRequerimientoSubClick = (subTipo) => {
        setSubTipoSeleccionado(subTipo);
        setSelectedRequerimiento(false);
        setMessages(prev => [...prev, { text: `Has seleccionado: ${subTipo}`, sender: "user" }, { text: `Describe tu problema relacionado con: ${subTipo}`, sender: "system" }]);
    };
    
    // Función para regresar al paso anterior, reseteando todo
    const handleBackClick = () => {
        setMessages([]); // Resetea el historial de mensajes
        setTicketSeleccionado(null);
        setSelectedRequerimiento(false);
        setSubTipoSeleccionado(null);
        setShowBackButton(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ticketSeleccionado || selectedRequerimiento) {
            setMessages(prev => [...prev, { text: "⚠️ Primero selecciona un tipo de ticket.", sender: "system" }]);
            return;
        }

        const userInput = issue.trim();
        if (!userInput) return;

        setMessages(prev => [...prev, { text: userInput, sender: "user" }]);
        setIssue("");

        let finalDescription = userInput;
        if (subTipoSeleccionado) {
            finalDescription = `${subTipoSeleccionado}: ${userInput}`;
        }

        const requestBody = {
            ...staticData,
            estatus: "Abierto",
            tipo_ticket: ticketSeleccionado.tipo,
            descripcion: finalDescription,
            fechaCreacion: new Date().toISOString(),
        };

        try {
            // const maestroActivo = await hayTicketMaestroEnProceso(requestBody.tipo_ticket);
            // if (maestroActivo) {
            //     const continuar = window.confirm("Ya hay un Ticket Maestro en proceso para este tipo de ticket. ¿Deseas continuar y crear tu ticket?");
            //     if (!continuar) {
            //         setMessages(prev => [...prev, { text: "Se canceló la creación del ticket.", sender: "system" }]);
            //         setTicketSeleccionado(null);
            //         setSubTipoSeleccionado(null);
            //         setShowBackButton(false);
            //         return;
            //     }
            // }

            const createdTicket = await createTicketCreate(requestBody);
            addNotification(
                createdTicket.folio,
                `Tu nuevo ticket ha sido creado y asignado al ingeniero ${createdTicket.ingeniero}.`
            );

            setMessages(prev => [...prev, {
                text: `✅ Ticket enviado con éxito. Folio: ${createdTicket.folio} Estatus: ${createdTicket.estatus} Ingeniero asignado: ${createdTicket.ingeniero}`,
                sender: "system"
            }]);

            setTicketSeleccionado(null);
            setSubTipoSeleccionado(null);
            setShowBackButton(false);
        } catch (error) {
            console.error("Error al enviar el ticket:", error);
            // Mostrar el mensaje de error devuelto por el servicio cuando sea posible
            const detalle = error && error.message ? error.message : 'Error desconocido al enviar el ticket.';
            setMessages(prev => [...prev, { text: `❌ Error al enviar el ticket: ${detalle}`, sender: "system" }]);
        }
    };

    return (
        <main className="main-content">
            {showBackButton && (
                <button className="back-button" onClick={handleBackClick}>
                    ← Regresar
                </button>
            )}
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
                {selectedRequerimiento && (
                    <div className="tipo-container">
                        <button className="back-button" onClick={handleBackClick}>
                            ← Regresar
                        </button>
                        <button className="tipo-button" onClick={() => handleRequerimientoSubClick("Ratones")}>Ratones</button>
                        <button className="tipo-button" onClick={() => handleRequerimientoSubClick("Equipo de Computo")}>Equipo de Computo</button>
                        <button className="tipo-button" onClick={() => handleRequerimientoSubClick("Teclado")}>Teclado</button>
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
                    disabled={!ticketSeleccionado || selectedRequerimiento}
                />
                <button type="submit" className="send-button" disabled={!ticketSeleccionado || selectedRequerimiento}>➤</button>
            </form>
        </main>
    );
};

export default MainContent;