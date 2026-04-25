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
      callback: graphCanvas.onMenuNodeMapTo,
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

graphCanvas.onMenuNodeMapTo = function (value, options, e, menu, node) {
  if (!node) {
    throw "no node for color";
  }

  var colors = [];
  colors.push({
    value: null,
    content:
      "<span style='display: block; padding-left: 4px;'>None</span>",
  });

  window.resources.forEach((resource, id) => {
    var color = {
      id: id,
      value: resource.get("name"),
      content:
        "<span style='display: block; color: #999; padding-left: 4px; border-left: 8px solid " +
        resource.get("color") +
        "; background-color:" +
        "black" +
        "'>" +
        resource.get("name") +
        "</span>",
    };
    colors.push(color);
  });
  new LiteGraph.ContextMenu(colors, {
    event: e,
    callback: inner_clicked,
    parentMenu: menu,
    node: node,
  });

  function inner_clicked(v) {
    if (!node) {
      return;
    }

    var color = v.value ? window.resources.get(v.id).get("color") : null;

    var fApplyColor = function (node) {
      if (color) {
        if (node.constructor === LiteGraph.LGraphGroup) {
          node.color = color;
        } else {
          node.color = color;
          node.bgcolor = color;
        }
      } else {
        delete node.color;
        delete node.bgcolor;
      }
    };

    var graphcanvas = LGraphCanvas.active_canvas;
    if (
      !graphcanvas.selected_nodes ||
      Object.keys(graphcanvas.selected_nodes).length <= 1
    ) {
      fApplyColor(node);
    } else {
      for (var i in graphcanvas.selected_nodes) {
        fApplyColor(graphcanvas.selected_nodes[i]);
      }
    }
    node.setDirtyCanvas(true, true);
  }

  return false;
};

window.resizeCanvas = function() {
  const canvas = document.getElementById('graphCanvas');
  const panel = document.getElementById('panel-graph');
  canvas.width = panel.clientWidth;
  canvas.height = panel.clientHeight;
  graphCanvas.draw(true);
}

window.resizeCanvas()
window.addEventListener('resize', resizeCanvas);
