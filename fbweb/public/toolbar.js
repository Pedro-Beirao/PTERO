function exportGraph() {
  const data = window.litegraph.serialize();
  const json = JSON.stringify(data, null, 2);
  console.log(json);
}

async function sendCommandToBackend(messages) {
  try {
        const response = await fetch('/deploy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(messages),
        });
        const result = await response.text();
        console.log('Response from backend:', result);
    } catch (error) {
        console.error('Error sending command:', error);
    }
}

// TODO the messages should be created in the backend. right?
async function deploy() {
  const data = window.litegraph.serialize();

  const messages = []

  messages.push({ message: `<Request Action="QUERY" ID="0"><FB Name="*" Type="*"/></Request>`, config: "" });
  let message_id = 1;

  messages.push({ message: `<Request Action="CREATE" ID="1"><FB Name="EMB_RES" Type="EMB_RES"/></Request>`, config: "" });
  message_id++;

  for (const node of data["nodes"]) {
    const fbtype = node["type"].split("/").pop();
    const fbname = node["title"] || fbtype;

    messages.push({ message: `<Request Action="CREATE" ID="${message_id}"><FB Name="${fbname}" Type="${fbtype}"/></Request>`, config: "EMB_RES" });
    // console.log(`<Request Action="CREATE" ID="${message_id}"><FB Name="${fbname}" Type="${fbtype}"/></Request>`);
    message_id++;


    for (const [key, value] of Object.entries(node["properties"])) {
      if (value != "") {
        messages.push({ message: `<Request Action="WRITE" ID="${message_id}"><Connection Destination="${fbname}.${key}" Source="${value}"/></Request>`, config: "EMB_RES" });
        // console.log(`<Request Action="WRITE" ID="${message_id}"><Connection Destination="${fbname}.${key}" Source="${value}"/></Request>`)
        message_id++;
      }
    }
  }

  for (const link of data["links"]) {
    // [link_id, source_id, source_slot, destination_id, destination_slot, data_type]

    // Is it possible that link[1] - 1 isnt always correct?
    // const source_fbtype = data["nodes"][link[1] - 1]["type"].split("/")[1]
    // const destination_fbtype = data["nodes"][link[3] - 1]["type"].split("/")[1]

    const source = data["nodes"].find(item => item["id"] == link[1]);
    const destination = data["nodes"].find(item => item["id"] == link[3]);

    const source_name = source["title"] || source["type"].split("/").pop()
    const destination_name = destination["title"] || destination["type"].split("/").pop()

    const source_str = `${source_name}.${source["outputs"][link[2]]["name"]}`;
    const destination_str = `${destination_name}.${destination["inputs"][link[4]]["name"]}`;

    messages.push({ message: `<Request Action="CREATE" ID="${message_id}"><Connection Destination="${destination_str}" Source="${source_str}"/></Request>`, config: "EMB_RES" });
    // console.log(`<Request Action="CREATE" ID="${message_id}"><Connection Destination="${destination_str}" Source="${source_str}"/></Request>`)
    message_id++;
  }

  messages.push({ message: `<Request Action="START" ID="${message_id}"/>`, config: "EMB_RES" });

  sendCommandToBackend(messages);
}

function switchTab(el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  const panelId = el.dataset.panel;
  if (panelId) document.getElementById(panelId).classList.add('active');

  if (panelId === 'panel-graph' && window.litegraph) {
    // requestAnimationFrame(() => window.resizeCanvas());
  }
  else if (panelId === 'panel-fbs' && window.xml_editorview) {
    window.xml_editorview.refresh();
    window.py_editorview.refresh();
  }
  else if (panelId === 'panel-deployment' && window.com_editorview) {
    window.com_editorview.refresh();
  }
}
