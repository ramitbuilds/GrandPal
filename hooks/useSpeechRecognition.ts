"use client";

import { useState, useRef, useCallback } from "react";

interface SpeechRecognitionResultItem {
  transcript: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
  };
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface WindowWithSpeechRecognition {
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => string;
  resetTranscript: () => void;
  hasSupport: boolean;
  error: string | null;
}

export function useSpeechRecognition(onResult?: (text: string) => void): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [hasSupport] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as WindowWithSpeechRecognition;
      return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
    }
    return false;
  });
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const transcriptRef = useRef<string>("");
  const listeningIntentRef = useRef<boolean>(false);

  const createRecognitionInstance = useCallback(() => {
    if (typeof window === "undefined") return null;

    const win = window as unknown as WindowWithSpeechRecognition;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return null;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        const item = event.results[i]?.[0];
        if (item) {
          combined += item.transcript + " ";
        }
      }
      const clean = combined.trim();
      transcriptRef.current = clean;
      setTranscript(clean);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn("Speech recognition status:", event.error);
      if (event.error === "not-allowed") {
        setError("Microphone permission was not allowed.");
      }
      listeningIntentRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      const captured = transcriptRef.current.trim();
      if (listeningIntentRef.current && captured && onResult) {
        onResult(captured);
      }
      listeningIntentRef.current = false;
      setIsListening(false);
    };

    return recognition;
  }, [onResult]);

  const startListening = useCallback(async () => {
    if (!hasSupport) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const instance = createRecognitionInstance();
      if (!instance) {
        setError("Failed to create speech recognition instance.");
        return;
      }

      recognitionRef.current = instance;
      transcriptRef.current = "";
      setTranscript("");
      setError(null);
      listeningIntentRef.current = true;
      setIsListening(true);

      instance.start();
    } catch (err: unknown) {
      console.warn("Speech recognition start warning:", err);
      setIsListening(false);
      listeningIntentRef.current = false;
    }
  }, [hasSupport, createRecognitionInstance]);

  const stopListening = useCallback((): string => {
    listeningIntentRef.current = false;
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    return transcriptRef.current;
  }, []);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = "";
    setTranscript("");
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasSupport,
    error,
  };
}
