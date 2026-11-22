// Web Audio API Synthesizer for instant appointment and reception alert chimes
// Does not depend on external MP3 files and works reliably on all modern browsers

const SOUND_STORAGE_KEY = 'maria_sound_alerts_enabled';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundAlertEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(SOUND_STORAGE_KEY);
    if (saved !== null) return saved === 'true';
  } catch {
    // ignore
  }
  return true;
}

export function setSoundAlertEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
  } catch {
    // ignore
  }
}

/**
 * Campana de notificación ascendente (Do5 - Mi5 - Sol5) para nueva cita o comprobante recibido
 */
export function playNewBookingChime(): void {
  if (!isSoundAlertEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 523.25, time: 0.0, duration: 0.18 }, // C5
    { freq: 659.25, time: 0.12, duration: 0.18 }, // E5
    { freq: 783.99, time: 0.24, duration: 0.45 }, // G5
  ];

  const now = ctx.currentTime;
  notes.forEach((n) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(n.freq, now + n.time);

    // Envolvente suave para un sonido cristalino y elegante
    gain.gain.setValueAtTime(0, now + n.time);
    gain.gain.linearRampToValueAtTime(0.28, now + n.time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + n.time);
    osc.stop(now + n.time + n.duration);
  });
}

/**
 * Campana de confirmación y cobro exitoso (Mi5 - Sol5 - Do6)
 */
export function playSuccessChime(): void {
  if (!isSoundAlertEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 659.25, time: 0.0, duration: 0.15 },  // E5
    { freq: 783.99, time: 0.12, duration: 0.15 }, // G5
    { freq: 1046.5, time: 0.22, duration: 0.4 },  // C6
  ];

  const now = ctx.currentTime;
  notes.forEach((n) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(n.freq, now + n.time);

    gain.gain.setValueAtTime(0, now + n.time);
    gain.gain.linearRampToValueAtTime(0.24, now + n.time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + n.time);
    osc.stop(now + n.time + n.duration);
  });
}

/**
 * Campana doble de alerta de atención (Sol5 - Do6) para avisos urgentes o reprogramación
 */
export function playAttentionChime(): void {
  if (!isSoundAlertEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 783.99, time: 0.0, duration: 0.15 }, // G5
    { freq: 1046.5, time: 0.14, duration: 0.35 }, // C6
  ];

  const now = ctx.currentTime;
  notes.forEach((n) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(n.freq, now + n.time);

    gain.gain.setValueAtTime(0, now + n.time);
    gain.gain.linearRampToValueAtTime(0.25, now + n.time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + n.time);
    osc.stop(now + n.time + n.duration);
  });
}
