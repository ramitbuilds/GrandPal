"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { PuppyMascot } from "@/components/PuppyMascot";
import { playNeuralVoice, prepareNeuralVoice, stopVoice } from "@/lib/audioPlayer";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { PhoneRingback } from "@/lib/ringtone";
import {
  Mic,
  MicOff,
  Phone,
  Volume2,
  VolumeX,
  Loader2,
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
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ringtoneRef = useRef<PhoneRingback | null>(null);
  const isMicMutedRef = useRef(isMicMuted);
  const isSpeakerMutedRef = useRef(isSpeakerMuted);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
  }, [isSpeakerMuted]);

  // Handle transcribed senior input
  const handleSeniorInput = useCallback(
    async (spokenText: string) => {
      if (!spokenText.trim() || isProcessingAI) return;

      setIsProcessingAI(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isProcessingAI, seniorId, seniorName, onDoseLogged]
  );

  // Audio Recorder Hook using HTML5 MediaRecorder and Gemini/Python STT
  const {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  // Play Doctor Pup's neural voice response (synchronized with mouth animation)
  const speakPupResponse = useCallback(
    async (text: string) => {
      if (isSpeakerMutedRef.current) return;

      setIsPupSpeaking(false);

      await playNeuralVoice(text, {
        onStart: () => {
          setIsPupSpeaking(true);
        },
        onEnd: () => {
          setIsPupSpeaking(false);
          // Auto-listen for senior's reply once Doctor Pup finishes speaking
          if (!isMicMutedRef.current) {
            startRecording().catch(() => {});
          }
        },
        onError: () => {
          setIsPupSpeaking(false);
          if (!isMicMutedRef.current) {
            startRecording().catch(() => {});
          }
        },
      });
    },
    [startRecording]
  );

  // Initialize and clean up when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
        ringtoneRef.current = null;
      }
      stopVoice();
      cancelRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      setStatus("DIALING");
      setCallDuration(0);
      setIsPupSpeaking(false);
      return;
    }

    setStatus("DIALING");
    setCallDuration(0);

    // Start realistic phone calling sound effect (dual tone ringback)
    const ringtone = new PhoneRingback();
    ringtoneRef.current = ringtone;
    ringtone.start();

    // Doctor Pup greeting text
    const initialGreeting = `Hello ${seniorName}! Doctor Pup here. I am so glad you called. How are you feeling today?`;

    // Process and pre-buffer the neural voice in the background WHILE the call is ringing!
    const preparedVoicePromise = prepareNeuralVoice(initialGreeting);

    // Call rings for 4.2 seconds (approx 2 authentic telephone rings) before Doctor Pup answers
    const connectTimer = setTimeout(async () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
        ringtoneRef.current = null;
      }
      setStatus("CONNECTED");

      // The voice was already processed during ringing! Play directly with 0ms delay!
      try {
        const preparedVoice = await preparedVoicePromise;
        if (!isSpeakerMutedRef.current) {
          await preparedVoice.play({
            onStart: () => setIsPupSpeaking(true),
            onEnd: () => {
              setIsPupSpeaking(false);
              if (!isMicMutedRef.current) startRecording().catch(() => {});
            },
            onError: () => {
              setIsPupSpeaking(false);
              if (!isMicMutedRef.current) startRecording().catch(() => {});
            },
          });
        }
      } catch {
        speakPupResponse(initialGreeting);
      }
    }, 4200);

    return () => {
      clearTimeout(connectTimer);
      preparedVoicePromise.then((p) => p.cancel()).catch(() => {});
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
        ringtoneRef.current = null;
      }
      stopVoice();
      cancelRecording();
    };
  }, [isOpen, seniorName, speakPupResponse, cancelRecording]);

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

  const handleToggleMic = async () => {
    if (isMicMuted) {
      setIsMicMuted(false);
      if (!isPupSpeaking && !isProcessingAI && !isTranscribing) {
        await startRecording();
      }
      return;
    }

    if (isRecording) {
      // User tapped mic button to finish speaking
      const transcript = await stopRecording();
      if (transcript && transcript.trim()) {
        handleSeniorInput(transcript.trim());
      }
    } else {
      // Start listening
      if (!isPupSpeaking && !isProcessingAI && !isTranscribing) {
        await startRecording();
      }
    }
  };

  const handleEndCall = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.stop();
      ringtoneRef.current = null;
    }
    stopVoice();
    cancelRecording();
    setStatus("ENDED");
    setTimeout(() => {
      onClose();
    }, 300);
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
            <div className={`w-1.5 h-1.5 rounded-full ${
              isRecording
                ? "bg-red-500 animate-pulse"
                : isProcessingAI || isTranscribing
                ? "bg-amber-400 animate-ping"
                : "bg-emerald-500 animate-pulse"
            }`} />
            <div className="w-1 h-1 rounded-full bg-slate-800" />
          </div>
        </div>

        {/* Minimal iPhone Call Header */}
        <div className="text-center pt-2 space-y-0.5 z-10">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Doctor Pup</h2>
          
          <div className="text-xs font-medium text-slate-500 h-5 flex items-center justify-center">
            {status === "DIALING" ? (
              <span className="text-emerald-600 animate-pulse font-medium">calling Doctor Pup...</span>
            ) : status === "CONNECTED" ? (
              isPupSpeaking ? (
                <span className="text-emerald-600 font-medium animate-pulse">Doctor Pup speaking...</span>
              ) : isTranscribing ? (
                <span className="text-indigo-600 font-medium flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Hearing you...
                </span>
              ) : isProcessingAI ? (
                <span className="text-indigo-600 font-medium flex items-center gap-1 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" /> Thinking of answer...
                </span>
              ) : isRecording ? (
                <span className="text-blue-600 font-medium animate-pulse">Listening... (Tap mic when done)</span>
              ) : isMicMuted ? (
                <span className="text-rose-500">Mic muted</span>
              ) : (
                <span className="font-mono text-slate-600">{formatTimer(callDuration)}</span>
              )
            ) : (
              <span className="text-rose-600">Call Ended</span>
            )}
          </div>
        </div>

        {/* Center Mascot Avatar with Interactive States */}
        <div className="relative flex flex-col items-center justify-center my-auto z-10">
          <div className="relative flex flex-col items-center justify-center">
            {/* Animated Ringing Pulses when Dialing */}
            {status === "DIALING" && (
              <>
                <div className="absolute w-36 h-36 rounded-full border-2 border-emerald-400/50 animate-ping" />
                <div className="absolute w-44 h-44 rounded-full border border-emerald-300/40 animate-pulse" />
              </>
            )}

            {/* Speaking / Listening Pulses */}
            {isPupSpeaking && (
              <div className="absolute w-36 h-36 rounded-full bg-emerald-100/60 animate-pulse" />
            )}
            {isRecording && (
              <div className="absolute w-36 h-36 rounded-full bg-blue-100/70 animate-ping" />
            )}
            {(isProcessingAI || isTranscribing) && (
              <div className="absolute w-36 h-36 rounded-full bg-indigo-100/60 animate-pulse" />
            )}

            {/* Circular Avatar */}
            <div className="w-32 h-32 bg-slate-50 rounded-full p-2 border border-slate-200/80 shadow-xs flex items-center justify-center">
              <PuppyMascot
                state={
                  status === "DIALING"
                    ? "thinking"
                    : isPupSpeaking
                    ? "listening"
                    : isProcessingAI || isTranscribing
                    ? "thinking"
                    : isRecording
                    ? "listening"
                    : "idle"
                }
                isSpeaking={isPupSpeaking}
                className="w-28 h-28"
              />
            </div>

            {/* AI Response Generating Indicator Pill */}
            {(isProcessingAI || isTranscribing) && (
              <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200/80 rounded-full shadow-2xs animate-in fade-in">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-[11px] font-semibold text-indigo-700">
                  {isTranscribing ? "Hearing words..." : "Doctor Pup is thinking..."}
                </span>
              </div>
            )}

            {/* Dialing Indicator Pill */}
            {status === "DIALING" && (
              <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                <span className="text-[11px] font-semibold text-emerald-700">Ringing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom iPhone Call Action Controls */}
        <div className="space-y-4 pb-2 z-10">
          {/* Action Button Row */}
          <div className="flex items-center justify-around px-2">
            {/* Microphone Button (Tap to finish speaking or toggle) */}
            <button
              type="button"
              onClick={handleToggleMic}
              disabled={status !== "CONNECTED" || isPupSpeaking || isProcessingAI}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-opacity ${
                status !== "CONNECTED" || isPupSpeaking || isProcessingAI
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-blue-600 text-white shadow-lg ring-4 ring-blue-200 scale-105 animate-pulse"
                    : isMicMuted
                    ? "bg-rose-100 text-rose-600 border border-rose-200"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {isRecording ? (
                  <Mic className="w-5 h-5 text-white" />
                ) : isMicMuted ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </div>
              <span className="text-[10px] font-medium text-slate-500">
                {isRecording ? "finish" : isMicMuted ? "unmute" : "speak"}
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
