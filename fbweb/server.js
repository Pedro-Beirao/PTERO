const express = require("express");
const path = require("path");
const fs = require("fs");
const net = require('net');

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

    const allNodes = files
      .filter(file => file.endsWith(".fbt"))
      .map(file => {
        const filePath = path.join(fbs_path, file);
        const data = fs.readFileSync(filePath, "utf-8");
        return data;
      })
      .flat(); // Combines all results into one array

    res.json(allNodes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load nodes" });
  }
});

// Middleware to parse JSON and XML
app.use(express.json());

app.post('/deploy', async (req, res) => {
  try {
    for (const r of req.body) {
      const message = buildMessage(r.message, r.config)
      const response = await sendToDinasore(message);
    }
    console.log('All messages processed');
    res.send('All messages processed');
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Error processing messages');
  }
});

function sendToDinasore(message) {
  return new Promise((resolve, reject) => {
    const tcpClient = new net.Socket();
    const DINASORE_HOST = 'localhost';
    const DINASORE_PORT = 61499;

    tcpClient.setTimeout(5000, () => {
      console.error('Connection timeout for message:', message);
      tcpClient.destroy();
      reject(new Error('Connection timeout'));
    });

    tcpClient.connect(DINASORE_PORT, DINASORE_HOST, () => {
      tcpClient.write(message);
      console.log('Sent to DINASORE:', message.toString("utf-8"));
    });

    tcpClient.on('data', (data) => {
      console.log('Raw data received:', data.toString("utf-8"));
      tcpClient.destroy();
      resolve(data.toString("utf-8"));
    });

    tcpClient.on('close', () => {
      // console.log('Connection closed for message:', message);
    });

    tcpClient.on('error', (err) => {
      console.error('TCP error for message:', message, err);
      tcpClient.destroy();
      reject(err);
    });
  });
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
