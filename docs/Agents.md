# 🤖 Guia do Desenvolvedor & Agentes de IA — Bingo Royale 75

Este documento é o manual de referência técnica para engenheiros de software e **agentes autônomos de IA** que operam ou realizam manutenção e evolução na base de código do **Bingo Royale 75**.

---

## 1. Visão Geral & Filosofia Arquitetural

O **Bingo Royale 75** é um sistema de bingo multiplayer em tempo real de 75 bolas, desenhado para rodar em celulares, desktops e TVs com Modo Telão simultaneamente.

### 🏛️ Princípios Arquiteturais Inegociáveis:
1. **Servidor Totalmente Autoritativo (Authoritative Server):**
   - O cliente (React) **nunca** decide se uma cartela venceu, se um número foi sorteado ou quem ganhou um prêmio.
   - Todas as regras de negócio, sorteios aleatórios do globo, hashes criptográficos HMAC das cartelas, validação temporal de batida, disputa de 10s e showdown de pedras ocorrem no backend (`RoomService` e `BingoEngine`).
2. **Monolito de Container Único (Single-Container SPA):**
   - A imagem Docker em produção (`Dockerfile`) compila o frontend via `node:22-alpine` e embute os assets estáticos gerados diretamente dentro do contêiner Python FastAPI (`python:3.14-slim`).
   - O FastAPI atua como servidor ASGI das APIs REST, do WebSocket `/ws/{room_code}` e serve os arquivos estáticos da SPA no fallback de rotas.
3. **Ambiente Único de Produção (`main`):**
   - Este projeto opera **exclusivamente** na branch `main`. Não existem branches de homologação (`staging`, `develop`).
   - Todo commit enviado à `main` dispara o pipeline de CI/CD que constrói a imagem multi-arquitetura e publica imediatamente em produção (`https://bingo.bolsadedados.com.br`).

---

## 2. Restrições Tecnológicas Rígidas

> [!WARNING]
> **ATENÇÃO AGENTES DE IA: RESPEITEM RIGOROSAMENTE ESTAS RESTRIÇÕES!**

| Componente | Requisito Obrigatório | O que NÃO fazer |
| :--- | :--- | :--- |
| **Python** | **Python 3.14** gerenciado exclusivamente via **`uv`** | **Nunca** use Python 3.11/3.12/3.13 ou execute `pip install` solto. Sempre use `uv run` ou `uv sync`. |
| **Node.js** | **Node.js 22** + React 19 + TypeScript + Vite 8 | Não faça downgrade do React 19 nem utilize dependências legadas incompatíveis com React 19. |
| **Arquitetura** | **Multi-Arch: `linux/amd64` e `linux/arm64`** | Não adicione dependências nativas em C/C++ que não compilem nativamente em ARM64 (servidor Oracle Ampere A1). |
| **Estilização** | **Tailwind CSS v3/v4** + Lucide React | Evite bibliotecas de componentes externas pesadas (MUI, AntD). Mantenha o design system leve e performático. |

---

## 3. Comandos de Desenvolvimento e Validação

Antes de realizar qualquer commit, **qualquer agente deve executar obrigatoriamente** as seguintes suites de verificação:

### 3.1 Backend (Testes Automatizados com Pytest)
```bash
cd backend
uv sync --dev
uv run pytest -v
```
- **Expectativa:** 100% dos testes devem passar (`test_bingo_engine.py`, `test_room_lifecycle.py`, `test_prizes.py`, `test_tiebreaker.py`, `test_manager_lifecycle.py`, `test_game_log.py`, `test_e2e_simulation.py`).

### 3.2 Frontend (Tipagem TypeScript e Build de Produção)
```bash
cd frontend
npm ci
npm run build
```
- **Expectativa:** A compilação TypeScript com Vite deve terminar sem erros de lint ou tipos.

### 3.3 Execução Local para Desenvolvimento
- **Backend (Porta 8000):**
  ```bash
  cd backend
  uv run uvicorn backend.main:app --reload --port 8000
  ```
- **Frontend (Porta 5173 com proxy para o backend):**
  ```bash
  cd frontend
  npm run dev
  ```

---

## 4. Regras de Negócio Críticas que Devem ser Preservadas

Se você estiver modificando código do backend ou frontend, certifique-se de **não quebrar** as seguintes invariantes:

1. **Regra do Tempo Crítico (Timing Rule):**
   - O jogador só tem o bingo validado se clicar **antes** do próximo número ser sorteado. O backend verifica se o `last_drawn_ball` faz parte da linha premiada.
2. **Prevenção de Duplicidade de Prêmios:**
   - Uma cartela não pode ganhar duas vezes com o mesmo padrão (`claimed_patterns`).
3. **Janela de Contestação (10 Segundos):**
   - Quando o primeiro jogador bate bingo válido, inicia-se uma contagem regressiva de 10s (`bingo_countdown_started`).
   - Outros jogadores que baterem na mesma pedra entram como candidatos (`bingo_candidate_joined`).
4. **Desempate da Pedra Maior (Showdown Tiebreaker):**
   - Havendo empate ao final dos 10s, cada candidato escolhe uma pedra misteriosa (1 a 75 sem repetição).
   - O jogador com a maior pedra leva o prêmio. Timeout de 15s com escolha automática de contingência.
5. **Manager não é Jogador:**
   - O Host da sala é o Manager organizador. Ele não tem cartelas, não concorre a prêmios e não conta em `player_count`.
6. **Sucessão por Inatividade (2 Minutos):**
   - Se o manager ficar inativo ou desconectado por mais de 120 segundos (`threshold_seconds`), qualquer jogador pode assumir a sala via `claim_manager`.
7. **Trilha de Auditoria (`game_log`):**
   - Todas as pedras, batidas, desempates e trocas de gerência devem ser apensadas sequencialmente em `room.game_log`.

---

## 5. Convenções de Código e Estrutura de Pastas

```
bingo-game/
├── backend/
│   ├── src/backend/
│   │   ├── main.py                     # Entrypoint FastAPI, CORS, rotas e SPA mounting
│   │   ├── config.py                   # Configurações Pydantic Settings
│   │   ├── models/
│   │   │   ├── room.py                 # Schemas Pydantic de Room, Player, Prize, Contest
│   │   │   ├── card.py                 # Modelo da Cartela e Células
│   │   │   └── ws_messages.py          # Envelope genérico WebSocket
│   │   ├── routers/
│   │   │   ├── rooms.py                # Endpoints REST (/api/rooms)
│   │   │   └── websockets.py           # Handler WebSocket (/ws/{room_code})
│   │   └── services/
│   │       ├── bingo_engine.py         # Motor de cartelas, padrões e regras de vitória
│   │       ├── room_service.py         # Estado global das salas, timers e desempates
│   │       ├── connection_manager.py   # Gerenciamento de WebSockets e broadcast
│   │       └── redis_service.py        # Adaptador Redis
│   └── tests/                          # Testes unitários e de integração
├── frontend/
│   ├── src/
│   │   ├── App.tsx                     # Roteador de telas (Lobby, Telão TV, Jogador)
│   │   ├── components/
│   │   │   ├── host/                   # Telão do Host (MasterBoard, DrawingGlobe, Prizes)
│   │   │   ├── player/                 # Visão do Jogador (BingoCard, Botão Bingo)
│   │   │   ├── lobby/                  # Radar de Salas, Criar Sala, Entrar
│   │   │   └── common/                 # Modais (Tiebreaker, UsersList, GameLog, Help)
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts         # Hook de comunicação em tempo real
│   │   │   ├── useAudio.ts             # Efeitos sonoros táteis procedurais (Web Audio API)
│   │   │   └── useSpeech.ts            # Locução TTS falada em português (Web Speech API)
│   │   └── types/bingo.ts              # Definições de tipos TypeScript sincronizadas com o backend
├── docs/                               # Documentação técnica em Markdown
├── .github/workflows/ci-cd.yml         # Pipeline CI/CD GitHub Actions multi-arch
├── Dockerfile                          # Multi-stage build Node 22 + Python 3.14
├── docker-compose.yaml                 # Stack de orquestração para Traefik e Portainer
└── deploy.sh                           # Script de deploy manual via GHCR
```

---

## 6. Fluxo de Trabalho Git para Agentes

Ao concluir alterações solicitadas pelo usuário:

1. **Verificação de Saúde:**
   - Execute os testes no backend e o build no frontend.
2. **Mensagens de Commit Claras:**
   - Siga a especificação do *Conventional Commits*:
     - `feat:` para novas funcionalidades.
     - `fix:` para correções de bugs.
     - `docs:` para documentação.
     - `refactor:` para refatorações sem alteração de comportamento.
3. **Push Direto na Branch `main`:**
   ```bash
   git add .
   git commit -m "feat: sua mensagem descritiva"
   git push origin main
   ```
4. **Monitoramento:**
   - Verifique a execução do workflow no GitHub Actions para garantir que a imagem Docker foi compilada para AMD64/ARM64 e o webhook do Portainer foi disparado com sucesso.
