export const highlightMinMaxPlugin = {
  id: "highlightMinMax",
  afterDraw: async (chart) => {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      const min = Math.min(...dataset.data);
      const max = Math.max(...dataset.data);
      meta.data.forEach((datapoint, index) => {
        if (dataset.data[index] === min || dataset.data[index] === max) {
          ctx.save();
          ctx.fillStyle = "red";
          ctx.beginPath();
          const { x, y } = datapoint.tooltipPosition();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.restore();
        }
      });
    });
  },
};
