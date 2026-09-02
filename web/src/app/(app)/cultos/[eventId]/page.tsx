import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  Badge,
  EmptyState,
  ButtonLink,
} from "@/components/ui";
import { formatLong, formatTime } from "@/lib/dates";
import {
  ASSIGNMENT_STATUS_LABEL,
  ASSIGNMENT_STATUS_TONE,
} from "@/lib/constants";
import {
  loadConsolidatedEvent,
  toTemplateEvent,
} from "@/lib/events";
import { buildEventSummary } from "@/lib/templates";
import { SummaryPreview } from "./summary-preview";
import { EventInfoForm } from "./event-info-form";
import { EventBasicsForm } from "./event-basics-form";
import { DeleteEventButton } from "./delete-event-button";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await requireSession();
  const supabase = await createClient();

  const ev = await loadConsolidatedEvent(supabase, eventId);
  if (!ev) notFound();

  const summaryText = buildEventSummary(toTemplateEvent(ev), ev.info ?? {});
  const canEditAnything = session.isAdmin || session.coordinatorTeamIds.length > 0;
  const canDelete =
    session.isAdmin || (ev.kind === "extra" && canEditAnything);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/cultos" className="text-sm text-sky-600 dark:text-sky-400 hover:underline">
            ← Cultos
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-fg">
            {ev.title}
            {ev.kind === "extra" ? (
              <Badge tone="sky" className="ml-2 align-middle">
                Extra
              </Badge>
            ) : null}
          </h1>
          <p className="text-sm text-fg-muted">
            {formatLong(ev.date)}
            {ev.time ? ` • ${formatTime(ev.time)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href={`/cultos/${ev.id}/escala`} size="sm">
            Montar escala
          </ButtonLink>
          {canDelete ? <DeleteEventButton eventId={ev.id} /> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader
              title="Escala completa"
              description="Todas as equipes deste culto."
            />
            {ev.teams.length === 0 ? (
              <EmptyState>Nenhuma equipe neste evento.</EmptyState>
            ) : (
              <div className="divide-y divide-border-soft">
                {ev.teams.map((team) => (
                  <div key={team.teamId} className="px-5 py-4">
                    <h3 className="mb-2 text-sm font-semibold text-fg">
                      {team.teamName}
                    </h3>
                    <ul className="space-y-1.5">
                      {team.assignments.map((a) => (
                        <li
                          key={a.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-fg-muted">{a.roleName}</span>
                          <span className="flex items-center gap-2">
                            <span
                              className={
                                a.personName
                                  ? "font-medium text-fg"
                                  : "text-fg-soft"
                              }
                            >
                              {a.personName ?? "em aberto"}
                            </span>
                            <Badge tone={ASSIGNMENT_STATUS_TONE[a.status]}>
                              {ASSIGNMENT_STATUS_LABEL[a.status]}
                            </Badge>
                          </span>
                        </li>
                      ))}
                      {team.assignments.length === 0 ? (
                        <li className="text-sm text-fg-soft">
                          Sem funções ativas nesta equipe.
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-base font-semibold text-fg">
              Informações do culto
            </h2>
            <p className="mb-4 text-sm text-fg-muted">
              Preletor, músicas, ordem do culto — editável por qualquer
              coordenador ou administrador.
            </p>
            {canEditAnything ? (
              <EventInfoForm eventId={ev.id} info={ev.info} />
            ) : (
              <p className="text-sm text-fg-muted">Somente leitura.</p>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="mb-1 text-base font-semibold text-fg">
              Prévia do resumo (D-1)
            </h2>
            <p className="mb-3 text-sm text-fg-muted">
              Texto que será enviado no WhatsApp um dia antes (leva 2). Já dá para
              copiar e enviar manualmente.
            </p>
            <SummaryPreview text={summaryText} />
          </Card>

          {session.isAdmin || ev.kind === "extra" ? (
            <Card className="p-5">
              <h2 className="mb-3 text-base font-semibold text-fg">
                Dados do evento
              </h2>
              <EventBasicsForm
                eventId={ev.id}
                title={ev.title}
                date={ev.date}
                time={ev.time}
              />
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
