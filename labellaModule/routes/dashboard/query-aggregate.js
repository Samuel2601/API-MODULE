const aggregateQueryGeneral = async (model, filter) => {
  return await model
    .aggregate([
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
                  $concat: [
                    "$encuestador.name", // Concatenar el 'name' del encuestador
                    " ", // Espacio entre el nombre y el apellido
                    "$encuestador.last_name", // Concatenar el 'last_name'
                  ],
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
    ])
    .allowDiskUse(true);
};
const aggregateQueryPersonal = async (model, filter) => {
  return await model
    .aggregate([
      { $match: filter },
      {
        $facet: {
          total: [{ $count: "total" }], // Total de registros
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
          total: { $arrayElemAt: ["$total.total", 0] },
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
    ])
    .allowDiskUse(true);
};
const aggregateQueryUbicacion = async (model, filter) => {
  return await model
    .aggregate([
      { $match: filter },
      {
        $facet: {
          total: [{ $count: "total" }], // Total de registros
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
                count: { $sum: "$informacionUbicacion.peopleCount" },
              },
            },
          ],
          totalFamiliasPorSector: [
            {
              $group: {
                _id: "$informacionUbicacion.sector",
                count: { $sum: "$informacionUbicacion.familyCount" },
              },
            },
          ],
          totalPersonasPorLote: [
            {
              $group: {
                _id: "$informacionUbicacion.lotenumero",
                count: { $sum: "$informacionUbicacion.peopleCount" },
              },
            },
          ],
          totalFamiliasPorLote: [
            {
              $group: {
                _id: "$informacionUbicacion.lotenumero",
                count: { $sum: "$informacionUbicacion.familyCount" },
              },
            },
          ],
        },
      },
      {
        $project: {
          total: { $arrayElemAt: ["$total.total", 0] }, // Extraer total (siempre único)
          promedioPosesion: {
            $arrayElemAt: ["$promedioPosesion.promedioPosesion", 0],
          }, // Extraer promedioPosesion (único)
          promedioFamiliasPorLote: {
            $arrayElemAt: ["$promedioFamiliasPorLote.promedioFamilias", 0],
          }, // Extraer promedioFamiliasPorLote (único)
          promedioPersonasPorLote: {
            $arrayElemAt: ["$promedioPersonasPorLote.promedioPersonas", 0],
          }, // Extraer promedioPersonasPorLote (único)
          distribucionPorSector: 1, // Mantener distribucionPorSector (grupo de documentos)
          distribucionPorBarrio: 1, // Mantener distribucionPorBarrio (grupo de documentos)
          distribucionPorManzana: 1, // Mantener distribucionPorManzana (grupo de documentos)
          distribucionPorEstadoCasa: 1, // Mantener distribucionPorEstadoCasa (grupo de documentos)
          totalPersonasPorSector: 1, // Mantener totalPersonasPorSector (grupo de documentos)
          totalFamiliasPorSector: 1, // Mantener totalFamiliasPorSector (grupo de documentos)
          totalPersonasPorLote: 1, // Mantener totalPersonasPorLote (grupo de documentos)
          totalFamiliasPorLote: 1, // Mantener totalFamiliasPorLote (grupo de documentos)
        },
      },
    ])
    .allowDiskUse(true);
};
const aggregateQuerySalud = async (model, filter) => {
  return await model
    .aggregate([
      { $match: filter },
      {
        $facet: {
          total: [{ $count: "total" }], // Total de registros
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
      {
        $project: {
          total: { $arrayElemAt: ["$total.total", 0] },
          distribucionEstadoSalud: 1, // Mantener distribucionEstadoSalud (grupo de documentos)
          causasFrecuentes: 1, // Mantener causasFrecuentes (grupo de documentos)
          distribucionEstadoSaludYCausa: 1, // Mantener distribucionEstadoSaludYCausa (grupo de documentos)
          distribucionConexionHigienico: 1, // Mantener distribucionConexionHigienico (grupo de documentos)
          distribucionConexionHigienicoPorEstadoSalud: 1, // Mantener distribucionConexionHigienicoPorEstadoSalud (grupo de documentos)
          distribucionPorEstadoSaludYConexionHigienico: 1, // Mantener distribucionPorEstadoSaludYConexionHigienico (grupo de documentos)
          promedioCausasPorRegistro: {
            $arrayElemAt: ["$promedioCausasPorRegistro.promedioCausas", 0],
          }, // Extraer promedioCausasPorRegistro (único)
          causasPorSector: 1, // Mantener causasPorSector (grupo de documentos)
          totalPersonasPorCausaCombinada: 1, // Mantener totalPersonasPorCausaCombinada (grupo de documentos)
          totalPersonasPorEstadoSalud: 1, // Mantener totalPersonasPorEstadoSalud (grupo de documentos)
        },
      },
    ])
    .allowDiskUse(true);
};
const aggregateQueryVivienda = async (model, filter) => {
  return await model
    .aggregate([
      // Filtramos los documentos según el filtro recibido
      { $match: filter },
      // Usamos $facet para ejecutar varias agregaciones en paralelo
      {
        $facet: {
          // Total de registros
          total: [{ $count: "total" }],

          // Distribución de Estructura de Vivienda
          distribucionEstructura: [
            {
              $group: {
                _id: "$vivienda.estructuraVivienda",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],

          // Promedio de Pisos y Habitaciones
          promedioPisosYHabitaciones: [
            {
              $group: {
                _id: null,
                promedioPisos: { $avg: "$vivienda.numPisos" },
                promedioHabitaciones: { $avg: "$vivienda.numHabitaciones" },
              },
            },
          ],

          // Acceso a Servicios Básicos
          accesoServicios: [
            { $unwind: "$vivienda.serviciosBasicos" },
            {
              $group: {
                _id: "$vivienda.serviciosBasicos",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],

          // Distribución de Tenencia de Vivienda
          distribucionTenencia: [
            {
              $group: {
                _id: "$vivienda.tenenciaVivienda",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],

          // Documentos de Propiedad
          documentosPropiedad: [
            { $unwind: "$vivienda.documentosPropiedad" },
            {
              $group: {
                _id: "$vivienda.documentosPropiedad",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],

          // Distribución de Alumbrado
          distribucionAlumbrado: [
            {
              $group: {
                _id: "$vivienda.tipoAlumbrado",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],

          // Distribución de Agua
          distribucionAgua: [
            { $unwind: "$vivienda.abastecimientoAgua" },
            {
              $group: {
                _id: "$vivienda.abastecimientoAgua",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],

          // Bienes Electrodomésticos
          bienesElectrodomesticos: [
            { $unwind: "$vivienda.bienesServiciosElectrodomesticos" },
            {
              $group: {
                _id: "$vivienda.bienesServiciosElectrodomesticos",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],

          // Zonas de Riesgo
          zonasRiesgo: [
            {
              $group: {
                _id: "$vivienda.zonaRiesgo",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],

          // Servicios por Fecha (Año)
          serviciosPorFecha: [
            { $unwind: "$vivienda.serviciosBasicos" },
            {
              $group: {
                _id: {
                  servicio: "$vivienda.serviciosBasicos",
                  año: { $year: "$createdAt" },
                },
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
      {
        $project: {
          total: { $arrayElemAt: ["$total.total", 0] }, // Extraemos el total de registros (único valor)
          distribucionEstructura: 1, // Mantener distribucionEstructura (grupo de documentos)
          promedioPisosYHabitaciones: {
            $arrayElemAt: ["$promedioPisosYHabitaciones", 0],
          }, // Extraemos el promedio de pisos y habitaciones (único valor)
          accesoServicios: 1, // Mantener accesoServicios (grupo de documentos)
          distribucionTenencia: 1, // Mantener distribucionTenencia (grupo de documentos)
          documentosPropiedad: 1, // Mantener documentosPropiedad (grupo de documentos)
          distribucionAlumbrado: 1, // Mantener distribucionAlumbrado (grupo de documentos)
          distribucionAgua: 1, // Mantener distribucionAgua (grupo de documentos)
          bienesElectrodomesticos: 1, // Mantener bienesElectrodomesticos (grupo de documentos)
          zonasRiesgo: 1, // Mantener zonasRiesgo (grupo de documentos)
          serviciosPorFecha: 1, // Mantener serviciosPorFecha (grupo de documentos)
        },
      },
    ])
    .allowDiskUse(true);
};
const aggregateQueryRedesDeApoyo = async (model, filter) => {
  return await model
    .aggregate([
      { $match: filter },
      {
        $facet: {
          totalRedesDeApoyo: [
            { $count: "total" }, // Total de registros relacionados con redes de apoyo
          ],
          apoyoHumanitario: [
            {
              $unwind: "$redesDeApoyo.recibeayudaHumanitaria",
            },
            {
              $group: {
                _id: "$redesDeApoyo.recibeayudaHumanitaria",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          actividadesBarrio: [
            {
              $unwind: "$redesDeApoyo.actividadesBarrio",
            },
            {
              $group: {
                _id: "$redesDeApoyo.actividadesBarrio",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          actividadesCantonDentro: [
            {
              $unwind: "$redesDeApoyo.actividadCantonDentro",
            },
            {
              $group: {
                _id: "$redesDeApoyo.actividadCantonDentro",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          actividadesCantonFuera: [
            {
              $unwind: "$redesDeApoyo.actividadCantonFuera",
            },
            {
              $group: {
                _id: "$redesDeApoyo.actividadCantonFuera",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          mejorasBarrio: [
            {
              $unwind: "$redesDeApoyo.mejorasBarrio",
            },
            {
              $group: {
                _id: "$redesDeApoyo.mejorasBarrio",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
          mejorasporSector: [
            {
              $unwind: "$redesDeApoyo.mejorasBarrio", // Descomponer las mejoras por registro
            },
            {
              $group: {
                _id: {
                  sector: "$informacionUbicacion.sector", // Agrupar por sector
                  mejora: "$redesDeApoyo.mejorasBarrio", // Agrupar por tipo de mejora
                },
                count: { $sum: 1 }, // Contar la cantidad de veces que aparece cada mejora en el barrio
              },
            },
            { $sort: { _id: 1 } },
          ],
          mejorasporBarrio: [
            {
              $unwind: "$redesDeApoyo.mejorasBarrio", // Descomponer las mejoras por registro
            },
            {
              $group: {
                _id: {
                  barrio: "$informacionUbicacion.barrio", // Agrupar por barrio
                  mejora: "$redesDeApoyo.mejorasBarrio", // Agrupar por tipo de mejora
                },
                count: { $sum: 1 }, // Contar la cantidad de veces que aparece cada mejora en el barrio
              },
            },
            { $sort: { _id: 1 } },
          ],
          mejoraPlus: [
            {
              $group: {
                _id: "$redesDeApoyo.mejoraPlus",
                count: { $sum: 1 },
              },
            },
            { $sort: { count: -1 } },
          ],
        },
      },
      {
        $project: {
          totalRedesDeApoyo: { $arrayElemAt: ["$totalRedesDeApoyo.total", 0] },
          apoyoHumanitario: 1,
          actividadesBarrio: 1,
          actividadesCantonDentro: 1,
          actividadesCantonFuera: 1,
          mejorasBarrio: 1,
          mejorasporSector: 1,
          mejorasporBarrio: 1,
          mejoraPlus: 1,
        },
      },
    ])
    .allowDiskUse(true);
};

const aggregateQueryFamilia = async (model, filter) => {
  return await model.aggregate([]).allowDiskUse(true);
};
export {
  aggregateQueryGeneral,
  aggregateQueryPersonal,
  aggregateQueryUbicacion,
  aggregateQuerySalud,
  aggregateQueryVivienda,
  aggregateQueryRedesDeApoyo,
  aggregateQueryFamilia,
};
