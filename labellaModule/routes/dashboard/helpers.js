"use strict";

import mongoose from "mongoose";
import { format } from "date-fns";
import initChartOptions from "./chartjs-option/main.js";
const chartOptions = await initChartOptions();

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

// Función para generar todas las fechas entre startDate y endDate
const generateDateRange = (start, end) => {
  const dates = [];
  let currentDate = start;
  while (currentDate <= end) {
    dates.push(format(currentDate, "yyyy-MM-dd")); // Formato 'YYYY-MM-DD'
    currentDate.setDate(currentDate.getDate() + 1); // Incrementamos un día
  }
  return dates;
};
const colors = [
  "#42A5F5",
  "#66BB6A",
  "#FFA726",
  "#AB47BC",
  "#FF7043",
  "#29B6F6",
  "#FFCA28",
  "#26A69A",
  "#8D6E63",
  "#78909C",
  "#5C6BC0",
  "#EF5350",
  "#EC407A",
  "#7E57C2",
  "#42A5F5",
  "#FFEE58",
  "#8E24AA",
  "#BDBDBD",
  "#FF6F00",
  "#00ACC1",
];

const grafic_table = async (data, fieldMap, title, type, borderColor) => {
  // Generar columnOrder a partir de las claves de fieldMap
  const columnOrder = Object.keys(fieldMap);

  // Reordenar los objetos de 'data' según 'columnOrder' y 'fieldMap'
  const table = data.map((item) => {
    const orderedItem = {};
    columnOrder.forEach((column) => {
      const fieldPath = fieldMap[column]; // Obtiene el valor del campo en fieldMap

      // Acceso a propiedades anidadas
      if (typeof fieldPath === "string" && fieldPath.includes(".")) {
        const keys = fieldPath.split(".");
        orderedItem[column] = keys.reduce(
          (acc, key) => acc[key] ?? "Desconocido",
          item
        );
      } else {
        orderedItem[column] = item[fieldPath] ?? "Desconocido";
      }

      // Redondear porcentajes si el campo actual es porcentaje
      if (column === "Porcentaje" && orderedItem[column] !== "Desconocido") {
        orderedItem[column] = parseFloat(orderedItem[column]).toFixed(2);
      }
    });
    return orderedItem;
  });

  let chartLabels = [];
  let chartDatasets = [];

  if (type === "date") {
    // Generar etiquetas de fechas entre el rango proporcionado
    const startDate = new Date(data[0]._id);
    const endDate = new Date(data[data.length - 1]._id);
    chartLabels = generateDateRange(startDate, endDate);

    chartDatasets = [
      {
        label: title,
        data: chartLabels.map((date) => {
          const match = data.find((item) => item._id === date);
          return match ? match.count : 0;
        }),
        borderColor: borderColor ?? "#42A5F5",
        backgroundColor: hexToRgba(borderColor, 0.7),
        fill: true,
        tension: 0.5,
      },
    ];
  } else if (type === "time") {
    // Generar etiquetas de horas
    chartLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);

    chartDatasets = [
      {
        label: title,
        data: chartLabels.map((hour) => {
          const match = data.find((item) => item._id === parseInt(hour));
          return match ? match.count : 0;
        }),
        borderColor: borderColor ?? "#42A5F5",
        backgroundColor: hexToRgba(borderColor, 0.7),
        fill: true,
        tension: 0.5,
      },
    ];
  } else if (type === "stacked") {
    // Gráfico de barras apiladas

    // Obtener el primer y segundo campo de agrupación, manejando propiedades anidadas
    const [firstFieldPath, secondFieldPath] = [
      fieldMap[columnOrder[0]],
      fieldMap[columnOrder[1]],
    ];

    // Función para acceder a un valor anidado en un objeto utilizando una ruta de propiedades
    const getNestedValue = (obj, path) => {
      return path
        .split(".")
        .reduce((acc, key) => acc?.[key] ?? "Desconocido", obj);
    };

    // Obtener las etiquetas únicas para el primer y segundo campo de agrupación
    const uniqueLabels = Array.from(
      new Set(
        data.map((item) => {
          return getNestedValue(item, firstFieldPath); // Acceder al valor del primer campo
        })
      )
    );

    const uniqueCauses = Array.from(
      new Set(
        data.map((item) => {
          return getNestedValue(item, secondFieldPath); // Acceder al valor del segundo campo
        })
      )
    );

    // Configurar las etiquetas para el gráfico
    chartLabels = uniqueLabels;

    // Generar los datasets para el gráfico apilado
    chartDatasets = uniqueCauses.map((cause, index) => {
      const borderColor = colors[index % colors.length] ?? "#FFA726";
      const backgroundColor = hexToRgba(borderColor, 0.9);

      return {
        label: cause,
        data: uniqueLabels.map((label) => {
          // Buscar coincidencias para contar los elementos
          const match = data.find(
            (item) =>
              getNestedValue(item, firstFieldPath) === label && // Verificar primer campo
              getNestedValue(item, secondFieldPath) === cause // Verificar segundo campo
          );
          return match ? match.count : 0; // Retornar el conteo o 0 si no hay coincidencia
        }),
        backgroundColor: backgroundColor,
        borderColor: borderColor,
      };
    });
  } else {
    // Otros tipos de gráficos
    chartLabels = data.map((item) => item[fieldMap[columnOrder[0]]]);
    chartDatasets = [
      {
        label: title,
        data: data.map(
          (item) => item[fieldMap[columnOrder[columnOrder.length - 2]]]
        ),
        borderColor: type !== "bar" ? "#ffffff" : borderColor ?? "#42A5F5",
        backgroundColor:
          type !== "bar" ? colors : hexToRgba(borderColor, 0.9) ?? "#42a5f563",
        fill: true,
        tension: 0.5,
      },
    ];
  }

  // Preparar el gráfico
  const chart = {
    type:
      type === "time" || type === "date"
        ? "line"
        : type === "stacked"
        ? "bar"
        : type,
    options: chartOptions[type],
    labels: chartLabels,
    datasets: chartDatasets,
    title: title,
  };

  return { columnOrder, table, chart, title };
};

const calcularPorcentaje = (array, key) => {
  const totalCategoria = array.reduce((acc, item) => acc + item[key], 0);
  array.forEach((item) => {
    item.percentage =
      totalCategoria > 0
        ? Math.round((item[key] * 100 * 100) / totalCategoria) / 100
        : 0;
  });
};

// Función para convertir color hexadecimal a rgba con opacidad
function hexToRgba(hex, alpha) {
  // Elimina el carácter '#' si está presente
  const cleanHex = hex.replace("#", "");

  // Divide el color hexadecimal en sus componentes RGB
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  // Devuelve el color en formato rgba
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* chartOptions.stacked.plugins.tooltip.callbacks.label = (context) => {
    const datasetLabel = context.dataset.label || "Sin etiqueta";
    const value = context.raw;
    return `${datasetLabel}: ${numberFormatter.format(value)}`;
  };
  chartOptions.stacked.scales.x = {
    ticks: {
      color: "#495057",
      font: {
        size: 12,
      },
    },
    grid: {
      color: "#ebedef",
    },
    stacked: true,
  };
  chartOptions.stacked.scales.y = {
    ...commonAxisOptions,
    stacked: true,
  };*/

export { buildFilterFromSchema, grafic_table, calcularPorcentaje };
