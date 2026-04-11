import React, { useState, useEffect } from "react";
import { getAllTipoTickets } from "../services/tipoTicketService";
import { createTicketCreate } from '../services/ticketService';
import { useNotifications } from '../contexts/NotificationContext';
import '../components/Styles/mainContent.css';

const MainContent = () => {

    const [messages, setMessages] = useState([]);
    const [issue, setIssue] = useState("");
    const [loadingTipos, setLoadingTipos] = useState(true);
    const [showBackButton, setShowBackButton] = useState(false);

    const [tipoTickets, setTipoTickets] = useState([]);
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);
    const [selectedRequerimiento, setSelectedRequerimiento] = useState(false);
    const [subTipoSeleccionado, setSubTipoSeleccionado] = useState(null);

    const [cantidad, setCantidad] = useState(1);

    const { addNotification } = useNotifications();

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
                console.error("Error cargando tipos:", error);
            } finally {
                setLoadingTipos(false);
            }
        };
        fetchTipos();
    }, []);

    const handleTipoClick = (tipo) => {
        setTicketSeleccionado(tipo);
        setMessages(prev => [...prev, { text: `Has seleccionado: ${tipo.tipo}`, sender: "user", selected: true }]);
        setShowBackButton(true);

        if (tipo.tipo === "Requerimiento") {
            setSelectedRequerimiento(true);
            setMessages(prev => [...prev, { text: "Selecciona el tipo de requerimiento:", sender: "system" }]);
        } else {
            // 🔥 SI NO ES REQUERIMIENTO → CREA DIRECTO
            crearTicketDirecto(tipo.tipo, "Ticket generado sin descripción");
        }
    };

    const handleRequerimientoSubClick = (subTipo) => {
        setSubTipoSeleccionado(subTipo);
        setSelectedRequerimiento(false);
        setCantidad(1);

        setMessages(prev => [
            ...prev,
            { text: `Has seleccionado: ${subTipo}`, sender: "user", selected: true }
        ]);
    };

    const handleBackClick = () => {
        setMessages([]);
        setTicketSeleccionado(null);
        setSelectedRequerimiento(false);
        setSubTipoSeleccionado(null);
        setCantidad(1);
        setShowBackButton(false);
    };

    // 🔥 FUNCIÓN CENTRAL PARA CREAR TICKET
    const crearTicketDirecto = async (tipo, descripcion) => {
        const requestBody = {
            ...staticData,
            estatus: "Abierto",
            tipo_ticket: tipo,
            descripcion: descripcion,
            fechaCreacion: new Date().toISOString(),
        };

        try {
            const createdTicket = await createTicketCreate(requestBody);

            addNotification(
                createdTicket.folio,
                `Tu nuevo ticket ha sido creado.`
            );

            setMessages(prev => [...prev, {
                text: `✅ Ticket creado automáticamente\nFolio: ${createdTicket.folio}`,
                sender: "system"
            }]);

            // reset
            setTicketSeleccionado(null);
            setSubTipoSeleccionado(null);
            setCantidad(1);
            setShowBackButton(false);

        } catch (error) {
            setMessages(prev => [...prev, {
                text: `❌ Error: ${error.message}`,
                sender: "system"
            }]);
        }
    };

    // 🔥 SUBMIT SOLO PARA RATONES/TECLADOS
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!ticketSeleccionado) return;

        // 🔥 SI ES RATONES O TECLADOS → CREA DIRECTO
        if (subTipoSeleccionado === "Ratones" || subTipoSeleccionado === "Teclados") {

            const descripcion = `${subTipoSeleccionado} (Cantidad: ${cantidad})`;

            await crearTicketDirecto(ticketSeleccionado.tipo, descripcion);
            return;
        }

        // 🔥 OTROS CASOS → NORMAL
        const userInput = issue.trim();
        if (!userInput) return;

        await crearTicketDirecto(ticketSeleccionado.tipo, userInput);
        setIssue("");
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
                    <div key={idx} className={`message-bubble ${msg.sender} ${msg.selected ? 'selected' : ''}`}>
                        <p>{msg.text}</p>
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
                        <button className="tipo-button" onClick={() => handleRequerimientoSubClick("Ratones")}>Ratones</button>
                        <button className="tipo-button" onClick={() => handleRequerimientoSubClick("Equipo de Computo")}>Equipo de Computo</button>
                        <button className="tipo-button" onClick={() => handleRequerimientoSubClick("Teclados")}>Teclados</button>
                    </div>
                )}

                {(subTipoSeleccionado === "Ratones" || subTipoSeleccionado === "Teclados") && (
                    <div className="cantidad-container">
                        <label>Cantidad:</label>
                        <input
                            type="number"
                            min="1"
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="input-container">
                <input
                    type="text"
                    className="issue-input"
                    placeholder={
                        (subTipoSeleccionado === "Ratones" || subTipoSeleccionado === "Teclados")
                        ? "Presiona Enter para crear el ticket"
                        : "Describe tu problema..."
                    }
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                />
                <button type="submit" className="send-button">➤</button>
            </form>

        </main>
    );
};

export default MainContent;