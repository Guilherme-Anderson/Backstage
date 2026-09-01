# Backstage — App de Escalas

Controle das escalas das equipes de mídia da igreja (subequipes da **Backstage**:
Vídeo, Redação, Áudio, Fotografia, Transmissão — Iluminação no futuro).
Substitui o controle manual no WhatsApp, mantendo a integração com os grupos.

## Estado atual (leva 1)

App web completo, com dados inseridos manualmente:

- Autenticação por e-mail + senha (só admin e coordenadores logam).
- Cadastro de equipes, membros e funções.
- Cultos recorrentes (quarta / domingo) + eventos extras multi-equipe.
- Informações do culto (preletor, músicas, ordem do culto, participações, anotações).
- Ciclo mensal de disponibilidade + formulário público por link (sem login).
- Montagem manual da escala (1 pessoa por função), cruzando com a disponibilidade.
- Visão consolidada do culto + **prévia do texto do resumo D-1**.
- Confirmação de presença por link + fluxo de troca/substituição.

**Fora desta leva (leva 2):** bot de WhatsApp (Baileys/Railway) e disparos
automáticos (`pg_cron` + Edge Functions). O schema já contempla tudo
(`whatsapp_outbox` / `whatsapp_inbox` / `whatsapp_targets`).

## Estrutura do repositório

```
web/        Next.js 16 (App Router) + TypeScript + Tailwind → Vercel
supabase/   migrations SQL (já aplicadas ao projeto remoto) + config
bot/        (leva 2) processo Baileys → Railway
```

## Rodando o `web` localmente

```bash
cd web
cp .env.example .env.local   # já vem com a URL e a chave pública do projeto
npm install
npm run dev
```

`.env.local`:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fetrngpniecxwdmjgwkv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | chave *publishable* (`sb_publishable_…`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` (prod: a URL da Vercel) |

Scripts: `npm run dev`, `npm run build`, `npm test`, `npm run lint`, `npm run typecheck`.

## Deploy na Vercel

1. Importe este repositório na Vercel e defina **Root Directory = `web`**.
2. Variáveis de ambiente (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` = a URL final (ex.: `https://backstage.vercel.app`)
3. No **Supabase → Authentication → URL Configuration**:
   - **Site URL** = a URL da Vercel
   - **Redirect URLs** += `http://localhost:3000/auth/callback` e
     `https://SEU-APP.vercel.app/auth/callback`
4. (Opcional, recomendado) **Authentication → Providers → Email**: desligar
   "Confirm email" — o cadastro já é restrito a e-mails pré-autorizados.

Detalhes do banco em [`supabase/README.md`](supabase/README.md).

## Primeiro acesso

1. O admin `acesgptgg@gmail.com` já existe (seed). Abra `/criar-acesso`, use esse
   e-mail e defina a senha.
2. Em **Configurações**, cadastre o 2º admin.
3. Em **Equipes**, para cada subequipe: adicione membros (nome + WhatsApp) e, se
   for coordenador com acesso ao app, marque "Dar acesso" e informe o e-mail.
   Essa pessoa entra por `/criar-acesso`.

## Checklist de teste ponta a ponta

Fluxos numerados conforme a especificação.

### Fluxo 2 — montagem da escala
- [ ] Como **admin**: `Cultos` → escolher o mês → **Gerar cultos recorrentes**.
      Confere quarta (Vídeo+Áudio) e domingos (manhã sem Fotografia, noite todas).
- [ ] Criar um **evento extra** escolhendo 2+ equipes.
- [ ] Abrir um culto → **Montar escala** → preencher uma função. O `select` mostra
      disponibilidade e aviso "já escalado neste dia".
- [ ] Tentar deixar 2 pessoas na mesma função — não é possível (1 por função).

### Fluxo 4 — disponibilidade
- [ ] `Disponibilidade` → **Abrir ciclo** para uma equipe no mês seguinte.
- [ ] Copiar o link de um membro, abrir **sem estar logado**, marcar quarta/domingo,
      enviar; reabrir e alterar.
- [ ] Na tela do ciclo, a matriz mostra ✓/✗ e quem respondeu.
- [ ] Fechar o ciclo → o formulário público fica somente leitura.

### Fluxo 5 — confirmação e troca
- [ ] Escalar alguém, abrir `/confirmar/<token>` (o token aparece via prévia/relatório;
      na leva 2 vai por WhatsApp) e escolher **Não vou poder**.
- [ ] O status vira "Não poderá" e aparece em **Trocas** e no **Painel**.
- [ ] Em `Cultos → culto → Montar escala`, trocar a pessoa da vaga recusada; a troca
      é marcada como resolvida.

### Fluxo 6 (base) — visão consolidada / resumo D-1
- [ ] Na tela do culto, preencher **Informações do culto**.
- [ ] A **Prévia do resumo (D-1)** reflete escala + infos; botão "Copiar texto".

### Permissões
- [ ] Logado como **coordenador de 1 equipe**: só edita membros/funções/escala da
      própria equipe; consegue ver (mas não editar) as demais na visão consolidada.
- [ ] `Configurações` só abre para admin.

## Licença / uso

Projeto interno da equipe de mídia da igreja.
