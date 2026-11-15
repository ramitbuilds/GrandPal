// Audio Player utility for Doctor Pup's Neural AI Voice
// Uses /api/tts powered by edge-tts for realistic, human-quality, non-robotic voice

let currentAudio: HTMLAudioElement | null = null;

export interface PlayVoiceOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
  voice?: string;
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
