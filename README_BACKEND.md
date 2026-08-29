# Entrega360 — Backend implementado

A aplicação foi preparada para sair do localStorage e operar com Supabase/PostgreSQL.

### Incluído
- Autenticação por e-mail/senha.
- Persistência de veículos no PostgreSQL.
- RLS por usuário/perfil.
- Perfis admin, gestor e operador.
- Auditoria de insert/update/delete.
- Validação de fluxo no banco.
- Controle de feriados para SLA.
- Cliente Supabase com sessão persistente.
- Fallback local quando Supabase não está configurado.

### Ativação
Execute as migrations em `supabase/migrations/` no projeto Supabase, crie um usuário no Authentication e promova-o a admin conforme `BACKEND.md`. Configure `.env.local` com URL e anon key.


## Configuração do projeto Supabase

1. Crie/abra o projeto no Supabase.
2. Em **SQL Editor**, execute nesta ordem:
   - `supabase/migrations/202608280001_entrega360.sql`
   - `supabase/migrations/202608280002_business_days.sql`
3. Em **Project Settings → API**, confirme a Project URL e a chave pública (Publishable/anon).
4. No projeto local, crie `.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Em **Authentication → Users**, crie o primeiro usuário. O trigger cria automaticamente o perfil como `operador`.
6. Para transformar o primeiro usuário em administrador, execute no SQL Editor, substituindo o e-mail:

```sql
update public.profiles
set perfil = 'admin', ativo = true
where id = (select id from auth.users where email = 'SEU_EMAIL');
```

> Nunca coloque uma `service_role`/secret key no `.env` do frontend.

## Regras do negócio

- O SLA começa na data de recebimento da NF.
- O prazo é de 5 dias úteis.
- Sábados, domingos e datas cadastradas em `holidays` não entram na contagem.
- Acessório, insulfilm e emplacamento são condicionais.
- O banco impede etapas de preparação antes da NF.
- O banco impede concluir entrega sem agendamento.
- Alterações em veículos geram auditoria.
