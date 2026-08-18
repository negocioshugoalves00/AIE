# Gestão de Solicitações de Exames

Sistema para substituir o grupo de WhatsApp usado para pedir inclusão, alteração e exclusão
de exames entre a recepção das unidades e o time responsável por corrigir no sistema de laudos.

## Stack

- **Next.js 14** (App Router) — front-end e back-end no mesmo projeto
- **Supabase** — banco de dados (Postgres), autenticação e regras de acesso (RLS)
- **Vercel** — hospedagem/deploy
- **GitHub** — versionamento e integração contínua com a Vercel

## Perfis de usuário

- **recepcionista** (padrão de qualquer novo usuário): cria solicitações e marca como "realizada".
- **gestor**: além disso, acessa a página `/relatorios` com indicadores mensais.

A troca de perfil é feita no banco (tabela `perfis`, coluna `role`), veja abaixo.

## Rodando localmente

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Acesse http://localhost:3000

## Criando o primeiro usuário gestor

1. No painel do Supabase → **Authentication → Users → Add user**, crie o usuário com e-mail/senha.
   Isso cria automaticamente uma linha na tabela `perfis` com `role = recepcionista`.
2. No **SQL Editor**, promova para gestor:

```sql
update public.perfis
set role = 'gestor'
where id = (select id from auth.users where email = 'email-do-gestor@clinica.com');
```

Os demais usuários (recepcionistas) seguem como `recepcionista` por padrão — não precisa fazer nada.

## Cadastros iniciais

As tabelas `unidades`, `convenios` e `exames` já vêm com alguns registros de exemplo.
Edite/inclua os reais direto no Supabase (Table Editor) ou crie uma tela de administração depois —
apenas usuários `gestor` têm permissão de escrita nessas tabelas.

## Segurança dos relatórios

O acesso aos relatórios é protegido em duas camadas:

1. Na interface: a página `/relatorios` só é exibida no menu e só renderiza para quem tem `role = gestor`.
2. No banco (a proteção que realmente importa): os dados agregados só são retornados pelas funções
   `relatorio_mensal()` e `relatorio_por_recepcionista()`, que verificam o papel do usuário logado
   e recusam a chamada (`Acesso negado`) para quem não é gestor — mesmo que a pessoa tente chamar a
   API diretamente, sem passar pela tela.

## Deploy

### 1. Subir para o GitHub

```bash
cd gestao-exames
git init
git add .
git commit -m "Setup inicial do projeto"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/gestao-exames.git
git push -u origin main
```

### 2. Conectar à Vercel

1. Acesse https://vercel.com/new e importe o repositório recém-criado.
2. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (os mesmos valores do `.env.local`)
3. Clique em **Deploy**. A cada `git push` na branch `main`, a Vercel publica automaticamente.

## Próximos passos sugeridos

- Tela de administração de unidades/convênios/exames (hoje só via Supabase).
- Notificação (e-mail ou WhatsApp via API) quando uma solicitação é criada ou finalizada.
- Exportar relatório mensal em PDF/Excel.
- Filtro de período customizado nos relatórios (hoje é sempre o mês corrente).
