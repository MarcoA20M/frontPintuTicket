// --- USUARIOS MAESTROS PARA ACCESO SIN BACKEND/AD ---
const MASTER_USERS = [
  {
    username: 'master_ingeniero',
    password: 'MasterPintu!2025',
    nombre: 'Ingeniero Maestro',
  rol: 'Ingeniero',
    correo: 'maestro.ingeniero@pintumex.com',
    token: 'token_maestro_ingeniero',
  },
  {
    username: 'master_usuario',
    password: 'UserPintu!2025',
    nombre: 'Usuario Maestro',
  rol: 'Usuario',
    correo: 'maestro.usuario@pintumex.com',
    token: 'token_maestro_usuario',
  },
];

// Devuelve el usuario maestro si las credenciales coinciden
function checkMasterUser(username, password) {
  const user = MASTER_USERS.find(u => u.username === username && u.password === password);
  if (user) {
    // Simula la respuesta del backend
    const usuario = {
      nombre: user.nombre,
      rol: user.rol,
      correo: user.correo,
      username: user.username,
      token: user.token,
    };
    localStorage.setItem('usuario', JSON.stringify(usuario));
    return { user: usuario, token: user.token };
  }
  return null;
}
const BASE_URL = "http://localhost:8080/api/auth";

export const login = async (username, password) => {
  // --- PRIMERO: chequea usuarios maestros ---
  const master = checkMasterUser(username, password);
  if (master) {
    return master;
  }
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error en el login");
    }

    return data; // devuelve {status, message, ...}
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
};