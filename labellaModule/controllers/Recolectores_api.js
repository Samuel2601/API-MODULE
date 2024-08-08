import cron from "node-cron";
import axios from "axios";
import { models } from "../models/Modelold.js";

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

  try {
    const response = await axios.get(url, { headers });
    console.log(response);
    return response.data;
  } catch (error) {
    console.error("Error fetching route data:", error);
    throw error;
  }
}

async function updateRoutesForDay() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const recolectores = await models.Recolector.find({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  for (const recolector of recolectores) {
    const { deviceId, createdAt } = recolector;
    const from = createdAt.toISOString();
    const to = endOfDay.toISOString();
    const routeData = await fetchRouteData(deviceId, from, to);

    recolector.ruta = routeData; // Ajusta según la estructura de datos
    await recolector.save();
  }
}

// Programa la tarea para que se ejecute diariamente a las 10 p.m.
cron.schedule("0 22 * * *", updateRoutesForDay);

// Función para ser llamada bajo demanda
export async function updateRoutesOnDemand(id) {
  let response = cloneResponse();

  try {
    const recolector = await models.Recolector.findById(id);
    if (recolector) {
      const { createdAt } = recolector;

      // Establece la hora de inicio a las 7:00 AM del día en que se creó el registro
      const startOfDay = new Date(createdAt);
      startOfDay.setHours(7, 0, 0, 0);
      const from = startOfDay.toISOString();

      // Establece la hora final a las 10:00 PM del día en que se creó el registro
      const endOfDay = new Date(createdAt);
      endOfDay.setHours(22, 0, 0, 0);
      const to = endOfDay.toISOString();

      // Asegúrate de que fetchRouteData devuelva los datos esperados
      const routeData = await fetchRouteData(recolector.deviceId, from, to);

      recolector.ruta = routeData; // Ajusta según la estructura de datos

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
