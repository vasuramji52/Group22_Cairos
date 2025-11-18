const STORAGE_PREFIX = "kairos:getting-started";
const SCHEDULE_TASK = "schedule";
export const ONBOARDING_PROGRESS_EVENT = "kairos:onboarding-progress";

type TaskName = typeof SCHEDULE_TASK;

function readStoredUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem("user_data");
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    const userId = parsed?._id;
    return typeof userId === "string" ? userId : null;
  } catch {
    return null;
  }
}

function buildKey(task: TaskName, userId: string | null) {
  const suffix = userId ?? "anon";
  return `${STORAGE_PREFIX}:${task}:${suffix}`;
}

function resolveUserId(userId?: string | null) {
  if (userId) {
    return userId;
  }
  return readStoredUserId();
}

export function getScheduleTaskComplete(userId?: string | null): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    const key = buildKey(SCHEDULE_TASK, resolveUserId(userId));
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

export function markScheduleTaskComplete(userId?: string | null) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const resolved = resolveUserId(userId);
    const key = buildKey(SCHEDULE_TASK, resolved);
    window.localStorage.setItem(key, "true");
    const detail = { task: SCHEDULE_TASK, userId: resolved };
    window.dispatchEvent(
      new CustomEvent(ONBOARDING_PROGRESS_EVENT, { detail })
    );
  } catch {
    // Ignore write failures (e.g., storage disabled)
  }
}

export type OnboardingProgressDetail = {
  task: TaskName;
  userId: string | null;
};
