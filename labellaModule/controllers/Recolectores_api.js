import cron from "node-cron";
import axios from "axios";
import { models } from "../models/Modelold.js";

// Establece la zona horaria del servidor (UTC-2 en este ejemplo)
const serverTimeOffset = 5; // UTC-2

// Response structure
const response = {
  status: null, // Can be 'SUCCESS_CODE' or 'ERROR_CODE'
  data: null, // Response data
  message: null, // Descriptive message (optional)
  error: null, // Error details (optional)
};
function cloneResponse() {
  return { ...response };
}

async function fetchRouteData(deviceId, from, to) {
  const url = `https://inteligenciavehicular.com/api/reports/route?deviceId=${deviceId}&type=allEvents&from=${from}&to=${to}`;
  console.log("LLAMADO: ", url);
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Basic " + btoa("CIUDADANIA:123456789"),
  };

  // Definir el tiempo de espera (en milisegundos)
  const timeout = 1200000; // 10 segundos

  // Promesa que rechaza después de un tiempo específico
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Request timed out")), timeout)
  );

  try {
    // Ejecutar la solicitud y la promesa de timeout en una carrera
    const response = await Promise.race([
      axios.get(url, { headers }),
      timeoutPromise
    ]);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching route data:", error.message);
    throw error;
  }
}


async function updateRoutesForDay() {
  console.log("Cron job started at: ", new Date());
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const recolectores = await models.Recolector.find({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  for (const recolector of recolectores) {
    const { deviceId, createdAt } = recolector;

    // Ajusta la hora de inicio a las 7:00 AM en la zona horaria del servidor
    const startOfDay = new Date(createdAt);
    startOfDay.setUTCHours(7 + serverTimeOffset, 0, 0, 0);
    const from = startOfDay.toISOString();

    // Ajusta la hora final a las 10:00 PM en la zona horaria del servidor
    const endOfDay = new Date(createdAt);
    endOfDay.setUTCHours(22 + serverTimeOffset, 0, 0, 0);
    const to = endOfDay.toISOString();

    try {
      const routeData = await fetchRouteData(deviceId, from, to);

      recolector.ruta = routeData; // Ajusta según la estructura de datos
      await recolector.save();
    } catch (error) {
      console.error(`Error updating recolector with ID ${recolector._id}:`, error.message);
      // Puedes agregar lógica para reintentar o manejar de otra manera este error
    }
  }
}

// Programa la tarea para que se ejecute diariamente a las 10 p.m.
cron.schedule("0 9 5 * *", updateRoutesForDay);

// Función para ser llamada bajo demanda
export async function updateRoutesOnDemand(id) {
  let response = cloneResponse();

  try {
    const recolector = await models.Recolector.findById(id);
    if (recolector) {
      const { createdAt } = recolector;      

      // Ajusta la hora de inicio a las 7:00 AM en la zona horaria del servidor
      const startOfDay = new Date(createdAt);
      startOfDay.setUTCHours(7 + serverTimeOffset, 0, 0, 0);
      const from = startOfDay.toISOString();

      // Ajusta la hora final a las 10:00 PM en la zona horaria del servidor
      const endOfDay = new Date(createdAt);
      endOfDay.setUTCHours(22 + serverTimeOffset, 0, 0, 0);
      const to = endOfDay.toISOString();

      // Asegúrate de que fetchRouteData devuelva los datos esperados
      const routeData = await fetchRouteData(recolector.deviceId, from, to);

      recolector.ruta = routeData; // Ajusta según la estructura de datos
      console.log("Actualizo registro de rutas");
      response.data = await recolector.save();
      response.status = 200;
      response.message = "Data retrieved successfully";
    } else {
      console.log("Recolector no encontrado");
      response.status = 404;
      response.message = "Recolector no encontrado";
    }
  } catch (error) {
    console.error("Error updating routes on demand:", error); // Imprime el error para depuración
    response.status = 500;
    response.message = "Algo salió mal";
    response.error = error.message; // Proporciona más detalles del error
  }
  return response;
}
