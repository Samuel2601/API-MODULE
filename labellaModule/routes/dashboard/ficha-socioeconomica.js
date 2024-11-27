import express from "express";
const rute_ficha_socioeconomica = express.Router();
import { models } from "../../models/Modelold.js";
import mongoose from "mongoose";

const buildFilterFromSchema = (query, schema) => {
  const filter = {};

  const processField = (field, definition, parentPath = "") => {
    const { type, ref, obj } = definition;
    const fullField = parentPath ? `${parentPath}.${field}` : field;

    // Manejar sub-esquemas
    if (obj) {
      Object.entries(obj).forEach(([subField, subDefinition]) => {
        processField(subField, subDefinition, fullField);
      });
      return;
    }

    // Buscar valores de consulta
    let queryValue = query[fullField];
    const rangeStart = query[`${fullField}.start`];
    const rangeEnd = query[`${fullField}.end`];
    const minValue = query[`${fullField}.min`];
    const maxValue = query[`${fullField}.max`];

    // Manejar valor único o array de valores
    if (queryValue) {
      // Parsear el valor si es un string que parece un array
      if (queryValue.startsWith("[") && queryValue.endsWith("]")) {
        // Eliminar los corchetes y dividir por coma
        queryValue = queryValue
          .slice(1, -1)
          .split(",")
          .map((val) => val.trim());
      }

      console.log("queryValue", queryValue);
      // Si es un array de valores
      if (Array.isArray(queryValue)) {
        console.log("Array");
        filter[fullField] = {
          $in: queryValue.map((value) =>
            type === String
              ? new RegExp(value, "i")
              : new mongoose.Types.ObjectId(value)
          ),
        };
      } else {
        // Si es un valor único
        filter[fullField] =
          type === String
            ? new RegExp(queryValue, "i")
            : new mongoose.Types.ObjectId(queryValue);
      }
    } else if (rangeStart || rangeEnd) {
      filter[fullField] = {};
      if (rangeStart) filter[fullField].$gte = new Date(rangeStart);
      if (rangeEnd) filter[fullField].$lte = new Date(rangeEnd);
    } else if (minValue || maxValue) {
      filter[fullField] = {};
      if (minValue) filter[fullField].$gte = parseFloat(minValue);
      if (maxValue) filter[fullField].$lte = parseFloat(maxValue);
    }
  };

  // Iterar sobre las claves del esquema
  Object.entries(schema.obj).forEach(([field, definition]) => {
    processField(field, definition);
  });

  return filter;
};

// Obtener estadísticas
rute_ficha_socioeconomica.get(
  "/api/registros/informacionRegistro",
  async (req, res) => {
    try {
      // Recibir filtros desde la solicitud (query params o body)
      console.log("Query", req.query);
      const filter = buildFilterFromSchema(req.query, models.Registro.schema);
      console.log("filter", filter);
      /*const { encuestador, startDate, endDate, ...restFilters } = req.query;

      // Construir filtros dinámicos
      const filter = {
        ...restFilters, // Otros filtros proporcionados
      };

      // Filtro por encuestador si se proporciona
      if (encuestador) {
        filter["informacionRegistro.encuestador"] = new mongoose.Types.ObjectId(
          encuestador
        );
      }

      // Filtro por rango de fechas si se proporciona
      if (startDate || endDate) {
        filter["informacionRegistro.date"] = {};
        if (startDate) {
          filter["informacionRegistro.date"].$gte = new Date(startDate);
        }
        if (endDate) {
          filter["informacionRegistro.date"].$lte = new Date(endDate);
        }
      }*/

      const total = await models.Registro.countDocuments(filter);

      // Registros por Encuestador
      const porEncuestador = await models.Registro.aggregate([
        { $match: filter }, // Aplicar los filtros dinámicos
        {
          $group: {
            _id: "$informacionRegistro.encuestador",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "encuestador",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  last_name: 1,
                  email: 1,
                },
              },
            ],
          },
        },
        { $unwind: "$encuestador" },
      ]);

      // Línea de Tiempo por Fecha
      const lineaDeTiempo = await models.Registro.aggregate([
        { $match: filter },
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
        { $match: filter },
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
            _id: "$localDate.hour",
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

rute_ficha_socioeconomica.get(
  "/api/registros/informacionPersonal",
  async (req, res) => {
    try {
      const { entrevistado, dni, minEdad, maxEdad, nacionalidad } = req.query;
      console.log("Query", req.query);
      const filter = buildFilterFromSchema(req.query, models.Registro.schema);
      console.log("filter", filter);
      // Filtros dinámicos
      /*const filter = {};

      if (entrevistado) {
        filter["informacionPersonal.entrevistado"] = new RegExp(
          entrevistado,
          "i" // Búsqueda insensible a mayúsculas/minúsculas
        );
      }
      if (dni) {
        filter["informacionPersonal.dni"] = dni;
      }
      if (minEdad || maxEdad) {
        filter["informacionPersonal.edad"] = {};
        if (minEdad) {
          filter["informacionPersonal.edad"].$gte = parseInt(minEdad, 10);
        }
        if (maxEdad) {
          filter["informacionPersonal.edad"].$lte = parseInt(maxEdad, 10);
        }
      }
      if (nacionalidad) {
        filter["informacionPersonal.nacionalidad"] = nacionalidad;
      }*/

      // Total de registros
      const total = await models.Registro.countDocuments(filter);

      // Estadísticas por Nacionalidad
      const porNacionalidad = await models.Registro.aggregate([
        { $match: filter }, // Aplicar los filtros dinámicos
        {
          $group: {
            _id: "$informacionPersonal.nacionalidad", // Agrupar por nacionalidad
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } }, // Ordenar por cantidad en orden descendente
      ]);

      // Distribución por Edad
      const distribucionEdad = await models.Registro.aggregate([
        { $match: filter },
        {
          $bucket: {
            groupBy: "$informacionPersonal.edad", // Agrupar por rango de edad
            boundaries: [0, 18, 30, 50, 65, 100], // Definir rangos
            default: "Otro", // Etiqueta para edades fuera de rango
            output: { count: { $sum: 1 } },
          },
        },
      ]);

      // Contactos Telefónicos Únicos
      const telefonosUnicos = await models.Registro.distinct(
        "informacionPersonal.phone",
        filter
      );

      res.json({
        total,
        porNacionalidad,
        distribucionEdad,
        telefonosUnicos,
      });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "Error al obtener estadísticas detalladas." });
    }
  }
);

export default rute_ficha_socioeconomica;
