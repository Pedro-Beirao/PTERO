const express = require("express");
const path = require("path");
const fs = require("fs");

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
