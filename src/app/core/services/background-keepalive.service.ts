import { Injectable, NgZone } from '@angular/core';

/**
 * Keeps the browser JS context alive when the screen turns off on iOS/Android.
 *
 * Strategy (same as music/navigation apps):
 *  1. Web Audio API — plays a near-silent (0.001 gain) oscillator loop.
 *     iOS Safari and Android Chrome treat pages with an active AudioContext
 *     as "audio sessions" and do NOT suspend them when the screen locks.
 *  2. visibilitychange listener — if the page somehow gets suspended and
 *     then becomes visible again, we immediately resume the AudioContext
 *     and re-register the geolocation watch.
 *
 * This does NOT keep the screen on (no battery drain from display).
 * The audio is inaudible (gain = 0.001) so the user hears nothing.
 */
@Injectable({ providedIn: 'root' })
export class BackgroundKeepAliveService {
  private audioCtx: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private active = false;

  constructor(private zone: NgZone) {}

  start() {
    if (this.active) return;
    this.active = true;
    this.startAudioSession();
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.stopAudioSession();
  }

  private startAudioSession() {
    try {
      // Create a fresh AudioContext each time (required after stop)
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Gain set to near-zero — completely inaudible but keeps audio session alive
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 0.001;
      this.gainNode.connect(this.audioCtx.destination);

      // A 1Hz oscillator — below human hearing, just keeps the graph running
      this.oscillator = this.audioCtx.createOscillator();
      this.oscillator.frequency.value = 1;
      this.oscillator.connect(this.gainNode);
      this.oscillator.start();

      // iOS requires a user-gesture to resume a suspended context.
      // By the time start() is called (button tap), the context is already
      // created inside a user gesture, so it starts in 'running' state.
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
    } catch (e) {
      // Web Audio not available — tracking still works, just no background keep-alive
      console.warn('BackgroundKeepAlive: Web Audio API not available', e);
    }
  }

  private stopAudioSession() {
    try {
      this.oscillator?.stop();
      this.oscillator?.disconnect();
      this.gainNode?.disconnect();
      this.audioCtx?.close();
    } catch (_) {}
    this.oscillator = null;
    this.gainNode = null;
    this.audioCtx = null;
  }

  /**
   * When the user returns to the tab/app after screen-off, resume the
   * AudioContext (browsers may suspend it on visibility loss).
   */
  private onVisibilityChange = () => {
    if (!this.active) return;
    if (document.visibilityState === 'visible') {
      this.zone.runOutsideAngular(() => {
        if (this.audioCtx?.state === 'suspended') {
          this.audioCtx!.resume();
        }
        // If context was closed/lost entirely, restart it
        if (!this.audioCtx || this.audioCtx.state === 'closed') {
          this.startAudioSession();
        }
      });
    }
  };
}
