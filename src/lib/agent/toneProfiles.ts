let activeTone: string = "conversational";

export function applyToneProfile(tone: string) {
  activeTone = tone;
  if (typeof document !== "undefined") {
    document.documentElement.dataset.eagentTone = tone;
  } else {
    console.info("[tone] applied profile", tone);
  }
}

export function getActiveToneProfile() {
  return activeTone;
}
