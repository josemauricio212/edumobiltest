# EduMobil — Front-end (Next.js)

Interface do EduMobil em **Next.js 15 (App Router) + React 19 + TypeScript**.
A API continua sendo o projeto `edu-rota-mobil` (FastAPI).

```text
navegador ──► Next.js (este projeto, :3000) ──► FastAPI (edu-rota-mobil, :8000) ──► PostgreSQL
              ├─ Server Components buscam os dados (com o token da sessão)
              ├─ /api/* é um proxy para a API (anexa o token do cookie)
              └─ /auth/login e /auth/logout gravam/limpam o cookie httpOnly
```

- **Sessão:** o token fica num cookie `httpOnly`; o JavaScript do navegador nunca o enxerga.
  O `middleware.ts` barra quem não tem cookie e o layout do painel valida o token no servidor.
- **Telas de leitura** (painel, listas, relatórios, detalhe da rota) são *Server Components*:
  os filtros vão na URL (`/alunos?turno=manha`) e o servidor refaz a consulta.
- **Telas de escrita** (formulários, botões de ação, mapas) são *Client Components* que chamam
  `/api/*` e depois fazem `router.refresh()`.
- Como o navegador só fala com o Next, não há CORS a configurar.

## Como rodar

Pré-requisitos: Node.js 20+ e a API rodando (veja o README do `edu-rota-mobil`).

```bash
cd edu-rota-front
npm install

npm run dev        # desenvolvimento, http://localhost:3000
# ou, em produção:
npm run build
npm start
```

`npm run lint` faz a checagem de tipos (`tsc --noEmit`).

No primeiro acesso a tela pede para criar o administrador.

### Variáveis de ambiente (opcionais)

Copie `.env.example` para `.env.local` para alterar.

| Variável          | Padrão                  | Para que serve                                                                  |
|-------------------|-------------------------|---------------------------------------------------------------------------------|
| `API_URL`         | `http://127.0.0.1:8000` | Endereço da API FastAPI (lido só no servidor do Next)                           |
| `SESSION_MINUTES` | `30`                    | Duração do cookie; use o mesmo valor de `ACCESS_TOKEN_EXPIRE_MINUTES` da API    |
| `COOKIE_SECURE`   | `false`                 | `true` quando servir por HTTPS                                                  |

## Estrutura

```text
app/
  layout.tsx, globals.css, not-found.tsx
  login/page.tsx                 tela de login / primeiro acesso
  (painel)/                      telas protegidas, com barra lateral
    layout.tsx                   valida a sessão e monta o Shell
    page.tsx                     painel
    alunos/ motoristas/ veiculos/ escola/ rotas/ relatorios/ usuarios/
  api/[...path]/route.ts         proxy da API (anexa o token)
  auth/login|logout/route.ts     gravam e limpam o cookie de sessão
components/                      Shell, formulários, mapas (Leaflet), tabelas...
lib/
  servidor.ts                    acesso à API a partir do servidor (Server Components)
  api.ts                         cliente da API para o navegador
  permissoes.ts  format.ts  erros.ts  mapa.ts  constantes.ts  types.ts
middleware.ts                    barreira de acesso (sem cookie → /login)
```

## Serviços externos usados no navegador

- **Leaflet** (pacote npm) e tiles da **Esri** para os mapas;
- **Nominatim** (OpenStreetMap) para "Buscar endereço no mapa" — serviço gratuito com limite de uso.
