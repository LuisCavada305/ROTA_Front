# ROTA Monorepo

Este repositório reúne os dois projetos da plataforma:

- `frontend/`: aplicação Vite/React responsável pela interface do portal.
- `backend/`: API Flask, scripts e infraestrutura Docker utilizados no deploy.

## Desenvolvimento local

- `make frontend-dev` — sobe o Vite dev server.
- `make backend-dev` — roda o backend Flask com HTTPS local (auto assinado).
- `make backend-test` — executa os testes do backend (requer dependências instaladas).

Veja os READMEs específicos em `frontend/` e `backend/` para instruções e variáveis de ambiente.

## Deploy

O workflow `App Deploy` (GitHub Actions) compila o frontend, copia o build para `backend/frontend_dist` e publica o backend no servidor remoto via `rsync` e `docker compose`, garantindo que a API e os assets do front sejam liberados juntos.
