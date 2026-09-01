import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui";
import { monthLabel, formatShort } from "@/lib/dates";
import { CopyLinkButton } from "./copy-link-button";
import { CycleStatusToggle } from "./cycle-status-toggle";

export const dynamic = "force-dynamic";

export default async function CyclePage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  await requireSession();
  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("availability_cycles")
    .select("id, year, month, status, team_id, teams(name)")
    .eq("id", cycleId)
    .maybeSingle();
  if (!cycle) notFound();

  const { data: responses } = await supabase
    .from("availability_responses")
    .select("id, token, submitted_at, users(full_name)")
    .eq("cycle_id", cycleId);

  const respIds = (responses ?? []).map((r) => r.id);
  const { data: dateRows } = respIds.length
    ? await supabase
        .from("availability_dates")
        .select("response_id, service_date, block, available")
        .in("response_id", respIds)
        .order("service_date", { ascending: true })
    : { data: [] };

  const colKeys: { key: string; date: string; block: string }[] = [];
  const seen = new Set<string>();
  for (const d of dateRows ?? []) {
    const key = `${d.service_date}|${d.block}`;
    if (!seen.has(key)) {
      seen.add(key);
      colKeys.push({ key, date: d.service_date, block: d.block });
    }
  }
  colKeys.sort((a, b) => a.date.localeCompare(b.date));

  const cell = new Map<string, boolean>();
  for (const d of dateRows ?? []) {
    cell.set(`${d.response_id}|${d.service_date}|${d.block}`, d.available);
  }

  let base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  if (!base) {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    const proto = h.get("x-forwarded-proto") ?? "https";
    if (host) base = `${proto}://${host}`;
  }

  const rows = (responses ?? []).slice().sort((a, b) =>
    (a.users?.full_name ?? "").localeCompare(b.users?.full_name ?? ""),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/disponibilidade"
            className="text-sm text-sky-600 hover:underline"
          >
            ← Disponibilidade
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900 capitalize">
            {cycle.teams?.name} — {monthLabel(cycle.year, cycle.month)}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={cycle.status === "open" ? "green" : "neutral"}>
            {cycle.status === "open" ? "Aberto" : "Fechado"}
          </Badge>
          <CycleStatusToggle cycleId={cycle.id} status={cycle.status} />
        </div>
      </div>

      <Card>
        <CardHeader
          title="Respostas"
          description="✓ disponível · ✗ não · vazio = ainda não respondeu aquele dia."
        />
        {rows.length === 0 ? (
          <EmptyState>Nenhum membro ativo nesta equipe.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                  <th className="px-4 py-2 font-medium">Pessoa</th>
                  <th className="px-3 py-2 font-medium">Respondeu?</th>
                  {colKeys.map((c) => (
                    <th key={c.key} className="px-3 py-2 text-center font-medium">
                      {formatShort(c.date)}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-medium">Link</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-2 font-medium text-zinc-900">
                      {r.users?.full_name}
                    </td>
                    <td className="px-3 py-2">
                      {r.submitted_at ? (
                        <Badge tone="green">Sim</Badge>
                      ) : (
                        <Badge tone="amber">Não</Badge>
                      )}
                    </td>
                    {colKeys.map((c) => {
                      const v = cell.get(`${r.id}|${c.date}|${c.block}`);
                      return (
                        <td
                          key={c.key}
                          className="px-3 py-2 text-center text-base"
                        >
                          {v === true ? (
                            <span className="text-emerald-600">✓</span>
                          ) : v === false && r.submitted_at ? (
                            <span className="text-red-500">✗</span>
                          ) : (
                            <span className="text-zinc-300">–</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2">
                      <CopyLinkButton
                        url={`${base}/disponibilidade/${r.token}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
