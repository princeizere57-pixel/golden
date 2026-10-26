// Module D: multi-dish timing orchestration. Schedules several dishes so they finish together,
// with only one *active* (hands-on) task at a time; *passive* tasks (simmering, roasting,
// resting) run in parallel while the cook does something else.

import type { Attention } from "@/lib/types";

export interface Task {
  id: string;
  dish: string;
  label: string;
  minutes: number;
  attention: Attention;
}

export interface ScheduledTask extends Task {
  /** Minutes from the start of cooking. */
  start: number;
  end: number;
}

export interface Schedule {
  tasks: ScheduledTask[];
  /** Minutes until everything is ready. */
  totalMinutes: number;
}

/**
 * Plans dishes (each an ordered list of tasks) backwards from a shared finish line.
 *
 * Each dish is laid out back to front so its last task ends as late as possible. Active tasks
 * claim the cook's hands; when two active tasks would overlap, the earlier one moves earlier
 * still. Passive tasks never block anything. The schedule is then shifted so it starts at 0.
 */
export function orchestrate(dishes: Task[][]): Schedule {
  const busy: Array<[number, number]> = []; // active intervals on a timeline ending at 0
  const placed: ScheduledTask[] = [];

  const overlapsBusy = (start: number, end: number) => busy.some(([s, e]) => start < e && s < end);

  // Longest dishes first: they constrain the schedule most.
  const ordered = [...dishes].sort((a, b) => total(b) - total(a));
  for (const dish of ordered) {
    let cursor = 0; // the dish's next task must end at or before this point
    for (const task of [...dish].reverse()) {
      let end = cursor;
      let start = end - task.minutes;
      if (task.attention === "active") {
        while (overlapsBusy(start, end)) {
          // Slide earlier until this task fits in a gap of the cook's time.
          const blocking = busy.filter(([s, e]) => start < e && s < end);
          end = Math.min(...blocking.map(([s]) => s));
          start = end - task.minutes;
        }
        busy.push([start, end]);
      }
      placed.push({ ...task, start, end });
      cursor = start;
    }
  }

  const earliest = Math.min(0, ...placed.map((t) => t.start));
  const tasks = placed
    .map((t) => ({ ...t, start: round(t.start - earliest), end: round(t.end - earliest) }))
    .sort((a, b) => a.start - b.start || a.end - b.end);
  return { tasks, totalMinutes: round(0 - earliest) };
}

const total = (dish: Task[]) => dish.reduce((sum, t) => sum + t.minutes, 0);
const round = (n: number) => Math.round(n * 100) / 100;
