# Dinasore

```bash
cd dinasore_docker
export FB_PORT=61499; export OPCUA_PORT=4840; export SSH_PORT=22
docker compose up -d

# Build and start all services
docker compose -f docker/docker-compose.yml up -d --build

# View running containers
docker ps -a

# View logs of a container
docker logs <container_name>

# Open a terminal within a container
docker exec -it <container_name> bash
```

```bash
# Stop and remove containers
docker compose -f docker/docker-compose.yml down

# Stop and remove containers and volumes.
# Running this will make you loose all the persistent data previously stored!
docker compose -f docker/docker-compose.yml down -v --remove-orphans
```
