import cron from "node-cron";
import axios from "axios";
import { models } from "../models/Modelold.js";


async function fetchRouteData(deviceId, from, to) {
    const url = `https://inteligenciavehicular.com/api/reports/route?deviceId=${deviceId}&type=allEvents&from=${from}&to=${to}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + btoa('CIUDADANIA:123456789')
    };
  
    try {
      const response = await axios.get(url, { headers });
      console.log(response);
      return response.data;
    } catch (error) {
      console.error('Error fetching route data:', error);
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
export async function updateRoutesOnDemand(deviceId) {
  const recolector = await models.Recolector.findOne({ deviceId });

  if (recolector) {
    const { createdAt } = recolector;
    const from = createdAt.toISOString();
    const to = new Date().toISOString(); // Hora actual
    const routeData = await fetchRouteData(deviceId, from, to);

    recolector.ruta = routeData; // Ajusta según la estructura de datos
    await recolector.save();
  } else {
    console.log("Recolector no encontrado");
  }
}