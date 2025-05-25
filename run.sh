# 0. clean container within same group
echo "=== [Harbor Tracking App] Run ==="
echo "[Harbor Tracking App]  Remove Containers ..."
docker compose -p app down --volumes --remove-orphans

# 1. environment setup  
export COMPOSE_BAKE=true
export DISPLAY=localhost:0.0

# 2. export DISPLAY=:0
xhost +local:docker
cd docker

## 3. startup the container
echo "[Harbor Tracking App] Launching container ..."
docker compose -p app up dev -d
# docker compose -p app up demo -d