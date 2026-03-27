function exportGraph() {
  const data = graph.serialize();
  const json = JSON.stringify(data, null, 2);
  console.log(json);
}

function deploy() {
  const data = graph.serialize();

  const firstMessage = buildMessage(`<Request Action="QUERY" ID="0"><FB Name="*" Type="*"/></Request>`, "");

  let message_id = 1

  for (const node of data["nodes"]) {
    const fbtype = node["type"].split("/").pop();
    const fbname = node["title"] || fbtype;

    const message = buildMessage(`<Request Action="CREATE" ID="${message_id}"><FB Name="${fbname}" Type="${fbtype}"/></Request>`, "");
    console.log(`<Request Action="CREATE" ID="${message_id}"><FB Name="${fbname}" Type="${fbtype}"/></Request>`);
    message_id++;

    for (const [key, value] of Object.entries(node["properties"])) {
      if (value != "") {
        const message = buildMessage(`<Request Action="WRITE" ID="${message_id}"><Connection Destination="${fbname}.${key}" Source="${value}"/></Request>`, "");
        console.log(`<Request Action="WRITE" ID="${message_id}"><Connection Destination="${fbname}.${key}" Source="${value}"/></Request>`)
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
    const destination_name = source["title"] || source["type"].split("/").pop()

    const source_str = `${source_name}.${source["outputs"][link[2]]["name"]}`;
    const destination_str = `${destination_name}.${destination["inputs"][link[4]]["name"]}`;

    const message = buildMessage(`<Request Action="CREATE" ID="${message_id}"><Connection Destination="${destination_str}" Source="${source_str}"/></Request>`, "");
    console.log(`<Request Action="CREATE" ID="${message_id}"><Connection Destination="${destination_str}" Source="${source_str}"/></Request>`)
    message_id++;
  }
}

function buildMessage(messagePayload, configurationName) {
  // Encode configuration name to bytes (UTF-8)
  const configBytes = new TextEncoder().encode(configurationName);

  // Helper: build a 3-byte header [0x50, highByte, lowByte] from a length
  function makeHeader(length) {
    const high = (length >> 8) & 0xff;
    const low  =  length       & 0xff;
    return new Uint8Array([0x50, high, low]);
  }

  const header1 = makeHeader(configBytes.length);   // config name length
  const header2 = makeHeader(messagePayload.length); // payload length

  // Concatenate: header1 + configName + header2 + payload
  const total = header1.length + configBytes.length + header2.length + messagePayload.length;
  const result = new Uint8Array(total);
  let offset = 0;

  result.set(header1,      offset); offset += header1.length;
  result.set(configBytes,  offset); offset += configBytes.length;
  result.set(header2,      offset); offset += header2.length;
  result.set(messagePayload, offset);

  return result;
}

function switchTab(el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  const panelId = el.dataset.panel;
  if (panelId) document.getElementById(panelId).classList.add('active');

  // Resize canvas when graph tab becomes active
  if (panelId === 'panel-graph' && window.graph) {
    requestAnimationFrame(() => resizeCanvas());
  }
}
