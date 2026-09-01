import { describe, it, expect } from "vitest";
import {
  datesOfMonthByWeekday,
  daysInMonth,
  nextMonth,
  weekdayOf,
  weekRange,
  formatShort,
  monthLabel,
} from "./dates";

describe("daysInMonth", () => {
  it("lida com anos bissextos", () => {
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 10)).toBe(31);
  });
});

describe("nextMonth", () => {
  it("avança dentro do ano", () => {
    expect(nextMonth("2026-09-01")).toEqual({ year: 2026, month: 10 });
  });
  it("vira o ano em dezembro", () => {
    expect(nextMonth("2026-12-20")).toEqual({ year: 2027, month: 1 });
  });
});

describe("datesOfMonthByWeekday", () => {
  it("acha todas as quartas de outubro/2026", () => {
    const wed = datesOfMonthByWeekday(2026, 10, 3);
    expect(wed).toEqual([
      "2026-10-07",
      "2026-10-14",
      "2026-10-21",
      "2026-10-28",
    ]);
    for (const d of wed) expect(weekdayOf(d)).toBe(3);
  });
  it("acha todos os domingos de outubro/2026", () => {
    const sun = datesOfMonthByWeekday(2026, 10, 0);
    expect(sun).toEqual([
      "2026-10-04",
      "2026-10-11",
      "2026-10-18",
      "2026-10-25",
    ]);
    for (const d of sun) expect(weekdayOf(d)).toBe(0);
  });
});

describe("weekRange", () => {
  it("segunda a domingo contendo a data", () => {
    const { start, end } = weekRange("2026-09-03"); // quinta
    expect(start).toBe("2026-08-31");
    expect(end).toBe("2026-09-06");
    expect(weekdayOf(start)).toBe(1);
    expect(weekdayOf(end)).toBe(0);
    expect(start <= "2026-09-03" && "2026-09-03" <= end).toBe(true);
  });
});

describe("formatação", () => {
  it("formatShort", () => {
    expect(formatShort("2026-10-07")).toBe("qua, 07/10");
  });
  it("monthLabel", () => {
    expect(monthLabel(2026, 10)).toBe("outubro de 2026");
  });
});
