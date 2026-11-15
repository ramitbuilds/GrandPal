"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import confetti from "canvas-confetti";
import { BarnabyMascot } from "@/components/BarnabyMascot";
import { useWebSpeech } from "@/lib/useWebSpeech";
import { Volume2, Clock, Check, Shield } from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  timeOfDay: string;
  instructions: string;
  color: string;
  shape: string;
}

interface DoseLog {
  id: string;
  medicationId: string;
  status: string;
  scheduledFor: string;
}

interface SeniorData {
  id: string;
  name: string;
  streakDays: number;
  medications: Medication[];
  doseLogs: DoseLog[];
}

export default function SeniorView({ onSwitchRole }: { onSwitchRole: () => void }) {
  const [senior, setSenior] = useState<SeniorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mascotState, setMascotState] = useState<"idle" | "listening" | "talking" | "celebrating">("idle");
  const [systemMessage, setSystemMessage] = useState("Listening for your voice...");
  const [lastTranscript, setLastTranscript] = useState("");
  const [takenMeds, setTakenMeds] = useState<Set<string>>(new Set());

  const {
    speak,
    startContinuousListening,
    pauseListening,
    resumeListening,
    isSpeaking,
    isListening,
  } = useWebSpeech();

  const isProcessingRef = useRef(false);
  const initializedSpeechRef = useRef(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/senior");
      const data = await res.json();
      setSenior(data);

      const taken = new Set<string>();
      data.doseLogs?.forEach((log: DoseLog) => {
        if (log.status === "TAKEN") taken.add(log.medicationId);
      });
      setTakenMeds(taken);
      setLoading(false);
      return data;
    } catch (e) {
      console.error(e);
      setLoading(false);
      return null;
    }
  }, []);

  const handleVoiceInput = useCallback(
    async (transcript: string) => {
      if (isProcessingRef.current || !senior) return;
      isProcessingRef.current = true;
      setLastTranscript(transcript);
      pauseListening();

      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ speech: transcript, seniorId: senior.id }),
        });

        const data = await res.json();
        const reply = data.response;

        if (data.action === "DOSE_LOGGED") {
          setMascotState("celebrating");
          confetti({
            particleCount: 45,
            spread: 55,
            origin: { y: 0.6 },
            colors: ["#8B2635", "#D3EFBD", "#2E3532"],
          });
          fetchProfile();
        } else {
          setMascotState("talking");
        }

        setSystemMessage(reply);

        speak(reply, {
          onEnd: () => {
            setMascotState("listening");
            isProcessingRef.current = false;
            resumeListening();
          },
        });
      } catch (err) {
        console.error(err);
        isProcessingRef.current = false;
        resumeListening();
      }
    },
    [senior, pauseListening, resumeListening, speak, fetchProfile]
  );

  useEffect(() => {
    fetchProfile().then((data) => {
      if (!initializedSpeechRef.current && data) {
        initializedSpeechRef.current = true;
        const pending = data.medications.find(
          (m: Medication) => !data.doseLogs?.some((l: DoseLog) => l.medicationId === m.id && l.status === "TAKEN")
        );

        let welcome = `Hello ${data.name}. `;
        if (pending) {
          welcome += `It is time for your ${pending.name} ${pending.dosage}. Simply say "I took it" when you have taken it.`;
        } else {
          welcome += `All scheduled medications are up to date. I am listening if you need anything.`;
        }

        setSystemMessage(welcome);
        setMascotState("talking");
        speak(welcome, {
          onEnd: () => {
            setMascotState("listening");
            startContinuousListening((transcript) => {
              handleVoiceInput(transcript);
            });
          },
        });
      }
    });
  }, [fetchProfile, speak, startContinuousListening, handleVoiceInput]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#E0E2DB] flex items-center justify-center p-4">
        <p className="text-xs font-semibold tracking-wider text-[#2E3532]/60 uppercase">
          Initializing audio and medical profile...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0E2DB] text-[#2E3532] font-sans p-6 max-w-3xl mx-auto flex flex-col justify-between">
      {/* Header bar */}
      <header className="flex items-center justify-between pb-4 border-b border-[#D2D4C8]">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[#2E3532]">{senior?.name}</h1>
          <p className="text-xs text-[#2E3532]/70 font-medium">GrandPal Health Companion</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-xs font-bold px-3 py-1 bg-[#D3EFBD] text-[#2E3532] border border-[#2E3532]/10 rounded-md shadow-xs">
            Streak: {senior?.streakDays} Days
          </div>

          <button
            onClick={onSwitchRole}
            className="flex items-center space-x-1.5 text-xs font-semibold text-[#2E3532] hover:text-[#8B2635] bg-[#E0E2DB] hover:bg-[#D2D4C8] border border-[#2E3532]/20 px-3 py-1 rounded-md transition"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Caregiver</span>
          </button>
        </div>
      </header>

      {/* Voice Status & Mascot Panel */}
      <section className="my-8 flex flex-col items-center text-center">
        <div className="relative mb-2">
          <BarnabyMascot state={mascotState} className="w-28 h-28" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                isListening
                  ? "bg-[#D3EFBD] text-[#2E3532] border-[#2E3532]/20 shadow-xs"
                  : isSpeaking
                  ? "bg-[#8B2635] text-[#E0E2DB] border-transparent"
                  : "bg-[#D2D4C8] text-[#2E3532] border-[#2E3532]/20"
              }`}
            >
              {isSpeaking ? "Speaking" : isListening ? "Listening" : "Active"}
            </span>
          </div>
        </div>

        {/* Ambient Speech bubble */}
        <div className="w-full max-w-md mt-3 p-4 bg-[#E0E2DB] border border-[#2E3532]/20 rounded-xl shadow-xs text-left">
          <div className="flex items-start space-x-2.5">
            <Volume2 className="w-4 h-4 text-[#8B2635] mt-0.5 shrink-0" />
            <p className="text-xs font-semibold text-[#2E3532] leading-relaxed">{systemMessage}</p>
          </div>
          {lastTranscript && (
            <p className="mt-2 text-[11px] font-medium text-[#2E3532]/60 pl-6 border-t border-[#D2D4C8] pt-1.5">
              Heard: &ldquo;{lastTranscript}&rdquo;
            </p>
          )}
        </div>
      </section>

      {/* Routine list */}
      <main className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#2E3532]/70">
          Today&apos;s Medication Schedule
        </h2>

        <div className="space-y-2">
          {senior?.medications.map((med) => {
            const isDone = takenMeds.has(med.id);

            return (
              <div
                key={med.id}
                className={`p-3 rounded-lg border text-xs flex items-center justify-between transition ${
                  isDone
                    ? "bg-[#D2D4C8]/50 border-[#D2D4C8] text-[#2E3532]/50"
                    : "bg-[#E0E2DB] border-[#2E3532]/20 text-[#2E3532] shadow-xs"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#D2D4C8] text-[#2E3532]">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-[#2E3532] mr-2">{med.name}</span>
                    <span className="text-[#2E3532]/70 mr-2">({med.dosage})</span>
                    <span className="text-[#2E3532]/60">{med.instructions}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-[#2E3532]/70 font-mono text-[11px]">{med.timeOfDay}</span>
                  {isDone ? (
                    <span className="flex items-center space-x-1 font-semibold text-[#2E3532] bg-[#D3EFBD] px-2 py-0.5 rounded border border-[#2E3532]/10">
                      <Check className="w-3 h-3" />
                      <span>Taken</span>
                    </span>
                  ) : (
                    <span className="font-semibold text-[#8B2635] bg-[#8B2635]/10 px-2 py-0.5 rounded border border-[#8B2635]/20">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 pt-4 border-t border-[#D2D4C8] text-center text-[11px] font-medium text-[#2E3532]/50">
        GrandPal Autonomous Voice System • Speak naturally to interact
      </footer>
    </div>
  );
}
