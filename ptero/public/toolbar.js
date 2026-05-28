import * as Y from "https://esm.sh/yjs@13.6.0";

function exportGraph() {
  const data = window.litegraph.serialize();
  const json = JSON.stringify(data, null, 2);
  console.log(json);
}

function clearStorage() {
  ydoc.transact(() => {
    ydoc.share.forEach(type => {
      if (type instanceof Y.Map) {
        type.clear()
      }
      else if (type instanceof Y.Array) {
        type.delete(0, type.length)
      }
      else if (type instanceof Y.Text) {
        type.delete(0, type.length)
      }
      else if (
        type instanceof Y.XmlFragment ||
        type instanceof Y.XmlElement
      ) {
        type.delete(0, type.length)
      }
    })
  })
}

async function restartDINASOREs() {
  try {
    const response = await fetch('/restart_dinasores', {
      method: 'POST'
    });
    const result = await response.text();
    console.log('Response from backend:', result);
  } catch (error) {
    console.error('Error restarting DINASORE:', error);
  }
}

async function deploy() {
  if (mode == "test") {
    test_deploy();
    return;
  }

  try {
    const response = await fetch(mode != "test" ? "/deploy" : "/test-deploy", {
      method: 'POST'
    });
    const result = await response.text();
    console.log('Response from backend:', result);
  } catch (error) {
    console.error('Error deploying:', error);
  }
}

async function test_deploy() {
  const communication = window.ydoc.getText("communication")
  ydoc.transact(() => {
    communication.delete(0, communication.length);
  });
  const test_messages = [
    `python3 ./sync/synchronize.py`,
    `Starting copying process`,
    `Copying process completed`,
    `Synchronized 1 DINASOREs`,
    `<Request Action="QUERY" ID="0"><FB Name="*" Type="*"/></Request>`,
    `<Response ID="0" />`,
    `<Request Action="CREATE" ID="1"><FB Name="EMB_RES" Type="EMB_RES"/></Request>`,
    `<Response ID="1" />`,
    `<Request Action="CREATE" ID="2"><FB Name="SENSOR_SIMULATOR" Type="SENSOR_SIMULATOR"/></Request>`,
    `<Response ID="2" />`,
    `<Request Action="WRITE" ID="3"><Connection Destination="SENSOR_SIMULATOR.OFFSET" Source="12"/></Request>`,
    `<Response ID="3" />`,
    `<Request Action="CREATE" ID="4"><FB Name="MOVING_AVERAGE" Type="MOVING_AVERAGE"/></Request>`,
    `<Response ID="4" />`,
    `<Request Action="WRITE" ID="5"><Connection Destination="MOVING_AVERAGE.WINDOW" Source="5"/></Request>`,
    `<Response ID="5" />`,
    `<Request Action="CREATE" ID="6"><FB Name="CONCATENATE_REALS" Type="CONCATENATE_REALS"/></Request>`,
    `<Response ID="6" />`,
    `<Request Action="CREATE" ID="7"><Connection Destination="MOVING_AVERAGE.VALUE" Source="SENSOR_SIMULATOR.VALUE"/></Request>`,
    `<Response ID="7" />`,
    `<Request Action="CREATE" ID="8"><Connection Destination="CONCATENATE_REALS.VALUE2" Source="MOVING_AVERAGE.VALUE_MA"/></Request>`,
    `<Response ID="8" />`,
    `<Request Action="CREATE" ID="9"><Connection Destination="CONCATENATE_REALS.RUN" Source="MOVING_AVERAGE.RUN_O"/></Request>`,
    `<Response ID="9" />`,
    `<Request Action="CREATE" ID="10"><Connection Destination="MOVING_AVERAGE.RUN" Source="SENSOR_SIMULATOR.READ_O"/></Request>`,
    `<Response ID="10" />`,
    `<Request Action="CREATE" ID="11"><Connection Destination="CONCATENATE_REALS.VALUE1" Source="SENSOR_SIMULATOR.VALUE"/></Request>`,
    `<Response ID="11" />`,
    `<Request Action="START" ID="12"/>`,
    `<Response ID="12" />`
  ]


  for (var i = 0; i < test_messages.length; i++) {
    ydoc.transact(async () => {
      communication.insert(communication.length, test_messages[i].toString() + "\n")
    })
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  test_watch();
}

async function test_watch() {
  while (true) {
    const value = (Math.random() * 6 + 12).toFixed(2)
    const value_ma = (Math.random() * 6 + 12).toFixed(2)
    const result = String(value) + ";" + String(value_ma);

    for (const [nk, node_map] of window.nodes.entries()) {
      for (const [key, kv] of node_map.get("watches").entries()) {
        node_map.get("watches").set(key, key == "VALUE" ? value :
                                         key == "VALUE_MA" ? value_ma :
                                         key == "RESULT" ? result : "0");
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

function switchTab(el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  const panelId = el.dataset.panel;
  if (panelId) document.getElementById(panelId).classList.add('active');

  if (panelId === 'panel-graph' && window.litegraph) {
    requestAnimationFrame(() => window.resizeCanvas());
    window.syncNodes();
    window.populateGraph();
  }
  else if (panelId === 'panel-fbs' && window.xml_editorview) {
    window.xml_editorview.refresh();
    window.py_editorview.refresh();
  }
  else if (panelId === 'panel-console' && window.com_editorview) {
    window.com_editorview.refresh();
  }
}

window.toolbar_exportGraph = exportGraph
window.toolbar_clearStorage = clearStorage
window.toolbar_restartDINASOREs = restartDINASOREs
window.toolbar_deploy = deploy
window.switchTab = switchTab
