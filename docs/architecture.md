# 🏗️ Arquitetura do Sistema — Bingo Royale 75

Este documento descreve a arquitetura de software, componentes estruturais, fluxo de dados e decisões de engenharia do **Bingo Royale 75**.

---

## 1. Visão Geral da Arquitetura

O sistema adota uma arquitetura **monolítica moderna e desacoplada em container único**, unindo um backend reativo assíncrono em Python 3.14 (FastAPI + WebSockets) com um frontend SPA (Single Page Application) em React 19 + TypeScript + Tailwind CSS.

### Diagrama de Blocos

```
                        ┌──────────────────────────────────────────────┐
                        │              Navegadores & TVs               │
                        │  (Smartphones, Desktops, TV Telão Projetor)  │
                        └───────────────▲──────────────▲───────────────┘
                                        │ HTTPS        │ WSS (WebSockets)
                                        │              │
                        ┌───────────────▼──────────────▼───────────────┐
                        │             Traefik v3 (Edge Proxy)          │
                        │       (TLS Let's Encrypt / Rate Limiting)    │
                        └───────────────────────┬──────────────────────┘
                                                │ Port 8000
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                              Container Docker: bingo-game                                    │
│                                                                                              │
│   ┌──────────────────────────────────┐        ┌──────────────────────────────────────────┐   │
│   │   SPA Estático (React 19 Vite)   │        │     FastAPI ASGI Server (Python 3.14)    │   │
│   │                                  │        │                                          │   │
│   │  • Telão TV (HostScreen)         │◄───────┤  • REST API Routers (/api/rooms, /users) │   │
│   │  • Visão Jogador (PlayerView)    │ Static │  • WebSocket Hub (/ws/{code})            │   │
│   │  • Radar de Salas (RoomRadar)    │ Assets │  • ConnectionManager (Pub/Sub Broadcast) │   │
│   │  • Modais (Showdown, Log, Ajuda) │  Mount │  • RoomService (State Engine)            │   │
│   └──────────────────────────────────┘        │  • BingoEngine (HMAC / Verificação)      │   │
│                                               └────────────────────┬─────────────────────┘   │
└────────────────────────────────────────────────────────────────────┼─────────────────────────┘
                                                                     │ (Opcional)
                                                                     ▼
                                                        ┌─────────────────────────┐
                                                        │     Redis 7 (Pub/Sub)   │
                                                        │   (Multi-instância sync)│
                                                        └─────────────────────────┘
```

---

## 2. Frontend (React 19 + TypeScript + Tailwind CSS)

O frontend foi concebido sob o conceito de **três modos de exibição principais** adaptados dinamicamente ao perfil do dispositivo do usuário:

### 2.1 Modos de Exibição

1. **Lobby & Radar de Salas (`RoomRadar`):**
   - Descoberta instantânea de partidas públicas com contagem de jogadores em tempo real.
   - Acesso por PIN para salas privadas.
   - Criação de salas (`CreateRoomModal`) com configuração visual de prêmios dinâmicos, ritmo do sorteio e janela de contestação.
   - Atalho direto para a Central de Ajuda e Regras.

2. **Visão Mobile-First do Jogador (`PlayerView`):**
   - Foco tátil e ergonômico para telas de smartphones na vertical.
   - Alternância fluida entre até 4 cartelas simultâneas por jogador (abas `C1`, `C2`, `C3`, `C4`).
   - Carimbo de números com feedback sonoro procedural (estalo de bolha) e vibração háptica (`navigator.vibrate`).
   - **Modo Assistente (Ícone do Olho):** Efeito visual pulsante nos números da cartela que já foram cantados pelo globo.
   - Botão **BINGO!** pulsante com ativação automática quando uma linha ou cartela cheia é fechada.
   - Banner de alerta de inatividade do Manager com atalho de emergência para assumir a gerência.

3. **Modo Telão para TV e Projetor (`HostScreen`):**
   - Layout horizontal otimizado para transmissões em 1080p / 4K.
   - **Globo 3D Animado (`DrawingGlobe`):** Simulação de rotação com extração de esfera iluminada e letra correspondente.
   - **Tabela Mestra dos 75 Números (`MasterBoard`):** Painel LED acendendo as pedras sorteadas divididas nas colunas B-I-N-G-O.
   - **Vitrine de Prêmios Dinâmica (`PrizesShowcase`):** Exibição dos prêmios da rodada com carimbo e nome do vencedor em tempo real.
   - **Controles por Teclado:** A Barra de Espaço (`[Espaço]`) opera o sorteio: inicia a partida, sorteia manualmente ou pausa/retoma o modo automático.
   - **Locução Vocal em Português (`useSpeech`):** Narração por sintetizador nativo do navegador via Web Speech API (`"B 12"`, `"I 24"`, `"Atenção: Bingo confirmado!"`).

### 2.2 Modais e Componentes Especializados

- **`TiebreakerModal` (Disputa da Pedra Mais Alta):**
  - Banner flutuante no topo durante a janela de contestação com barra de progresso e contagem regressiva de 10s.
  - Arena de Showdown para empates: exibe slots misteriosos onde cada jogador clica para puxar sua pedra exclusiva (1 a 75).
  - Animação de revelação e coroação do vencedor com a maior pedra.
- **`UsersListModal`:**
  - Exibição segmentada entre **👑 Manager da Mesa** (com cronômetro de atividade e botão de assumir gerência) e **🎯 Jogadores de Bingo** (com contagem de cartelas e status de conexão).
- **`GameLogModal`:**
  - Painel de auditoria com filtro por Vitórias, Pedras ou Todos os eventos.
  - Botão de cópia formatada para área de transferência para atas de premiação.
- **`HelpModal`:**
  - Guia em abas contendo Regulamento Oficial, Manual do Jogador e Manual do Manager.

### 2.3 Camada de Áudio e Fala

- **`useAudio`:** Sintetizador de áudio procedural construído com a **Web Audio API** do navegador. Não consome banda com arquivos MP3 externos e gera tons analógicos com precisão de milissegundos:
  - *Stamp:* Carimbo de marcação na cartela (filtro passa-alta + decaimento senoidal).
  - *Ball Drop:* Som de esfera caindo no tubo (ressonância harmônica).
  - *Victory:* Fanfarra pentatônica de triunfo.
  - *Error:* Sinalizador de bingo inválido ou bloqueio.
- **`useSpeech`:** Narrador automatizado do bingo utilizando a `SpeechSynthesisUtterance` com voz em português do Brasil (`pt-BR`).

---

## 3. Backend (FastAPI + Python 3.14 + WebSockets)

O backend opera como um **motor de estado em memória com capacidade de replicação pub/sub**.

### 3.1 Estrutura de Pacotes

```
backend/
├── pyproject.toml              # Dependências gerenciadas pelo Astral uv
├── tests/                      # Suite de testes com pytest (22 testes)
└── src/backend/
    ├── main.py                 # FastAPI app, CORS, rotas e static SPA mount
    ├── models/
    │   ├── card.py             # BingoCard, BingoCell, WinningPattern
    │   └── room.py             # Room, Player, Prize, GameLogEntry, BingoContest
    ├── routers/
    │   ├── rooms.py            # Endpoints REST (/api/rooms, /users, /claim-manager)
    │   └── websockets.py       # WebSocket hub (/ws/{room_code})
    └── services/
        ├── bingo_engine.py     # Geração de cartelas, HMAC e audit de vitória
        ├── connection_manager.py # Gerenciador de conexões WebSocket ativas
        └── room_service.py     # Máquina de estados das salas e regras de sorteio
```

### 3.2 Motor de Jogo (`RoomService`)

- **Máquina de Estados da Partida:**
  - `LOBBY` ➔ `PLAYING` ➔ `PAUSED` ➔ `FINISHED`.
- **Ciclo Assíncrono do Sorteio (`_draw_loop`):**
  - Executado via `asyncio.create_task` em loop contínuo no modo automático com intervalos customizáveis (3s a 10s).
  - Pausado automaticamente ao cantar um bingo ou por comando do host.
- **Janela de Contestação & Desempate:**
  - Quando um bingo válido é cantado, o sorteio é pausado e uma instância de `BingoContest` é aberta pelo tempo configurado (padrão 10s).
  - Outros jogadores completando na mesma bola entram como candidatos no contest.
  - Se houver mais de 1 candidato: inicia o desempate `_start_tiebreaker`, gerando pedras sem duplicidade (amostra de 1 a 75).
  - Ao expirar o prazo de escolha (15s) ou com a escolha de todos, resolve o vencedor (`_resolve_tiebreaker`) atribuindo o prêmio e registrando o histórico.
- **Gestão de Atividade do Manager:**
  - Rastreamento de `manager_last_active_at` a cada interação via socket ou heartbeat.
  - Verificação de inatividade de 2 minutos (120 segundos) para autorizar a transferência de gerência com `claim_manager`.

### 3.3 Motor Criptográfico & Anti-Fraude (`BingoEngine`)

- **Geração Segura de Cartelas:**
  - 5 colunas estritas: B (1..15), I (16..30), N (31..45 com centro zero), G (46..60), O (61..75).
- **Assinatura Digital HMAC-SHA256:**
  - Cada cartela gerada recebe um hash HMAC calculado com a chave secreta do servidor (`SECRET_KEY`) baseando-se nos 24 números e no ID da cartela.
  - É impossível para o cliente adulterar números na memória do navegador: a validação de bingo no servidor recalcula a conformidade do hash e confere as pedras sorteadas contra o histórico imutável `room.drawn_balls`.

---

## 4. Comunicação em Tempo Real (WebSockets)

O protocolo de comunicação utiliza mensagens JSON no padrão evento-payload:

```json
{
  "type": "nome_do_evento",
  "payload": { ... }
}
```

### 4.1 Multiplexação de Conexões (`ConnectionManager`)
- Mantém conexões agrupadas por código da sala (`code: set[WebSocket]`).
- Mapeia metadados de sockets (`websocket: (room_code, player_id)`).
- Desconexões são tratadas com evento `player_list_update` automático marcando `connected = false` no jogador correspondente.

---

## 5. Estratégia de Deploy em Container Único

Para simplificar a operação em produção e reduzir o consumo de memória, o container Docker combina:
1. **Stage 1 (Node.js 22):** Compila o frontend React com Vite em arquivos estáticos minificados (`dist/`).
2. **Stage 2 (Python 3.14-slim + uv):** Instala o runtime e dependências do backend.
3. **Mount Estático:** Os arquivos do frontend são copiados para `/app/static` e servidos pelo FastAPI via `StaticFiles(html=True)`, servindo a SPA na raiz `/` e a API em `/api/*`.

Isso elimina a necessidade de servidores Nginx auxiliares e permite que o sistema rode consumindo menos de 90 MB de RAM no servidor.
