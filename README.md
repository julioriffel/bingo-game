# 🎱 Bingo Multiplayer em Tempo Real (Bingo Royale 75)

Sistema completo de **Bingo Multiplayer de 75 bolas** em tempo real projetado para dispositivos móveis, desktops e TVs com **Modo Telão**, construído com **Python 3.14 (FastAPI + WebSockets + Redis Pub/Sub)** e **React 19 + Vite + TypeScript + Tailwind CSS**.

Disponível em produção em: [**https://bingo.bolsadedados.com.br**](https://bingo.bolsadedados.com.br)

---

## ⚡ Principais Recursos

1. **Modo Telão para TV & Projetor:** Globo animado 3D com destaque da pedra sorteada, Mesa Geral de 75 pedras com lâmpadas LED dinâmicas e locução vocal sintetizada nativa (`Web Speech API`).
2. **Prêmios Variáveis por Rodada:** Inclusão de quantidade customizável de prêmios com títulos e descrições opcionais, exibidos com destaque no telão e com carimbo do nome do vencedor (`👑 Ganhador: Carlos`).
3. **Ergonomia Mobile-First & Marcação Tátil:** Jogadores no celular com 1 a 4 cartelas simultâneas, resposta tátil (`navigator.vibrate`), áudio procedural de estalo/carimbo e assistente visual de números sorteados.
4. **Radar de Salas Públicas & PIN Privado:** Entrada instantânea em 1 clique na sala ou proteção por código e PIN.
5. **Segurança & Anti-Cheat:** Cartelas geradas e auditadas estritamente no servidor com assinatura HMAC para evitar qualquer manipulação no cliente.
6. **Backend Python 3.14 & Astral uv:** Alta performance assíncrona, Pydantic v2 e escalabilidade distribuída via Redis Pub/Sub.

---

## 🚀 Como Executar Localmente

### 1. Iniciar o Backend
```bash
cd backend
uv run uvicorn backend.main:app --reload --port 8001
```

### 2. Iniciar o Frontend
```bash
cd frontend
npm run dev
```

---

## 🧪 Testes Automatizados

```bash
cd backend
uv run pytest -v
```

---

## 📚 Documentação Técnica Completa

A documentação detalhada do sistema, arquitetura, servidor, regras de negócio e guia para agentes de IA está organizada na pasta [`docs/`](docs/):

- 🏛️ [**Arquitetura do Sistema**](docs/architecture.md): Visão de engenharia, frontend React 19, backend Python 3.14 FastAPI e WebSockets.
- 🎲 [**Regras de Negócio & Game Engine**](docs/business-rules.md): Regras de vitória, timing da batida, janela de 10s, showdown da pedra mais alta, prêmios e manager.
- 🔌 [**API REST & Protocolo WebSocket**](docs/api-and-websocket.md): Especificação completa de todos os endpoints HTTP e eventos WS.
- 🖥️ [**Servidor, Infraestrutura & Deploy**](docs/server-and-deployment.md): OCI ARM64, Traefik v3, Docker multi-stage, Portainer e GitHub Actions.
- 🤖 [**Guia de Agentes de IA (AGENTS.md)**](AGENTS.md): Diretrizes rígidas, convenções e comandos para desenvolvedores e agentes autônomos.

---

## 🐳 Deploy e Produção

Deploy automatizado via **GitHub Actions** em push na branch `main`:
1. Validação de qualidade e testes automatizados (`pytest` e build de Vite).
2. Construção de imagem Docker Multi-Arch (`linux/amd64,linux/arm64`).
3. Publicação no **GitHub Container Registry** (`ghcr.io/julioriffel/bingo-game:latest`).
4. Trigger de webhook no **Portainer** para atualização zero-downtime com proxy reverso e SSL automático via **Traefik**.

