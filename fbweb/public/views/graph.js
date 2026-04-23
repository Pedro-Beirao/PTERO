const canvas = document.getElementById("graphCanvas");

const graphCanvas = new LGraphCanvas(canvas, window.litegraph);

// Override node panel
graphCanvas.showShowNodePanel = function (node) { };

graphCanvas.getNodeMenuOptions = function (node) {
  return [
    {
      content: "Name",
      callback: LGraphCanvas.onShowPropertyEditor,
    },
    {
      content: "Inputs",
      has_submenu: true,
      callback: LGraphCanvas.onShowMenuNodeProperties,
    },
    {
      content: "Map to",
      has_submenu: true,
      callback: LGraphCanvas.onMenuNodeColors,
    },
    null,
    {
      content: "Resize",
      callback: LGraphCanvas.onMenuResizeNode,
    },
    {
      content: "Collapse",
      callback: LGraphCanvas.onMenuNodeCollapse,
    },
    null,
    {
      content: "Clone",
      callback: LGraphCanvas.onMenuNodeClone,
    },
    {
      content: "Remove",
      disabled: !(node.removable !== false && !node.block_delete),
      callback: LGraphCanvas.onMenuNodeRemove,
    },
  ];
}

const resizeCanvas = function() {
  const canvas = document.getElementById('graphCanvas');
  const panel = document.getElementById('panel-graph');
  canvas.width = panel.clientWidth;
  canvas.height = panel.clientHeight;
  graphCanvas.draw(true);
}

resizeCanvas()
window.addEventListener('resize', resizeCanvas);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    resizeCanvas();
  }
});
