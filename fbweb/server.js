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

// Middleware to parse raw XML
app.use(express.raw({ type: 'application/xml' }));

// Endpoint to receive XML from frontend
app.post('/send-command', (req, res) => {
    const xmlMessage = req.body.toString();
    console.log('Received XML:', xmlMessage);

    // Send the XML to DINASORE via TCP
    const tcpClient = new net.Socket();
    const DINASORE_HOST = 'localhost';
    const DINASORE_PORT = 61499;

    tcpClient.connect(DINASORE_PORT, DINASORE_HOST, () => {
        tcpClient.write(xmlMessage);
        console.log('Sent to DINASORE:', xmlMessage);
    });

    tcpClient.on('data', (data) => {
        console.log('Response from DINASORE:', data.toString());
        res.send(data.toString());
        tcpClient.destroy();
    });

    tcpClient.on('error', (err) => {
        console.error('TCP error:', err);
        res.status(500).send('Error sending to DINASORE');
    });
});
