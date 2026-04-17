import * as Y from "https://esm.sh/yjs@13.6.0";
import { WebsocketProvider } from "https://esm.sh/y-websocket@3.0.0?deps=yjs@13.6.0";
// import { IndexeddbPersistence } from "https://esm.sh/y-indexeddb@9.0.12?deps=yjs@13.6.0";

window.litegraph = new LGraph();

window.ydoc = new Y.Doc();
// const indexeddbProvider = new IndexeddbPersistence('room', ydoc)
window.provider = new WebsocketProvider("ws://localhost:1234", "room", ydoc);
window.nodes = window.ydoc.getMap('nodes');
window.links = window.ydoc.getMap('links');
window.fbs = window.ydoc.getMap('fbs');
window.resources = window.ydoc.getMap('resources');

const not_connected = document.getElementById('not-connected');
provider.on('synced', (isSynced) => {
  if (isSynced) {
    not_connected.style.display = 'none';
    syncNodes();
    populateGraph();
    window.nodes.observe((event) => {
      console.log(event.transaction.origin);
      // TODO dont need the origin cuz the id cant be the same when adding. is this good enough?
      // if (event.transaction.origin == 'programmatic') return;
      event.changes.keys.forEach((change, id) => {
        if (change.action === 'add') {
          var node_map = window.nodes.get(id);
          if(!window.litegraph.getNodeById(id)) {
            var node = LiteGraph.createNode(node_map.get("type"));
            node.id = id;
            node.title = node_map.get("title");
            node.pos = [node_map.get("x"), node_map.get("y")];
            window.litegraph.add(node);
          }
        } else if (change.action === 'update') {
          var node_map = window.nodes.get(id);
          var node = window.litegraph.getNodeById(id);
          node.title = node_map.get("title");
          node.pos = [node_map.get("x"), node_map.get("y")];
        } else if (change.action === 'delete') {
          window.litegraph.remove(window.litegraph.getNodeById(id))
        }
      });
    });
  }
});
provider.on('status', event => {
  if (event.status === 'disconnected') {
    not_connected.style.display = 'flex';
  }
});



window.litegraph.onNodeAdded = function(node) {
  if (!node) return;

  window.ydoc.transact(() => {
    const node_map = new Y.Map();
    node_map.set("type", node.type);
    node_map.set("title", node.title);
    node_map.set("x", node.pos[0]);
    node_map.set("y", node.pos[1]);
    window.nodes.set(node.id, node_map);
  }, 'programmatic');
}

window.litegraph.afterChange = function(node) {
  if (!node) return;

  window.ydoc.transact(() => {
    const node_map = window.nodes.get(node.id);
    node_map.set("type", node.type);
    node_map.set("title", node.title);
    node_map.set("x", node.pos[0]);
    node_map.set("y", node.pos[1]);
  }, 'programmatic');
};

window.litegraph.onNodeRemoved = function(node) {
  if (!node) return;
  window.ydoc.transact(() => {
    window.nodes.delete(node.id);
  }, 'programmatic');
};

function populateGraph() {
  window.nodes.forEach((node, id) => {
    if(!window.litegraph.getNodeById(id)) {
      var node_map = window.nodes.get(id);
      var node = LiteGraph.createNode(node_map.get("type"));
      node.id = id;
      node.title = node_map.get("title");
      node.pos = [node_map.get("x"), node_map.get("y")];
      window.litegraph.add(node);
    }
  });
}

function syncNodes() {
  LiteGraph.clearRegisteredTypes();
  window.fbs.forEach((fb, id) => {
    const parser = new DOMParser();
    const fbt_doc = parser.parseFromString(fb.get("xml"), "text/xml");
    registerNode(fbt_doc)
  });
}

function registerNode(fbt_doc) {
  const fbtype = fbt_doc.getElementsByTagName("FBType")[0];

  const name = fbtype.getAttribute("Name");

  // Define the LiteGraph Node
  function CustomNode() {
    this.properties = {}

    // First add the events
    let inputs = fbt_doc.querySelectorAll("EventInputs > Event");
    let outputs = fbt_doc.querySelectorAll("EventOutputs > Event");

    for (let i = 0; i < inputs.length; i++) {
      const input = this.addInput(inputs[i].getAttribute("Name"), inputs[i].getAttribute("Type"));
      input.color_off = "#470000"
      input.color_on = "#ff0000"
    }

    for (let i = 0; i < outputs.length; i++) {
      const output = this.addOutput(outputs[i].getAttribute("Name"), outputs[i].getAttribute("Type"));
      output.color_off = "#470000"
      output.color_on = "#ff0000"
    }

    // Now the variables
    inputs = fbt_doc.querySelectorAll("InputVars > VarDeclaration");
    outputs = fbt_doc.querySelectorAll("OutputVars > VarDeclaration");

    for (let i = 0; i < inputs.length; i++) {
      const input = this.addInput(inputs[i].getAttribute("Name"), inputs[i].getAttribute("Type"));
      input.color_off = "#000047"
      input.color_on = "#0000ff"

      this.properties[inputs[i].getAttribute("Name")] = ""
    }

    for (let i = 0; i < outputs.length; i++) {
      const output = this.addOutput(outputs[i].getAttribute("Name"), outputs[i].getAttribute("Type"));
      output.color_off = "#000047"
      output.color_on = "#0000ff"
    }
  }
  CustomNode.title = name;

  CustomNode.prototype.onDrawForeground = function(ctx, graphcanvas)
  {
    if (this.flags.collapsed) return;

    ctx.save();

    for (let i = 0; i < this.inputs.length; i++) {
      const property = this.properties[this.inputs[i]["name"]]
      if (property != null && property != "" && this.inputs[i]["link"] == null) {
        ctx.font = "14px monospace";
        ctx.fillStyle = "white";
        ctx.textAlign = "right";

        const y = LiteGraph.NODE_SLOT_HEIGHT * (i + 0.5) + 9;
        ctx.fillText(property, -7, y);
      }
    }

    ctx.restore();
  }

  LiteGraph.registerNodeType("custom/" + name, CustomNode);
}
