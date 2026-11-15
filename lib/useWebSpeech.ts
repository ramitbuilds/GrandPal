"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SpeechOptions {
  onEnd?: () => void;
  rate?: number;
  pitch?: number;
}

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal?: boolean;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
}

interface WindowWithSpeechRecognition {
  SpeechRecognition?: new () => ISpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => ISpeechRecognitionInstance;
}

export function useWebSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const isContinuousRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as WindowWithSpeechRecognition;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = "en-US";
        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const speak = useCallback((text: string, options?: SpeechOptions) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      options?.onEnd?.();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Cute, warm, cheerful animated character settings
    utterance.pitch = options?.pitch ?? 1.35; // Cute higher pitch for puppy companion
    utterance.rate = options?.rate ?? 0.95; // Slightly slower for elderly clarity
    utterance.volume = 1.0;

    // Try finding an expressive English female / friendly voice
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice =
      voices.find(
        (v) =>
          (v.lang.startsWith("en") &&
            (v.name.includes("Samantha") ||
              v.name.includes("Victoria") ||
              v.name.includes("Zira") ||
              v.name.includes("Google US English") ||
              v.name.includes("Natural"))) ||
          v.default
      ) || voices[0];

    if (friendlyVoice) {
      utterance.voice = friendlyVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      options?.onEnd?.();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      options?.onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const startContinuousListening = useCallback((onTranscript: (text: string) => void) => {
    if (!recognitionRef.current) return;

    isContinuousRef.current = true;

    recognitionRef.current.onresult = (event: SpeechRecognitionEventLike) => {
      const len = event.results.length;
      const latest = event.results[len - 1];
      if (latest?.isFinal) {
        const transcript = latest[0]?.transcript?.trim() ?? "";
        if (transcript.length > 0) {
          onTranscript(transcript);
        }
      }
    };

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (isContinuousRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {}
      }
    };
    recognitionRef.current.onerror = () => {
      setIsListening(false);
    };

    try {
      recognitionRef.current.start();
    } catch {}
  }, []);

  const stopListening = useCallback(() => {
    isContinuousRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    startContinuousListening,
    stopListening,
    isListening,
  };
}
