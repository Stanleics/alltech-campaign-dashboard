# Histórico de sessões

## 2026-11-25 — Seguidores e alcance zerados

**Pedido:** o card "Seguidores ganhos via anúncios" mostrava 0 apesar de o LinkedIn ter
seguidores; depois, o mesmo para "Alcance único de gestores" e "Frequência média".

**Seguidores**
- Causa imediata: `fact_follower_stats` terminava em 19/10 e a janela de 30 dias (26/10–25/11)
  ficava vazia. Posts orgânicos também pararam (último em 20/10); a mídia paga seguia em dia.
- A API do LinkedIn tinha os dados (68 seguidores via anúncios em 90 dias). A coleta orgânica
  local funcionava em ~3 s, então o código estava certo.
- Hipótese (não confirmada, sem acesso aos logs da Vercel): a parte orgânica roda depois da
  paga em `/api/etl/run`, que não tem `maxDuration`; o ETL completo leva ~209 s.
- Ação: ETL rodado localmente (upsert, idempotente) preencheu o buraco; seguidores via anúncios
  em 26/10–25/11 = 57, igual ao Campaign Manager.
- Decisão do usuário: separar o cron orgânico em rota própria. Feito: `/api/etl/run` só paga,
  `/api/etl/organic` orgânico (06:30 UTC), `maxDuration = 300` nas duas, `cron-auth.ts`
  compartilhado, README atualizado. Commit `9ef44c1`.

**Alcance e frequência**
- Causa: o ETL pedia 365 dias diários de uma vez, e o LinkedIn omite `approximateMemberReach`
  em janelas de 92+ dias. Teste na API com a mesma consulta: 30 d → 36/36 linhas com alcance,
  90 d → 81/81, 92 d → 0/81, 120 d → 0/6.650, 365 d → 0/7.150. Todas as linhas do banco
  tinham alcance 0 desde o início.
- Alcance diário somado superestima o alcance do período (mesma pessoa em vários dias).
- Decisão do usuário: fazer os dois itens. (1) consulta separada de 90 dias só para alcance,
  mesclada nas linhas diárias (`mergeCreativeReach`), com upsert que não zera alcance antigo;
  (2) alcance único da conta nos últimos 30 dias (pivot ACCOUNT, granularidade ALL) gravado na
  nova tabela `fact_paid_reach_period` (migração `20261125000000_add_fact_paid_reach_period`,
  aplicada no Supabase com `prisma migrate deploy` após autorização do usuário), lido por
  `getGoals`; frequência = impressões ÷ alcance único. Commit `07c1d40`, pushed.
- Verificado: ETL pago local (203 s) sem fallback; cards lidos do banco: alcance 4.460,
  frequência 1,20 (bate com o teste da API), 81 linhas diárias com alcance. Typecheck, lint e
  63 testes passam. A primeira conferência falhou com `EMAXCONNSESSION` (pooler cheio);
  a repetição funcionou.
- Não verificado: dashboard em produção após o deploy; comportamento do cron na Vercel.
- Limitação conhecida: a coluna "Alcance" da Mídia paga continua somando alcance diário.
- Fechamento: o usuário confirmou os cards corretos em produção. Os 3 deploys (`9ef44c1`,
  `07c1d40`, `c82c99b`) terminaram em sucesso e `/api/etl/run` e `/api/etl/organic` respondem
  401 sem segredo (rotas existem). Logs dos crons não verificados (sem Vercel CLI nem
  `CRON_SECRET`; chamar a rota em produção grava no banco). Primeira execução separada dos
  crons: 2026-11-26 às 06:00/06:30 UTC.
