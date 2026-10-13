# 📚 Documentação Técnica — Bingo Royale 75

Bem-vindo à documentação oficial do **Bingo Royale 75**, um sistema de bingo multiplayer em tempo real de 75 bolas para dispositivos móveis, desktops e TVs com Modo Telão.

Produção: [**https://bingo.bolsadedados.com.br**](https://bingo.bolsadedados.com.br)  
Repositório: [**git@github.com:julioriffel/bingo-game.git**](https://github.com/julioriffel/bingo-game)

---

## 🗂️ Estrutura da Documentação

A documentação está dividida nos seguintes módulos temáticos:

| Documento | Descrição |
| :--- | :--- |
| [**Arquitetura do Sistema**](architecture.md) | Visão geral da arquitetura, frontend (React 19 + Tailwind), backend (Python 3.14 FastAPI), WebSockets, estado em memória e segurança anti-fraude. |
| [**Regras de Negócio & Game Engine**](business-rules.md) | Regras oficiais do Bingo 75, critérios de vitória, janela de contestação de 10s, showdown da pedra mais alta, prêmios dinâmicos e papéis de Manager/Jogador. |
| [**API REST & Protocolo WebSocket**](api-and-websocket.md) | Especificação completa de todos os endpoints REST, contratos de mensagens bidirecionais via WebSocket e esquemas de dados. |
| [**Servidor, Infraestrutura & Deploy**](server-and-deployment.md) | Detalhes do servidor Oracle Cloud ARM64, Traefik, Docker Compose, Portainer, Cloudflare e pipeline CI/CD GitHub Actions multi-arquitetura. |
| [**Guia de Agentes de IA (Agents.md)**](Agents.md) | Manual de diretrizes, convenções de código, restrições tecnológicas e fluxo de trabalho para desenvolvedores e agentes autônomos de IA. |

---

## ⚡ Visão Rápida da Stack

- **Linguagem Backend:** Python 3.14.0+ (gerenciado via [Astral `uv`](https://docs.astral.sh/uv/))
- **Framework Web:** FastAPI + Uvicorn (ASGI assíncrono)
- **Modelagem de Dados:** Pydantic v2
- **Tempo Real:** WebSockets nativos com `ConnectionManager` e pub/sub
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS, Lucide Icons
- **Áudio & Voz:** Web Audio API (sons táteis procedurais) + Web Speech API (locução TTS em português)
- **Containerização:** Docker multi-arch (`linux/amd64`, `linux/arm64`) via multi-stage build
- **Hospedagem:** Oracle Cloud Infrastructure (OCI) Ampere A1 (ARM64)
- **Proxy Reverso & SSL:** Traefik v3 com Let's Encrypt automático
- **CI/CD:** GitHub Actions com push direto na branch `main` e trigger no Portainer
