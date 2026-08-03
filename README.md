# Alltech — Dashboard de Campanhas

Dashboard de acompanhamento de metas de **autoridade** no LinkedIn (mídia paga
+ orgânico). Reescrita em Next.js do dashboard original em Streamlit/Python
(histórico preservado em `github.com/Stanleics/alltech-linkedin-dashboard`,
repositório descontinuado — ver "Atualização de dados" abaixo), mantendo o
mesmo Supabase já populado com dados reais. Este é o único dashboard ativo do
projeto, publicado em `alltech-dashboard.vercel.app`.

> Todas as metas medem presença e autoridade. A conversão comercial é
> consequência natural — não o gatilho que mede o sucesso desta estratégia.

## Páginas

- **Visão geral** (`/`) — os 6 KPIs de meta do cliente, sempre nos últimos 30
  dias corridos, com barra de progresso contra o ritmo esperado (pacing linear
  Mês 1 → Mês 3 → Mês 6):
  - Impressões (pago) / mês
  - Alcance único de gestores / mês
  - Frequência média (views/pessoa)
  - Taxa de engajamento (pago)
  - Seguidores ganhos via anúncios (**só `paid_follower_gain`**, não
    orgânico + pago)
  - CTR (cliques para a página)
- **Mídia paga** (`/midia-paga`) — tabela de campanha/criativo por período
  (seletor 7/30/90 dias + personalizado), equivalente a `vw_paid_performance`.
- **Orgânico** (`/organico`) — tabela de posts orgânicos por período,
  equivalente a `vw_organic_performance`.

Não há página dedicada de "linha do tempo" de seguidores — o dado de
`fact_follower_stats` continua sendo coletado e alimenta o KPI de seguidores,
só não vira um gráfico próprio.

## Mês 1 e ritmo (pacing)

"Mês 1" é a data de início mais antiga (`MIN(start_date)`) entre as campanhas
já coletadas no banco — calculado dinamicamente, nunca hardcoded. A meta "do
momento" interpola linearmente 0 → Mês 3 → Mês 6 com base nos dias corridos
desde o Mês 1, com teto no valor de Mês 6 (`src/lib/goals/pacing.ts`).

## Rodando localmente

1. `npm install`
2. `cp .env.example .env` e preencha com `DATABASE_URL` (Supabase) e as
   credenciais LinkedIn — `DIRECT_URL` pode ficar em branco (o pooler já é
   session-mode).
3. `npm run dev` e abra `http://localhost:3000`

Não é preciso rodar `prisma migrate dev` nem seed — o banco já existe e já
está populado; o schema Prisma foi feito por baseline contra ele (ver
`prisma/migrations/`).

## Testes

`npm test` roda a suíte Vitest: fidelidade de encoding do cliente LinkedIn,
transformação dos coletores, matemática das views (`src/lib/metrics`) e
pacing/metas (`src/lib/goals`), tudo sem rede nem banco.

## Credenciais LinkedIn

App aprovado no LinkedIn Marketing Developer Platform ("Alltech", não
"Community Management"). O script para gerar/renovar o token
(`scripts/get_linkedin_token.py`, ~60 dias de validade) está preservado no
histórico do repo Python descontinuado
(`github.com/Stanleics/alltech-linkedin-dashboard`); rodar dali e colar o
`LINKEDIN_ACCESS_TOKEN` gerado aqui.

## Atualização de dados

- Botão "Atualizar dados" na Visão geral dispara o ETL sob demanda (Server
  Action `src/app/actions/refresh-etl.ts`).
- `GET /api/etl/run` (protegido por `Authorization: Bearer $CRON_SECRET`) é o
  **único** escritor agendado no banco — o Vercel Cron chama esse endpoint
  diariamente (ver `vercel.json`).
- O repo Python (`alltech-linkedin-dashboard`) tinha uma GitHub Action
  equivalente, mas ela ficou anos sem a repository variable `DATA_SOURCE`
  configurada e por isso rodava em `DATA_SOURCE=mock` todo dia, escrevendo
  campanhas/posts fictícios (prefixo `MOCK`) neste mesmo Supabase — descoberto
  e corrigido em 2026-08-03 (dados MOCK removidos, Action desligada
  permanentemente via `gh workflow disable`). Esse repositório está
  descontinuado; não reativar a Action.

## Deploy (Vercel)

1. Importe este repositório GitHub na Vercel (app já está na raiz, sem
   precisar configurar Root Directory).
2. Em Vercel → Settings → Environment Variables, configure: `DATABASE_URL`,
   `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ACCESS_TOKEN`,
   `LINKEDIN_API_VERSION`, `LINKEDIN_ORGANIZATION_URN`,
   `LINKEDIN_AD_ACCOUNT_URN` (mesmos valores do `.env`).
3. Habilite Vercel Cron Jobs — a Vercel injeta `CRON_SECRET` automaticamente.
4. Deploy.
