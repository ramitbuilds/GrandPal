"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface SpeechOptions {
  onTranscript?: (text: string) => void;
  onEnd?: () => void;
  rate?: number;
  pitch?: number;
}

export function useWebSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSpeech = "speechSynthesis" in window;
      setSupported(hasSpeech);

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const speak = useCallback(
    (text: string, options?: SpeechOptions) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 0.85; // Slightly slower pace for seniors
      utterance.pitch = options?.pitch ?? 1.05; // Gentle, warm pitch

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        options?.onEnd?.();
      };
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const startListening = useCallback(
    (onResult: (transcript: string) => void, onComplete?: () => void) => {
      if (!recognitionRef.current) {
        console.warn("Speech Recognition not supported in this browser.");
        onComplete?.();
        return;
      }

      try {
        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onResult(transcript);
        };
        recognitionRef.current.onend = () => {
          setIsListening(false);
          onComplete?.();
        };
        recognitionRef.current.onerror = (e: any) => {
          console.warn("Speech recognition error:", e);
          setIsListening(false);
          onComplete?.();
        };

        recognitionRef.current.start();
      } catch (err) {
        setIsListening(false);
      }
    },
    []
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return {
    speak,
    startListening,
    stopListening,
    isSpeaking,
    isListening,
    supported,
  };
}
