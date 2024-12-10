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

rute_ficha_socioeconomica.get("/api/registros/filter", async (req, res) => {
  try {
    const filter = buildFilterFromSchema(req.query, models.Registro.schema);

    // Total de registros
    const total = await models.Registro.countDocuments();
    const total_filtered = await models.Registro.countDocuments(filter);
    res.json({
      total,
      total_filtered,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error al obtener estadísticas detalladas." });
  }
});

// Obtener estadísticas
rute_ficha_socioeconomica.get(
  "/api/registros/informacionRegistro",
  async (req, res) => {
    try {
      // Recibir filtros desde la solicitud (query params o body)

      const filter = buildFilterFromSchema(req.query, models.Registro.schema);

      // Ejecutar el pipeline de agregación
      const resultado = await models.Registro.aggregate([
        { $match: filter }, // Filtro dinámico
        {
          $facet: {
            total: [{ $count: "total" }], // Total de registros

            // Registros por Encuestador
            porEncuestador: [
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
                },
              },
              { $unwind: "$encuestador" },
              {
                $project: {
                  _id: 0,
                  encuestador: {
                    name: "$encuestador.name",
                    last_name: "$encuestador.last_name",
                    email: "$encuestador.email",
                  },
                  count: 1,
                },
              },
              { $sort: { count: -1 } }, // Ordenar por cantidad, descendente
            ],

            // Línea de Tiempo por Fecha
            lineaDeTiempo: [
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
              { $sort: { _id: 1 } }, // Orden cronológico
            ],

            // Línea de Tiempo por Hora
            lineaDeTiempoHora: [
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
            ],

            // Línea de Tiempo por Hora (Conectividad)
            lineaDeTiempoHoraConectividad: [
              {
                $addFields: {
                  localDate: {
                    $dateToParts: {
                      date: "$createdAt",
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
            ],
          },
        },
        {
          $project: {
            total: { $arrayElemAt: ["$total.total", 0] }, // Extraer total
            porEncuestador: 1,
            lineaDeTiempo: 1,
            lineaDeTiempoHora: 1,
            lineaDeTiempoHoraConectividad: 1,
          },
        },
      ]);

      // Calcular porcentajes de nacionalidad (opcional)
      if (resultado[0].lineaDeTiempo) {
        calcularPorcentaje(resultado[0].lineaDeTiempo, "count");
      }
      if (resultado[0].lineaDeTiempoHora) {
        calcularPorcentaje(resultado[0].lineaDeTiempoHora, "count");
      }
      if (resultado[0].lineaDeTiempoHoraConectividad) {
        calcularPorcentaje(resultado[0].lineaDeTiempoHoraConectividad, "count");
      }
      if (resultado[0].porEncuestador) {
        calcularPorcentaje(resultado[0].porEncuestador, "count");
      }

      res.json(resultado[0]);
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

      const estadisticas = await models.Registro.aggregate([
        { $match: filter },
        {
          $facet: {
            totalRegistros: [
              { $count: "total" }, // Total de registros
            ],
            porNacionalidad: [
              {
                $group: {
                  _id: "$informacionPersonal.nacionalidad",
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
            ],
            promedioEdad: [
              {
                $group: {
                  _id: null,
                  promedioEdad: { $avg: "$informacionPersonal.edad" },
                },
              },
            ],
            rangoEdadCount: [
              {
                $project: {
                  rangoEdad: {
                    $cond: [
                      { $lt: ["$informacionPersonal.edad", 18] },
                      "Menor de edad",
                      {
                        $cond: [
                          { $lt: ["$informacionPersonal.edad", 30] },
                          "18-29",
                          {
                            $cond: [
                              { $lt: ["$informacionPersonal.edad", 40] },
                              "30-39",
                              {
                                $cond: [
                                  { $lt: ["$informacionPersonal.edad", 50] },
                                  "40-49",
                                  {
                                    $cond: [
                                      {
                                        $lt: ["$informacionPersonal.edad", 60],
                                      },
                                      "50-59",
                                      {
                                        $cond: [
                                          {
                                            $lt: [
                                              "$informacionPersonal.edad",
                                              70,
                                            ],
                                          },
                                          "60-69",
                                          {
                                            $cond: [
                                              {
                                                $lt: [
                                                  "$informacionPersonal.edad",
                                                  80,
                                                ],
                                              },
                                              "70-79",
                                              {
                                                $cond: [
                                                  {
                                                    $lt: [
                                                      "$informacionPersonal.edad",
                                                      90,
                                                    ],
                                                  },
                                                  "80-89",
                                                  "90+",
                                                ],
                                              },
                                            ],
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  sortKey: {
                    $cond: [
                      { $lt: ["$informacionPersonal.edad", 18] },
                      0,
                      {
                        $cond: [
                          { $lt: ["$informacionPersonal.edad", 30] },
                          1,
                          {
                            $cond: [
                              { $lt: ["$informacionPersonal.edad", 40] },
                              2,
                              {
                                $cond: [
                                  { $lt: ["$informacionPersonal.edad", 50] },
                                  3,
                                  {
                                    $cond: [
                                      {
                                        $lt: ["$informacionPersonal.edad", 60],
                                      },
                                      4,
                                      {
                                        $cond: [
                                          {
                                            $lt: [
                                              "$informacionPersonal.edad",
                                              70,
                                            ],
                                          },
                                          5,
                                          {
                                            $cond: [
                                              {
                                                $lt: [
                                                  "$informacionPersonal.edad",
                                                  80,
                                                ],
                                              },
                                              6,
                                              {
                                                $cond: [
                                                  {
                                                    $lt: [
                                                      "$informacionPersonal.edad",
                                                      90,
                                                    ],
                                                  },
                                                  7,
                                                  8,
                                                ],
                                              },
                                            ],
                                          },
                                        ],
                                      },
                                    ],
                                  },
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
              {
                $group: {
                  _id: { rangoEdad: "$rangoEdad", sortKey: "$sortKey" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { "_id.sortKey": 1 } }, // Ordenar por rango de edad
              { $project: { rangoEdad: "$_id.rangoEdad", count: 1, _id: 0 } }, // Eliminar claves internas
            ],

            distribucionEdad: [
              {
                $bucket: {
                  groupBy: "$informacionPersonal.edad",
                  boundaries: [0, 18, 30, 50, 65, 100],
                  default: "Otro",
                  output: { count: { $sum: 1 } },
                },
              },
            ],
            ageStats: [
              {
                $group: {
                  _id: null,
                  minEdad: { $min: "$informacionPersonal.edad" },
                  maxEdad: { $max: "$informacionPersonal.edad" },
                },
              },
            ],
            telefonosUnicos: [
              {
                $group: {
                  _id: null,
                  telefonos: { $addToSet: "$informacionPersonal.phone" },
                },
              },
            ],
          },
        },
        {
          $project: {
            total: { $arrayElemAt: ["$totalRegistros.total", 0] },
            porNacionalidad: 1,
            promedioEdad: { $arrayElemAt: ["$promedioEdad.promedioEdad", 0] },
            rangoEdadCount: 1,
            distribucionEdad: 1,
            ageStats: { $arrayElemAt: ["$ageStats", 0] },
            telefonosUnicos: {
              $arrayElemAt: ["$telefonosUnicos.telefonos", 0],
            },
          },
        },
      ]);

      // Tomar el resultado del facet
      const resultado = estadisticas[0];

      // Calcular porcentajes de nacionalidad (opcional)
      if (resultado.porNacionalidad) {
        calcularPorcentaje(resultado.porNacionalidad, "count");
      }

      // Calcular porcentajes de nacionalidad (opcional)
      if (resultado.rangoEdadCount) {
        calcularPorcentaje(resultado.rangoEdadCount, "count");
      }

      res.json(resultado);
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "Error al obtener estadísticas detalladas." });
    }
  }
);

const calcularPorcentaje = (array, key) => {
  const totalCategoria = array.reduce((acc, item) => acc + item[key], 0);
  array.forEach((item) => {
    item.percentage =
      totalCategoria > 0 ? (item[key] * 100) / totalCategoria : 0;
  });
};

rute_ficha_socioeconomica.get(
  "/api/registros/informacionUbicacion",
  async (req, res) => {
    try {
      // Construir el filtro para los registros
      const filter = buildFilterFromSchema(req.query, models.Registro.schema);

      // Total de registros
      const total = await models.Registro.countDocuments(filter).allowDiskUse(
        true
      );
      const estadisticas = await models.Registro.aggregate([
        { $match: filter },
        {
          $facet: {
            promedioPosesion: [
              {
                $project: {
                  posesionTiempoEnAños: {
                    $cond: {
                      if: {
                        $eq: ["$informacionUbicacion.posesionTimeUnit", "days"],
                      },
                      then: {
                        $divide: [
                          "$informacionUbicacion.posesionTimeNumber",
                          365,
                        ],
                      },
                      else: {
                        $cond: {
                          if: {
                            $eq: [
                              "$informacionUbicacion.posesionTimeUnit",
                              "months",
                            ],
                          },
                          then: {
                            $divide: [
                              "$informacionUbicacion.posesionTimeNumber",
                              12,
                            ],
                          },
                          else: "$informacionUbicacion.posesionTimeNumber",
                        },
                      },
                    },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  promedioPosesion: { $avg: "$posesionTiempoEnAños" },
                },
              },
            ],
            promedioFamiliasPorLote: [
              {
                $group: {
                  _id: null,
                  promedioFamilias: {
                    $avg: "$informacionUbicacion.familyCount",
                  },
                },
              },
            ],
            promedioPersonasPorLote: [
              {
                $group: {
                  _id: null,
                  promedioPersonas: {
                    $avg: "$informacionUbicacion.peopleCount",
                  },
                },
              },
            ],
            distribucionPorSector: [
              {
                $group: {
                  _id: "$informacionUbicacion.sector",
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
            ],
            distribucionPorBarrio: [
              {
                $group: {
                  _id: "$informacionUbicacion.barrio",
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
            ],
            distribucionPorManzana: [
              {
                $group: {
                  _id: "$informacionUbicacion.manzana",
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
            ],
            distribucionPorEstadoCasa: [
              {
                $group: {
                  _id: "$informacionUbicacion.houseState",
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
            ],
            totalPersonasPorSector: [
              {
                $group: {
                  _id: "$informacionUbicacion.sector",
                  totalPersonas: { $sum: "$informacionUbicacion.peopleCount" },
                },
              },
            ],
            totalFamiliasPorSector: [
              {
                $group: {
                  _id: "$informacionUbicacion.sector",
                  totalFamilias: { $sum: "$informacionUbicacion.familyCount" },
                },
              },
            ],
            totalPersonasPorLote: [
              {
                $group: {
                  _id: "$informacionUbicacion.lotenumero",
                  totalPersonas: { $sum: "$informacionUbicacion.peopleCount" },
                },
              },
            ],
            totalFamiliasPorLote: [
              {
                $group: {
                  _id: "$informacionUbicacion.lotenumero",
                  totalFamilias: { $sum: "$informacionUbicacion.familyCount" },
                },
              },
            ],
          },
        },
      ]).allowDiskUse(true);

      estadisticas[0].promedioPosesion = {
        promedioPosesion: estadisticas[0].promedioPosesion[0].promedioPosesion,
        timeUnit: "years",
      };
      estadisticas[0].promedioFamiliasPorLote =
        estadisticas[0].promedioFamiliasPorLote[0].promedioFamilias;
      estadisticas[0].promedioPersonasPorLote =
        estadisticas[0].promedioPersonasPorLote[0].promedioPersonas;
      // Aplicar a cada categoría
      calcularPorcentaje(estadisticas[0].distribucionPorSector, "count");
      calcularPorcentaje(estadisticas[0].distribucionPorBarrio, "count");
      calcularPorcentaje(estadisticas[0].distribucionPorManzana, "count");
      calcularPorcentaje(estadisticas[0].distribucionPorEstadoCasa, "count");
      calcularPorcentaje(
        estadisticas[0].totalPersonasPorSector,
        "totalPersonas"
      );
      calcularPorcentaje(
        estadisticas[0].totalFamiliasPorSector,
        "totalFamilias"
      );
      calcularPorcentaje(estadisticas[0].totalPersonasPorLote, "totalPersonas");
      calcularPorcentaje(estadisticas[0].totalFamiliasPorLote, "totalFamilias");
      // Preparar los datos de respuesta
      res.json({
        total,
        ...estadisticas[0],
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

    const estadisticas = await models.Registro.aggregate([
      { $match: filter },
      {
        $facet: {
          // Nuevas métricas basadas en el esquema `Salud`
          distribucionEstadoSalud: [
            {
              $group: {
                _id: "$salud.estadoSalud",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          causasFrecuentes: [
            {
              $unwind: "$salud.causasSalud",
            },
            {
              $group: {
                _id: "$salud.causasSalud",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          distribucionEstadoSaludYCausa: [
            {
              $unwind: "$salud.causasSalud",
            },
            {
              $group: {
                _id: {
                  estadoSalud: "$salud.estadoSalud",
                  causaSalud: "$salud.causasSalud",
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          distribucionConexionHigienico: [
            {
              $group: {
                _id: "$salud.conexionHigienico",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          distribucionConexionHigienicoPorEstadoSalud: [
            {
              $group: {
                _id: {
                  estadoSalud: "$salud.estadoSalud",
                  conexionHigienico: "$salud.conexionHigienico",
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],

          distribucionPorEstadoSaludYConexionHigienico: [
            {
              $group: {
                _id: {
                  estadoSalud: "$salud.estadoSalud",
                  conexionHigienico: "$salud.conexionHigienico",
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          promedioCausasPorRegistro: [
            {
              $project: {
                cantidadCausas: { $size: "$salud.causasSalud" },
              },
            },
            {
              $group: {
                _id: null,
                promedioCausas: { $avg: "$cantidadCausas" },
              },
            },
          ],
          causasPorSector: [
            {
              $unwind: "$salud.causasSalud",
            },
            {
              $group: {
                _id: {
                  sector: "$informacionUbicacion.sector",
                  causaSalud: "$salud.causasSalud",
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],

          totalPersonasPorCausaCombinada: [
            {
              $unwind: "$salud.causasSalud",
            },
            {
              $group: {
                _id: "$salud.causasSalud",
                totalPersonas: { $sum: "$informacionUbicacion.peopleCount" },
              },
            },
            { $sort: { totalPersonas: -1 } },
          ],
          totalPersonasPorEstadoSalud: [
            {
              $group: {
                _id: "$salud.estadoSalud",
                totalPersonas: { $sum: "$informacionUbicacion.peopleCount" },
              },
            },
            { $sort: { totalPersonas: -1 } },
          ],
        },
      },
    ]).allowDiskUse(true);

    calcularPorcentaje(estadisticas[0].distribucionEstadoSalud, "count");
    calcularPorcentaje(estadisticas[0].causasFrecuentes, "count");
    calcularPorcentaje(estadisticas[0].distribucionEstadoSaludYCausa, "count");
    calcularPorcentaje(estadisticas[0].distribucionConexionHigienico, "count");
    calcularPorcentaje(
      estadisticas[0].distribucionConexionHigienicoPorEstadoSalud,
      "count"
    );
    calcularPorcentaje(
      estadisticas[0].distribucionPorEstadoSaludYConexionHigienico,
      "count"
    );
    calcularPorcentaje(estadisticas[0].causasPorSector, "count");
    calcularPorcentaje(
      estadisticas[0].totalPersonasPorEstadoSalud,
      "totalPersonas"
    );
    calcularPorcentaje(
      estadisticas[0].totalPersonasPorCausaCombinada,
      "totalPersonas"
    );

    res.json({
      total,
      estadisticas,
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
            encuestador: [
              { $group: { _id: "$informacionRegistro.encuestador" } },
            ],
            sectores: [{ $group: { _id: "$informacionUbicacion.sector" } }],
            barrios: [{ $group: { _id: "$informacionUbicacion.barrio" } }],
            houseState: [
              { $unwind: "$informacionUbicacion.houseState" },
              { $group: { _id: "$informacionUbicacion.houseState" } },
            ],
            estadosSalud: [{ $group: { _id: "$salud.estadoSalud" } }],
            causasSalud: [
              { $unwind: "$salud.causasSalud" },
              { $group: { _id: "$salud.causasSalud" } },
            ],
            conexionHigienico: [
              { $unwind: "$salud.conexionHigienico" },
              { $group: { _id: "$salud.conexionHigienico" } },
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
        encuestador: uniqueValues[0]?.encuestador.map((item) => item._id),
        sectores: uniqueValues[0]?.sectores.map((item) => item._id),
        barrios: uniqueValues[0]?.barrios.map((item) => item._id),
        houseState: uniqueValues[0]?.houseState.map((item) => item._id),
        estadosSalud: uniqueValues[0]?.estadosSalud.map((item) => item._id),
        causasSalud: uniqueValues[0]?.causasSalud.map((item) => item._id),
        conexionHigienico: uniqueValues[0]?.conexionHigienico.map(
          (item) => item._id
        ),
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
