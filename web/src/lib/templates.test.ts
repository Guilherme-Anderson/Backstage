import { describe, it, expect } from "vitest";
import {
  buildEventSummary,
  buildWeeklyReminder,
  buildAvailabilityRequest,
} from "./templates";

describe("buildEventSummary", () => {
  const text = buildEventSummary(
    {
      title: "Domingo à Noite",
      date: "2026-10-04",
      time: "18:00:00",
      assignments: [
        { team: "Vídeo", role: "Operação", person: "Ana", confirmed: true, declined: false },
        { team: "Áudio", role: "Mesa", person: null, confirmed: false, declined: false },
        { team: "Áudio", role: "Retorno", person: "João", confirmed: false, declined: true },
      ],
    },
    { preacher: "Pr. Lucas", songs: "Música A\nMúsica B", service_order: "1. Abertura" },
  );

  it("inclui título, data e horário", () => {
    expect(text).toContain("DOMINGO À NOITE");
    expect(text).toContain("domingo, 4 de outubro de 2026");
    expect(text).toContain("18:00");
  });
  it("inclui preletor e músicas", () => {
    expect(text).toContain("*Preletor:* Pr. Lucas");
    expect(text).toContain("• Música A");
    expect(text).toContain("• Música B");
  });
  it("marca confirmado, aberto e recusado", () => {
    expect(text).toContain("Ana ✅");
    expect(text).toContain("_(em aberto)_");
    expect(text).toContain("João ❌");
  });
  it("agrupa por equipe", () => {
    expect(text).toContain("*Vídeo*");
    expect(text).toContain("*Áudio*");
  });
});

describe("buildWeeklyReminder", () => {
  it("lista os cultos e pede confirmação", () => {
    const t = buildWeeklyReminder(
      "Ana",
      [{ title: "Culto de Quarta", date: "2026-10-07", time: "19:30:00", role: "Operação" }],
      ["https://x/c/abc"],
    );
    expect(t).toContain("Oi, Ana!");
    expect(t).toContain("Culto de Quarta");
    expect(t).toContain("Confirmar: https://x/c/abc");
    expect(t).toContain("SIM");
  });
});

describe("buildAvailabilityRequest", () => {
  it("cita o mês e o link", () => {
    const t = buildAvailabilityRequest("Áudio", 2026, 11, "https://x/d/tok");
    expect(t).toContain("novembro de 2026");
    expect(t).toContain("https://x/d/tok");
    expect(t).toContain("Áudio");
  });
});
