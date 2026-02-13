# BetTracker Pro

Aplicação React + Vite para gestão de apostas com autenticação Supabase (email/senha + Google OAuth).

## 1) Configuração local

### Pré-requisitos
- Node 18+
- Projeto criado no Supabase

### Instalação
1. Instale dependências:
   ```bash
   npm install
   ```
2. Crie o arquivo `.env` com base no exemplo:
   ```bash
   cp .env.example .env
   ```
3. Preencha as variáveis:
   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=ey... (ou VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable...)
   ```
4. Rode localmente:
   ```bash
   npm run dev
   ```

## 2) SQL recomendado no Supabase

> Rode no SQL Editor na ordem abaixo.

### 2.1 Estrutura e extensões
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bankrolls (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'BRL',
  initial_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.methods (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.bets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  bankroll_id UUID REFERENCES public.bankrolls ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  sport TEXT,
  market TEXT,
  event TEXT,
  selection TEXT,
  odds NUMERIC NOT NULL,
  stake NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  profit NUMERIC DEFAULT 0,
  method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mindset_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  time TIME DEFAULT CURRENT_TIME,
  mood TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  bankroll_id UUID REFERENCES public.bankrolls ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  target NUMERIC NOT NULL,
  current NUMERIC DEFAULT 0,
  deadline DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 RLS + políticas corretas (com USING e WITH CHECK)
```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bankrolls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mindset_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "bankrolls_all_own" ON public.bankrolls;
CREATE POLICY "bankrolls_all_own" ON public.bankrolls
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "bets_all_own" ON public.bets;
CREATE POLICY "bets_all_own" ON public.bets
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "methods_all_own" ON public.methods;
CREATE POLICY "methods_all_own" ON public.methods
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "mindset_all_own" ON public.mindset_entries;
CREATE POLICY "mindset_all_own" ON public.mindset_entries
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "goals_all_own" ON public.goals;
CREATE POLICY "goals_all_own" ON public.goals
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

### 2.3 Trigger de domínio de e-mail (ajustado)
```sql
CREATE OR REPLACE FUNCTION public.check_email_domain()
RETURNS TRIGGER AS $$
BEGIN
  IF lower(split_part(NEW.email, '@', 2)) NOT IN ('gmail.com', 'hotmail.com', 'outlook.com') THEN
    RAISE EXCEPTION 'Apenas e-mails Gmail, Hotmail ou Outlook são permitidos.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_check_domain ON auth.users;
CREATE TRIGGER on_auth_user_created_check_domain
BEFORE INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.check_email_domain();
```

## 3) Google OAuth (console + Supabase)

1. No **Google Cloud Console**:
   - APIs & Services → OAuth consent screen (External).
   - Preencha app name, support email e authorized domain.
   - Em “Test users”, adicione seu e-mail (enquanto em modo teste).
2. Crie **OAuth Client ID** (Web application).
3. Authorized JavaScript origins:
   - `https://SEU-PROJETO.supabase.co`
   - `https://SEU-DOMINIO-VERCEL.vercel.app`
4. Authorized redirect URIs:
   - `https://SEU-PROJETO.supabase.co/auth/v1/callback`
5. No Supabase → Authentication → Providers → Google:
   - Ative Google
   - Cole Client ID e Client Secret
6. No Supabase → Authentication → URL Configuration:
   - Site URL: `https://SEU-DOMINIO-VERCEL.vercel.app`
   - Additional Redirect URLs:
     - `http://localhost:5173`
     - `https://SEU-DOMINIO-VERCEL.vercel.app`

## 4) Vercel (sem erro de build/login)

1. Projeto na Vercel → Settings → Environment Variables.
2. Configure em **Production / Preview / Development**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (ou `VITE_SUPABASE_PUBLISHABLE_KEY`)
3. Faça redeploy após salvar as variáveis.
4. Build command: `npm run build`
5. Output directory: `dist`

## 5) Checklist rápido de troubleshooting

- `Failed to fetch` no login:
  - URL Supabase errada ou variável sem prefixo `VITE_`.
- Google abre mas não loga:
  - Redirect URI faltando no Google ou Supabase.
- Cadastro por e-mail não entra:
  - Verificar confirmação de e-mail em Authentication → Providers → Email.
- Continua com erro após ajustar variáveis:
  - Force redeploy + limpe cache do navegador.

## Segurança

Como as chaves foram compartilhadas em texto, gere novas chaves no Supabase e atualize no `.env`/Vercel.


## 6) SQL pronto para copiar/colar

Se preferir, use o arquivo versionado do projeto:

```bash
supabase/setup.sql
```

Cole todo o conteúdo no **Supabase > SQL Editor** e execute.

## 7) Como atualizar GitHub automaticamente após meus ajustes

Hoje seu repositório local está sem `remote`, então o push não acontece sozinho.
Faça esse setup **uma vez**:

1. Criar repo no GitHub (se ainda não criou).
2. Conectar o remote:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   ```
3. Definir branch padrão no GitHub como `main`.
4. Subir branch atual:
   ```bash
   git push -u origin work
   ```

### Fluxo recomendado sempre que eu fizer ajustes

```bash
git add -A
git commit -m "sua mensagem"
git push
```

Se quiser tudo em um comando, crie um alias no seu terminal:

```bash
git config --global alias.sync '!git add -A && git commit -m "update" && git push'
```

Depois basta rodar:

```bash
git sync
```

## 8) Deploy automático na Vercel após push

1. Na Vercel, conecte o projeto ao repositório GitHub.
2. Em **Project Settings > Git**, mantenha Auto Deploy habilitado.
3. Toda vez que você der `git push` para a branch configurada (ex: `main`), a Vercel faz build/deploy automático.
4. Se usar `work` para desenvolvimento, abra PR para `main` e a Vercel publica ao merge.


## 9) Correção do erro da Vercel: `vite: command not found`

Esse erro acontece quando o ambiente instala dependências sem `devDependencies` (onde ficam `vite` e `typescript`) **ou** quando o Build Command está como `vite build` direto.

### Correção aplicada no repositório
Foi adicionado `vercel.json` com:
- `installCommand`: `npm ci --include=dev`
- `buildCommand`: `npm run build`
- `outputDirectory`: `dist`

### O que conferir no painel da Vercel
1. Project Settings → Build and Deployment:
   - **Install Command**: deixe vazio (para usar o `vercel.json`) ou coloque `npm ci --include=dev`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
2. Project Settings → Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (ou `VITE_SUPABASE_PUBLISHABLE_KEY`)
3. Faça **Redeploy** com **"Use existing Build Cache" desmarcado**.

## 10) Ajustes importantes pelas telas que você enviou

### Supabase
- Em **Authentication → OAuth Server (BETA)**: isso **não é necessário** para login Google do seu app cliente.
  - Pode deixar **desativado** para evitar confusão.
- O que importa é:
  - **Authentication → Sign In / Providers → Google** (ativado com Client ID/Secret corretos)
  - **Authentication → URL Configuration** com Site URL e Redirect URLs corretos.

### Google Cloud (OAuth Client)
- Em **Authorized JavaScript origins** adicione:
  - `https://SEU-PROJETO.supabase.co`
  - `https://SEU-DOMINIO-VERCEL.vercel.app`
- Em **Authorized redirect URIs**, use **somente**:
  - `https://SEU-PROJETO.supabase.co/auth/v1/callback`
- Remova `https://SEU-DOMINIO-VERCEL.vercel.app/` da lista de redirect URI do Google (não é callback do Supabase).

## 11) Fluxo final (do zero ao deploy funcionando)

1. Rodar SQL completo: `supabase/setup.sql` no SQL Editor.
2. Configurar Google Provider no Supabase.
3. Configurar URL Configuration no Supabase.
4. Ajustar OAuth Client no Google Cloud (origins + callback correto).
5. Confirmar envs na Vercel.
6. Redeploy.
7. Testar:
   - login por e-mail/senha
   - cadastro
   - login com Google.
