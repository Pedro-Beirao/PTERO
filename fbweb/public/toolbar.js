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

function switchTab(el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  const panelId = el.dataset.panel;
  if (panelId) document.getElementById(panelId).classList.add('active');

  if (panelId === 'panel-graph' && window.litegraph) {
    requestAnimationFrame(() => window.resizeCanvas());
  }
  else if (panelId === 'panel-fbs' && window.xml_editorview) {
    window.xml_editorview.refresh();
    window.py_editorview.refresh();
  }
  else if (panelId === 'panel-config' && window.com_editorview) {
    window.com_editorview.refresh();
  }
}
