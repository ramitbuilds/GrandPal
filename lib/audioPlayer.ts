// Audio Player utility for Doctor Pup's Neural AI Voice
// Uses /api/tts powered by edge-tts for realistic, human-quality, non-robotic voice

let currentAudio: HTMLAudioElement | null = null;

export interface PlayVoiceOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
  voice?: string;
}

export interface PreparedAudio {
  play: (callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }) => Promise<void>;
  cancel: () => void;
}

// Pre-fetch and pre-buffer audio so playback can begin with 0ms latency when needed
export async function prepareNeuralVoice(
  text: string,
  options?: { voice?: string }
): Promise<PreparedAudio> {
  if (typeof window === "undefined") {
    return {
      play: async () => {},
      cancel: () => {},
    };
  }

  let cancelled = false;
  let audioUrl: string | null = null;
  let audio: HTMLAudioElement | null = null;

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: options?.voice ?? "en-US-AnaNeural",
      }),
    });

    if (!res.ok) {
      throw new Error(`TTS API returned ${res.status}`);
    }

    const blob = await res.blob();
    if (cancelled) return { play: async () => {}, cancel: () => {} };

    audioUrl = URL.createObjectURL(blob);
    audio = new Audio(audioUrl);
    audio.preload = "auto";
  } catch (err) {
    console.warn("Pre-buffering TTS error:", err);
  }

  return {
    play: async (callbacks) => {
      if (cancelled || !audio || !audioUrl) {
        callbacks?.onError?.("Audio preparation was cancelled or failed");
        return;
      }

      stopVoice();
      currentAudio = audio;

      audio.onplay = () => {
        callbacks?.onStart?.();
      };

      audio.onended = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        if (currentAudio === audio) {
          currentAudio = null;
        }
        callbacks?.onEnd?.();
      };

      audio.onerror = (err) => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        if (currentAudio === audio) {
          currentAudio = null;
        }
        callbacks?.onError?.(err);
      };

      try {
        await audio.play();
      } catch (playErr) {
        console.warn("Direct audio play error:", playErr);
        callbacks?.onError?.(playErr);
      }
    },
    cancel: () => {
      cancelled = true;
      if (audio) {
        audio.pause();
        audio = null;
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        audioUrl = null;
      }
    },
  };
}

export async function playNeuralVoice(
  text: string,
  options?: PlayVoiceOptions
): Promise<HTMLAudioElement | null> {
  if (typeof window === "undefined") return null;

  stopVoice();

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        voice: options?.voice ?? "en-US-AnaNeural",
      }),
    });

    if (!res.ok) {
      throw new Error(`TTS API returned ${res.status}`);
    }

    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    currentAudio = audio;

    audio.onplay = () => {
      options?.onStart?.();
    };

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (currentAudio === audio) {
        currentAudio = null;
      }
      options?.onEnd?.();
    };

    audio.onerror = (err) => {
      URL.revokeObjectURL(audioUrl);
      if (currentAudio === audio) {
        currentAudio = null;
      }
      options?.onError?.(err);
    };

    await audio.play();
    return audio;
  } catch (error) {
    console.error("Neural voice playback error:", error);
    options?.onError?.(error);
    return null;
  }
}

export function stopVoice() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
}
