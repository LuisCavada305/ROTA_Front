# Rota Back-end

Serviço Flask responsável pelas operações de autenticação, fóruns e trilhas do projeto
Rota. Esta versão recebeu ajustes para operar em ambiente de produção mantendo os
parâmetros seguros configuráveis por variáveis de ambiente.

## Requisitos

- Python 3.12+
- PostgreSQL 13+ (para desenvolvimento rápido é possível usar SQLite)
- Redis 6+ para rate limiting distribuído (opcional, recomendado em produção)
- Docker + Docker Compose (para quem preferir rodar tudo containerizado)

## Como rodar localmente

### 1. Preparar variáveis de ambiente

Dentro de `backend/` copie o exemplo e ajuste o que for necessário:

```bash
cd backend
cp .env.example .env
# edite o arquivo e defina segredos (JWT_SECRET, CSRF_SECRET etc.)
```

Em desenvolvimento você pode usar SQLite (`DATABASE_URL=sqlite:///rota.db`) ou apontar para
um Postgres local.

### 2. Rodar em ambiente Python (sem Docker)

1. Crie e ative um virtualenv:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```
2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
3. Crie as tabelas executando os scripts em `app/scripts` (o `bootstrap_schema.sql` monta toda
   a estrutura). Com Postgres local:
   ```bash
   psql postgres://usuario:senha@localhost:5432/rota-db -f app/scripts/bootstrap_schema.sql
   psql postgres://usuario:senha@localhost:5432/rota-db -f app/scripts/seed_lookup_values.sql
   ```
   > Para SQLite basta rodar `python -m app.scripts.bootstrap_schema` (executável no `make bootstrap`).
4. Execute o servidor:
   ```bash
   make  # alvo padrão roda `flask --app app.main run --debug`
   ```

### 3. Rodar usando Docker Compose (Postgres + Redis + API)

1. Garanta que Docker e Docker Compose plugin estejam instalados.
2. Ainda dentro de `backend/`, suba os serviços:
   ```bash
   docker compose --env-file .env up -d --build
   ```
3. A primeira vez que os containers forem iniciados o Postgres lerá os arquivos de
   `app/scripts` automaticamente. Se precisar reaplicar, execute:
   ```bash
   docker compose exec db psql -U rota-user -d rota-db -f /docker-entrypoint-initdb.d/bootstrap_schema.sql
   docker compose exec db psql -U rota-user -d rota-db -f /docker-entrypoint-initdb.d/seed_lookup_values.sql
   ```
4. A API ficará disponível em `http://localhost:8000`. Para derrubar tudo:
   ```bash
   docker compose down
   ```

### Uploads locais

As imagens de membros e capas de trilhas são gravadas na pasta `uploads/` (bind mount no
`docker-compose.yml`). Antes de subir os containers, garanta que o diretório exista:

```bash
mkdir -p uploads/members uploads/trails
```

Em ambientes de produção (ex.: `/opt/rota`), aponte o volume para um caminho persistente
e ajuste as permissões para o usuário que executa a API:

```bash
sudo mkdir -p /opt/rota/uploads/{members,trails}
# a imagem executa como UID/GID 1000 (appuser); ajuste as permissões para corresponder:
sudo chown -R 1000:1000 /opt/rota/uploads
sudo chmod 750 /opt/rota/uploads
```

## Variáveis de ambiente principais

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | opcional | URL completa do banco. Se ausente, o app monta usando as chaves `DB_*`. |
| `DB_ENGINE`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` | opcional | Componentes para montar a URL do banco. Em produção não utilize os valores padrão. |
| `JWT_SECRET` | **sim** | Chave usada para assinar sessões e tokens. Deve ter >=16 caracteres e não pode ser trivial. |
| `CSRF_SECRET` | recomendado | Segredo dedicado para assinar tokens CSRF. Obrigatório em produção. |
| `COOKIE_DOMAIN` | recomendado | Domínio compartilhado (ex.: `.seu-dominio.com`). Necessário quando API e app usam subdomínios diferentes para que `rota_session`/`rota_csrftoken` sejam lidos pelo front. |
| `CORS_ALLOWED_ORIGINS` | opcional | Lista separada por vírgulas de origens permitidas. Defaults seguros para `localhost`. |
| `REDIS_URL` | recomendado | URL do Redis (`redis://user:pass@host:6379/0`). Se não informado cai no limitador em memória. |
| `AUTH_RATE_LIMIT_MAX_ATTEMPTS` | opcional | Tentativas permitidas por janela (default `10`). |
| `AUTH_RATE_LIMIT_WINDOW_SECONDS` | opcional | Duração da janela de rate limiting (default `60`). |
| `SMTP_*` | opcional | Configurações de e-mail transactional. |
| `ENV` | opcional | Define o ambiente (`dev`, `staging`, `prod`). Em `prod` validações extras são aplicadas. |
| `DD_TRACE_ENABLED` | opcional | Defina `1` para ativar tracing via Datadog. Sem agente em execução deixe `0`. |
| `DD_API_KEY` | opcional | Chave da sua conta Datadog. Obrigatória quando o agente estiver habilitado. |
| `DD_SITE` | opcional | Região Datadog (ex.: `datadoghq.com`, `datadoghq.eu`). Default `datadoghq.com`. |
| `DD_ENV`, `DD_VERSION` | opcional | Metadados para agrupamento de métricas/traces no Datadog. |

> **Importante:** ao definir `ENV=prod` o aplicativo bloqueia o uso das credenciais padrão
> e exige `CSRF_SECRET`. Configure também HTTPS terminado no proxy ou load balancer
> para que os cookies seguros sejam ativados automaticamente.

### HTTPS com proxy Nginx

O `docker-compose.yml` inclui o serviço `proxy`, que termina TLS nas portas 80/443 e repassa o tráfego para a API Flask.
Para habilitar HTTPS coloque os certificados em `certs/` (diretório não versionado) com os nomes:

```
certs/
 ├─ server.crt   # certificado público (cadeia completa)
 └─ server.key   # chave privada correspondente
```

Depois suba (ou recrie) a stack:

```bash
docker compose -p rota_backend --env-file ../.env up -d --build --remove-orphans
```

Se utilizar a pipeline do GitHub Actions, certifique-se de que esses arquivos já existam na VPS antes de executar o deploy. Para ambientes públicos, use certificados válidos (ex.: Let's Encrypt) e mantenha o healthcheck interno em `http://127.0.0.1:8000/healthz`, expondo externamente `https://seu-dominio`.

### Servindo o front-end com o mesmo proxy

O serviço `proxy` também entrega o build do Vite. O arquivo `docker/proxy/nginx.conf` define dois hosts virtuais:

- `api.*` → proxy para a API Flask (`http://api:8000`)
- `app.*` → arquivos estáticos em `/usr/share/nginx/html`

Para publicar o front:

1. Gere/renove o certificado incluindo ambos os domínios (ex.: `api.72-61-32-2.nip.io` e `app.72-61-32-2.nip.io`). O `nip.io` é aceito pela Let's Encrypt e evita o limite que atingimos com `sslip.io`:
   ```bash
   sudo certbot certonly --standalone \
     -d api.72-61-32-2.nip.io \
     -d app.72-61-32-2.nip.io
   sudo cp /etc/letsencrypt/live/api.72-61-32-2.nip.io/fullchain.pem /opt/rota/backend/certs/server.crt
   sudo cp /etc/letsencrypt/live/api.72-61-32-2.nip.io/privkey.pem   /opt/rota/backend/certs/server.key
   sudo chmod 600 /opt/rota/backend/certs/server.key
   ```

2. Faça o build do front (diretório `frontend/` deste monorepo):
   ```bash
   cd ../frontend
   npm install
   npm run build
   cd ..
   ```
   Copie o resultado para `backend/frontend_dist/` (diretório ignorado pelo git). Exemplo:
   ```bash
   rm -rf backend/frontend_dist
   mkdir -p backend/frontend_dist
   cp -r frontend/dist/* backend/frontend_dist/
   ```
   No servidor, basta sincronizar a pasta `frontend_dist/` antes do deploy (ex.: `rsync -az dist/ usuario@servidor:/opt/rota/backend/releases/<release>/frontend_dist/`).

3. Reinicie os containers:
   ```bash
   cd ../backend
   docker compose -p rota_backend --env-file ../.env up -d --build --remove-orphans
   ```

4. Atualize o backend (`CORS_ALLOWED_ORIGENS`) para incluir `https://app.72-61-32-2.nip.io` e configure o front (`VITE_API_BASE_URL`/`apiHost.json`) apontando para `https://api.72-61-32-2.nip.io`.

Com isso o portal fica acessível em `https://app.seu-dominio` e a API em `https://api.seu-dominio`, ambos servidos pelo mesmo Nginx com TLS.

## Preparando a VPS para a pipeline

As etapas a seguir deixam a infraestrutura pronta para que a *pipeline* (GitHub Actions)
consiga fazer o deploy sem intervenção manual. Execute-as apenas na primeira vez em uma
VPS Ubuntu 22.04+ recém-provisionada.

### 1. Instale dependências básicas

```bash
sudo apt update
sudo apt install -y git curl ufw
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
sudo apt install -y docker-compose-plugin
```

Faça logout/login para ativar o grupo `docker`.

### 2. Estruture os diretórios

```bash
sudo mkdir -p /opt/rota/{backend/releases,uploads/{members,trails},certs}
sudo chown -R $USER:$USER /opt/rota
```

> Após copiar os arquivos do projeto, ajuste novamente a pasta `uploads/` para UID/GID `1000:1000`:
>
> ```bash
> sudo chown -R 1000:1000 /opt/rota/uploads
> sudo chmod 750 /opt/rota/uploads
> ```

> O diretório `uploads/` deve sempre pertencer ao mesmo usuário que roda os containers, pois é montado em `/opt/app/app/static/uploads`.
>
> A pipeline assume que `/opt/rota/backend/current` aponta para o release ativo e que o
> volume `/opt/rota/uploads` já existe com as permissões acima.

### 3. Obtenha o projeto

Se você já rodou a pipeline pelo menos uma vez, ela cuidará de criar o primeiro release em
`/opt/rota/backend/releases/<timestamp>/` e atualizar o symlink `current`. Caso queira
conferir tudo antes de liberar o deploy automatizado, faça um clone manual:

```bash
cd /opt/rota/backend/releases
git clone https://seu-repo.git 20250101120000
ln -sfn 20250101120000 ../current
```

Independentemente da abordagem, as etapas seguintes consideram
`/opt/rota/backend/current` como caminho ativo.

### 4. Configure variáveis de ambiente

Dentro de `current/backend/` copie e edite:

```bash
cd /opt/rota/backend/current/backend
cp .env.example ../.env
nano ../.env  # defina JWT_SECRET, CSRF_SECRET, DATABASE_URL etc.
```

No VPS apontamos `DATABASE_URL` para o Postgres gerenciado (ou para o container `db` caso use o compose completo).

### 5. Prepare certificados e build do front-end

1. Copie `frontend/dist/` gerado localmente para `backend/frontend_dist/`:
   ```bash
   rsync -az ../frontend/dist/ /opt/rota/backend/current/backend/frontend_dist/
   ```
2. Coloque `server.crt` e `server.key` válidos em `/opt/rota/backend/current/certs/`.

### 6. Criar o banco de dados (apenas primeira vez)

Com o Postgres do compose:

```bash
docker compose -p rota_backend exec db psql -U rota-user -d rota-db -f /docker-entrypoint-initdb.d/bootstrap_schema.sql
docker compose -p rota_backend exec db psql -U rota-user -d rota-db -f /docker-entrypoint-initdb.d/seed_lookup_values.sql
docker compose -p rota_backend exec db psql -U rota-user -d rota-db -f /docker-entrypoint-initdb.d/create_admin_user_new.sql
```

Se estiver usando Postgres externo, copie os SQLs para o servidor e execute com `psql`.

### 7. Rodar a pipeline

Com todos os pré-requisitos acima atendidos:

1. Faça commit das alterações (backend e frontend) no repositório.
2. Abra um *pull request* ou faça push para o branch monitorado pela pipeline.
3. Aguarde a conclusão da ação (ex.: `Deploy backend`). Ela cuidará de:
   - gerar um release em `/opt/rota/backend/releases/<timestamp>/`;
   - atualizar o symlink `current`;
   - rodar `docker compose -p rota_backend --env-file ../.env up -d --build`;
   - executar ajustes pós-deploy definidos no workflow.
4. Verifique o status em GitHub Actions e, se necessário, revise os logs via
   `docker compose -p rota_backend logs -f api`.

### 8. Secrets da pipeline (GitHub Actions)

Crie os seguintes *secrets* em **Settings → Secrets and variables → Actions** do repositório:

| Secret | Obrigatório | Descrição e exemplo |
| --- | --- | --- |
| `DEPLOY_HOST` | sim | IP ou hostname público da VPS. Ex.: `72.61.32.2`. |
| `DEPLOY_USER` | sim | Usuário SSH com permissão para rodar Docker e escrever em `/opt/rota`. Ex.: `deploy`. |
| `DEPLOY_PATH` | sim | Caminho base usado pela pipeline. Ex.: `/opt/rota/backend`. |
| `DOCKER_PROJECT` | opcional | Nome do projeto Compose (`-p`). Default do workflow: `rota_backend`. |
| `HEALTHCHECK_URL` | opcional | URL completa usada após o deploy. Se vazio usa `http://127.0.0.1:8000/healthz`. |
| `SSH_PRIVATE_KEY` | sim | Chave privada (formato PEM/OpenSSH) do usuário definido em `DEPLOY_USER`. A pública deve estar em `~/.ssh/authorized_keys` na VPS. |
| `ENV_FILE_PROD` | opcional | Conteúdo do `.env` de produção (texto puro). Se setado, a pipeline sobrescreve `${DEPLOY_PATH}/.env`. Caso contrário mantenha o arquivo manualmente no servidor. |
| `DD_API_KEY` | opcional | Caso prefira manter a chave Datadog fora do `.env`, informe-a aqui (a pipeline a exportará para o agente). |
| `DD_SITE` | opcional | Região Datadog (`datadoghq.com`, `datadoghq.eu`, ...). Usada somente se `DD_API_KEY` estiver definido. |

> Os secrets são lidos somente pelo workflow `deploy.yml`. Se for preciso acessar múltiplas VPS,
> prefira reutilizar os nomes acima e armazenar os valores específicos em *environment secrets*
> (ex.: `production`, `staging`) para simplificar o reuso.

### 9. Manutenção diária

- **Executar comandos administrativos** (migrações, shell, etc.):
  ```bash
  cd /opt/rota/backend/current/backend
  docker compose -p rota_backend exec api flask --app app.main shell
  ```
- **Ver logs**: `docker compose -p rota_backend logs -f api proxy`
- **Reiniciar serviço manualmente** (somente se a pipeline não estiver sendo executada):
  ```bash
  docker compose -p rota_backend restart api proxy
  ```

Certifique-se de manter backups do banco e renovar certificados TLS (ex.: via cron com Certbot).

## Rate limiting

O serviço aplica rate limiting nas rotas sensíveis (login, registro, reset de senha). Por
padrão utiliza um limitador em memória adequado para desenvolvimento. Quando `REDIS_URL`
está configurado, o backend usa uma janela fixa com `ZSET` em Redis, permitindo múltiplas
instâncias da aplicação sem perder o controle de tentativas.

## Observabilidade (Datadog)

O `docker-compose.yml` inclui um contêiner `datadog-agent` responsável por coletar:

- logs de stdout/stderr dos serviços (API, proxy, etc.);
- métricas e traces APM enviados automaticamente pelo `ddtrace` quando habilitado.

Para ativar em produção:

1. Defina no arquivo `.env` (ou no secret `ENV_FILE_PROD`) os valores:
   ```
   COMPOSE_PROFILES=datadog
   DD_TRACE_ENABLED=1
   DD_API_KEY=<sua-chave>
   DD_SITE=datadoghq.com          # ou outra região
   DD_ENV=production              # aparece nas tags do Datadog
   DD_VERSION=<hash ou versão>    # opcional, para releases
   ```
2. Certifique-se de que o usuário que roda os containers tem permissão de ler:
   - `/var/run/docker.sock`
   - `/var/lib/docker/containers`
   - `/proc` e `/sys/fs/cgroup`

   Esses diretórios são montados pelo agente para coletar logs e métricas.

3. Rode a pipeline normalmente. Ela reprovisionará a stack com o agente e a API
   instrumentada via `ddtrace`. Se a chave estiver ausente, o serviço `datadog-agent`
   falhará ao iniciar (o deploy será revertido pelo healthcheck).

Para desativar temporariamente, deixe `COMPOSE_PROFILES` em branco (o agente não será
subido) e ajuste `DD_TRACE_ENABLED=0`; a API continuará operando sem enviar dados ao
Datadog.

## CORS e cookies

As origens permitidas agora são configuráveis e a aplicação ajusta automaticamente os
headers `Access-Control-Allow-*` e as flags de cookie (Secure/SameSite) conforme o
ambiente. Para produção, mantenha a lista de origens restrita aos domínios da aplicação
web.

## Testes

Execute a suíte com:

```bash
pytest -v --disable-warnings --maxfail=1
```

Considere rodar os testes em CI antes de todo deploy. Há também targets no `makefile`
para execução com `uvicorn`/`waitress` quando necessário.

### Testes de performance (k6)

O alvo `make k6` prepara e executa o teste de carga definido em
`performance/k6/performance.test.js`. Por padrão, os cenários que exercitam o
rate limit de login ficam desativados para evitar falhas decorrentes das
respostas `429` esperadas. Basta rodar:

```bash
make k6
```

Caso seja necessário validar o comportamento do rate limit, habilite o cenário
extra configurando a variável de ambiente `ENABLE_RATE_LIMIT_SCENARIOS`:

```bash
ENABLE_RATE_LIMIT_SCENARIOS=true make k6
```
