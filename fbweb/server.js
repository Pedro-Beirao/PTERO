const express = require("express");
const path = require("path");
const fs = require("fs");
const net = require('net');
const Y = require('yjs')
const { WebsocketProvider } = require('y-websocket')

const doc = new Y.Doc()
const provider = new WebsocketProvider('ws://localhost:1234', 'room', doc)
const communication = doc.getText("communication")

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => res.render('index'));

app.get("/nodes", (req, res) => {
  try {
    const fbs_path = path.join(__dirname, "function_blocks");
    const files = fs.readdirSync(fbs_path);

    const allFiles = files
      .filter(file => file.endsWith(".fbt"))
      .map(file => {
        const name = file.split(".")[0];
        const xml_path = path.join(fbs_path, (name + ".fbt"));
        const py_path = path.join(fbs_path, (name + ".py"));
        const data = {
          name: file.split(".")[0],
          xml: fs.readFileSync(xml_path, "utf-8"),
          py: fs.readFileSync(py_path, "utf-8"),
        };
        return data;
      })
      .flat(); // Combines all results into one array

    res.json(allFiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load nodes" });
  }
});

// Middleware to parse JSON and XML
app.use(express.json());

app.post('/deploy', async (req, res) => {
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

    communication.delete(0, communication.length);

    // Process all messages using the same connection
    for (const r of req.body) {
      const message = buildMessage(r.message, r.config);
      const response = await new Promise((resolve, reject) => {
        tcpClient.write(message);
        communication.insert(communication.length, message.toString("utf-8") + "\n");

        tcpClient.once('data', (data) => {
          communication.insert(communication.length, data.toString("utf-8") + "\n");
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
});

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
