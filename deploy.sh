#!/bin/bash
# ==============================================================================
# Bingo Multiplayer (Produção) — Fast Deployment Script via GHCR
# Puxa a imagem mais recente do GitHub Container Registry (GHCR) e reinicia
# o contêiner do Bingo sem necessidade de build local no servidor.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yaml"
PROJECT_NAME="bingo-game"

echo "🚀 Iniciando deploy do Bingo Multiplayer via GHCR..."

# 1. Puxar imagem mais recente do GHCR
echo "📥 Baixando imagem pré-construída do GHCR..."
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" pull

# 2. Subir / recriar serviço
echo "🚀 Reiniciando serviço bingo-game..."
docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" up -d --force-recreate

echo "✅ Deploy do Bingo Multiplayer concluído com sucesso!"
docker ps --filter "name=bingo-game"
