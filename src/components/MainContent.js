import React, { useState, useEffect } from "react";
import { getAllTipoTickets } from "../services/tipoTicketService";
// import { createTicket, hayTicketMaestroEnProceso } from "../services/ticketService";
import { createTicketCreate, getTicketById } from '../services/ticketService';
import { useNotifications } from '../contexts/NotificationContext';
import io from 'socket.io-client';
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
        // Conectar socket para recibir notificaciones de asignación en tiempo real
        const socket = io('http://localhost:8080');
        socket.on('connect', () => {
            console.log('MainContent socket conectado', socket.id);
            // registrar el usuario en el servidor para que pueda enrutar notificaciones dirigidas
            try {
                if (usuarioLocal) {
                    const registerPayload = {
                        userId: usuarioLocal.id ?? usuarioLocal.idUsuario ?? usuarioLocal.id_usuario ?? null,
                        email: usuarioLocal.correo ?? usuarioLocal.email ?? null,
                        nombre: usuarioLocal.nombre ?? usuarioLocal.usuario ?? null,
                    };
                    socket.emit('registerUser', registerPayload);
                    console.log('MainContent: registerUser emitido', registerPayload);
                }
            } catch (e) {
                console.warn('Error emitiendo registerUser:', e);
            }
        });
        const notifiedFoliosRef = { current: new Set() };

        socket.on('ticketAssigned', async (payload) => {
            try {
                // si el mensaje es para este usuario autenticado, notificar
                const currentName = usuarioLocal ? (usuarioLocal.nombre || usuarioLocal.usuario || '') : '';
                const currentEmail = usuarioLocal ? (usuarioLocal.correo || usuarioLocal.email || '') : '';
                const currentId = usuarioLocal ? (usuarioLocal.id || usuarioLocal.id_usuario || usuarioLocal.idUsuario || '') : '';

                const targetName = payload?.usuario_nombre ? String(payload.usuario_nombre).trim() : '';
                const targetEmail = payload?.usuario_email ? String(payload.usuario_email).trim() : '';
                const targetId = payload?.usuario_id ? String(payload.usuario_id).trim() : '';

                const matchesName = currentName && targetName && String(currentName).trim() === targetName;
                const matchesEmail = currentEmail && targetEmail && String(currentEmail).trim() === targetEmail;
                const matchesId = currentId && targetId && String(currentId).trim() === targetId;

                const folio = payload?.folio;
                if ((matchesName || matchesEmail || matchesId) && folio && !notifiedFoliosRef.current.has(folio)) {
                    addNotification(folio, `Tu ticket ${folio} fue asignado al ingeniero ${payload.ingeniero}.`);
                    setMessages(prev => [...prev, { text: `🔔 Tu ticket ${folio} fue asignado al ingeniero ${payload.ingeniero} y está en estatus ${payload.estatus}.`, sender: 'system' }]);
                    notifiedFoliosRef.current.add(folio);
                } else if (folio && !notifiedFoliosRef.current.has(folio)) {
                    // fallback: pedir ticket por folio y comprobar owner
                    try {
                        const ticket = await getTicketById(folio);
                        if (ticket) {
                            const ownerName = ticket.usuario || ticket.nombre || ticket.usuario_nombre || '';
                            const ownerEmail = ticket.correo || ticket.email || ticket.usuario_correo || '';
                            const ownerId = ticket.id_usuario || ticket.idUsuario || ticket.usuario_id || ticket.id || '';
                            if ((ownerName && String(ownerName).trim() === String(currentName).trim()) || (ownerEmail && String(ownerEmail).trim() === String(currentEmail).trim()) || (ownerId && String(ownerId).trim() === String(currentId).trim())) {
                                addNotification(folio, `Tu ticket ${folio} fue asignado al ingeniero ${payload.ingeniero}.`);
                                setMessages(prev => [...prev, { text: `🔔 Tu ticket ${folio} fue asignado al ingeniero ${payload.ingeniero} y está en estatus ${payload.estatus}.`, sender: 'system' }]);
                                notifiedFoliosRef.current.add(folio);
                            }
                        }
                    } catch (e) {
                        console.warn('No fue posible obtener ticket por folio para validar owner:', e);
                    }
                }
            } catch (e) {
                console.error('Error manejando ticketAssigned en MainContent', e);
            }
        });

        // Escuchar assignTicket por compatibilidad con servidores que usan ese evento
        socket.on('assignTicket', async (payload) => {
            try {
                console.log('assignTicket recibido en MainContent:', payload);
                const currentName = usuarioLocal ? (usuarioLocal.nombre || usuarioLocal.usuario || '') : '';
                const currentEmail = usuarioLocal ? (usuarioLocal.correo || usuarioLocal.email || '') : '';
                const currentId = usuarioLocal ? (usuarioLocal.id || usuarioLocal.id_usuario || usuarioLocal.idUsuario || '') : '';

                const targetName = payload?.usuario_nombre ? String(payload.usuario_nombre).trim() : '';
                const targetEmail = payload?.usuario_email ? String(payload.usuario_email).trim() : '';
                const targetId = payload?.usuario_id ? String(payload.usuario_id).trim() : '';

                const matchesName = currentName && targetName && String(currentName).trim() === targetName;
                const matchesEmail = currentEmail && targetEmail && String(currentEmail).trim() === targetEmail;
                const matchesId = currentId && targetId && String(currentId).trim() === targetId;

                const folio = payload?.folio;
                if ((matchesName || matchesEmail || matchesId) && folio && !notifiedFoliosRef.current.has(folio)) {
                    addNotification(folio, `Tu ticket ${folio} fue asignado al ingeniero ${payload.ingeniero}.`);
                    setMessages(prev => [...prev, { text: `🔔 Tu ticket ${folio} fue asignado al ingeniero ${payload.ingeniero} y está en estatus ${payload.estatus}.`, sender: 'system' }]);
                    notifiedFoliosRef.current.add(folio);
                } else if (folio && !notifiedFoliosRef.current.has(folio)) {
                    try {
                        const ticket = await getTicketById(folio);
                        if (ticket) {
                            const ownerName = ticket.usuario || ticket.nombre || ticket.usuario_nombre || '';
                            const ownerEmail = ticket.correo || ticket.email || ticket.usuario_correo || '';
                            const ownerId = ticket.id_usuario || ticket.idUsuario || ticket.usuario_id || ticket.id || '';
                            if ((ownerName && String(ownerName).trim() === String(currentName).trim()) || (ownerEmail && String(ownerEmail).trim() === String(currentEmail).trim()) || (ownerId && String(ownerId).trim() === String(currentId).trim())) {
                                addNotification(folio, `Tu ticket ${folio} fue asignado al ingeniero ${payload.ingeniero}.`);
                                setMessages(prev => [...prev, { text: `🔔 Tu ticket ${folio} fue asignado al ingeniero ${payload.ingeniero} y está en estatus ${payload.estatus}.`, sender: 'system' }]);
                                notifiedFoliosRef.current.add(folio);
                            }
                        }
                    } catch (e) {
                        console.warn('No fue posible obtener ticket por folio para validar owner (assignTicket):', e);
                    }
                }
            } catch (e) {
                console.error('Error manejando assignTicket en MainContent', e);
            }
        });
        return () => {
            socket.disconnect();
        };
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