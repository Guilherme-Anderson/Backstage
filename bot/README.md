# Bot de WhatsApp — leva 2 (ainda não implementado)

Este diretório vai hospedar o processo do bot (Baileys) que roda no **Railway**.

## Papel do bot

- Mantém a sessão do WhatsApp (número dedicado da equipe).
- Expõe `GET /health`, `GET /qr` (pareamento) e `POST /send` (segredo compartilhado).
- Faz *polling* de `public.whatsapp_outbox` (`status = 'queued'`) e envia as mensagens.
- Recebe mensagens: grava em `public.whatsapp_inbox`, casa telefone → pessoa,
  interpreta **SIM/NÃO** e atualiza `assignments` dos próximos 7 dias;
  em caso de "não", abre `swap_request` e avisa o coordenador.

## O que já está pronto para ele no banco

- Tabelas `whatsapp_outbox`, `whatsapp_inbox`, `whatsapp_targets`.
- Em **Configurações** do app dá para cadastrar o `chat_id` (`...@g.us`) de cada grupo.
- Os textos das mensagens estão em `web/src/lib/templates.ts` (funções puras,
  reaproveitáveis pelas Edge Functions).

## Stack pretendida

- Node 20 + TypeScript + Fastify + `@whiskeysockets/baileys`
- `Dockerfile` + `railway.json`
- Auth da sessão persistida em Supabase Storage ou numa tabela dedicada
- Usa a **service_role key** do Supabase (bypassa RLS)
