# 🤖 AI Agent Guidelines — Bingo Royale 75

> **Documento Completo:** Para o manual de engenharia completo e detalhado, consulte [`docs/Agents.md`](docs/Agents.md).  
> **Documentação do Sistema:** Veja [`docs/README.md`](docs/README.md).

---

## ⚡ Regras Rápidas para Agentes de IA

1. **Python 3.14 via `uv`:** O backend utiliza **Python 3.14**. **Nunca** use Python 3.11/3.12/3.13 ou execute `pip` diretamente. Sempre use `uv run <comando>` ou `uv sync`.
2. **Branch Única (`main`):** Não crie branches de homologação ou staging. Todo push em `main` dispara deploy automático imediato para [`https://bingo.bolsadedados.com.br`](https://bingo.bolsadedados.com.br).
3. **Multi-Arquitetura Obrigatória:** O servidor de produção é um Oracle Cloud ARM64 (`linux/arm64`). O pipeline compila para `linux/amd64` e `linux/arm64`. Não inclua dependências incompatíveis com ARM64.
4. **Backend Autoritativo:** O cliente (React 19) é puramente visual. Toda a validação de cartelas (HMAC-SHA256), timing de bingo (deve clicar antes do próximo número), janela de contestação de 10s e showdown de pedras de desempate reside estritamente no backend.
5. **Manager Separado dos Jogadores:** O Host é o coordenador da partida, não recebe cartelas e não conta na lista de jogadores. Inatividade de 2 minutos permite que outro participante assuma a gerência.

### Comandos de Teste Obrigatórios antes de Push:
```bash
# 1. Testes do Backend (100% de aprovação necessária)
cd backend && uv run pytest -v

# 2. Build do Frontend
cd frontend && npm run build
```
