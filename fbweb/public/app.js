const canvas = document.getElementById("graphCanvas");

// create graph
const graph = new LGraph();
const graphCanvas = new LGraphCanvas(canvas, graph);

LiteGraph.clearRegisteredTypes();

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
    }

    for (let i = 0; i < outputs.length; i++) {
      this.addOutput(outputs[i].getAttribute("Name"), outputs[i].getAttribute("Type"));
    }
  }
  CustomNode.title = name;

    // // Find outputs in the XML
    // const outputs = fbt_doc.getElementsByTagName("output");
    // for (let i = 0; i < outputs.length; i++) {
    //   this.addOutput(outputs[i].getAttribute("name"), outputs[i].getAttribute("type"));
    // }
  // }

  LiteGraph.registerNodeType("custom/" + name, CustomNode);
}

// example nodes
// const node1 = LiteGraph.createNode("basic/const");
// node1.pos = [200, 200];
// node1.setValue(4);

// const node2 = LiteGraph.createNode("basic/watch");
// node2.pos = [400, 200];

// connect nodes
// graph.add(node1);
// graph.add(node2);
// node1.connect(0, node2, 0);

function exportGraph() {
  const data = graph.serialize();

  // console.log(data);

  const json = JSON.stringify(data, null, 2);
  console.log(json);
}
