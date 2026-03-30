function exportGraph() {
  const data = graph.serialize();
  const json = JSON.stringify(data, null, 2);
  console.log(json);
}

async function sendCommandToBackend(message) {
    try {
        const response = await fetch('/send-command', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/xml',
            },
            body: message,
        });
        const result = await response.text();
        console.log('Response from backend:', result);
    } catch (error) {
        console.error('Error sending command:', error);
    }
}

async function deploy() {
  const data = graph.serialize();

  const query_message = buildMessage(`<Request Action="QUERY" ID="0"><FB Name="*" Type="*"/></Request>`, "");
  await sendCommandToBackend(query_message);
  let message_id = 1;

  const resource_message = buildMessage(`<Request Action="CREATE" ID="1"><FB Name="EMB_RES" Type="EMB_RES"/></Request>`, "");
  await sendCommandToBackend(resource_message);
  message_id++;

  for (const node of data["nodes"]) {
    const fbtype = node["type"].split("/").pop();
    const fbname = node["title"] || fbtype;

    const message = buildMessage(`<Request Action="CREATE" ID="${message_id}"><FB Name="${fbname}" Type="${fbtype}"/></Request>`, "EMB_RES");
    await sendCommandToBackend(message);
    // console.log(`<Request Action="CREATE" ID="${message_id}"><FB Name="${fbname}" Type="${fbtype}"/></Request>`);
    message_id++;

    for (const [key, value] of Object.entries(node["properties"])) {
      if (value != "") {
        const message = buildMessage(`<Request Action="WRITE" ID="${message_id}"><Connection Destination="${fbname}.${key}" Source="${value}"/></Request>`, "EMB_RES");
        await sendCommandToBackend(message);
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

    const message = buildMessage(`<Request Action="CREATE" ID="${message_id}"><Connection Destination="${destination_str}" Source="${source_str}"/></Request>`, "EMB_RES");
    await sendCommandToBackend(message);
    console.log(`<Request Action="CREATE" ID="${message_id}"><Connection Destination="${destination_str}" Source="${source_str}"/></Request>`)
    message_id++;
  }

  const start_message = buildMessage(`<Request Action="START" ID="${message_id}"></Request>`, "EMB_RES");
  await sendCommandToBackend(start_message);
}

function buildMessage(messagePayload, configurationName) {
    // Helper: Convert a number to two bytes (big-endian)
    function toTwoBytes(num) {
        const hex = num.toString(16).padStart(4, '0');
        const byte1 = parseInt(hex.substring(0, 2), 16);
        const byte2 = parseInt(hex.substring(2, 4), 16);
        return [byte1, byte2];
    }

    // Build the first header: 0x50 + length of configurationName (2 bytes)
    const configNameBytes = new TextEncoder().encode(configurationName);
    const configNameLenBytes = toTwoBytes(configurationName.length);
    const header1 = new Uint8Array([0x50, configNameLenBytes[0], configNameLenBytes[1]]);

    // Build the second header: 0x50 + length of messagePayload (2 bytes)
    const messagePayloadBytes = new TextEncoder().encode(messagePayload);
    const messageLenBytes = toTwoBytes(messagePayload.length);
    const header2 = new Uint8Array([0x50, messageLenBytes[0], messageLenBytes[1]]);

    // Concatenate all parts
    const result = new Uint8Array(
        header1.length +
        configNameBytes.length +
        header2.length +
        messagePayloadBytes.length
    );
    result.set(header1, 0);
    result.set(configNameBytes, header1.length);
    result.set(header2, header1.length + configNameBytes.length);
    result.set(messagePayloadBytes, header1.length + configNameBytes.length + header2.length);

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
