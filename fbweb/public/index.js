LiteGraph.clearRegisteredTypes();
window.graph = new LGraph();

fetch('/nodes')
  .then(res => res.json())
  .then(fbt_strings => {

    fbt_strings.forEach(fbt_string => {
      const parser = new DOMParser();
      const fbt_doc = parser.parseFromString(fbt_string, "text/xml");
      registerNode(fbt_doc)
    });
  });

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
