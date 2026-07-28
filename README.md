# Alltech — Dashboard de Campanhas

Dashboard de acompanhamento de metas de **autoridade** no LinkedIn (mídia paga
+ orgânico). Reescrita em Next.js do dashboard original em Streamlit/Python
(`github.com/Stanleics/alltech-linkedin-dashboard`), mantendo o mesmo Supabase
já populado com dados reais.

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
2. `cp .env.example .env` e preencha com o mesmo `DATABASE_URL` (Supabase) e
   credenciais LinkedIn já usadas pelo dashboard Python — `DIRECT_URL` pode
   ficar em branco (o pooler já é session-mode).
3. `npm run dev` e abra `http://localhost:3000`

Não é preciso rodar `prisma migrate dev` nem seed — o banco já existe e já
está populado; o schema Prisma foi feito por baseline contra ele (ver
`prisma/migrations/`).

## Testes

`npm test` roda a suíte Vitest: fidelidade de encoding do cliente LinkedIn,
transformação dos coletores, matemática das views (`src/lib/metrics`) e
pacing/metas (`src/lib/goals`), tudo sem rede nem banco.

## Credenciais LinkedIn

Mesmo app aprovado no LinkedIn Marketing Developer Platform usado pelo
dashboard Python ("Alltech", não "Community Management"). Gerar/renovar o
token com `scripts/get_linkedin_token.py` do repo Python quando expirar
(~60 dias) e atualizar `LINKEDIN_ACCESS_TOKEN` aqui e lá.

## Atualização de dados

- Botão "Atualizar dados" na Visão geral dispara o ETL sob demanda (Server
  Action `src/app/actions/refresh-etl.ts`).
- `GET /api/etl/run` (protegido por `Authorization: Bearer $CRON_SECRET`) é o
  endpoint que o Vercel Cron chama diariamente — ver `vercel.json`.
- Enquanto este app não estiver validado em produção, o GitHub Action Python
  (`alltech-linkedin-dashboard/.github/workflows/etl.yml`) continua sendo o
  único escritor agendado no banco.

## Deploy (Vercel)

1. Importe este repositório GitHub na Vercel (app já está na raiz, sem
   precisar configurar Root Directory).
2. Em Vercel → Settings → Environment Variables, configure: `DATABASE_URL`,
   `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_ACCESS_TOKEN`,
   `LINKEDIN_API_VERSION`, `LINKEDIN_ORGANIZATION_URN`,
   `LINKEDIN_AD_ACCOUNT_URN` (mesmos valores do `.env` do repo Python).
3. Habilite Vercel Cron Jobs — a Vercel injeta `CRON_SECRET` automaticamente.
4. Deploy.
5. Só depois de validar visualmente os números contra o dashboard Python e o
   cliente aprovar: desligar o GitHub Action do repo Python para evitar dois
   escritores agendados no mesmo banco.
