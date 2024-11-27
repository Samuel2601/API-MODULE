import express from "express";
const rute_ficha_socioeconomica = express.Router();
import { models } from "../../models/Modelold.js";

// Obtener estadísticas
rute_ficha_socioeconomica.get(
  "/api/registros/estadisticas",
  async (req, res) => {
    try {
      const total = await models.Registro.countDocuments();

      // Registros por Encuestador
      const porEncuestador = await models.Registro.aggregate([
        {
          $group: {
            _id: "$informacionRegistro.encuestador", // Agrupamos por el ID del encuestador
            count: { $sum: 1 }, // Contamos los registros asociados
          },
        },
        {
          $lookup: {
            from: "users", // Nombre de la colección de encuestadores
            localField: "_id", // Campo local que se usará para la unión
            foreignField: "_id", // Campo en la colección relacionada
            as: "encuestador", // Alias para los datos del encuestador
          },
        },
        {
          $unwind: "$encuestador", // Expandimos el array para convertirlo en un objeto
        },
      ]);

      // Línea de Tiempo por Fecha
      const lineaDeTiempo = await models.Registro.aggregate([
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$informacionRegistro.date",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Línea de Tiempo por Hora
      const lineaDeTiempoHora = await models.Registro.aggregate([
        {
          $addFields: {
            localDate: {
              $dateToParts: {
                date: "$informacionRegistro.date",
                timezone: "America/Guayaquil",
              },
            },
          },
        },
        {
          $group: {
            _id: "$localDate.hour", // Agrupamos por hora local
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      res.json({ total, porEncuestador, lineaDeTiempo, lineaDeTiempoHora });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al obtener estadísticas." });
    }
  }
);

export default rute_ficha_socioeconomica;
