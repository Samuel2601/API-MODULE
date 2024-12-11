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
        "#66BB6A",
        "#66bb6a7d"
      );
      const timelineData = await grafic_table(
        resultado.lineaDeTiempo,
        { Fecha: "_id", Conteo: "count", Porcentaje: "percentage" },
        "Registros por Fecha",
        "date",
        "#42A5F5",
        "#42a5f57d"
      );
      const hourlyData = await grafic_table(
        resultado.lineaDeTiempoHora,
        { Hora: "_id", Conteo: "count", Porcentaje: "percentage" },
        "Registros por Hora",
        "time",
        "#FF7043",
        "#ff70437d"
      );
      const hourlyDataConectividad = await grafic_table(
        resultado.lineaDeTiempoHoraConectividad,
        { Hora: "_id", Conteo: "count", Porcentaje: "percentage" },
        "Registros por Hora (Conectividad)",
        "time",
        "#FFA726",
        "#ffa7267d"
      );

      const components = {
        surveyorData,
        timelineData,
        hourlyData,
        hourlyDataConectividad,
      };

      const components_arr = Object.entries(components).map(([key, value]) => ({
        key,
        ...value,
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
        "doughnut"
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
        "bar"
      );
      const components = {
        porNacionalidad,
        rangoEdadCount,
      };

      const components_arr = Object.entries(components).map(([key, value]) => ({
        key,
        ...value,
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
        "bar"
      );
      const distribucionPorBarrio = await grafic_table(
        resultado.distribucionPorBarrio,
        {
          Barrio: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Distribución por Barrio",
        "bar"
      );
      const distribucionPorManzana = await grafic_table(
        resultado.distribucionPorManzana,
        {
          Manzana: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Distribución por Manzana",
        "bar"
      );
      const distribucionPorEstadoCasa = await grafic_table(
        resultado.distribucionPorEstadoCasa,
        {
          Estado: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Distribución por Estado de Casa",
        "bar"
      );
      const totalPersonasPorSector = await grafic_table(
        resultado.totalPersonasPorSector,
        {
          Sector: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Total de Personas por Sector",
        "bar"
      );
      const totalFamiliasPorSector = await grafic_table(
        resultado.totalFamiliasPorSector,
        {
          Sector: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Total de Familias por Sector",
        "bar"
      );
      const totalPersonasPorLote = await grafic_table(
        resultado.totalPersonasPorLote,
        {
          Lote: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Total de Personas por Lote",
        "bar"
      );
      const totalFamiliasPorLote = await grafic_table(
        resultado.totalFamiliasPorLote,
        {
          Lote: "_id",
          Conteo: "count",
          Porcentaje: "percentage",
        },
        "Total de Familias por Lote",
        "bar"
      );

      const components = {
        distribucionPorSector,
        distribucionPorBarrio,
        distribucionPorManzana,
        distribucionPorEstadoCasa,
        totalPersonasPorSector,
        totalFamiliasPorSector,
        totalPersonasPorLote,
        totalFamiliasPorLote,
      };

      const components_arr = Object.entries(components).map(([key, value]) => ({
        key,
        ...value,
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
    console.log(resultado);
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
      "#42A5F5",
      "#42a5f57d"
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
      "#66BB6A",
      "#66bb6a7d"
    );
    const distribucionEstadoSaludYCausa = await grafic_table(
      resultado.distribucionEstadoSaludYCausa,
      {
        Estado: "estadoSalud",
        Causa: "causaSalud",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Distribución por Estado de Salud y Causa",
      "doble",
      "#FFA726",
      "#ffa7267d"
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
      "#AB47BC",
      "#ab47bc7d"
    );
    const distribucionConexionHigienicoPorEstadoSalud = await grafic_table(
      resultado.distribucionConexionHigienicoPorEstadoSalud,
      {
        Estado: "estadoSalud",
        Conexion: "conexionHigienico",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Distribución por Conexión Higienica y Estado de Salud",
      "doble",
      "#FF7043",
      "#ff70437d"
    );
    const distribucionPorEstadoSaludYConexionHigienico = await grafic_table(
      resultado.distribucionPorEstadoSaludYConexionHigienico,
      {
        Estado: "estadoSalud",
        Conexion: "conexionHigienico",
        Conteo: "count",
        Porcentaje: "percentage",
      },
      "Distribución por Estado de Salud y Conexión Higienica",
      "doble",
      "#29B6F6",
      "#29b6f67d"
    );
    const causasPorSector = await grafic_table(
      resultado.causasPorSector,
      {
        Sector: "sector",
        Causa: "causaSalud",
        Conteo: "totalPersonas",
        Porcentaje: "percentage",
      },
      "Distribución por Sector y Causa",
      "doble",
      "#FFCA28",
      "#ffca287d"
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
      "#26A69A",
      "#26a69a7d"
    );

    const components = {
      distribucionEstadoSalud,
      causasFrecuentes,
      distribucionEstadoSaludYCausa,
      distribucionConexionHigienico,
      distribucionConexionHigienicoPorEstadoSalud,
      distribucionPorEstadoSaludYConexionHigienico,
      causasPorSector,
      totalPersonasPorCausaCombinada,
    };

    const components_arr = Object.entries(components).map(([key, value]) => ({
      key,
      ...value,
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

    const estadisticas = await aggregateQueryVivienda(models.Registro, filter);

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
