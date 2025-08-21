import React, { useState } from 'react';

const MainContent = () => {
    const [issue, setIssue] = useState('');
    const [messages, setMessages] = useState([]);

    // Datos estáticos que tu backend requiere
    const staticData = {
        usuario: 'Luis',
        tipo_ticket: 'Soporte Técnico',
        estatus: 'Abierto',
        ingeniero: 'Carlos',
        ticketMaestro: null,
        prioridad: 'Alta'
    };

    // Respuestas predefinidas del sistema
    const menus = {
        'hola': "¡Hola! ¿Cómo puedo ayudarte?\n1. Falla de impresora\n2. Falla de softland\n3. No tengo internet\n4. Otro problema",
        '1': "Por favor, describe el problema con la impresora.",
        '2': "Por favor, describe el problema con Softland.",
        '3': "Por favor, describe tu problema de internet.",
        '4': "Por favor, describe el problema en detalle.",
        // Puedes agregar más menús y respuestas aquí
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userInput = issue.trim();

        if (userInput === '') {
            return;
        }

        // Agrega el mensaje del usuario al historial
        const userMessage = { text: userInput, sender: 'user' };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setIssue(''); // Limpia el campo de entrada

        // Lógica condicional para simular la conversación
        if (menus[userInput.toLowerCase()]) {
            const systemResponseText = menus[userInput.toLowerCase()];
            const systemResponse = { text: systemResponseText, sender: 'system' };
            setMessages(prevMessages => [...prevMessages, systemResponse]);
        } else {
            // Si no hay un menú predefinido, enviamos el ticket al backend
            const requestBody = {
                ...staticData,
                descripcion: userInput,
                fechaCreacion: new Date().toISOString(),
            };

            try {
                const response = await fetch('http://localhost:8080/tickets/createTicket', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                if (response.ok) {
                    const createdTicket = await response.json();
                    console.log('Ticket creado:', createdTicket);
                    const successMessage = { text: "Ticket enviado con éxito. Folio: " + createdTicket.folio, sender: 'system' };
                    setMessages(prevMessages => [...prevMessages, successMessage]);
                } else {
                    const errorData = await response.json();
                    const errorMessage = { text: "Error: No se pudo enviar el ticket.", sender: 'system' };
                    setMessages(prevMessages => [...prevMessages, errorMessage]);
                    console.error('Error al enviar el ticket:', errorData);
                }
            } catch (error) {
                const connectionError = { text: "Error de conexión. Revisa el servidor.", sender: 'system' };
                setMessages(prevMessages => [...prevMessages, connectionError]);
                console.error('Error de conexión:', error);
            }
        }
    };

    return (
        <main className="main-content">
            <h1>¿Cuál es tu necesidad?</h1>
            
            <div className="chat-history">
                {messages.length === 0 && (
                    <div className="initial-message">
                        Escribe "hola" para iniciar la conversación.
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`message-bubble ${msg.sender}`}>
                        {msg.text.split('\n').map((line, i) => (
                            <p key={i} style={{ margin: '0' }}>{line}</p>
                        ))}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="input-container">
                <input
                    type="text"
                    className="issue-input"
                    placeholder="Escribe tu mensaje..."
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                />
                <button type="submit" className="send-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-up"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
                </button>
            </form>
        </main>
    );
};

export default MainContent;