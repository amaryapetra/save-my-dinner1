/**
 * Web Audio API gentle kitchen rescue chime.
 * Generates an audible chime without external asset dependencies.
 * Handles iOS Safari / Android Chrome AudioContext suspension & unlocking.
 */

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * Call on any user tap (e.g. clicking timer start or test button)
 * to ensure AudioContext is primed and unlocked on mobile browsers.
 */
export function unlockAudio() {
  getAudioContext();
}

export function playTimerChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // In case context was suspended
    if (ctx.state === 'suspended') {
      ctx.resume().then(renderTones).catch(renderTones);
    } else {
      renderTones();
    }

    function renderTones() {
      if (!ctx) return;
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(523.25, now, 0.4);        // C5
      playTone(659.25, now + 0.15, 0.4); // E5
      playTone(783.99, now + 0.3, 0.6);  // G5
      playTone(1046.5, now + 0.45, 0.8); // C6
    }
  } catch (e) {
    console.warn('Audio chime playback not supported:', e);
  }
}
