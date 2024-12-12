export const floatingLabelsPlugin = {
    id: "floatingLabels",
    afterEvent: async (chart, args) => {
      const { event } = args;
      const tooltipEl = document.getElementById("chartjs-floating-tooltip") || createTooltipElement("chartjs-floating-tooltip");
  
      if (event.type === "mousemove") {
        const { x, y } = event;
        const elements = chart.getElementsAtEventForMode(
          event,
          "nearest",
          { intersect: true },
          false
        );
  
        if (elements.length) {
          const datasetIndex = elements[0].datasetIndex;
          const index = elements[0].index;
          const label = chart.data.labels[index];
          const value = chart.data.datasets[datasetIndex].data[index];
  
          tooltipEl.innerHTML = `Label: ${label}<br>Value: ${value}`;
          tooltipEl.style.left = `${x + 10}px`;
          tooltipEl.style.top = `${y + 10}px`;
          tooltipEl.style.opacity = "1";
        } else {
          tooltipEl.style.opacity = "0";
        }
      } else if (event.type === "mouseout") {
        tooltipEl.style.opacity = "0";
      }
    },
  };