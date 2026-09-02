import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { WEEKDAY_LONG } from "@/lib/dates";
import { TemplateForm } from "./template-form";

export const dynamic = "force-dynamic";

export default async function RecorrenciasPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("event_templates")
    .select("id, name, weekday, default_start_time, active, event_template_teams(team_id)")
    .order("sort_order", { ascending: true });

  const { data: teams } = await supabase
    .from("teams")
    .select("id, name")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/cultos" className="text-sm text-link hover:underline">
          ← Cultos
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-fg">
          Recorrências
        </h1>
        <p className="text-sm text-fg-muted">
          Modelos usados por “Gerar cultos recorrentes”. O dia da semana é fixo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(templates ?? []).map((t) => (
          <Card key={t.id} className="p-5">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-soft">
              {WEEKDAY_LONG[t.weekday]}
            </div>
            <TemplateForm
              template={{
                id: t.id,
                name: t.name,
                default_start_time: t.default_start_time,
                active: t.active,
                teamIds: (t.event_template_teams ?? []).map((x) => x.team_id),
              }}
              teams={teams ?? []}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
