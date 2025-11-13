import React, { useEffect, useState } from "react";
import { getAllTickets } from "../services/ticketService";
import { useNavigate } from "react-router-dom";

const Card = ({ title, value, bgColor }) => (
  <div
    style={{
      background: bgColor || "rgba(255,255,255,0.06)",
      borderRadius: 14,
      padding: "28px 35px",
      minWidth: 240,
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: 45, fontWeight: 800, color: "#fff" }}>{value}</div>
    <div style={{ fontSize: 16, color: "#fff", opacity: 0.95, marginTop: 8 }}>
      {title}
    </div>
  </div>
);

const glassStyle = {
  background: "rgba(255,255,255,0.09)",
  boxShadow: "0 10px 32px rgba(0,0,0,0.28)",
  borderRadius: 14,
  padding: 22,
  border: "1px solid rgba(255,255,255,0.12)",
  backdropFilter: "blur(8px)",
};

const Admin = () => {
  const [usuario, setUsuario] = useState(null);
  const [tickets, setTickets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem("usuario");
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
    }
  }, []);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await getAllTickets();
        setTickets(data || []);
      } catch (error) {
        console.error("Error al cargar tickets:", error);
      }
    };
    fetchTickets();
  }, []);

  if (!usuario) {
    return (
      <div style={{ color: "#fff", textAlign: "center", marginTop: "40px" }}>
        Cargando información del usuario...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      <div
        style={{
          flex: 1,
          padding: "8px 12px",
          width: "100%",
          marginLeft: "60px",
        }}
      >
        {/* Tarjetas superiores */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginBottom: 24,
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <Card
            title="En proceso"
            value={tickets.filter((t) => t.estatus === "En proceso").length}
            bgColor={"rgba(255, 255, 255, 0.12)"}
          />
          <Card
            title="Cerrados"
            value={tickets.filter(
              (t) => t.estatus === "Cerrado" || t.estatus === "Cerrados"
            ).length}
            bgColor={"rgba(255,255,255,0.12)"}
          />
          <Card
            title="Pendientes"
            value={tickets.filter((t) => t.estatus === "Pendiente").length}
            bgColor={"rgba(255,255,255,0.12)"}
          />
        </div>

        {/* Banner de bienvenida dinámico */}
        <div
          style={{
            ...glassStyle,
            padding: "30px 60px",
            color: "#fff",
            marginBottom: 28,
            borderRadius: 14,
          }}
        >
          <strong style={{ fontSize: 22 }}>
            BIENVENIDO DE NUEVO {usuario.nombre?.toUpperCase() || "ADMIN"}
          </strong>
        </div>

        {/* Dos paneles: Equipo y Resumen */}
        <div
          style={{
            display: "flex",
            gap: 28,
            alignItems: "stretch",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          {/* Panel de equipo */}
          <div style={{ flex: 1.6, ...glassStyle, color: "#fff" }}>
            <h3 style={{ marginTop: 0, fontSize: 19 }}>Equipo de trabajo</h3>
            <ul style={{ listStyle: "none", padding: 0 }}>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 0",
                }}
              >
                <div
                  style={{
                    width: 51,
                    height: 51,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
                <div>
                  <div>
                    <strong style={{ fontSize: 14 }}>José Randall</strong>
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>
                    Programador · Resurrección · En proceso
                  </div>
                </div>
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 0",
                }}
              >
                <div
                  style={{
                    width: 51,
                    height: 51,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
                <div>
                  <div>
                    <strong style={{ fontSize: 14 }}>Diana Herrera</strong>
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>
                    Programadora · Resurrección · En proceso
                  </div>
                </div>
              </li>
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 0",
                }}
              >
                <div
                  style={{
                    width: 51,
                    height: 51,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
                <div>
                  <div>
                    <strong style={{ fontSize: 14 }}>Felix Harol</strong>
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>
                    Programador · Planta · Sin pendientes
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Panel de resumen mensual */}
          <div style={{ flex: 1.4, ...glassStyle, color: "#fff" }}>
            <h3 style={{ marginTop: 0, fontSize: 19 }}>Resumen mensual</h3>
            <div
              style={{
                height: 256,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "80%",
                  height: "84%",
                  background: "linear-gradient(180deg,#ffdb5c,#ff6ea1)",
                  borderRadius: 10,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
