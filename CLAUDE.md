# Alltech — Dashboard de Campanhas (LinkedIn)

Dashboard Next.js das metas de autoridade da Alltech no LinkedIn (mídia paga + orgânico).
Produção: `alltech-dashboard.vercel.app`. Repo: `github.com/Stanleics/alltech-campaign-dashboard`
(branch `main`; push dispara o deploy). Stack: Next.js, Prisma 7 + `PrismaPg`, Supabase
(pooler session-mode), Vercel Cron, API do LinkedIn (Marketing Developer Platform).
Setup, páginas e deploy: `README.md`. Não commitar `.env`.

## Dados e ETL

- Dois crons diários na Vercel, ambos com `Authorization: Bearer $CRON_SECRET`:
  `/api/etl/run` (mídia paga, 06:00 UTC) e `/api/etl/organic` (posts + seguidores, 06:30 UTC).
  O botão "Atualizar dados" roda os dois (`runEtl`). Código em `src/lib/etl/`.
- Os 6 cards da Visão geral usam janela fixa de 30 dias (`getGoals`, `src/lib/goals/`).

## Armadilhas

- **Alcance (`approximateMemberReach`):** o LinkedIn só devolve o campo em janelas de até ~90
  dias (com 92+ vem ausente e o ETL gravava 0). Por isso o alcance diário vem de uma consulta
  separada de 90 dias e o upsert nunca sobrescreve alcance guardado com 0.
- **Alcance diário não soma em período:** conta a mesma pessoa uma vez por dia. O card usa o
  alcance único da conta nos últimos 30 dias (tabela `fact_paid_reach_period`, lido por
  `getGoals`); frequência = impressões ÷ alcance único. A coluna "Alcance" da Mídia paga
  ainda soma o diário (superestima; fica 0 para dias além dos últimos 90).
- **Seguidores via anúncios** = só `paid_follower_gain` (não orgânico + pago). Bate com os
  "Seguidores da Page" do Campaign Manager (57 em 26/10–25/11/2026).
- **Script avulso com Prisma:** `import 'dotenv/config'` como primeira linha, senão cai em
  ECONNREFUSED enganoso. Apagar o script depois.
- **Pooler do Supabase** tem limite de 15 conexões em modo sessão; `EMAXCONNSESSION` é
  saturação, não bug de código. Repetir depois.
- Migrações: `npx prisma migrate deploy` (o `migrate dev` é interativo). Escrever o SQL à mão.
- O ETL pago completo leva ~200 s (≈7.150 upserts um a um); rodar em segundo plano.

## Estado atual (2026-11-25)

- Em produção/banco: crons separados, alcance e frequência corrigidos, ETL local rodado e
  banco preenchido até 23/11 (seguidores) e 25/11 (alcance). Commits `9ef44c1` e `07c1d40`.
- Cards (30 dias): impressões 5.354, alcance 4.460, frequência 1,20, engajamento 0,34%,
  seguidores 57, CTR 2,93%.

## Pendências

- Confirmar nos logs da Vercel que `/api/etl/organic` e `/api/etl/run` terminam sem estourar
  tempo (`maxDuration = 300` pode ser limitado pelo plano; o plano é desconhecido). A causa do
  orgânico ter parado em 19/10 é hipótese, não confirmada.
- Conferir os cards no dashboard em produção após o deploy (não aberto nesta sessão).
- Se o ETL pago estourar tempo: gravar em lote em vez de upsert linha a linha.
- Alcance por criativo/período na Mídia paga (hoje soma diário).

## Para X, leia Y

| Para | Leia |
|---|---|
| Rodar local, deploy, páginas | `README.md` |
| História e números das sessões | `docs/historico-sessoes.md` |
