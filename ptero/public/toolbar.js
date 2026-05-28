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
    const response = await fetch('/deploy', {
      method: 'POST'
    });
    const result = await response.text();
    console.log('Response from backend:', result);
  } catch (error) {
    console.error('Error deploying:', error);
  }
}

async function test_deploy() {
  // TODO test deploy
  window.com_bindingaas
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
