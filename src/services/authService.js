// src/services/authService.js
const BASE_URL = "http://localhost:8080/api/auth";

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
      throw new Error(data.message || "Error en el login");
    }

    return data; // devuelve {status, message, ...}
  } catch (error) {
    console.error("Error en login:", error);
    throw error;
  }
};
