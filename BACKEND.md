# Entrega360 — backend

O backend do Entrega360 usa Supabase (PostgreSQL + Auth + RLS + Realtime).

## Configuração local

Crie `.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
```

## Banco

As migrations devem ser executadas no SQL Editor do Supabase, nesta ordem:

1. `202608280001_entrega360.sql`
2. `202608280002_business_days.sql`
3. `202608280003_realtime_and_integrity.sql`

A terceira migration adiciona unicidade do chassi e sincronização em tempo real dos veículos.

## Fluxo

Minuta → Cliente comunicado → NF → SLA de 5 dias úteis → preparação → pronto → agendamento → entrega.

A data limite é calculada a partir da `data_nf`. A regra de bloqueio de etapas anteriores à NF é validada também no PostgreSQL.
