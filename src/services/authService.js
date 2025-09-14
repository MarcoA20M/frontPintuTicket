// src/services/authService.js
const BASE_URL = "http://localhost:8080/auth"; // tu endpoint de backend

export const login = async (username, password) => {
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
      throw new Error(data.error || "Error en el login");
    }

    return data; // devuelve {status, message}
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
};
