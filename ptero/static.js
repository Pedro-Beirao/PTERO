const ejs = require('ejs');
const fs = require('fs');
const path = require('path');

const viewsDir = './views';
const publicDir = './public';
const outDir = './dist';

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.readdirSync(viewsDir).forEach(file => {
  if (file.endsWith('.ejs')) {
    const filePath = path.join(viewsDir, file);
    const template = fs.readFileSync(filePath, 'utf-8');
    const html = ejs.render(template, { mode: "test" }, {filename: filePath});
    const outFile = file.replace('.ejs', '.html');
    fs.writeFileSync(path.join(outDir, outFile), html);
  }
});

fs.cpSync(publicDir, path.join(outDir), { recursive: true });

console.log('Build complete!');
