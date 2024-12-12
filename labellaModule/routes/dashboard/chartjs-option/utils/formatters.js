export const numberFormatter = new Intl.NumberFormat("es-ES", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  export const formatValueCallback = (value) => numberFormatter.format(value);
  