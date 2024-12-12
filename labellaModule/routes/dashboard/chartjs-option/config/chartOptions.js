import { baseChartOptions } from "./baseChartOptions.js";
import { commonAxisOptions } from "./axisOptions.js";
import { highlightMinMaxPlugin } from "../plugins/highlightMinMaxPlugin.js";
import { floatingLabelsPlugin } from "../plugins/floatingLabelsPlugin.js";
import { textColor } from "./colors.js";
import { xAxisFloatingLabelsPlugin } from "../plugins/xAxisFloatingLabelsPlugin.js";
import { formatValueCallback } from "../utils/formatters.js";

export const chartOptions = {
  line: {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      highlightMinMaxPlugin,
    },
    scales: {
      x: {
        ticks: {
          color: "#495057",
          font: {
            size: 20,
          },
        },
        grid: {
          color: "#ebedef",
        },
      },
      y: { ...commonAxisOptions },
    },
  },
  bar: {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      highlightMinMaxPlugin,
    },
    scales: {
      x: {
        ticks: {
          color: "#495057",
          font: {
            size: 12,
          },
        },
        grid: {
          color: "#ebedef",
        },
      },
      y: { ...commonAxisOptions },
    },
  },
  pie: {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        ...baseChartOptions.plugins.legend,
        labels: {
          usePointStyle: true,
          color: textColor,
        },
      },
    },
  },
  doughnut: {
    ...baseChartOptions,
    plugins: {
      ...baseChartOptions.plugins,
      legend: {
        ...baseChartOptions.plugins.legend,
        labels: {
          usePointStyle: true,
          color: textColor,
        },
      },
    },
  },
  stacked: {
    ...baseChartOptions,
    plugins: {
      ...highlightMinMaxPlugin,
      ...floatingLabelsPlugin,
      ...xAxisFloatingLabelsPlugin,
    },

    scales: {
      x: {
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
      },
      y: { ...commonAxisOptions, stacked: true },
    },
  },
  doubleAxis: {
    ...baseChartOptions,
    scales: {
      y: {
        type: "linear",
        position: "left",
        ticks: { callback: formatValueCallback },
      },
      y2: {
        type: "linear",
        position: "right",
        grid: { drawOnChartArea: false },
        ticks: { callback: formatValueCallback },
      },
    },
  },
};
