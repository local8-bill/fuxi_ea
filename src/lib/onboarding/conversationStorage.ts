type ConversationMessage = {
  role: "assistant" | "user" | "system";
  content: string;
};

const STORAGE_PREFIX = "uxshell:onboarding:conversation:";
const MAX_MESSAGES = 40;

function getKey(projectId: string) {
  return `${STORAGE_PREFIX}${projectId}`;
}

export function saveOnboardingConversation(projectId: string, messages: ConversationMessage[]) {
  if (typeof window === "undefined") return;
  const trimmed = messages.slice(-MAX_MESSAGES);
  try {
    window.localStorage.setItem(getKey(projectId), JSON.stringify(trimmed));
  } catch {
    // ignore quota errors
  }
}

export function loadOnboardingConversation(projectId: string): ConversationMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((msg) => typeof msg?.content === "string" && typeof msg?.role === "string");
  } catch {
    return [];
  }
}

export function clearOnboardingConversation(projectId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getKey(projectId));
}

export type { ConversationMessage };
