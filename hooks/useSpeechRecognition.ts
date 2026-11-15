"use client";

import { useState, useRef, useEffect, useCallback } from "react";

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
  const [hasSupport, setHasSupport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");
  const listeningIntentRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setHasSupport(true);
      }
    }
  }, []);

  const createRecognitionInstance = useCallback(() => {
    if (typeof window === "undefined") return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let combined = "";
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript + " ";
      }
      const clean = combined.trim();
      transcriptRef.current = clean;
      setTranscript(clean);
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition status:", event.error);
      // Suppress network / no-speech errors so we don't frighten seniors with red popups
      if (event.error === "not-allowed") {
        setError("Microphone permission was not allowed.");
      }
      listeningIntentRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      // When user stops speaking in single-utterance mode, deliver the captured text!
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
    setError(null);
    transcriptRef.current = "";
    setTranscript("");

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const rec = createRecognitionInstance();
      if (!rec) {
        setError("Speech recognition is not available in this browser.");
        return;
      }

      recognitionRef.current = rec;
      listeningIntentRef.current = true;
      setIsListening(true);
      rec.start();
    } catch (e) {
      console.warn("Speech start issue:", e);
      listeningIntentRef.current = false;
      setIsListening(false);
    }
  }, [createRecognitionInstance]);

  const stopListening = useCallback(() => {
    listeningIntentRef.current = false;
    const captured = transcriptRef.current.trim();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    setIsListening(false);

    if (onResult && captured) {
      onResult(captured);
    }

    return captured;
  }, [onResult]);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = "";
    setTranscript("");
    setError(null);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      listeningIntentRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
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
