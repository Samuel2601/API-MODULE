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

      const filter = buildFilterFromSchema(req.query, models.Registro.schema);

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
      const filter = buildFilterFromSchema(req.query, models.Registro.schema);

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

      const nacionalidadPercentage = await models.Registro.aggregate([
        { $match: filter }, // Aplicar los filtros dinámicos
        {
          $group: {
            _id: "$informacionPersonal.nacionalidad",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            nacionalidad: "$_id",
            percentage: {
              $multiply: [{ $divide: ["$count", total] }, 100],
            },
          },
        },
      ]);

      const promedioEdad = await models.Registro.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            promedioEdad: { $avg: "$informacionPersonal.edad" },
          },
        },
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

      const rangoEdadCount = await models.Registro.aggregate([
        { $match: filter }, // Aplicar los filtros dinámicos
        {
          $project: {
            rangoEdad: {
              $cond: [
                { $lt: ["$informacionPersonal.edad", 18] },
                "Menor de edad", // Edad menor de 18
                {
                  $cond: [
                    { $lt: ["$informacionPersonal.edad", 30] },
                    "18-29", // Edad entre 18 y 29
                    {
                      $cond: [
                        { $lt: ["$informacionPersonal.edad", 40] },
                        "30-39", // Edad entre 30 y 39
                        {
                          $cond: [
                            { $lt: ["$informacionPersonal.edad", 50] },
                            "40-49", // Edad entre 40 y 49
                            "50+", // Edad de 50 en adelante
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
        { $group: { _id: "$rangoEdad", count: { $sum: 1 } } },
      ]);

      const ageStats = await models.Registro.aggregate([
        { $match: filter }, // Aplicar los filtros dinámicos
        {
          $group: {
            _id: null,
            minEdad: { $min: "$informacionPersonal.edad" },
            maxEdad: { $max: "$informacionPersonal.edad" },
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
        nacionalidadPercentage,
        distribucionEdad,
        telefonosUnicos,
        promedioEdad,
        rangoEdadCount,
        ageStats,
      });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "Error al obtener estadísticas detalladas." });
    }
  }
);

rute_ficha_socioeconomica.get(
  "/api/registros/informacionUbicacion",
  async (req, res) => {
    try {
      const filter = buildFilterFromSchema(req.query, models.Registro.schema);

      // Total de registros
      const total = await models.Registro.countDocuments(filter);

      const promedioPosesion = await models.Registro.aggregate([
        {
          $project: {
            posesionTiempoEnAños: {
              $cond: {
                if: {
                  $eq: ["$informacionUbicacion.posesionTimeUnit", "days"],
                },
                then: {
                  $divide: ["$informacionUbicacion.posesionTimeNumber", 365],
                },
                else: {
                  $cond: {
                    if: {
                      $eq: ["$informacionUbicacion.posesionTimeUnit", "months"],
                    },
                    then: {
                      $divide: ["$informacionUbicacion.posesionTimeNumber", 12],
                    },
                    else: "$informacionUbicacion.posesionTimeNumber", // Ya está en años
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            promedioPosesion: {
              $avg: "$posesionTiempoEnAños",
            },
          },
        },
      ]);
      const distribucionPorSector = await models.Registro.aggregate([
        {
          $group: {
            _id: "$informacionUbicacion.sector",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      const promedioFamiliasPorLote = await models.Registro.aggregate([
        {
          $group: {
            _id: null,
            promedioFamilias: { $avg: "$informacionUbicacion.familyCount" },
          },
        },
      ]);

      const promedioPersonasPorLote = await models.Registro.aggregate([
        {
          $group: {
            _id: null,
            promedioPersonas: { $avg: "$informacionUbicacion.peopleCount" },
          },
        },
      ]);

      const distribucionPorEstadoCasa = await models.Registro.aggregate([
        {
          $group: {
            _id: "$informacionUbicacion.houseState",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      const promedioPersonasPorSector = await models.Registro.aggregate([
        {
          $group: {
            _id: "$informacionUbicacion.sector",
            promedioPersonas: { $avg: "$informacionUbicacion.peopleCount" },
          },
        },
      ]);

      const totalPersonasPorBarrio = await models.Registro.aggregate([
        {
          $group: {
            _id: "$informacionUbicacion.barrio",
            totalPersonas: { $sum: "$informacionUbicacion.peopleCount" },
          },
        },
      ]);

      const totalLotesPorSector = await models.Registro.aggregate([
        {
          $group: {
            _id: "$informacionUbicacion.sector",
            totalLotes: { $sum: 1 },
          },
        },
      ]);

      const totalFamiliasPorSector = await models.Registro.aggregate([
        {
          $group: {
            _id: "$informacionUbicacion.sector",
            totalFamilias: { $sum: "$informacionUbicacion.familyCount" },
          },
        },
      ]);

      const totalFamiliasPorBarrio = await models.Registro.aggregate([
        {
          $group: {
            _id: "$informacionUbicacion.barrio",
            totalFamilias: { $sum: "$informacionUbicacion.familyCount" },
          },
        },
      ]);

      const totalFamiliasPorLote = await models.Registro.aggregate([
        {
          $group: {
            _id: "$informacionUbicacion.lotenumero", // O el campo que utilices para identificar el lote
            totalFamilias: { $sum: "$informacionUbicacion.familyCount" },
          },
        },
      ]);

      res.json({
        total,
        promedioPosesion: [{ ...promedioPosesion["0"], timeUnit: "years" }],
        distribucionPorSector,
        promedioFamiliasPorLote,
        promedioPersonasPorLote,
        distribucionPorEstadoCasa,
        promedioPersonasPorSector,
        totalPersonasPorBarrio,
        totalLotesPorSector,
        totalFamiliasPorSector,
        totalFamiliasPorBarrio,
        totalFamiliasPorLote,
      });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "Error al obtener estadísticas detalladas." });
    }
  }
);

rute_ficha_socioeconomica.get("/api/registros/salud", async (req, res) => {
  try {
    const filter = buildFilterFromSchema(req.query, models.Registro.schema);

    // Total de registros
    const total = await models.Registro.countDocuments(filter);

    const distribucionEstadoSalud = await models.Registro.aggregate([
      {
        $group: {
          _id: "$salud.estadoSalud",
          cantidad: { $sum: 1 },
        },
      },
    ]);

    const causasFrecuentes = await models.Registro.aggregate([
      { $unwind: "$salud.causasSalud" },
      {
        $group: {
          _id: "$salud.causasSalud",
          frecuencia: { $sum: 1 },
        },
      },
      { $sort: { frecuencia: -1 } }, // Ordenar de más a menos frecuente
    ]);

    const saludPorConexionHigienica = await models.Registro.aggregate([
      {
        $group: {
          _id: "$salud.conexionHigienico", // Agrupamos por tipo de conexión higiénica
          saludables: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$salud.estadoSalud", "FATAL"] }, // No es fatal
                    { $ne: ["$salud.estadoSalud", "MALO"] }, // No es malo
                  ],
                },
                1, // Si cumple, sumamos 1 (saludable)
                0, // Si no, sumamos 0
              ],
            },
          },
          enfermos: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$salud.estadoSalud", "FATAL"] }, // Es fatal
                    { $eq: ["$salud.estadoSalud", "MALO"] }, // Es malo
                  ],
                },
                1, // Si cumple, sumamos 1 (enfermo)
                0, // Si no, sumamos 0
              ],
            },
          },
          total: { $sum: 1 }, // Contamos todos los registros
        },
      },
    ]);

    const hogaresSinConexion = await models.Registro.aggregate([
      {
        $group: {
          _id: "$salud.conexionHigienico",
          cantidad: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 1,
          porcentaje: {
            $multiply: [{ $divide: ["$cantidad", total] }, 100],
          },
        },
      },
    ]);

    const causasPorConexion = await models.Registro.aggregate([
      { $unwind: "$salud.causasSalud" },
      {
        $group: {
          _id: {
            conexion: "$salud.conexionHigienico",
            causa: "$salud.causasSalud",
          },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { cantidad: -1 } },
    ]);

    const evolucionEstadoSalud = await models.Registro.aggregate([
      {
        $group: {
          _id: {
            estadoSalud: "$salud.estadoSalud",
            mes: { $month: "$createdAt" },
            anio: { $year: "$createdAt" },
          },
          cantidad: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.anio": 1,
          "_id.mes": 1,
        },
      },
    ]);

    const causasPorAnio = await models.Registro.aggregate([
      { $unwind: "$salud.causasSalud" },
      {
        $group: {
          _id: {
            causa: "$salud.causasSalud",
            anio: { $year: "$createdAt" },
          },
          cantidad: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.anio": 1,
          cantidad: -1,
        },
      },
    ]);

    const evolucionConexionHigienica = await models.Registro.aggregate([
      {
        $group: {
          _id: {
            conexion: "$salud.conexionHigienico",
            mes: { $month: "$createdAt" },
            anio: { $year: "$createdAt" },
          },
          cantidad: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.anio": 1,
          "_id.mes": 1,
        },
      },
    ]);

    const causasYEstadoPorTiempo = await models.Registro.aggregate([
      { $unwind: "$salud.causasSalud" },
      {
        $group: {
          _id: {
            causa: "$salud.causasSalud",
            estadoSalud: "$salud.estadoSalud",
            mes: { $month: "$createdAt" },
            anio: { $year: "$createdAt" },
          },
          cantidad: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.anio": 1,
          "_id.mes": 1,
          cantidad: -1,
        },
      },
    ]);

    const registrosPorTiempo = await models.Registro.aggregate([
      {
        $group: {
          _id: {
            mes: { $month: "$createdAt" },
            anio: { $year: "$createdAt" },
          },
          totalRegistros: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.anio": 1,
          "_id.mes": 1,
        },
      },
    ]);

    res.json({
      total,
      distribucionEstadoSalud,
      causasFrecuentes,
      saludPorConexionHigienica,
      hogaresSinConexion,
      causasPorConexion,
      evolucionEstadoSalud,
      causasPorAnio,
      evolucionConexionHigienica,
      causasYEstadoPorTiempo,
      registrosPorTiempo,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error al obtener estadísticas detalladas." });
  }
});

rute_ficha_socioeconomica.get("/api/registros/vivienda", async (req, res) => {
  try {
    const filter = buildFilterFromSchema(req.query, models.Registro.schema);

    // Total de registros
    const total = await models.Registro.countDocuments(filter);

    const distribucionEstructura = await models.Registro.aggregate([
      {
        $group: {
          _id: "$vivienda.estructuraVivienda",
          total: { $sum: 1 },
        },
      },
    ]);

    const promedioPisosYHabitaciones = await models.Registro.aggregate([
      {
        $group: {
          _id: null,
          promedioPisos: { $avg: "$vivienda.numPisos" },
          promedioHabitaciones: { $avg: "$vivienda.numHabitaciones" },
        },
      },
    ]);

    const accesoServicios = await models.Registro.aggregate([
      {
        $unwind: "$vivienda.serviciosBasicos", // Dividimos los servicios en registros individuales
      },
      {
        $group: {
          _id: "$vivienda.serviciosBasicos",
          total: { $sum: 1 },
        },
      },
    ]);

    const distribucionTenencia = await models.Registro.aggregate([
      {
        $group: {
          _id: "$vivienda.tenenciaVivienda",
          total: { $sum: 1 },
        },
      },
    ]);

    const documentosPropiedad = await models.Registro.aggregate([
      {
        $unwind: "$vivienda.documentosPropiedad",
      },
      {
        $group: {
          _id: "$vivienda.documentosPropiedad",
          total: { $sum: 1 },
        },
      },
    ]);

    const distribucionAlumbrado = await models.Registro.aggregate([
      {
        $group: {
          _id: "$vivienda.tipoAlumbrado",
          total: { $sum: 1 },
        },
      },
    ]);

    const distribucionAgua = await models.Registro.aggregate([
      {
        $unwind: "$vivienda.abastecimientoAgua",
      },
      {
        $group: {
          _id: "$vivienda.abastecimientoAgua",
          total: { $sum: 1 },
        },
      },
    ]);

    const bienesElectrodomesticos = await models.Registro.aggregate([
      {
        $unwind: "$vivienda.bienesServiciosElectrodomesticos",
      },
      {
        $group: {
          _id: "$vivienda.bienesServiciosElectrodomesticos",
          total: { $sum: 1 },
        },
      },
    ]);

    const zonasRiesgo = await models.Registro.aggregate([
      {
        $group: {
          _id: "$vivienda.zonaRiesgo",
          total: { $sum: 1 },
        },
      },
    ]);

    const serviciosPorFecha = await models.Registro.aggregate([
      {
        $unwind: "$vivienda.serviciosBasicos",
      },
      {
        $group: {
          _id: {
            servicio: "$vivienda.serviciosBasicos",
            año: { $year: "$createdAt" },
          },
          total: { $sum: 1 },
        },
      },
    ]);

    res.json({
      total,
      distribucionEstructura,
      promedioPisosYHabitaciones,
      accesoServicios,
      distribucionTenencia,
      documentosPropiedad,
      distribucionAlumbrado,
      distribucionAgua,
      bienesElectrodomesticos,
      zonasRiesgo,
      serviciosPorFecha,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error al obtener estadísticas detalladas." });
  }
});

// Endpoint para obtener valores únicos
rute_ficha_socioeconomica.get(
  "/api/registros/unique-values",
  async (req, res) => {
    try {
      const uniqueValues = await models.Registro.aggregate([
        {
          $facet: {
            sectores: [{ $group: { _id: "$informacionUbicacion.sector" } }],
            barrios: [{ $group: { _id: "$informacionUbicacion.barrio" } }],
            estadosSalud: [{ $group: { _id: "$salud.estadoSalud" } }],
            causasSalud: [
              { $unwind: "$salud.causasSalud" },
              { $group: { _id: "$salud.causasSalud" } },
            ],
            estructuraVivienda: [
              { $group: { _id: "$vivienda.estructuraVivienda" } },
            ],
            tenenciaVivienda: [
              { $group: { _id: "$vivienda.tenenciaVivienda" } },
            ],
          },
        },
      ]);

      const formattedResponse = {
        sectores: uniqueValues[0]?.sectores.map((item) => item._id),
        barrios: uniqueValues[0]?.barrios.map((item) => item._id),
        estadosSalud: uniqueValues[0]?.estadosSalud.map((item) => item._id),
        causasSalud: uniqueValues[0]?.causasSalud.map((item) => item._id),
        estructuraVivienda: uniqueValues[0]?.estructuraVivienda.map(
          (item) => item._id
        ),
        tenenciaVivienda: uniqueValues[0]?.tenenciaVivienda.map(
          (item) => item._id
        ),
      };

      res.status(200).json(formattedResponse);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener valores únicos" });
    }
  }
);
export default rute_ficha_socioeconomica;
