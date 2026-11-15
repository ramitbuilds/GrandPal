"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SpeechOptions {
  onEnd?: () => void;
  rate?: number;
  pitch?: number;
}

export function useWebSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isContinuousRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

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
    utterance.rate = options?.rate ?? 0.95; // Gentle clear cadence

    // Prefer highest quality natural voice available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) =>
        (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Jenny")) &&
        v.lang.startsWith("en")
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
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

  const startContinuousListening = useCallback((onTranscript: (text: string) => void) => {
    if (!recognitionRef.current) return;

    isContinuousRef.current = true;

    recognitionRef.current.onresult = (event: any) => {
      const len = event.results.length;
      const latest = event.results[len - 1];
      if (latest.isFinal) {
        const transcript = latest[0].transcript.trim();
        if (transcript.length > 0) {
          onTranscript(transcript);
        }
      }
    };

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onend = () => {
      setIsListening(false);
      if (isContinuousRef.current) {
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

  const pauseListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  }, []);

  const resumeListening = useCallback(() => {
    if (recognitionRef.current && isContinuousRef.current) {
      try {
        recognitionRef.current.start();
      } catch {}
    }
  }, []);

  return {
    speak,
    startContinuousListening,
    pauseListening,
    resumeListening,
    isSpeaking,
    isListening,
  };
}
