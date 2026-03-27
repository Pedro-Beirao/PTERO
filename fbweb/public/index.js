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
      this.addInput(inputs[i].getAttribute("Name"), inputs[i].getAttribute("Type"));
    }

    for (let i = 0; i < outputs.length; i++) {
      this.addOutput(outputs[i].getAttribute("Name"), outputs[i].getAttribute("Type"));
    }

    // Now the variables
    inputs = fbt_doc.querySelectorAll("InputVars > VarDeclaration");
    outputs = fbt_doc.querySelectorAll("OutputVars > VarDeclaration");

    for (let i = 0; i < inputs.length; i++) {
      this.addInput(inputs[i].getAttribute("Name"), inputs[i].getAttribute("Type"));
      this.properties[inputs[i].getAttribute("Name")] = ""
    }

    for (let i = 0; i < outputs.length; i++) {
      this.addOutput(outputs[i].getAttribute("Name"), outputs[i].getAttribute("Type"));
      this.properties[inputs[i].getAttribute("Name")] = ""
    }
  }
  CustomNode.title = name;

  LiteGraph.registerNodeType("custom/" + name, CustomNode);
}
