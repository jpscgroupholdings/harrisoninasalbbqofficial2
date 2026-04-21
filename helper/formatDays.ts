import { DAYS } from "@/app/admin/(protected)/settings/page";
import { Days } from "@/hooks/api/useSettings";

export function formatDays(days: Days[]) {
  if (!days.length) return "No days selected";

  const sorted = [...days].sort((a, b) => DAYS.indexOf(a) - DAYS.indexOf(b));

  // Group consecutive days into runs
  const runs: Days[][] = [];
  let current: Days[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (DAYS.indexOf(curr) - DAYS.indexOf(prev) === 1) {
      // Consecutive — extend the current run
      current.push(curr);
    } else {
      // Gap — save current run, start a new one
      runs.push(current);
      current = [curr];
    }
  }
  runs.push(current); // push the last run

  // Format each run: single day → "Mon", range → "Mon-Wed"
  return runs
    .map((run) =>
      run.length === 1 ? run[0] : `${run[0]}-${run[run.length - 1]}`
    )
    .join(", ");
}