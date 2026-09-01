import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { formatLong, formatTime } from "@/lib/dates";
import { ConfirmForm } from "./confirm-form";

export const dynamic = "force-dynamic";

type Info = {
  assignment_id: string;
  status: "unfilled" | "pending" | "confirmed" | "declined";
  person: string | null;
  team: string;
  role: string;
  event: { title: string; event_date: string; start_time: string | null };
};

export default async function ConfirmPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_confirm_info", { p_token: token });
  const info = data as Info | null;

  if (!info) {
    return (
      <Card className="p-6 text-center">
        <h1 className="text-lg font-semibold text-zinc-900">Link inválido</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Fale com o seu coordenador.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h1 className="text-lg font-semibold text-zinc-900">Confirmar presença</h1>
      <div className="mt-3 rounded-lg bg-zinc-50 p-4 text-sm">
        <div className="font-medium text-zinc-900">{info.event.title}</div>
        <div className="capitalize text-zinc-600">
          {formatLong(info.event.event_date)}
          {info.event.start_time
            ? ` • ${formatTime(info.event.start_time)}`
            : ""}
        </div>
        <div className="mt-2 text-zinc-600">
          {info.team} · {info.role}
          {info.person ? ` · ${info.person}` : ""}
        </div>
      </div>
      <ConfirmForm token={token} status={info.status} />
    </Card>
  );
}
