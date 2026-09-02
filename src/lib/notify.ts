// Client-side browser notifications for new visitor messages.
// Uses the Notification API + a short beep + optional tab-title flash.

let _permission: NotificationPermission | null = null;

export function ensureNotificationPermission(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (_permission != null) return _permission === "granted";
  _permission = Notification.permission;
  if (Notification.permission === "default") {
    Notification.requestPermission().then((p) => {
      _permission = p;
    });
  }
  return _permission === "granted";
}

export function showNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      tag: "natasun-message",
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // ignore
  }
}

let audioCtx: AudioContext | null = null;
export function playNotificationSound() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // ignore
  }
}

export function notifyAgent(message: { visitorName?: string; content?: string }) {
  const title = message.visitorName || "New message";
  const body = (message.content || "").slice(0, 120);
  // If the inbox tab isn't focused, alert the agent with a system
  // notification + sound. When focused, the unread badge is enough.
  if (typeof document !== "undefined" && document.hidden) {
    showNotification(title, body);
    playNotificationSound();
  } else {
    playNotificationSound();
  }
}
