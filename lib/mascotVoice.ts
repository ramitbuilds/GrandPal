// Mascot Voice Assistant Utility using Web Speech Synthesis API
// Optimized for elderly comprehension (calm rate, warm pitch, clear articulation)

export interface MascotSpeechOptions {
  rate?: number; // default 0.92 for clear senior comprehension
  pitch?: number; // default 1.1 for friendly, cheerful tone
  volume?: number; // default 1.0
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

class MascotVoiceService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isMuted: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.initVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (!this.synth) return;
    const voices = this.synth.getVoices();
    // Prioritize natural, pleasant English voices (Google, Microsoft, Apple, Samantha)
    const naturalVoice =
      voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Jenny") || v.name.includes("Samantha"))) ||
      voices.find((v) => v.lang.startsWith("en-US")) ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];

    if (naturalVoice) {
      this.selectedVoice = naturalVoice;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public speak(text: string, options?: MascotSpeechOptions) {
    if (typeof window === "undefined" || !this.synth || this.isMuted) {
      return;
    }

    // Cancel any previous speech
    this.synth.cancel();

    // Clean text: strip HTML and clean extra whitespace
    const cleanText = text.replace(/<[^>]*>?/gm, "").trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options?.rate ?? 0.92; // Calm, clear pacing for seniors
    utterance.pitch = options?.pitch ?? 1.08; // Friendly, warm puppy-like tone
    utterance.volume = options?.volume ?? 1.0;

    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }

    utterance.onstart = () => {
      options?.onStart?.();
    };

    utterance.onend = () => {
      options?.onEnd?.();
    };

    utterance.onerror = (err) => {
      options?.onError?.(err);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  // Pre-configured situational voice scripts
  public getGreeting(seniorName: string, remainingMedsCount: number): string {
    const hour = new Date().getHours();
    let timeGreeting = "Hello";
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 17) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";

    if (remainingMedsCount === 0) {
      return `${timeGreeting}, ${seniorName}! You have taken all your medicines today. You are doing fantastic!`;
    } else if (remainingMedsCount === 1) {
      return `${timeGreeting}, ${seniorName}! You have one medicine scheduled for today. Let us make sure you take it on time.`;
    } else {
      return `${timeGreeting}, ${seniorName}! You have ${remainingMedsCount} medicines scheduled for today. I am here to help you remember each one.`;
    }
  }

  public getDoseTakenCelebration(seniorName: string, medName: string): string {
    const phrases = [
      `Wonderful job, ${seniorName}! You took your ${medName}. I have marked it off and notified your caregiver.`,
      `Good job, ${seniorName}! Your ${medName} is all taken. Keep up the great streak!`,
      `Excellent! You are taking great care of your health today, ${seniorName}.`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  public getPlayfulMascotLine(seniorName: string): string {
    const lines = [
      `Hello ${seniorName}! I am Doctor Pup, your personal GrandPal companion. Click me anytime for help!`,
      `Everything is looking good, ${seniorName}! Make sure to drink plenty of fresh water today.`,
      `I am right here with you, ${seniorName}. If you ever feel unwell, tap the Doctor Pup button to let me know.`,
    ];
    return lines[Math.floor(Math.random() * lines.length)];
  }
}

export const mascotVoice = new MascotVoiceService();
