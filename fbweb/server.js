const express = require("express");
const path = require("path");
const fs = require("fs");
const net = require('net');
const Y = require('yjs')
const { WebsocketProvider } = require('y-websocket')
const { spawn } = require('child_process')

const ydoc = new Y.Doc()
const provider = new WebsocketProvider('ws://localhost:1234', 'room', ydoc, { connect: true, resyncInterval: 5000 })
const communication = ydoc.getText("communication")
const fbs = ydoc.getMap("fbs")
const resources = ydoc.getMap("resources")

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => res.render('index'));

// Middleware to parse JSON and XML
app.use(express.json());

var deploying = false;
app.post('/deploy', async (req, res) => {
  if (deploying) return;

  deploying = true;
  ydoc.transact(() => {
    communication.delete(0, communication.length);
  });
  exportFBs();
  await syncFBs();

  sendToDINASORE(req, res);
  deploying = false;
});

async function sendToDINASORE(req, res) {
  const tcpClient = new net.Socket();
  const DINASORE_HOST = 'localhost';
  const DINASORE_PORT = 61499;

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
        resolve();
      });

      tcpClient.on('error', (err) => {
        console.error('TCP connection error:', err);
        tcpClient.destroy();
        reject(err);
      });
    });

    // Process all messages using the same connection
    for (const r of req.body) {
      const message = buildMessage(r.message, r.config);
      const response = await new Promise((resolve, reject) => {
        tcpClient.write(message);
        console.log(message.toString("utf-8"))
        ydoc.transact(() => {
          communication.insert(communication.length, message.toString("utf-8") + "\n");
        });

        tcpClient.once('data', (data) => {
          console.log(data.toString("utf-8"))
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
  } finally {
    tcpClient.destroy();
  }
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
    "dinasores": [],
    "strategy": "wipe"
  };

  resources.forEach((resouce, id) => {
    const [address, port] = resouce.get("ip").split(':');
    config.dinasores.push({
          "address": address,
          "port": 22,
          "username": "root",
          "password": "dinasore",
          "dinasore-path": "/sinf/dinasore"
      })
  })

  fs.rmSync('./sync/config.json', { force: true });
  fs.writeFileSync('./sync/config.json', JSON.stringify(config, null, 2));

  function promise_sync() {
    return new Promise((resolve, reject) => {
      ydoc.transact(() => {
        communication.insert(0, "python3 ./sync/synchronize.py\n");
      });

      const child = spawn('python3.12', ['./sync/synchronize.py']);

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

  await promise_sync();
}
