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
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const BASE_URL = `${API_URL}/api/auth`;

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

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await response.text().catch(() => '');
      throw new Error(
        `Login: respuesta no JSON (status=${response.status}). ` +
          `Revisa REACT_APP_API_URL/endpoint. Body: ${text.slice(0, 200)}`
      );
    }

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