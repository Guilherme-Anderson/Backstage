"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function SummaryPreview({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-3 text-xs text-zinc-800">
        {text}
      </pre>
      <Button
        variant="secondary"
        size="sm"
        className="mt-2"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {
            /* ignore */
          }
        }}
      >
        {copied ? "Copiado!" : "Copiar texto"}
      </Button>
    </div>
  );
}
