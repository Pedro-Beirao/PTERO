# PTERO

Install dependencies
```bash
# Server dependencies
npm install

# Sync dependencies
pip install -r requirements.txt
```

In a terminal tab, run this command to start the database server, persisting the data to `./db`.
```bash
YPERSISTENCE=./db npx y-websocket --binary true
# running at 'localhost' on port 1234
```

In a separate tab, run this command to start the server and serve the frontend. Make sure that the `python3` environment in this session is the same as the one where your did `pip install -r requirements.txt` before.
```bash
node server.js
# Server running at http://localhost:3000
```

Now the server should be is running and syncing with the database.

---

### Expose
If you want to expose the app instead of just running in localhost, you need to first use a reverse_proxy to have both `localhost:3000` and `localhost:1234` in the same domain, then use a tunnel.
```bash
# Install and run Caddy (configured in ./Caddyfile)
apt install caddy # https://caddyserver.com/docs/install
caddy run

# Create a tunnel to expose Caddy's port with serveo.net
apt install autossh
autossh -M 0 -R 80:localhost:3001 serveo.net
```
