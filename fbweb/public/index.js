import * as Y from "https://esm.sh/yjs@13.6.0";
import { WebsocketProvider } from "https://esm.sh/y-websocket@3.0.0?deps=yjs@13.6.0";
// import { IndexeddbPersistence } from "https://esm.sh/y-indexeddb@9.0.12?deps=yjs@13.6.0";

LiteGraph.NODE_TITLE_COLOR = "#BBB"
LiteGraph.NODE_TEXT_COLOR = "#CCC"
LiteGraph.NODE_DEFAULT_BOXCOLOR = "#AAA"
window.litegraph = new LGraph();

window.ydoc = new Y.Doc();

const wsUrl = (window.location.hostname === 'localhost' ||
              window.location.hostname == '127.0.0.1')
  ? 'ws://localhost:1234'
  : `wss://${window.location.host}`;
window.provider = new WebsocketProvider(wsUrl, "room", ydoc, {binary: true});
window.nodes = window.ydoc.getMap('nodes');
window.links = window.ydoc.getArray('links');
window.fbs = window.ydoc.getMap('fbs');
window.resources = window.ydoc.getMap('resources');

localStorage.clear(); // TODO needed? there was a bug where local storage was screwing it up

const not_connected = document.getElementById('not-connected');
provider.on('synced', (isSynced) => {
  if (isSynced) {
    not_connected.style.display = 'none';
    syncNodes();
    populateGraph();

    window.nodes.observeDeep((events) => {
      events.forEach(event => {
        event.changes.keys.forEach((change, id) => {
          // Node Updated
          if (event.target != window.nodes) {
            const node_map = event.target;
            const id = node_map.get("id");

            // If the map has an id, type and title, then its the node itself
            if (id && node_map.get("type") && node_map.get("title")) {
              const node = window.litegraph.getNodeById(id);
              node.title = node_map.get("title");
              node.pos = [node_map.get("x"), node_map.get("y")];
              node.mappedto = node_map.get("mappedto");
              const color = window.resources.get(node.mappedto)?.get("color");
              node.color = color;
              node.bgcolor = color;
            }

            // If not, it is the properties or watches
            else {
              const node = window.litegraph.getNodeById(event.path[0]);
              Object.keys(node.properties).forEach((key) => {
                const new_value = node_map.get(key);
                if (new_value)
                  node.properties[key] = new_value;
              });
              Object.keys(node.watches).forEach((key) => {
                const new_value = node_map.get(key);
                if (new_value)
                  node.watches[key] = new_value;
              });
            }
            window.litegraph.setDirtyCanvas(true, true);
          }

          // Node Added
          else if (change.action === 'add') {
            var node_map = window.nodes.get(id);
            if(!window.litegraph.getNodeById(id)) {
              var node = LiteGraph.createNode(node_map.get("type"));
              node.id = id;
              node.title = node_map.get("title");
              node.pos = [node_map.get("x"), node_map.get("y")];
              node.mappedto = node_map.get("mappedto");
              const color = window.resources.get(node.mappedto)?.get("color");
              node.color = color;
              node.bgcolor = color;
              window.litegraph.add(node);
            }
          }

          // Node Deleted
          else if (change.action === 'delete') {
            window.litegraph.remove(window.litegraph.getNodeById(id))
          }
        });
      });
    });

    window.links.observe((event) => {
      if (event.transaction.origin === 'local') return;
// really dislike this whole logic
// nothing should be named edge
      event.changes.delta.forEach((delta) => {
        if (delta.insert) {
          delta.insert.forEach((edge) => {
            const originNode = window.litegraph.getNodeById(edge.origin_id);
            const targetNode = window.litegraph.getNodeById(edge.target_id);
            if (originNode && targetNode) {
              originNode.connect(edge.origin_slot, targetNode, edge.target_slot);
            }
          });
        }
        if (delta.delete) {
          const edgeIds = new Set(window.links.toArray().map(e => e.id));
          Object.values(window.litegraph.links).forEach((link) => {
            const key = `${link.origin_id}:${link.origin_slot}-${link.target_id}:${link.target_slot}`;
            if (!edgeIds.has(key)) {
              window.litegraph.removeLink(link.id);
            }
          });
        }
      });

      window.litegraph.setDirtyCanvas(true, true);
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
    node_map.set("id", node.id);
    node_map.set("type", node.type);
    node_map.set("title", node.title);
    node_map.set("x", node.pos[0]);
    node_map.set("y", node.pos[1]);
    node_map.set("mappedto", node.mappedto);
    const prop_map = new Y.Map()
    Object.entries(node.properties).forEach(([key, value]) => {
      prop_map.set(key, value);
    });
    node_map.set("properties", prop_map);
    const watch_map = new Y.Map()
    Object.entries(node.watches).forEach(([key, value]) => {
      watch_map.set(key, value);
    });
    node_map.set("watches", watch_map);
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
    // node_map.delete("mappedto");
    node_map.set("mappedto", node.mappedto);
    const prop_map = node_map.get("properties");
    Object.entries(node.properties).forEach(([key, value]) => {
      prop_map.set(key, value);
    });
  }, 'programmatic');
};

window.litegraph.onNodeRemoved = function(node) {
  if (!node) return;
  window.ydoc.transact(() => {
    window.nodes.delete(node.id);
  }, 'programmatic');
};

window.litegraph.onNodeConnectionChange = function(type, node, slot, target_node, target_slot) {
  if (type != LiteGraph.OUTPUT) return;

  window.ydoc.transact(() => {
    node.outputs[slot].links?.forEach((linkId) => {
      const link = window.litegraph.links[linkId];
      if (!link) return;
      const edgeKey = `${link.origin_id}:${link.origin_slot}-${link.target_id}:${link.target_slot}`;
      // Check if already stored
      const exists = window.links.toArray().some(e => e.id === edgeKey);
      if (!exists) {
        window.links.push([{
          id: edgeKey,
          origin_id: link.origin_id,
          origin_slot: link.origin_slot,
          target_id: link.target_id,
          target_slot: link.target_slot,
          origin_slot_name: node.outputs[link.origin_slot].name,
          target_slot_name: window.litegraph.getNodeById(link.target_id).inputs[link.target_slot].name
        }]);
      }
    });

    // Remove links that no longer exist
    const currentLinkIds = new Set(
      Object.values(window.litegraph.links).map(l =>
        `${l.origin_id}:${l.origin_slot}-${l.target_id}:${l.target_slot}`
      )
    );
    const arr = window.links.toArray();
    for (let i = arr.length - 1; i >= 0; i--) {
      if (!currentLinkIds.has(arr[i].id)) {
        window.links.delete(i, 1);
      }
    }
  }, 'local');
};

function populateGraph() {
  window.nodes.forEach((node_map, id) => {
    if(!window.litegraph.getNodeById(id)) {
      var node = LiteGraph.createNode(node_map.get("type"));
      if (node == null) {
        window.ydoc.transact(() => {
          window.nodes.delete(id);
        });
      }
      else {
        node.id = id;
        node.title = node_map.get("title");
        node.pos = [node_map.get("x"), node_map.get("y")];
        node.mappedto = node_map.get("mappedto");
        const color = window.resources.get(node.mappedto)?.get("color");
        node.color = color;
        node.bgcolor = color;
        node_map.get("properties").forEach((value, key) => {
          node.properties[key] = value;
        });
        node_map.get("watches").forEach((value, key) => {
          node.watches[key] = value;
        });
        window.litegraph.add(node);
      }
    }
  });

  window.links.toArray().forEach((link) => {
    const originNode = window.litegraph.getNodeById(link.origin_id);
    const targetNode = window.litegraph.getNodeById(link.target_id);
    if (originNode && targetNode) {
      originNode.connect(link.origin_slot, targetNode, link.target_slot);
    }
  });
}

function syncNodes() {
  LiteGraph.clearRegisteredTypes();
  const parser = new DOMParser();
  window.fbs.forEach((fb, id) => {
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
    this.watches = {}

    // First add the events
    let inputs = [...fbt_doc.querySelectorAll("EventInputs > Event"), ...fbt_doc.querySelectorAll("InputVars > VarDeclaration")];
    let outputs = [...fbt_doc.querySelectorAll("EventOutputs > Event"), ...fbt_doc.querySelectorAll("OutputVars > VarDeclaration")];

    for (let i = 0; i < inputs.length; i++) {
      const input = this.addInput(inputs[i].getAttribute("Name"), inputs[i].getAttribute("Type"));
      if (inputs[i].getAttribute("Type") == "Event") {
        input.color_off = "#470000"
        input.color_on = "#ff0000"
      }
      else {
        input.color_off = "#000047"
        input.color_on = "#0000ff"
        this.properties[inputs[i].getAttribute("Name")] = ""
      }
    }

    for (let i = 0; i < outputs.length; i++) {
      const output = this.addOutput(outputs[i].getAttribute("Name"), outputs[i].getAttribute("Type"));
      if (outputs[i].getAttribute("Type") == "Event") {
        output.color_off = "#470000"
        output.color_on = "#ff0000"
      }
      else {
        output.color_off = "#000047"
        output.color_on = "#0000ff"
        this.watches[outputs[i].getAttribute("Name")] = ""
      }
    }

    // TODO the width still doenst work correctly, for example a big fb name can break
    // Investigate that lower/upper makes a difference
    this.size = [this.size[0] + 50, this.size[1]];
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

    for (let i = 0; i < this.outputs.length; i++) {
      var watch = this.watches[this.outputs[i]["name"]]
      if (watch != null && watch != "") {
        ctx.font = "14px monospace";
        ctx.fillStyle = "white";
        ctx.textAlign = "left";

        const y = LiteGraph.NODE_SLOT_HEIGHT * (i + 0.5) + 9;
        ctx.fillText(watch, this.size[0] + 7, y);
      }
    }

    ctx.restore();
  }

  // Dont want "Rename Slot" to appear
  CustomNode.prototype.getSlotMenuOptions = function (slot)
  {
    return []
  };

  LiteGraph.registerNodeType("custom/" + name, CustomNode);
}
