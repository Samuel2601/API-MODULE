export const xAxisFloatingLabelsPlugin = {
  id: "xAxisFloatingLabels",
  afterDraw: async (chart) => {
    const ctx = chart.ctx;
    const xAxis = chart.scales.x;

    xAxis.ticks.forEach((tick, index) => {
      const x = xAxis.getPixelForTick(index);
      const y = xAxis.bottom;

      // Draw marker for each tick
      ctx.save();
      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.arc(x, y + 5, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });
  },
  afterEvent: (chart, args) => {
    const { event } = args;
    const xAxis = chart.scales.x;

    if (event.type === "mousemove") {
      const x = event.x;

      xAxis.ticks.forEach((tick, index) => {
        const tickX = xAxis.getPixelForTick(index);

        if (Math.abs(tickX - x) < 5) {
          const label = xAxis.ticks[index].label;

          // Display floating label near the tick
          const tooltipEl =
            document.getElementById("xAxis-floating-tooltip") ||
            createTooltipElement("xAxis-floating-tooltip");
          tooltipEl.innerHTML = `Label: ${label}`;
          tooltipEl.style.left = `${tickX}px`;
          tooltipEl.style.top = `${xAxis.bottom + 20}px`;
          tooltipEl.style.opacity = "1";
        }
      });
    } else if (event.type === "mouseout") {
      const tooltipEl = document.getElementById("xAxis-floating-tooltip");
      if (tooltipEl) tooltipEl.style.opacity = "0";
    }
  },
};
