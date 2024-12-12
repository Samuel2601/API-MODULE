export const createTooltipElement = (id) => {
    const tooltipEl = document.createElement("div");
    tooltipEl.id = id;
    tooltipEl.style.position = "absolute";
    tooltipEl.style.background = "rgba(0, 0, 0, 0.7)";
    tooltipEl.style.color = "#fff";
    tooltipEl.style.padding = "5px 10px";
    tooltipEl.style.borderRadius = "5px";
    tooltipEl.style.pointerEvents = "none";
    tooltipEl.style.fontSize = "12px";
    tooltipEl.style.zIndex = "100";
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  };