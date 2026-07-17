global.WebSocket = require('ws');
const express = require("express");
const path = require("path");
const fs = require("fs");
const net = require('net');
const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');
const { spawn } = require('child_process');
const { DOMParser } = require('@xmldom/xmldom');

const PYTHON_PATH = "python3"

const ydoc = new Y.Doc()
const provider = new WebsocketProvider('ws://localhost:1234', 'room', ydoc, { binary: true, connect: true, resyncInterval: 5000 })
const communication = ydoc.getText("communication")
const nodes = ydoc.getMap('nodes');
const links = ydoc.getArray('links');
const fbs = ydoc.getMap("fbs")
const resources = ydoc.getMap("resources")
// TODO use keymapvalue

var tcp_sockets = [];

const app = express();
const PORT = 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => res.render('index'));
app.get('/ide', (req, res) => res.render('ide', { mode: 'default' }));
app.get('/test-ide', (req, res) => res.render('ide', { mode: 'test' }));

// Middleware to parse JSON and XML
app.use(express.json());

app.post('/restart_dinasores', async (req, res) => {
  resources.forEach((resource, id) => {
    spawn('docker', ['restart', 'dinasore'+String(Number(resource.get("DINASORE port")))]);
    ydoc.transact(() => {
      communication.insert(communication.length, 'Restarting docker dinasore61499 (takes less than a minute)' + "\n");
    });
  });
});

var deploying = false
app.post('/deploy', async (req, res) => {
  if (deploying)
    return;
  deploying = true
  setTimeout(() => {
    deploying = false;
  }, 5000)

  ydoc.transact(() => {
    communication.delete(0, communication.length);
  });
  exportFBs();
  await syncFBs();

  for (const tcpClient of tcp_sockets) {
    tcpClient.destroy();
  }
  tcp_sockets = [];

  for (const [res_id, res_map] of resources.entries()) {
    const messages = prepareMessages(res_id);
    await sendToDINASORE(messages, res_map, res);
    deploying = false;

    watchDINASORE(0);
  }
});

function prepareMessages(res_id) {
  const messages = []

  messages.push({ message: `<Request Action="QUERY" ID="0"><FB Name="*" Type="*"/></Request>`, config: "" });
  let message_id = 1;

  messages.push({ message: `<Request Action="CREATE" ID="1"><FB Name="EMB_RES" Type="EMB_RES"/></Request>`, config: "" });
  message_id++;

  for (const [nk, node_map] of nodes.entries()) {
    if (node_map.get("mappedto") != res_id)
      continue;

    const fbtype = node_map.get("type").split("/").pop();
    const fbname = node_map.get("title") || fbtype;

    messages.push({ message: `<Request Action="CREATE" ID="${message_id}"><FB Name="${fbname}" Type="${fbtype}"/></Request>`, config: "EMB_RES" });
    message_id++;


    node_map.get("properties").forEach((value, key) => {
      if (value != "") {
        messages.push({ message: `<Request Action="WRITE" ID="${message_id}"><Connection Destination="${fbname}.${key}" Source="${value}"/></Request>`, config: "EMB_RES" });
        message_id++;
      }
    });
  };

  for (const link_map of links) {
    // [link_id, source_id, source_slot, destination_id, destination_slot, data_type]
    const source = nodes.get(link_map.origin_id);
    const destination = nodes.get(link_map.target_id);

    if (source.get("mappedto") != res_id)
      continue;
    if (destination.get("mappedto") != res_id)
      continue;

    if (source && destination) {
      const source_name = source.get("title")
      const destination_name = destination.get("title")

      const source_str = `${source_name}.${link_map.origin_slot_name}`;
      const destination_str = `${destination_name}.${link_map.target_slot_name}`;

      messages.push({ message: `<Request Action="CREATE" ID="${message_id}"><Connection Destination="${destination_str}" Source="${source_str}"/></Request>`, config: "EMB_RES" });
      // console.log(`<Request Action="CREATE" ID="${message_id}"><Connection Destination="${destination_str}" Source="${source_str}"/></Request>`)
      message_id++;
    }
  };

  messages.push({ message: `<Request Action="START" ID="${message_id}"/>`, config: "EMB_RES" });

  return messages;
}

async function sendToDINASORE(messages, res_map, res) {
  const tcpClient = new net.Socket();
  tcp_sockets.push(tcpClient);
  const DINASORE_HOST = res_map.get("Address");
  const DINASORE_PORT = res_map.get("DINASORE port");

  try {
    // Connect to DINASORE once
    await new Promise((resolve, reject) => {
      tcpClient.setTimeout(5000, () => {
        console.error('Connection timeout');
        tcpClient.destroy();
        reject(new Error('Connection timeout'));
      });

      tcpClient.connect(DINASORE_PORT, DINASORE_HOST, () => {
        console.log('Connected to DINASORE');
        setTimeout(() => {
          resolve();
        }, 500);
      });

      tcpClient.on('error', (err) => {
        console.error('TCP connection error:', err);
        tcpClient.destroy();
        reject(err);
      });
    });

    // Process all messages using the same connection
    for (const r of messages) {
      const message = buildMessage(r.message, r.config);
      const response = await new Promise((resolve, reject) => {
        tcpClient.write(message);
        ydoc.transact(() => {
          communication.insert(communication.length, message.toString("utf-8") + "\n");
        });

        tcpClient.once('data', (data) => {
          ydoc.transact(() => {
            communication.insert(communication.length, data.toString("utf-8") + "\n");
          });
          resolve(data.toString("utf-8"));
        });
      });
    }

    console.log('All messages processed');
    res.send('All messages processed');
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error processing messages');
  }
}

async function watchDINASORE(id) {
  for (const tcpClient of tcp_sockets) {
    if (id == 0) {
      for (const [nk, node_map] of nodes.entries()) {
        var address = tcpClient.remoteAddress;
        if (address === '::1' || address === '127.0.0.1' || address === '::ffff:127.0.0.1') {
          address = 'localhost';
        }
        if (address == resources.get(node_map.get("mappedto"))?.get("Address") &&
            tcpClient.remotePort == resources.get(node_map.get("mappedto"))?.get("DINASORE port")) {
          for (const [key, value] of node_map.get("watches").entries()) {
            await new Promise((resolve, reject) => {
              tcpClient.write(buildMessage(`<Request ID="${id}" Action="CREATE"><Watch Source="${node_map.get('title')}.${key}" Destination="*"/></Request>`, "EMB_RES"));
              id++;
              tcpClient.once('data', (data) => {
                resolve();
              });
            });
          };
        }
      };
    }

    await new Promise((resolve, reject) => {
      tcpClient.write(buildMessage(`<Request ID="${id}" Action="READ"><Watches/></Request>`, ""));
      id++;
      tcpClient.once('data', (data) => {
        const parser = new DOMParser();
        const data_str = data.toString("utf-8");
        const doc = parser.parseFromString(data_str.slice(data_str.indexOf('<')), 'text/xml');

        const fbsEls = doc.getElementsByTagName('FB');
         for (let i = 0; i < fbsEls.length; i++) {
           const fbEl = fbsEls[i];
           const fbName = fbEl.getAttribute('name');
           const nodeMap = Array.from(nodes.values()).find(v => v.get("title") === fbName);

           const portsEls = fbEl.getElementsByTagName('Port');
           for (let j = 0; j < portsEls.length; j++) {
             const portEl = portsEls[j];
             const portName = portEl.getAttribute('name');

             const data = portEl.getElementsByTagName('Data')[0];
             const value = data.getAttribute('value');

             ydoc.transact(() => {
               nodeMap?.get("watches")?.set(portName, value);
             });
           }
         }

        resolve();
      });
    });
  }

  if (!deploying)
    setTimeout(watchDINASORE, 1000, id);
}

function buildMessage(message, config) {
  const configBuffer = Buffer.from(config, 'utf-8');
  const messageBuffer = Buffer.from(message, 'utf-8');

  // Allocate 2-byte headers
  // Header 1: [0x50][len_hi][len_lo]
  const header1 = Buffer.alloc(3);
  header1[0] = 0x50;
  header1.writeUInt16BE(configBuffer.length, 1);

  // Header 2: [0x50][len_hi][len_lo]
  const header2 = Buffer.alloc(3);
  header2[0] = 0x50;
  header2.writeUInt16BE(messageBuffer.length, 1);

  return Buffer.concat([
    header1,
    configBuffer,
    header2,
    messageBuffer
  ]);
}

const FBS_DIR = './sync/fbs'
function exportFBs() {
  fs.rmSync(FBS_DIR, { recursive: true, force: true })
  fs.mkdirSync(FBS_DIR, { recursive: true })
  fbs.forEach((fb, id) => {
    fs.writeFileSync(path.join(FBS_DIR, `${fb.get("name").toString()}.fbt`), fb.get("xml").toString())
    fs.writeFileSync(path.join(FBS_DIR, `${fb.get("name").toString()}.py`), fb.get("py").toString())
  })
}

async function syncFBs() {
  var config = {
    "master-fbs-path": "sync/fbs",
    "dinasores": []
  };

  resources.forEach((resource, id) => {
    config.dinasores.push({
          "address": resource.get("Address"),
          "port": resource.get("SSH port"),
          "username": resource.get("SSH user"),
          "password": resource.get("SSH password"),
          "dinasore-path": resource.get("SSH path to DINASORE")
      })
  })

  fs.rmSync('./sync/config.json', { force: true });
  fs.writeFileSync('./sync/config.json', JSON.stringify(config, null, 2));

  function promise_sync() {
    return new Promise((resolve, reject) => {
      ydoc.transact(() => {
        communication.insert(0, PYTHON_PATH + " ./sync/synchronize.py\n");
      });

      const child = spawn(PYTHON_PATH, ['./sync/synchronize.py']);

      child.stdout.on('data', (data) => {
        ydoc.transact(() => {
          communication.insert(communication.length, data.toString());
        });
      });

      child.stderr.on('data', (data) => {
        ydoc.transact(() => {
          communication.insert(communication.length, data.toString());
        });
      });

      child.on('close', (code) => {
        if (code !== 0) {
          ydoc.transact(() => {
            communication.insert(communication.length, `\nSync failed.\nMake sure the server machine has SSH access to each DINASORE.`);
          });
        }

        resolve();
      });

      child.on('error', (err) => {
        ydoc.transact(() => {
          communication.insert(communication.length, err.toString());
        });
        reject(err);
      });
    });
  }

  return await promise_sync();
}
