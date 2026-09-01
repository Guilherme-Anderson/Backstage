"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { deleteEvent } from "../actions";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="danger"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            "Excluir este evento? A escala e as informações dele serão perdidas.",
          )
        ) {
          start(() => deleteEvent(eventId));
        }
      }}
    >
      Excluir
    </Button>
  );
}
