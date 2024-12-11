import mongoose from "mongoose";
import { format } from "date-fns";

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

const grafic_table = async (
  data,
  fieldMap,
  title,
  type,
  borderColor,
  backgroundColor
) => {
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

  // Preparar los datos y etiquetas del gráfico
  if (type === "doble") {
    const uniqueLabels = Array.from(
      new Set(data.map((item) => item._id[fieldMap[columnOrder[0]]]))
    );
    const uniqueCauses = Array.from(
      new Set(data.map((item) => item._id[fieldMap[columnOrder[1]]]))
    );

    chartLabels = uniqueLabels;
    chartDatasets = uniqueCauses.map((cause, index) => ({
      label: cause,
      data: uniqueLabels.map((estadoSalud) => {
        const match = data.find(
          (item) =>
            item._id[fieldMap[columnOrder[0]]] === estadoSalud &&
            item._id[fieldMap[columnOrder[1]]] === cause
        );
        return match ? match.count : 0;
      }),
      backgroundColor:
        backgroundColor ??
        `#${Math.floor(Math.random() * 16777215).toString(16)}7d`,
      borderColor: borderColor ?? "#FFA726",
    }));
  } else {
    // Otros tipos de gráficos
    chartLabels = data.map((item) => item[fieldMap[columnOrder[0]]]);
    chartDatasets = [
      {
        label: title,
        data: data.map(
          (item) => item[fieldMap[columnOrder[columnOrder.length - 2]]]
        ),
        backgroundColor: backgroundColor ?? "#42a5f563",
        borderColor: borderColor ?? "#42A5F5",
      },
    ];
  }

  // Preparar el gráfico
  const chart = {
    type: type === "time" || type === "date" ? "line" : type==="doble"? 'bar' : type, // Si es 'time', el gráfico es de tipo 'line'
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

export { buildFilterFromSchema, grafic_table, calcularPorcentaje };
