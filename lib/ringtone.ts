// Realistic telephone ringback sound effect using Web Audio API

export class PhoneRingback {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timer: NodeJS.Timeout | null = null;

  start() {
    if (typeof window === "undefined") return;
    this.stop();
    this.isPlaying = true;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      const playBurst = () => {
        if (!this.isPlaying || !this.ctx) return;

        // Resume AudioContext if suspended (browser autoplay policy)
        if (this.ctx.state === "suspended") {
          this.ctx.resume().catch(() => {});
        }

        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        // Standard US/UK telephone ring frequencies: 440 Hz + 480 Hz
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(440, now);
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(480, now);

        // Smooth ringing volume envelope: ramp in, ring for 1.6s, ramp out
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.09, now + 0.12);
        gainNode.gain.setValueAtTime(0.09, now + 1.5);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.6);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.65);
        osc2.stop(now + 1.65);

        // Standard pause between rings: 3 seconds
        if (this.isPlaying) {
          this.timer = setTimeout(playBurst, 3200);
        }
      };

      playBurst();
    } catch (err) {
      console.warn("Ringback audio error:", err);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}
