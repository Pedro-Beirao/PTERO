# PTERO

Install dependencies
```bash
npm install
pip install -r requirements.txt
```

In a terminal tab, run this command to start the database server, persisting the data to `./db`.
```bash
YPERSISTENCE=./db npx y-websocket
```

In a separate tab, run this command to start the server and serve the frontend. Make sure that the `python3` environment in this session is the same as the one where your did `pip install -r requirements.txt` before.
```bash
node server.js
```
