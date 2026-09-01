"use client";

import { useActionState, useState, useTransition } from "react";
import {
  Card,
  CardHeader,
  Badge,
  Button,
  Field,
  Input,
  Textarea,
  FormError,
  EmptyState,
} from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { formatPhoneBR } from "@/lib/utils";
import {
  addMember,
  addRole,
  removeMember,
  setMemberFlag,
  setRoleActive,
  updateTeam,
} from "./actions";

type MemberRow = {
  id: string;
  is_coordinator: boolean;
  active: boolean;
  users: {
    id: string;
    full_name: string;
    phone_e164: string | null;
    email: string | null;
    role: string;
    active: boolean;
  } | null;
};
type RoleRow = { id: string; name: string; active: boolean };
type TeamRow = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
};

export function TeamManager({
  team,
  members,
  roles,
  canManage,
  isAdmin,
}: {
  team: TeamRow;
  members: MemberRow[];
  roles: RoleRow[];
  canManage: boolean;
  isAdmin: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* -------------------- Membros -------------------- */}
        <Card>
          <CardHeader
            title="Membros"
            description="Pessoas que servem nesta equipe."
          />
          {members.length === 0 ? (
            <EmptyState>Nenhum membro ainda.</EmptyState>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                >
                  <div>
                    <div className="font-medium text-zinc-900">
                      {m.users?.full_name}
                      {m.is_coordinator ? (
                        <Badge tone="sky" className="ml-2">
                          Coordenador
                        </Badge>
                      ) : null}
                      {!m.active ? (
                        <Badge className="ml-2">Inativo</Badge>
                      ) : null}
                    </div>
                    <div className="text-sm text-zinc-500">
                      {formatPhoneBR(m.users?.phone_e164)}
                      {m.users?.email ? ` · ${m.users.email}` : ""}
                    </div>
                  </div>
                  {canManage ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          start(() =>
                            setMemberFlag(
                              team.id,
                              m.id,
                              "is_coordinator",
                              !m.is_coordinator,
                            ),
                          )
                        }
                      >
                        {m.is_coordinator
                          ? "Remover coord."
                          : "Tornar coord."}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          start(() =>
                            setMemberFlag(team.id, m.id, "active", !m.active),
                          )
                        }
                      >
                        {m.active ? "Inativar" : "Reativar"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pending}
                        onClick={() => {
                          if (confirm("Remover esta pessoa da equipe?"))
                            start(() => removeMember(team.id, m.id));
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {canManage ? (
            <div className="border-t border-zinc-100 p-5">
              <AddMemberForm teamId={team.id} isAdmin={isAdmin} />
            </div>
          ) : null}
        </Card>

        {/* -------------------- Funções -------------------- */}
        <Card>
          <CardHeader
            title="Funções"
            description="Cada função vira uma vaga por culto (1 pessoa por função)."
          />
          {roles.length === 0 ? (
            <EmptyState>Nenhuma função cadastrada.</EmptyState>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {roles.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <span className="text-zinc-900">
                    {r.name}
                    {!r.active ? <Badge className="ml-2">Inativa</Badge> : null}
                  </span>
                  {canManage ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        start(() => setRoleActive(team.id, r.id, !r.active))
                      }
                    >
                      {r.active ? "Inativar" : "Reativar"}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          {canManage ? (
            <div className="border-t border-zinc-100 p-5">
              <AddRoleForm teamId={team.id} />
            </div>
          ) : null}
        </Card>
      </div>

      {/* -------------------- Dados da equipe (admin) -------------------- */}
      {isAdmin ? (
        <Card className="h-fit p-5">
          <h2 className="mb-3 text-base font-semibold text-zinc-900">
            Dados da equipe
          </h2>
          <EditTeamForm team={team} />
        </Card>
      ) : null}
    </div>
  );
}

function AddMemberForm({
  teamId,
  isAdmin,
}: {
  teamId: string;
  isAdmin: boolean;
}) {
  const [state, action] = useActionState(addMember.bind(null, teamId), null);
  const [asLogin, setAsLogin] = useState(false);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome completo" htmlFor="full_name">
          <Input id="full_name" name="full_name" required />
        </Field>
        <Field label="WhatsApp" htmlFor="phone" hint="Com DDD">
          <Input id="phone" name="phone" placeholder="(11) 99999-8888" />
        </Field>
      </div>
      {isAdmin ? (
        <>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              name="as_login"
              checked={asLogin}
              onChange={(e) => setAsLogin(e.target.checked)}
            />
            Dar acesso ao app (coordenador desta equipe)
          </label>
          {asLogin ? (
            <Field label="E-mail de acesso" htmlFor="email">
              <Input id="email" name="email" type="email" />
            </Field>
          ) : null}
        </>
      ) : (
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="is_coordinator" />
          É coordenador desta equipe
        </label>
      )}
      <FormError>{state?.error}</FormError>
      <SubmitButton size="sm">Adicionar membro</SubmitButton>
    </form>
  );
}

function AddRoleForm({ teamId }: { teamId: string }) {
  const [state, action] = useActionState(addRole.bind(null, teamId), null);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">

      <div className="flex-1">
        <Field label="Nova função" htmlFor="role_name">
          <Input id="role_name" name="name" placeholder="Ex.: Câmera 1" required />
        </Field>
      </div>
      <SubmitButton size="sm">Adicionar</SubmitButton>
      {state?.error ? (
        <p className="w-full text-sm text-red-600">{state.error}</p>
      ) : null}
    </form>
  );
}

function EditTeamForm({ team }: { team: TeamRow }) {
  const [state, action] = useActionState(updateTeam.bind(null, team.id), null);
  return (
    <form action={action} className="space-y-3">
      <Field label="Nome" htmlFor="t_name">
        <Input id="t_name" name="name" defaultValue={team.name} required />
      </Field>
      <Field label="Descrição" htmlFor="t_desc">
        <Textarea
          id="t_desc"
          name="description"
          defaultValue={team.description ?? ""}
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="active" defaultChecked={team.active} />
        Equipe ativa
      </label>
      <FormError>{state?.error}</FormError>
      {state?.ok ? (
        <p className="text-sm text-emerald-600">Salvo.</p>
      ) : null}
      <SubmitButton size="sm">Salvar</SubmitButton>
    </form>
  );
}
