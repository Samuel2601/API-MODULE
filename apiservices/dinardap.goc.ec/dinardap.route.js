import express from "express";
import { verificarYConsultar } from "./dinardap.service.js";

const router = express.Router();

// Ruta para consultar cédula o RUC
router.get("/consultar", async (req, res) => {
  const { identificacion, codigoPaquete, consultAll } = req.query; // Obtenemos los parámetros de la URL

  // Validar que los parámetros sean correctos
  if (!identificacion || !codigoPaquete) {
    return res.status(400).json({
      success: false,
      mensaje: "Faltan parámetros requeridos (identificacion y codigoPaquete)",
      datos: null,
    });
  }

  try {
    // Llamamos a la función verificarYConsultar y pasamos los parámetros obtenidos
    const result = await verificarYConsultar(
      identificacion,
      codigoPaquete,
      consultAll === "true" // Convertimos el parámetro consultAll a un booleano
    );

    // Devolvemos la respuesta al cliente
    res.json(result);
  } catch (error) {
    // Si ocurre un error inesperado, enviamos el mensaje de error
    res.status(500).json({
      success: false,
      mensaje: "Ocurrió un error al procesar la solicitud",
      datos: null,
    });
  }
});

export default router;
