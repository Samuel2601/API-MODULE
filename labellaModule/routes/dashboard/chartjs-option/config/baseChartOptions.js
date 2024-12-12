import { textColor, surfaceBorder } from "../config/colors.js";
import { numberFormatter } from "../utils/formatters.js";

export const baseChartOptions = {
  maintainAspectRatio: false,
  aspectRatio: 0.6,
  responsive: true,
  animation: {
    duration: 1000,
    easing: "easeOutQuart",
  },
  interaction: {
    mode: "nearest",
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: "top",
      labels: {
        font: { size: 14 },
        color: textColor,
      },
    },
    tooltip: {
      mode: "index",
      intersect: false,
      backgroundColor: "#ffffff",
      titleColor: "#333333",
      bodyColor: "#555555",
      borderColor: "#ddd",
      borderWidth: 1,
      padding: 10,
      titleFont: { size: 16, weight: "bold" },
      bodyFont: { size: 14 },
      displayColors: false,
      callbacks: {
        label: (context) => `Valor: ${numberFormatter.format(context.raw)}`,
      },
    },
  },
};
