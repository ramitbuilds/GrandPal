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
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <p className="text-sm font-medium text-slate-500">Connecting audio and profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 max-w-4xl mx-auto flex flex-col justify-between">
      {/* Header bar */}
      <header className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{senior?.name}</h1>
          <p className="text-xs text-slate-500">Autonomous Voice Companion</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
            Streak: {senior?.streakDays} Days
          </div>

          <button
            onClick={onSwitchRole}
            className="flex items-center space-x-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md transition"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Caregiver</span>
          </button>
        </div>
      </header>

      {/* Voice Status & Mascot Panel */}
      <section className="my-8 flex flex-col items-center text-center">
        <div className="relative mb-3">
          <BarnabyMascot state={mascotState} className="w-28 h-28" />
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase border ${
                isListening
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : isSpeaking
                  ? "bg-sky-50 text-sky-700 border-sky-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {isSpeaking ? "Speaking" : isListening ? "Listening" : "Active"}
            </span>
          </div>
        </div>

        {/* Ambient Speech bubble */}
        <div className="w-full max-w-lg mt-2 p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs text-left">
          <div className="flex items-start space-x-2">
            <Volume2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-slate-700 leading-relaxed">{systemMessage}</p>
          </div>
          {lastTranscript && (
            <p className="mt-2 text-xs text-slate-400 pl-6 border-t border-slate-100 pt-1.5">
              Heard: &ldquo;{lastTranscript}&rdquo;
            </p>
          )}
        </div>
      </section>

      {/* Routine list */}
      <main className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
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
                    ? "bg-slate-100/60 border-slate-200 text-slate-400"
                    : "bg-white border-slate-200 text-slate-800 shadow-xs"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-slate-100 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 mr-2">{med.name}</span>
                    <span className="text-slate-500 mr-3">({med.dosage})</span>
                    <span className="text-slate-400">{med.instructions}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-slate-500 font-mono">{med.timeOfDay}</span>
                  {isDone ? (
                    <span className="flex items-center space-x-1 font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <Check className="w-3 h-3" />
                      <span>Taken</span>
                    </span>
                  ) : (
                    <span className="font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
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
      <footer className="mt-8 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
        GrandPal Continuous Ambient Voice System • Speak naturally to interact
      </footer>
    </div>
  );
}
