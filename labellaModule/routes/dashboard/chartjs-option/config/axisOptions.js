import { formatValueCallback } from "../utils/formatters.js";
import { surfaceBorder, textColor } from "./colors.js";

export const commonAxisOptions = {
  ticks: {
    color: textColor,
    font: { size: 12 },
    callback: formatValueCallback,
  },
  grid: { color: surfaceBorder },
};
