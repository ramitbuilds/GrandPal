"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PuppyMascot } from "@/components/PuppyMascot";
import { playNeuralVoice, stopVoice } from "@/lib/audioPlayer";
import {
  Mic,
  MicOff,
  Phone,
  Volume2,
  VolumeX,
} from "lucide-react";

interface DoctorPupPhoneCallProps {
  isOpen: boolean;
  onClose: () => void;
  seniorName: string;
  seniorId: string;
  onDoseLogged?: () => void;
}

type CallStatus = "DIALING" | "CONNECTED" | "ENDED";

export function DoctorPupPhoneCall({
  isOpen,
  onClose,
  seniorName,
  seniorId,
  onDoseLogged,
}: DoctorPupPhoneCallProps) {
  const [status, setStatus] = useState<CallStatus>("DIALING");
  const [callDuration, setCallDuration] = useState(0);
  const [isPupSpeaking, setIsPupSpeaking] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [isListeningUser, setIsListeningUser] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and clean up when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      stopVoice();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
      setStatus("DIALING");
      setCallDuration(0);
      setIsPupSpeaking(false);
      return;
    }

    setStatus("DIALING");
    setCallDuration(0);

    // Simulate iPhone calling tone / pause for 2 seconds, then connect
    const connectTimer = setTimeout(() => {
      setStatus("CONNECTED");

      // Doctor Pup greeting upon answering the phone
      const initialGreeting = `Hello ${seniorName}! Doctor Pup here. I am so glad you called. How are you feeling today?`;
      speakPupResponse(initialGreeting);
    }, 2000);

    return () => {
      clearTimeout(connectTimer);
      stopVoice();
    };
  }, [isOpen, seniorName]);

  // Call timer once connected
  useEffect(() => {
    if (status === "CONNECTED") {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Play Doctor Pup's neural voice response (synchronized with audio start)
  const speakPupResponse = useCallback(
    async (text: string) => {
      if (isSpeakerMuted) return;

      setIsPupSpeaking(false);

      await playNeuralVoice(text, {
        onStart: () => {
          setIsPupSpeaking(true);
        },
        onEnd: () => {
          setIsPupSpeaking(false);
          startListeningSenior();
        },
        onError: () => {
          setIsPupSpeaking(false);
          startListeningSenior();
        },
      });
    },
    [isSpeakerMuted]
  );

  // Process senior's speech with AI
  const handleSeniorInput = useCallback(
    async (spokenText: string) => {
      if (!spokenText.trim() || isProcessingAI) return;

      setIsProcessingAI(true);
      stopListeningSenior();

      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speech: spokenText,
            seniorId,
          }),
        });

        const data = await res.json();
        const reply = data.response || `I hear you, ${seniorName}. You are doing wonderful.`;

        if (data.action === "DOSE_LOGGED") {
          onDoseLogged?.();
        }

        await speakPupResponse(reply);
      } catch (err) {
        console.error("AI response error:", err);
        await speakPupResponse(`I am right here with you, ${seniorName}. Everything will be alright.`);
      } finally {
        setIsProcessingAI(false);
      }
    },
    [isProcessingAI, seniorId, seniorName, onDoseLogged, speakPupResponse]
  );

  // Start listening to the senior
  const startListeningSenior = useCallback(() => {
    if (isMicMuted || typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListeningUser(true);
      };

      rec.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        handleSeniorInput(resultText);
      };

      rec.onerror = (e: any) => {
        console.warn("Speech recognition error:", e.error);
        setIsListeningUser(false);
      };

      rec.onend = () => {
        setIsListeningUser(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.warn("Recognition start failed:", e);
    }
  }, [isMicMuted, handleSeniorInput]);

  const stopListeningSenior = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListeningUser(false);
    }
  }, []);

  const handleEndCall = () => {
    stopVoice();
    stopListeningSenior();
    setStatus("ENDED");
    setTimeout(() => {
      onClose();
    }, 350);
  };

  if (!isOpen) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Compact iPhone Shell - Light Theme */}
      <div className="relative w-[285px] sm:w-[295px] h-[510px] bg-white rounded-[44px] p-3 shadow-2xl border-[6px] border-slate-200/90 flex flex-col justify-between overflow-hidden text-slate-800 select-none">
        
        {/* iPhone Dynamic Island */}
        <div className="w-full pt-1.5 pb-1 flex justify-center items-center z-10">
          <div className="w-20 h-4.5 bg-black rounded-full flex items-center justify-center gap-1.5 px-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <div className="w-1 h-1 rounded-full bg-slate-800" />
          </div>
        </div>

        {/* Minimal iPhone Call Header */}
        <div className="text-center pt-2 space-y-0.5 z-10">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Pup</h2>
          
          <div className="text-xs font-medium text-slate-500">
            {status === "DIALING" ? (
              <span className="animate-pulse">calling...</span>
            ) : status === "CONNECTED" ? (
              <span className="font-mono text-slate-600">{formatTimer(callDuration)}</span>
            ) : (
              <span className="text-rose-600">Call Ended</span>
            )}
          </div>
        </div>

        {/* Center Mascot Avatar with Interactive States */}
        <div className="relative flex flex-col items-center justify-center my-auto z-10">
          <div className="relative flex items-center justify-center">
            {/* Animated Ringing Pulses when Dialing */}
            {status === "DIALING" && (
              <>
                <div className="absolute w-36 h-36 rounded-full border-2 border-emerald-400/40 animate-ping" />
                <div className="absolute w-44 h-44 rounded-full border border-emerald-300/30 animate-pulse" />
              </>
            )}

            {/* Speaking / Listening Pulses */}
            {isPupSpeaking && (
              <div className="absolute w-36 h-36 rounded-full bg-emerald-100/60 animate-pulse" />
            )}
            {isListeningUser && (
              <div className="absolute w-36 h-36 rounded-full bg-blue-100/60 animate-ping" />
            )}

            {/* Circular Avatar */}
            <div className="w-32 h-32 bg-slate-50 rounded-full p-2 border border-slate-200/80 shadow-xs flex items-center justify-center">
              <PuppyMascot
                state={
                  status === "DIALING"
                    ? "thinking"
                    : isPupSpeaking
                    ? "listening"
                    : isProcessingAI
                    ? "thinking"
                    : "idle"
                }
                isSpeaking={isPupSpeaking}
                className="w-28 h-28"
              />
            </div>
          </div>
        </div>

        {/* Bottom iPhone Call Action Controls */}
        <div className="space-y-4 pb-2 z-10">
          {/* Action Button Row */}
          <div className="flex items-center justify-around px-2">
            {/* Mute Mic */}
            <button
              type="button"
              onClick={() => {
                const next = !isMicMuted;
                setIsMicMuted(next);
                if (next) stopListeningSenior();
                else startListeningSenior();
              }}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isMicMuted
                    ? "bg-rose-100 text-rose-600 border border-rose-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </div>
              <span className="text-[10px] font-medium text-slate-500">
                {isMicMuted ? "muted" : "mute"}
              </span>
            </button>

            {/* Apple Decline / End Call Button: Red circle with downward-pointing handset icon */}
            <button
              type="button"
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 flex items-center justify-center text-white shadow-md transition-transform cursor-pointer"
              title="Decline / End Call"
            >
              <Phone className="w-6 h-6 fill-white text-white rotate-[135deg]" />
            </button>

            {/* Speaker Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !isSpeakerMuted;
                setIsSpeakerMuted(next);
                if (next) stopVoice();
              }}
              className="flex flex-col items-center gap-1 cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isSpeakerMuted
                    ? "bg-amber-100 text-amber-600 border border-amber-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </div>
              <span className="text-[10px] font-medium text-slate-500">
                {isSpeakerMuted ? "muted" : "speaker"}
              </span>
            </button>
          </div>

          {/* iPhone Home Indicator Bar */}
          <div className="w-full flex justify-center pt-1">
            <div className="w-24 h-1 bg-slate-300 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
