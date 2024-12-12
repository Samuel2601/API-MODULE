import express from "express";
const rute_ficha_socioeconomica = express.Router();
import { models } from "../../models/Modelold.js";
import mongoose from "mongoose";
import { format } from "date-fns";
import {
  aggregateQueryGeneral,
  aggregateQueryPersonal,
  aggregateQueryUbicacion,
  aggregateQuerySalud,
  aggregateQueryVivienda,
  aggregateQueryRedesDeApoyo,
  aggregateQueryFamilia,
} from "./query-aggregate.js";
import {
  buildFilterFromSchema,
  calcularPorcentaje,
  grafic_table,
} from "./helpers.js";

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
      const estadisticas = await aggregateQueryGeneral(models.Registro, filter);
      const resultado = estadisticas[0];
      // Calcular porcentajes (opcional)
      [
        "lineaDeTiempo",
        "lineaDeTiempoHora",
        "lineaDeTiempoHoraConectividad",
        "porEncuestador",
      ].forEach((field) => {
        if (resultado[field]) {
          calcularPorcentaje(resultado[field], "count");
        }
      });

      // Generar los gráficos
      const surveyorData = await grafic_table(
        resultado.porEncuestador,
        {
          Encuestador: "encuestador",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Registros por Encuestador",
        "bar",
        "#66BB6A"
      );
      const timelineData = await grafic_table(
        resultado.lineaDeTiempo,
        { Fecha: "_id", Conteo: "count", Porcentaje: "percentage" },
        "Registros por Fecha",
        "date",
        "#42A5F5"
      );
      const hourlyData = await grafic_table(
        resultado.lineaDeTiempoHora,
        { Hora: "_id", Conteo: "count", Porcentaje: "percentage" },
        "Registros por Hora",
        "time",
        "#FF7043"
      );
      const hourlyDataConectividad = await grafic_table(
        resultado.lineaDeTiempoHoraConectividad,
        { Hora: "_id", Conteo: "count", Porcentaje: "percentage" },
        "Registros por Hora (Conectividad)",
        "time",
        "#FFA726"
      );

      // Agrupaciones con títulos
      const groupedComponents = [
        {
          title: "Datos de Encuestas y Temporalidad",
          components: {
            surveyorData,
            timelineData,
            hourlyData,
            hourlyDataConectividad,
          },
        },
      ];

      // Convertir a un array con `title` y `components`
      const components_arr = groupedComponents.map((group) => ({
        title: group.title,
        components: Object.entries(group.components).map(([key, value]) => ({
          key,
          ...value,
        })),
      }));
      [
        "lineaDeTiempo",
        "lineaDeTiempoHora",
        "lineaDeTiempoHoraConectividad",
        "porEncuestador",
      ].forEach((field) => {
        if (resultado[field]) {
          delete resultado[field];
        }
      });

      //console.log(resultado);
      res.json({ ...resultado, components_arr });
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

      const estadisticas = await aggregateQueryPersonal(
        models.Registro,
        filter
      );

      // Tomar el resultado del facet
      const resultado = estadisticas[0];

      // Calcular porcentajes por nacionalidad y rango de edad
      ["porNacionalidad", "rangoEdadCount"].forEach((field) => {
        if (resultado[field]) {
          calcularPorcentaje(resultado[field], "count");
        }
      });
      const porNacionalidad = await grafic_table(
        resultado.porNacionalidad,
        {
          Nacionalidad: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Registros por Nacionalidad",
        "doughnut",
        "#42a5f5"
      );
      //console.log(resultado.rangoEdadCount);
      const rangoEdadCount = await grafic_table(
        resultado.rangoEdadCount,
        {
          "Rango de Edad": "rangoEdad",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Registros por Rango de Edad",
        "bar",
        "#42a5f5"
      );
      // Agrupaciones con títulos
      const groupedComponents = [
        {
          title: "Estadísticas Demográficas",
          components: {
            porNacionalidad,
            rangoEdadCount,
          },
        },
      ];

      // Convertir a un array con `title` y `components`
      const components_arr = groupedComponents.map((group) => ({
        title: group.title,
        components: Object.entries(group.components).map(([key, value]) => ({
          key,
          ...value,
        })),
      }));

      ["porNacionalidad", "rangoEdadCount"].forEach((field) => {
        if (resultado[field]) {
          delete resultado[field];
        }
      });

      res.json({ ...resultado, components_arr });
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
      // Construir el filtro para los registros
      const filter = buildFilterFromSchema(req.query, models.Registro.schema);

      const estadisticas = await aggregateQueryUbicacion(
        models.Registro,
        filter
      );
      const resultado = estadisticas[0];

      // Calcular porcentajes (opcional)
      [
        "distribucionPorSector",
        "distribucionPorBarrio",
        "distribucionPorManzana",
        "distribucionPorEstadoCasa",
        "totalPersonasPorSector",
        "totalFamiliasPorSector",
        "totalPersonasPorLote",
        "totalFamiliasPorLote",
      ].forEach((field) => {
        if (resultado[field]) {
          calcularPorcentaje(resultado[field], "count");
        }
      });
      const distribucionPorSector = await grafic_table(
        resultado.distribucionPorSector,
        {
          Sector: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Distribución por Sector",
        "bar",
        "#42a5f5"
      );
      const distribucionPorBarrio = await grafic_table(
        resultado.distribucionPorBarrio,
        {
          Barrio: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Distribución por Barrio",
        "bar",
        "#66BB6A"
      );
      const distribucionPorManzana = await grafic_table(
        resultado.distribucionPorManzana,
        {
          Manzana: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Distribución por Manzana",
        "bar",
        "#FFA726"
      );
      const distribucionPorEstadoCasa = await grafic_table(
        resultado.distribucionPorEstadoCasa,
        {
          Estado: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Distribución por Estado de Casa",
        "bar",
        "#AB47BC"
      );
      const totalPersonasPorSector = await grafic_table(
        resultado.totalPersonasPorSector,
        {
          Sector: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Total de Personas por Sector",
        "bar",
        "#FF7043"
      );
      const totalFamiliasPorSector = await grafic_table(
        resultado.totalFamiliasPorSector,
        {
          Sector: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Total de Familias por Sector",
        "bar",
        "#29B6F6"
      );
      const totalPersonasPorLote = await grafic_table(
        resultado.totalPersonasPorLote,
        {
          Lote: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Total de Personas por Lote",
        "bar",
        "#FFCA28"
      );
      const totalFamiliasPorLote = await grafic_table(
        resultado.totalFamiliasPorLote,
        {
          Lote: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Total de Familias por Lote",
        "bar",
        "#26A69A"
      );

      // Agrupaciones con títulos
      const groupedComponents = [
        {
          title: "Distribución Geográfica",
          components: {
            distribucionPorSector,
            distribucionPorBarrio,
            distribucionPorManzana,
          },
        },
        {
          title: "Estado de Vivienda",
          components: {
            distribucionPorEstadoCasa,
          },
        },
        {
          title: "Totales por Ubicación",
          components: {
            totalPersonasPorSector,
            totalFamiliasPorSector,
            totalPersonasPorLote,
            totalFamiliasPorLote,
          },
        },
      ];

      // Convertir a un array con `title` y `components`
      const components_arr = groupedComponents.map((group) => ({
        title: group.title,
        components: Object.entries(group.components).map(([key, value]) => ({
          key,
          ...value,
        })),
      }));
      [
        "distribucionPorSector",
        "distribucionPorBarrio",
        "distribucionPorManzana",
        "distribucionPorEstadoCasa",
        "totalPersonasPorSector",
        "totalFamiliasPorSector",
        "totalPersonasPorLote",
        "totalFamiliasPorLote",
      ].forEach((field) => {
        if (resultado[field]) {
          delete resultado[field];
        }
      });

      res.json({ ...resultado, components_arr });
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

    const estadisticas = await aggregateQuerySalud(models.Registro, filter);

    const resultado = estadisticas[0];
    //console.log(resultado);
    // Calcular porcentajes (opcional)
    [
      "distribucionEstadoSalud",
      "causasFrecuentes",
      "distribucionEstadoSaludYCausa",
      "distribucionConexionHigienico",
      "distribucionConexionHigienicoPorEstadoSalud",
      "distribucionPorEstadoSaludYConexionHigienico",
      "causasPorSector",
      "totalPersonasPorCausaCombinada",
    ].forEach((field) => {
      if (resultado[field]) {
        calcularPorcentaje(resultado[field], "count");
      }
    });
    const distribucionEstadoSalud = await grafic_table(
      resultado.distribucionEstadoSalud,
      {
        Estado: "_id",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Distribución por Estado de Salud",
      "bar",
      "#42A5F5"
    );
    const causasFrecuentes = await grafic_table(
      resultado.causasFrecuentes,
      {
        Causa: "_id",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Causas Frecuentes",
      "bar",
      "#66BB6A"
    );

    const distribucionEstadoSaludYCausa = await grafic_table(
      resultado.distribucionEstadoSaludYCausa,
      {
        Estado: "_id.estadoSalud",
        Causa: "_id.causaSalud",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Distribución por Estado de Salud y Causa",
      "stacked",
      "#FFA726"
    );
    const distribucionConexionHigienico = await grafic_table(
      resultado.distribucionConexionHigienico,
      {
        Conexion: "_id",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Distribución por Conexión Higienica",
      "bar",
      "#AB47BC"
    );

    const distribucionConexionHigienicoPorEstadoSalud = await grafic_table(
      resultado.distribucionConexionHigienicoPorEstadoSalud,
      {
        Estado: "_id.estadoSalud",
        Conexion: "_id.conexionHigienico",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Distribución por Conexión Higienica y Estado de Salud",
      "stacked",
      "#FF7043"
    );

    const distribucionPorEstadoSaludYConexionHigienico = await grafic_table(
      resultado.distribucionPorEstadoSaludYConexionHigienico,
      {
        Estado: "_id.estadoSalud",
        Conexion: "_id.conexionHigienico",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Distribución por Estado de Salud y Conexión Higienica",
      "stacked",
      "#29B6F6"
    );
    const causasPorSector = await grafic_table(
      resultado.causasPorSector,
      {
        Sector: "_id.sector",
        Causa: "_id.causaSalud",
        Conteo: "totalPersonas",
        Porcentaje: "percentage",
      },
      "Distribución por Sector y Causa",
      "stacked",
      "#FFCA28"
    );
    const totalPersonasPorCausaCombinada = await grafic_table(
      resultado.totalPersonasPorCausaCombinada,
      {
        Causa: "_id",
        Conteo: "totalPersonas",
        Porcentaje: "percentage",
      },
      "Distribución por Causa",
      "bar",
      "#26A69A"
    );

    // Agrupaciones con títulos
    const groupedComponents = [
      {
        title: "Estado de Salud",
        components: {
          distribucionEstadoSalud,
          distribucionEstadoSaludYCausa,
        },
      },
      {
        title: "Causas y Factores",
        components: {
          causasFrecuentes,
          causasPorSector,
          totalPersonasPorCausaCombinada,
        },
      },
      {
        title: "Conexión Higiénica",
        components: {
          distribucionConexionHigienico,
          distribucionConexionHigienicoPorEstadoSalud,
          distribucionPorEstadoSaludYConexionHigienico,
        },
      },
    ];

    // Convertir a un array con `title` y `components`
    const components_arr = groupedComponents.map((group) => ({
      title: group.title,
      components: Object.entries(group.components).map(([key, value]) => ({
        key,
        ...value,
      })),
    }));

    [
      "distribucionEstadoSalud",
      "causasFrecuentes",
      "distribucionEstadoSaludYCausa",
      "distribucionConexionHigienico",
      "distribucionConexionHigienicoPorEstadoSalud",
      "distribucionPorEstadoSaludYConexionHigienico",
      "causasPorSector",
      "totalPersonasPorCausaCombinada",
    ].forEach((field) => {
      if (resultado[field]) {
        delete resultado[field];
      }
    });

    res.json({ ...resultado, components_arr });
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

    // Ejecutar la consulta de agregación
    const estadisticas = await aggregateQueryVivienda(models.Registro, filter);

    const resultado = estadisticas[0];
    // Calcular porcentajes (opcional) para los campos relacionados con los porcentajes
    [
      "distribucionEstructura",
      "accesoServicios",
      "distribucionTenencia",
      "documentosPropiedad",
      "distribucionAlumbrado",
      "distribucionAgua",
      "bienesElectrodomesticos",
      "zonasRiesgo",
      "serviciosPorFecha",
    ].forEach((field) => {
      if (resultado[field]) {
        calcularPorcentaje(resultado[field], "count");
      }
    });

    // Generar los gráficos de acuerdo a los resultados
    const distribucionEstructura = await grafic_table(
      resultado.distribucionEstructura,
      {
        Estructura: "_id",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Distribución de Estructura de Vivienda",
      "bar",
      "#42A5F5"
    );

    const accesoServicios = await grafic_table(
      resultado.accesoServicios,
      {
        Servicio: "_id",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Acceso a Servicios Básicos",
      "bar",
      "#66BB6A"
    );

    const distribucionTenencia = await grafic_table(
      resultado.distribucionTenencia,
      {
        Tenencia: "_id",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Distribución de Tenencia de Vivienda",
      "bar",
      "#FFA726"
    );

    const documentosPropiedad = await grafic_table(
      resultado.documentosPropiedad,
      {
        Documento: "_id",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Documentos de Propiedad",
      "bar",
      "#AB47BC"
    );

    const distribucionAlumbrado = await grafic_table(
      resultado.distribucionAlumbrado,
      {
        Alumbrado: "_id",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Distribución de Alumbrado",
      "bar",
      "#FF7043"
    );

    const distribucionAgua = await grafic_table(
      resultado.distribucionAgua,
      {
        Agua: "_id",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Distribución de Agua",
      "bar",
      "#29B6F6"
    );

    const bienesElectrodomesticos = await grafic_table(
      resultado.bienesElectrodomesticos,
      {
        Electrodomestico: "_id",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Bienes Electrodomésticos",
      "bar",
      "#FFCA28"
    );

    const zonasRiesgo = await grafic_table(
      resultado.zonasRiesgo,
      {
        Zona: "_id",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Zonas de Riesgo",
      "bar",
      "#26A69A"
    );
    const serviciosPorFecha = await grafic_table(
      resultado.serviciosPorFecha,
      {
        Servicio: "_id.servicio",
        Año: "_id.año",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Servicios por Año",
      "stacked",
      "#66BB6A"
    );

    // Agrupaciones con títulos
    const groupedComponents = [
      {
        title: "Infraestructura",
        components: {
          distribucionEstructura,
          distribucionAlumbrado,
          distribucionAgua,
        },
      },
      {
        title: "Servicios y Tenencia",
        components: {
          accesoServicios,
          distribucionTenencia,
          documentosPropiedad,
          serviciosPorFecha,
        },
      },
      {
        title: "Condiciones del Hogar",
        components: {
          bienesElectrodomesticos,
          zonasRiesgo,
        },
      },
    ];

    // Convertir a un array con `title` y `components`
    const components_arr = groupedComponents.map((group) => ({
      title: group.title,
      components: Object.entries(group.components).map(([key, value]) => ({
        key,
        ...value,
      })),
    }));

    // Limpiar los campos de estadística antes de enviar la respuesta
    [
      "distribucionEstructura",
      "accesoServicios",
      "distribucionTenencia",
      "documentosPropiedad",
      "distribucionAlumbrado",
      "distribucionAgua",
      "bienesElectrodomesticos",
      "zonasRiesgo",
      "serviciosPorFecha",
    ].forEach((field) => {
      if (resultado[field]) {
        delete resultado[field];
      }
    });

    // Devolver el resultado con los gráficos
    res.json({ ...resultado, components_arr });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error al obtener estadísticas detalladas." });
  }
});

rute_ficha_socioeconomica.get(
  "/api/registros/redesDeApoyo",
  async (req, res) => {
    try {
      const filter = buildFilterFromSchema(req.query, models.Registro.schema);

      // Ejecutar la consulta de agregación
      const estadisticas = await aggregateQueryRedesDeApoyo(
        models.Registro,
        filter
      );

      const resultado = estadisticas[0];

      // Calcular porcentajes (opcional) para los campos relacionados con los porcentajes
      [
        "apoyoHumanitario",
        "actividadesBarrio",
        "actividadesCantonDentro",
        "actividadesCantonFuera",
        "mejorasBarrio",
        "mejorasporSector",
        "mejorasporBarrio",
        "mejoraPlus",
      ].forEach((field) => {
        if (resultado[field]) {
          calcularPorcentaje(resultado[field], "count");
        }
      });

      // Generar los gráficos de acuerdo a los resultados
      const apoyoHumanitario = await grafic_table(
        resultado.apoyoHumanitario,
        {
          Ayuda: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Ayuda Humanitaria Recibida",
        "bar",
        "#42A5F5"
      );

      const actividadesBarrio = await grafic_table(
        resultado.actividadesBarrio,
        {
          Actividad: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Actividades en el Barrio",
        "bar",
        "#66BB6A"
      );

      const actividadesCantonDentro = await grafic_table(
        resultado.actividadesCantonDentro,
        {
          Actividad: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Actividades dentro del Cantón",
        "bar",
        "#FFA726"
      );

      const actividadesCantonFuera = await grafic_table(
        resultado.actividadesCantonFuera,
        {
          Actividad: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Actividades fuera del Cantón",
        "bar",
        "#AB47BC"
      );

      const mejorasBarrio = await grafic_table(
        resultado.mejorasBarrio,
        {
          Mejora: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Mejoras en el Barrio",
        "bar",
        "#FF7043"
      );
      const mejorasporSector = await grafic_table(
        resultado.mejorasporSector,
        {
          Sector: "_id.sector",
          Mejora: "_id.mejora",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Mejoras en los Sectores",
        "stacked",
        "#FF7043"
      );
      const mejorasporBarrio = await grafic_table(
        resultado.mejorasporBarrio,
        {
          Barrio: "_id.barrio",
          Mejora: "_id.mejora",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Mejoras en los Barrios",
        "stacked",
        "#FF7043"
      );
      const mejoraPlus = await grafic_table(
        resultado.mejoraPlus,
        {
          Mejora: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Mejoras Extras",
        "bar",
        "#29B6F6"
      );

      // Agrupaciones con títulos
      const groupedComponents = [
        {
          title: "Apoyo",
          components: {
            apoyoHumanitario,
          },
        },
        {
          title: "Actividades",
          components: {
            actividadesBarrio,
            actividadesCantonDentro,
            actividadesCantonFuera,
          },
        },
        {
          title: "Mejoras",
          components: {
            mejorasBarrio,
            mejorasporSector,
            mejorasporBarrio,
            mejoraPlus,
          },
        },
      ];

      // Convertir a un array con `title` y `components`
      const components_arr = groupedComponents.map((group) => ({
        title: group.title,
        components: Object.entries(group.components).map(([key, value]) => ({
          key,
          ...value,
        })),
      }));

      // Limpiar los campos de estadística antes de enviar la respuesta
      [
        "apoyoHumanitario",
        "actividadesBarrio",
        "actividadesCantonDentro",
        "actividadesCantonFuera",
        "mejorasBarrio",
        "mejorasporSector",
        "mejorasporBarrio",
        "mejoraPlus",
      ].forEach((field) => {
        if (resultado[field]) {
          delete resultado[field];
        }
      });

      // Devolver el resultado con los gráficos
      res.json({ ...resultado, components_arr });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ error: "Error al obtener estadísticas de redes de apoyo." });
    }
  }
);

// Endpoint para obtener valores únicos
rute_ficha_socioeconomica.get(
  "/api/registros/uniqueValues",
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
