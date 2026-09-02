import type { NextConfig } from "next";

/**
 * Valores públicos do Supabase (chave publishable — embutida no navegador por
 * design, protegida por RLS). Ficam aqui para o deploy funcionar sem configurar
 * variáveis na Vercel. Se você definir as variáveis no painel da Vercel, elas
 * têm prioridade (o `process.env.*` abaixo as lê).
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://pmvhvzibfsdjjhayhymr.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_Ap2SYSw-Qm3KJ_PZJVj_vA_eE4J_dy2";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
