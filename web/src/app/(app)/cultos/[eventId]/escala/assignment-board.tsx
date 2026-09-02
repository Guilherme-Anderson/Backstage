"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, Badge, Select } from "@/components/ui";
import {
  ASSIGNMENT_STATUS_LABEL,
  ASSIGNMENT_STATUS_TONE,
} from "@/lib/constants";
import type { Database } from "@/lib/database.types";
import { assignPerson } from "./actions";

type Availability = "yes" | "no" | "unknown";

export type BoardTeam = {
  teamId: string;
  teamName: string;
  sort: number;
  canManage: boolean;
  roles: {
    assignmentId: string;
    roleName: string;
    roleSort: number;
    currentUserId: string | null;
    status: Database["public"]["Enums"]["assignment_status"];
  }[];
  members: {
    id: string;
    name: string;
    availability: Availability;
    elsewhere: string[];
  }[];
};

const AVAIL_MARK: Record<Availability, string> = {
  yes: "✓ disponível",
  no: "✗ indisponível",
  unknown: "— sem resposta",
};

export function AssignmentBoard({
  eventId,
  teams,
}: {
  eventId: string;
  teams: BoardTeam[];
}) {
  return (
    <div className="space-y-6">
      {teams.map((team) => (
        <Card key={team.teamId}>
          <CardHeader
            title={team.teamName}
            description={
              team.canManage
                ? "Escolha uma pessoa para cada função."
                : "Você não coordena esta equipe — somente leitura."
            }
          />
          <div className="divide-y divide-border-soft">
            {team.roles.length === 0 ? (
              <p className="px-5 py-4 text-sm text-fg-soft">
                Sem funções ativas.
              </p>
            ) : (
              team.roles.map((role) => (
                <RoleRow
                  key={role.assignmentId}
                  eventId={eventId}
                  role={role}
                  members={team.members}
                  canManage={team.canManage}
                />
              ))
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

function RoleRow({
  eventId,
  role,
  members,
  canManage,
}: {
  eventId: string;
  role: BoardTeam["roles"][number];
  members: BoardTeam["members"];
  canManage: boolean;
}) {
  const [pending, start] = useTransition();
  const [value, setValue] = useState(role.currentUserId ?? "");
  const selected = members.find((m) => m.id === value);

  function onChange(next: string) {
    setValue(next);
    start(() =>
      assignPerson(eventId, role.assignmentId, next === "" ? null : next),
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3">
      <div className="w-40 shrink-0 text-sm text-fg-muted">{role.roleName}</div>
      <div className="min-w-[220px] flex-1">
        {canManage ? (
          <Select
            value={value}
            disabled={pending}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">— em aberto —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} · {AVAIL_MARK[m.availability]}
                {m.elsewhere.length ? ` · já em ${m.elsewhere.join(", ")}` : ""}
              </option>
            ))}
          </Select>
        ) : (
          <span className="text-sm font-medium text-fg">
            {members.find((m) => m.id === role.currentUserId)?.name ??
              "em aberto"}
          </span>
        )}
      </div>
      <Badge tone={ASSIGNMENT_STATUS_TONE[role.status]}>
        {ASSIGNMENT_STATUS_LABEL[role.status]}
      </Badge>
      {selected && selected.availability === "no" ? (
        <span className="text-xs text-red-600 dark:text-red-400">
          Atenção: marcou indisponível
        </span>
      ) : null}
      {selected && selected.elsewhere.length ? (
        <span className="text-xs text-amber-600 dark:text-amber-400">
          Já escalado neste dia
        </span>
      ) : null}
    </div>
  );
}
