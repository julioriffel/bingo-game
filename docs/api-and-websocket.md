# 🔌 API REST & Protocolo WebSocket — Bingo Royale 75

Este documento é a referência completa da interface de comunicação do **Bingo Royale 75**, detalhando todos os endpoints HTTP REST e o protocolo de eventos bidirecionais via WebSocket.

---

## 1. Endpoints da API REST

Base URL: `https://bingo.bolsadedados.com.br/api` (ou `http://localhost:8000/api` em ambiente local).

### 1.1 Listar Salas Públicas
Retorna todas as salas abertas e ativas aguardando jogadores ou em andamento.

- **Método:** `GET`
- **Rota:** `/api/rooms`
- **Resposta (200 OK):**
```json
{
  "rooms": [
    {
      "code": "AB12CD",
      "name": "Bingo da Família",
      "host_name": "Julio",
      "status": "lobby",
      "win_condition": "multi_stage",
      "player_count": 8,
      "max_cards": 4,
      "prizes_count": 3,
      "prizes": [
        {
          "id": "prz_abc123",
          "title": "Air Fryer",
          "description": "Fritadeira Elétrica 4L",
          "order": 1,
          "winner_id": null,
          "winner_name": null,
          "won_at": null
        }
      ]
    }
  ]
}
```

---

### 1.2 Criar Nova Sala
Cria uma sala de bingo com parâmetros customizados de rodada, prêmios e tempo de contestação.

- **Método:** `POST`
- **Rota:** `/api/rooms`
- **Payload:**
```json
{
  "host_name": "Julio (Host)",
  "name": "Super Bingo de Domingo",
  "win_condition": "multi_stage",
  "max_cards_per_player": 4,
  "is_public": true,
  "draw_interval": 5.0,
  "draw_mode": "auto",
  "contest_window_seconds": 10.0,
  "prizes": [
    { "title": "1º Prêmio: Cafeteira", "description": "Modo Linha" },
    { "title": "2º Prêmio: Smart TV 50\"", "description": "Modo Cartela Cheia" }
  ]
}
```
- **Resposta (200 OK):**
```json
{
  "room_code": "ROYAL1",
  "pin": "4821",
  "host_id": "host_7b3a19e2",
  "token": "49bfd3b1238947bba09115fa01"
}
```

---

### 1.3 Entrar na Sala (Join Player)
Registra o jogador na sala e gera suas cartelas com assinatura criptográfica HMAC.

- **Método:** `POST`
- **Rota:** `/api/rooms/{room_code}/join`
- **Payload:**
```json
{
  "player_name": "Marina",
  "card_count": 2,
  "pin": "4821",
  "token": null
}
```
- **Resposta (200 OK):**
```json
{
  "room_code": "ROYAL1",
  "player_id": "p_8f102a9c",
  "player_name": "Marina",
  "token": "e8913b4c102a99d45",
  "is_host": false,
  "room_state": "lobby",
  "cards": [
    {
      "id": "p_8f102a9c_c1",
      "grid": [
        [
          { "number": 12, "letter": "B", "row": 0, "col": 0, "is_free": false, "marked": false },
          { "number": 19, "letter": "I", "row": 0, "col": 1, "is_free": false, "marked": false },
          { "number": 33, "letter": "N", "row": 0, "col": 2, "is_free": false, "marked": false },
          { "number": 48, "letter": "G", "row": 0, "col": 3, "is_free": false, "marked": false },
          { "number": 72, "letter": "O", "row": 0, "col": 4, "is_free": false, "marked": false }
        ]
      ],
      "hash": "a1b2c3d4e5f6...hmac-sha256...",
      "claimed_patterns": [],
      "winning_patterns": []
    }
  ],
  "prizes": [...]
}
```

---

### 1.4 Obter Estado Completo da Sala
- **Método:** `GET`
- **Rota:** `/api/rooms/{room_code}`
- **Resposta (200 OK):** Retorna status da rodada, pedras sorteadas, lista de ganhadores, prêmios, auditoria do log e status do manager.

---

### 1.5 Listar Usuários Conectados & Status do Manager
Retorna a listagem separando o Manager e os Jogadores participantes.

- **Método:** `GET`
- **Rota:** `/api/rooms/{room_code}/users`
- **Resposta (200 OK):**
```json
{
  "room_code": "ROYAL1",
  "host_id": "host_7b3a19e2",
  "host_name": "Julio (Host)",
  "manager_last_active_at": 1776092000.5,
  "manager_inactive": false,
  "player_count": 12,
  "users": [
    {
      "id": "host_7b3a19e2",
      "name": "Julio (Host)",
      "is_host": true,
      "role": "manager",
      "connected": true,
      "card_count": 0,
      "last_active_at": 1776092000.5
    },
    {
      "id": "p_8f102a9c",
      "name": "Marina",
      "is_host": false,
      "role": "player",
      "connected": true,
      "card_count": 2,
      "last_active_at": 1776091995.1
    }
  ]
}
```

---

### 1.6 Assumir Gerência da Sala (Claim Manager)
Permite que um jogador conectado assuma a coordenação caso o manager atual esteja inativo por 2 minutos (120s).

- **Método:** `POST`
- **Rota:** `/api/rooms/{room_code}/claim-manager`
- **Payload:**
```json
{
  "player_id": "p_8f102a9c"
}
```
- **Resposta (200 OK):**
```json
{
  "success": true,
  "host_id": "p_8f102a9c",
  "host_name": "Marina",
  "token": "e8913b4c102a99d45",
  "player_count": 11
}
```
- **Erro (400 Bad Request):** Caso o manager ainda esteja ativo (`threshold_seconds` não atingido).

---

### 1.7 Obter Log de Auditoria do Jogo
Retorna o histórico cronológico de cada pedra sorteada, bingos validados e desempates.

- **Método:** `GET`
- **Rota:** `/api/rooms/{room_code}/log`
- **Resposta (200 OK):**
```json
{
  "room_code": "ROYAL1",
  "total_drawn": 24,
  "total_winners": 1,
  "game_log": [
    {
      "id": "log_a109bf",
      "event_type": "ball_drawn",
      "order": 1,
      "timestamp": 1776091500.0,
      "ball": 15,
      "letter": "B"
    },
    {
      "id": "log_b220cc",
      "event_type": "bingo_awarded",
      "order": 24,
      "timestamp": 1776091620.4,
      "ball": 42,
      "player_id": "p_8f102a9c",
      "player_name": "Marina",
      "card_id": "p_8f102a9c_c1",
      "win_type": "Linha",
      "pattern_name": "Linha 3",
      "winning_numbers": [12, 28, "FREE", 53, 67],
      "prize_title": "Cafeteira Elétrica",
      "on_ball": 42,
      "details": null
    }
  ]
}
```

---

### 1.8 Gerenciamento Dinâmico de Prêmios
- **Adicionar Prêmio:** `POST /api/rooms/{room_code}/prizes`
  - Payload: `{ "host_id": "...", "title": "Air Fryer", "description": "Modo Linha" }`
- **Remover Prêmio:** `DELETE /api/rooms/{room_code}/prizes/{prize_id}?host_id=...`

---

## 2. Protocolo WebSocket Bidirecional

Conexão: `wss://bingo.bolsadedados.com.br/ws/{room_code}` (ou `ws://localhost:8000/ws/{room_code}`).

Formato padrão da mensagem:
```json
{
  "type": "nome_do_evento",
  "payload": {},
  "timestamp": 1776092000.0
}
```

### 2.1 Mensagens do Cliente para o Servidor (Client -> Server)

| Tipo de Mensagem | Payload Obrigatório | Descrição |
| :--- | :--- | :--- |
| `ping` | `{}` | Keepalive para manter a conexão WebSocket ativa. |
| `manager_heartbeat` | `{ "host_id": "..." }` | Pulso de presença enviado periodicamente pelo Manager para atualizar `manager_last_active_at`. |
| `join` | `{ "player_id": "...", "token": "..." }` | Handshake inicial associando o socket ao jogador cadastrado. Responde com `room_state`. |
| `start_game` | `{ "host_id": "..." }` | Comando exclusivo do Host para iniciar a partida. |
| `draw_next` | `{ "host_id": "..." }` | Sorteia a próxima pedra (no modo de sorteio manual). |
| `toggle_pause` | `{ "host_id": "..." }` | Pausa ou retoma o sorteio automático. |
| `set_speed` | `{ "host_id": "...", "interval": 4.0 }` | Ajusta o intervalo de sorteio automático (entre 2.0s e 20.0s). |
| `mark_number` | `{ "player_id": "...", "card_id": "...", "number": 42 }` | Alterna a marcação visual de um número na cartela do jogador. |
| `call_bingo` | `{ "player_id": "...", "card_id": "..." }` | Jogador canta BINGO para validação estrita no servidor. |
| `pick_tiebreaker_stone` | `{ "player_id": "...", "stone_index": 2 }` | Jogador seleciona sua pedra no minigame de desempate. |
| `add_prize` | `{ "host_id": "...", "title": "...", "description": "..." }` | Cadastra novo prêmio dinamicamente durante a partida. |
| `remove_prize` | `{ "host_id": "...", "prize_id": "..." }` | Remove um prêmio não contemplado. |
| `claim_manager` | `{ "player_id": "..." }` | Solicita transferência de gerência por inatividade. |

---

### 2.2 Eventos do Servidor para o Cliente (Server -> Client)

#### `room_state`
Enviado individualmente ao cliente após o handshake `join` com o estado completo da sala, histórico de pedras e prêmios.

#### `ball_drawn`
Transmitido para todos os clientes a cada nova pedra retirada do globo:
```json
{
  "type": "ball_drawn",
  "payload": {
    "ball": 42,
    "letter": "N",
    "drawn_count": 18,
    "history": [7, 19, 54, 42],
    "log_entry": {
      "id": "log_x81a",
      "event_type": "ball_drawn",
      "order": 18,
      "ball": 42,
      "letter": "N"
    }
  }
}
```

#### `bingo_countdown_started`
Disparado quando um jogador bate um bingo válido e inicia a contagem de 10 segundos para outros competidores na mesma pedra:
```json
{
  "type": "bingo_countdown_started",
  "payload": {
    "contest_id": "cnt_9182ab",
    "ball": 42,
    "duration_seconds": 10.0,
    "ends_at": 1776092010.5,
    "first_candidate": { "player_id": "p_1", "player_name": "Julio", "card_id": "p_1_c1" },
    "candidates": [...],
    "target_prize": { "title": "Fritadeira Elétrica" },
    "message": "🎉 BINGO cantado por Julio na pedra 42! Janela de 10s iniciada!"
  }
}
```

#### `bingo_candidate_joined`
Transmitido se outro jogador cantar bingo válido dentro da mesma janela de 10 segundos:
```json
{
  "type": "bingo_candidate_joined",
  "payload": {
    "contest_id": "cnt_9182ab",
    "ball": 42,
    "new_candidate": { "player_id": "p_2", "player_name": "Marina" },
    "total_candidates": 2,
    "message": "⚡ Marina também cantou BINGO na pedra 42! Total em disputa: 2."
  }
}
```

#### `bingo_tiebreaker_started`
Transmitido ao fim dos 10 segundos se houver 2 ou mais candidatos; abre o modal de desempate com as pedras misteriosas:
```json
{
  "type": "bingo_tiebreaker_started",
  "payload": {
    "contest_id": "cnt_9182ab",
    "ball": 42,
    "prize_title": "Fritadeira Elétrica",
    "candidates": [...],
    "timeout_seconds": 15.0,
    "stone_options_count": 6,
    "message": "⚔️ EMPATE! 2 jogadores cantaram Bingo! Escolha sua pedra da sorte!"
  }
}
```

#### `tiebreaker_stone_revealed`
Notifica quando um jogador escolheu sua pedra ou foi escolhida pelo tempo limite (`auto_picked`):
```json
{
  "type": "tiebreaker_stone_revealed",
  "payload": {
    "contest_id": "cnt_9182ab",
    "player_id": "p_1",
    "player_name": "Julio",
    "chosen_stone": 67,
    "all_picked": true
  }
}
```

#### `tiebreaker_resolved`
Declara o vencedor que obteve a maior pedra numérica:
```json
{
  "type": "tiebreaker_resolved",
  "payload": {
    "contest_id": "cnt_9182ab",
    "winner_player_id": "p_1",
    "winner_player_name": "Julio",
    "winning_stone": 67,
    "summary": "Desempate: Julio (pedra 67), Marina (pedra 34) — Vencedor: Julio com a maior pedra (67)",
    "message": "🏆 Julio venceu o desempate com a pedra 67!"
  }
}
```

#### `bingo_valid`
Validação e anúncio oficial de premiação com coordenadas para riscar a linha no frontend:
```json
{
  "type": "bingo_valid",
  "payload": {
    "winner": {
      "player_id": "p_1",
      "player_name": "Julio",
      "card_id": "p_1_c1",
      "win_type": "Linha",
      "prize_title": "Fritadeira Elétrica"
    },
    "card_id": "p_1_c1",
    "pattern_id": "row_2",
    "pattern_name": "Linha 3",
    "winning_cells": [
      { "row": 2, "col": 0, "number": 14 },
      { "row": 2, "col": 1, "number": 22 },
      { "row": 2, "col": 2, "number": 0 },
      { "row": 2, "col": 3, "number": 51 },
      { "row": 2, "col": 4, "number": 68 }
    ],
    "winning_numbers": [14, 22, "FREE", 51, 68],
    "on_ball": 42,
    "was_tiebreaker": true,
    "winning_stone": 67,
    "awarded_prize": { "title": "Fritadeira Elétrica" },
    "next_stage": "blackout",
    "stage_name": "Cartela Cheia",
    "game_over": false,
    "message": "Parabéns! Julio bateu Linha (Linha 3) após desempate e faturou: 🎁 Fritadeira Elétrica! A partida continua para Cartela Cheia!"
  }
}
```

#### `bingo_invalid`
Enviado privadamente para o jogador quando a conferência no servidor falha (ex: falta de pedras sorteadas, bingo expirado após o sorteio do próximo número, ou padrão já premiado).

#### `player_list_update`
Broadcast contendo a lista atualizada de conexões, com separação explícita entre Manager e Jogadores.
