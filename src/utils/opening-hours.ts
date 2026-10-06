export type OpeningHours = { default?: [string, string, string][] };
export type OpeningState = "open" | "closed" | "unknown";
export const WEEKDAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;
const shanghaiClock = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Shanghai",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
function minutes(value: unknown, allowEndOfDay = false): number | undefined {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return;
  const [hour, minute] = value.split(":").map(Number);
  if (allowEndOfDay && hour === 24 && minute === 0) return 1440;
  if (hour > 23 || minute > 59) return;
  return hour * 60 + minute;
}
// A non-empty, valid default array represents a complete weekly schedule.
// An empty or malformed schedule cannot establish that a venue is closed.
export function getOpeningIntervals(
  hours: unknown,
): [string, string, string][] | undefined {
  if (!hours || typeof hours !== "object" || !("default" in hours)) return;
  const intervals = hours.default;
  if (!Array.isArray(intervals) || !intervals.length) return;
  if (
    !intervals.every((item) => {
      if (
        !Array.isArray(item) ||
        item.length !== 3 ||
        !WEEKDAYS.some((day) => day === item[0])
      )
        return false;
      const start = minutes(item[1]);
      const end = minutes(item[2], true);
      return start !== undefined && end !== undefined && start !== end;
    })
  )
    return;
  return intervals as [string, string, string][];
}
export function getOpeningState(hours: unknown, now: Date): OpeningState {
  const intervals = getOpeningIntervals(hours);
  if (!intervals || !Number.isFinite(now.getTime())) return "unknown";
  const parts = shanghaiClock.formatToParts(now);
  const day = parts.find((part) => part.type === "weekday")?.value;
  const dayIndex = WEEKDAYS.findIndex((value) => value === day);
  const previousDay = WEEKDAYS[(dayIndex + 6) % 7];
  const currentMinutes =
    Number(parts.find((part) => part.type === "hour")?.value) * 60 +
    Number(parts.find((part) => part.type === "minute")?.value);
  const open = intervals.some(([openingDay, opening, closing]) => {
    const start = minutes(opening)!;
    const end = minutes(closing, true)!;
    if (end > start)
      return (
        openingDay === day && currentMinutes >= start && currentMinutes < end
      );
    return (
      (openingDay === day && currentMinutes >= start) ||
      (openingDay === previousDay && currentMinutes < end)
    );
  });
  return open ? "open" : "closed";
}
export function isOpenNow(hours: unknown, now: Date): boolean {
  return getOpeningState(hours, now) === "open";
}
