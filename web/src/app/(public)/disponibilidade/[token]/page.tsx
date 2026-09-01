import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { monthLabel } from "@/lib/dates";
import { AvailabilityForm, type FormDate } from "./availability-form";

export const dynamic = "force-dynamic";

type FormPayload = {
  response_id: string;
  submitted_at: string | null;
  person: { full_name: string };
  team: { name: string };
  cycle: { year: number; month: number; status: string; closes_at: string | null };
  dates: FormDate[];
};

export default async function AvailabilityPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_availability_form", {
    p_token: token,
  });

  const payload = data as FormPayload | null;

  if (!payload) {
    return (
      <Card className="p-6 text-center">
        <h1 className="text-lg font-semibold text-zinc-900">Link inválido</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Confira o link com o seu coordenador.
        </p>
      </Card>
    );
  }

  const open = payload.cycle.status === "open";

  return (
    <Card className="p-6">
      <h1 className="text-lg font-semibold text-zinc-900">
        Disponibilidade — {monthLabel(payload.cycle.year, payload.cycle.month)}
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        {payload.person.full_name} · equipe {payload.team.name}
      </p>

      {!open ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          O período para informar disponibilidade deste mês está encerrado.
        </p>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">
          Marque os cultos em que você pode servir. Domingo conta manhã e noite
          juntos.
        </p>
      )}

      <AvailabilityForm
        token={token}
        dates={payload.dates}
        readOnly={!open}
        alreadySubmitted={Boolean(payload.submitted_at)}
      />
    </Card>
  );
}
