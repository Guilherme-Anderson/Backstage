"use client";

import { useActionState, useState } from "react";
import { Field, Select, FormError } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { openCycle } from "./actions";

export function OpenCycleForm({
  teams,
  months,
}: {
  teams: { id: string; name: string }[];
  months: { year: number; month: number; label: string }[];
}) {
  const [state, action] = useActionState(openCycle, null);
  const [pick, setPick] = useState(`${months[0].year}-${months[0].month}`);
  const [y, m] = pick.split("-");

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-[180px] flex-1">
        <Field label="Equipe" htmlFor="team_id">
          <Select id="team_id" name="team_id" required>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="min-w-[180px] flex-1">
        <Field label="Mês" htmlFor="month_pick">
          <Select
            id="month_pick"
            value={pick}
            onChange={(e) => setPick(e.target.value)}
          >
            {months.map((mo) => (
              <option
                key={`${mo.year}-${mo.month}`}
                value={`${mo.year}-${mo.month}`}
              >
                {mo.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <input type="hidden" name="year" value={y} />
      <input type="hidden" name="month" value={m} />
      <SubmitButton>Abrir ciclo</SubmitButton>
      {state?.error ? (
        <div className="w-full">
          <FormError>{state.error}</FormError>
        </div>
      ) : null}
    </form>
  );
}
