"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function CopyLinkButton({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* ignore */
        }
      }}
    >
      {done ? "Copiado!" : "Copiar link"}
    </Button>
  );
}
