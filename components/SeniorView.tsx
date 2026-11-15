"use client";

import { useEffect, useState, useRef } from "react";
import confetti from "canvas-confetti";
import { BarnabyMascot } from "@/components/BarnabyMascot";
import { useWebSpeech } from "@/lib/useWebSpeech";
import {
  Volume2,
  Mic,
  MicOff,
  Sparkles,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Clock,
  HeartHandshake,
} from "lucide-react";

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
  const [mascotState, setMascotState] = useState<"idle" | "talking" | "listening" | "celebrating">("idle");
  const [activeSpeechText, setActiveSpeechText] = useState("Tap anywhere or say 'Hello Barnaby' to start!");
  const [lastTranscript, setLastTranscript] = useState("");
  const [takenMeds, setTakenMeds] = useState<Set<string>>(new Set());

  const { speak, startListening, stopListening, isSpeaking, isListening } = useWebSpeech();
  const hasSpokenGreeting = useRef(false);

  useEffect(() => {
    fetch("/api/senior")
      .then((res) => res.json())
      .then((data) => {
        setSenior(data);
        const alreadyTaken = new Set<string>();
        data.doseLogs?.forEach((log: DoseLog) => {
          if (log.status === "TAKEN") alreadyTaken.add(log.medicationId);
        });
        setTakenMeds(alreadyTaken);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading senior data:", err);
        setLoading(false);
      });
  }, []);

  const greetSenior = () => {
    if (!senior) return;
    const pendingMed = senior.medications.find((m) => !takenMeds.has(m.id));
    let text = `Hello ${senior.name}! I am Barnaby. You have a ${senior.streakDays} day sunshine streak! `;
    if (pendingMed) {
      text += `It is time for your ${pendingMed.name} ${pendingMed.dosage}. ${pendingMed.instructions}. Say 'I took it' once you swallow it!`;
    } else {
      text += "All your scheduled medicines for right now have been taken. You are doing wonderful!";
    }
    setActiveSpeechText(text);
    setMascotState("talking");
    speak(text, {
      onEnd: () => {
        setMascotState("idle");
        listenForConfirmation();
      },
    });
  };

  const listenForConfirmation = () => {
    setMascotState("listening");
    startListening(
      (transcript) => {
        setLastTranscript(transcript);
        const lower = transcript.toLowerCase();
        if (
          lower.includes("took") ||
          lower.includes("done") ||
          lower.includes("yes") ||
          lower.includes("swallowed") ||
          lower.includes("taken")
        ) {
          const pendingMed = senior?.medications.find((m) => !takenMeds.has(m.id));
          if (pendingMed) {
            handleTakeMed(pendingMed.id, pendingMed.name, `Confirmed via voice: "${transcript}"`);
          }
        } else if (lower.includes("hello") || lower.includes("barnaby")) {
          greetSenior();
        } else {
          speak(`I heard: "${transcript}". If you took your pill, tap the big green button or say 'I took it'!`);
        }
      },
      () => setMascotState("idle")
    );
  };

  const handleTakeMed = async (medId: string, medName: string, note?: string) => {
    if (!senior) return;

    try {
      setMascotState("celebrating");
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#F59E0B", "#10B981", "#3B82F6", "#EC4899"],
      });

      const res = await fetch("/api/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seniorId: senior.id,
          medicationId: medId,
          note: note ?? "Confirmed on Senior Portal",
        }),
      });

      const result = await res.json();
      if (result.success) {
        setTakenMeds((prev) => new Set(prev).add(medId));
        setSenior((prev) => (prev ? { ...prev, streakDays: result.streakDays } : null));

        const praise = `Wonderful job, ${senior.name}! You took your ${medName}. Barnaby has added a golden sunflower to your streak!`;
        setActiveSpeechText(praise);
        speak(praise, {
          onEnd: () => setMascotState("idle"),
        });
      }
    } catch (e) {
      console.error(e);
      setMascotState("idle");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6 text-center">
        <BarnabyMascot state="talking" className="w-32 h-32 animate-pulse" />
        <p className="mt-4 text-2xl font-bold text-amber-900">Barnaby is waking up...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-100/60 p-4 sm:p-8 flex flex-col justify-between max-w-4xl mx-auto select-none">
      <header className="flex items-center justify-between bg-white/80 backdrop-blur-md rounded-3xl p-4 sm:p-6 shadow-sm border border-amber-200">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="bg-amber-100 p-3 rounded-2xl">
            <Sun className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              Good Day, {senior?.name}!
            </h1>
            <p className="text-base sm:text-lg text-slate-600 font-medium">GrandPal Companion</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="flex items-center bg-amber-500 text-white px-4 py-2 sm:px-5 sm:py-3 rounded-2xl font-black text-lg sm:text-xl shadow-md space-x-2">
            <span>🌻</span>
            <span>{senior?.streakDays} Days</span>
          </div>

          <button
            onClick={onSwitchRole}
            className="flex items-center space-x-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl font-semibold text-sm transition"
            title="Open Caregiver Dashboard"
          >
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span className="hidden sm:inline">Caregiver</span>
          </button>
        </div>
      </header>

      <section className="my-6 sm:my-8 bg-white/95 rounded-3xl p-6 sm:p-8 shadow-md border-2 border-amber-300 flex flex-col md:flex-row items-center gap-6">
        <div
          onClick={greetSenior}
          className="cursor-pointer group relative flex flex-col items-center"
          title="Tap Barnaby to talk!"
        >
          <BarnabyMascot state={mascotState} className="w-44 h-44 sm:w-52 sm:h-52 drop-shadow-md" />
          <span className="mt-2 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-3 py-1 rounded-full group-hover:bg-amber-200 transition">
            Tap Me 🦉
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-4 text-center md:text-left">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 relative">
            <p className="text-xl sm:text-2xl font-bold text-slate-800 leading-snug">
              &ldquo;{activeSpeechText}&rdquo;
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <button
              onClick={greetSenior}
              disabled={isSpeaking}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white text-lg font-bold px-6 py-3.5 rounded-2xl shadow-md transition active:scale-95 disabled:opacity-50"
            >
              <Volume2 className="w-6 h-6" />
              <span>Read Aloud</span>
            </button>

            <button
              onClick={isListening ? stopListening : listenForConfirmation}
              className={`flex items-center space-x-2 text-lg font-bold px-6 py-3.5 rounded-2xl shadow-md transition active:scale-95 ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              <span>{isListening ? "Listening..." : "Speak to Barnaby"}</span>
            </button>
          </div>

          {lastTranscript && (
            <p className="text-sm font-medium text-slate-500 italic">
              Heard: &ldquo;{lastTranscript}&rdquo;
            </p>
          )}
        </div>
      </section>

      <main className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <span>Today&rsquo;s Medication Routine</span>
            <Sparkles className="w-6 h-6 text-amber-500" />
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {senior?.medications.map((med) => {
            const isDone = takenMeds.has(med.id);

            return (
              <div
                key={med.id}
                className={`rounded-3xl p-6 border-2 transition-all flex flex-col justify-between ${
                  isDone
                    ? "bg-emerald-50/80 border-emerald-300 opacity-90"
                    : "bg-white border-amber-200 shadow-md hover:border-amber-400"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-black px-3 py-1 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      {med.timeOfDay}
                    </span>
                    {isDone ? (
                      <span className="text-emerald-700 font-extrabold text-sm flex items-center gap-1 bg-emerald-100 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4" /> Taken
                      </span>
                    ) : (
                      <span className="text-amber-800 font-bold text-sm bg-amber-100 px-3 py-1 rounded-full">
                        Scheduled
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-800">{med.name}</h3>
                  <p className="text-lg font-bold text-amber-700 mt-1">{med.dosage}</p>
                  <p className="text-base text-slate-600 mt-2 font-medium">{med.instructions}</p>
                </div>

                <div className="mt-6">
                  {isDone ? (
                    <div className="w-full py-4 text-center text-emerald-800 font-bold text-lg bg-emerald-100/60 rounded-2xl">
                      ✓ Completed for Today
                    </div>
                  ) : (
                    <button
                      onClick={() => handleTakeMed(med.id, med.name)}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black text-xl rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-7 h-7" />
                      <span>I TOOK IT!</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="bg-white/80 border border-amber-200 rounded-3xl p-4 text-center text-sm font-medium text-slate-500 flex items-center justify-center gap-2">
        <HeartHandshake className="w-4 h-4 text-rose-500" />
        <span>GrandPal Voice & Care Companion • Built for Catalyst 2k26</span>
      </footer>
    </div>
  );
}
