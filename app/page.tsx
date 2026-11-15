"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { PuppyMascot } from "@/components/PuppyMascot";
import { VectorPuppy } from "@/components/VectorPuppy";
import { CaregiverPinModal } from "@/components/CaregiverPinModal";
import { DoctorPupPhoneCall } from "@/components/DoctorPupPhoneCall";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { playNeuralVoice, stopVoice } from "@/lib/audioPlayer";
import {
  Check,
  Clock,
  Lock,
  Mic,
  Phone,
  Pill,
  Square,
} from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  timeOfDay: string;
  instructions: string;
}

interface DoseLog {
  id: string;
  medicationId: string;
  status: string;
  takenAt?: string;
}

interface SeniorProfile {
  id: string;
  name: string;
  age: number;
  caregiverEmail: string;
  medications: Medication[];
  doseLogs: DoseLog[];
}

// Warm, uplifting quotes for seniors that rotate daily
const DAILY_QUOTES = [
  "Each new morning brings a fresh start. Take it easy and enjoy the quiet, gentle moments today.",
  "A peaceful heart brings health to the whole body. Have a wonderful and restful day.",
  "Take today one gentle step at a time, and remember you are deeply cared for.",
  "Every day is a gift. Smile, breathe deeply, and enjoy your favorite cup of tea.",
  "You bring warmth to everyone around you. Take good care of yourself today.",
  "A gentle walk and a quiet mind bring sunshine to every morning.",
  "Life is made of little moments of joy. Savor the day at your own comfortable pace.",
];

export default function Home() {
  const [senior, setSenior] = useState<SeniorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [dateString, setDateString] = useState("");
  const [greeting, setGreeting] = useState("Good morning");
  const [todayQuote, setTodayQuote] = useState(DAILY_QUOTES[0]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPhoneCall, setShowPhoneCall] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isPupThinking, setIsPupThinking] = useState(false);
  const [isPupSpeaking, setIsPupSpeaking] = useState(false);
  const [textInput, setTextInput] = useState("");

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/senior");
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setSenior(data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const now = new Date();
    setDateString(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    );

    // Dynamic time-based greeting
    const hour = now.getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Today's quote rotating based on day of month
    const day = now.getDate();
    setTodayQuote(DAILY_QUOTES[day % DAILY_QUOTES.length]);
  }, [loadData]);

  // Handle voice speech input from microphone button
  const handleVoiceInput = useCallback(
    async (spokenText: string) => {
      if (!spokenText.trim() || !senior) return;

      setIsPupThinking(true);
      try {
        const res = await fetch("/api/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            speech: spokenText,
            seniorId: senior.id,
          }),
        });

        const data = await res.json();
        const reply = data.response || "I hear you! I am right here by your side.";

        if (data.action === "DOSE_LOGGED") {
          setIsCelebrating(true);
          setTimeout(() => setIsCelebrating(false), 1400);
          await loadData();
          toast.success(reply);
        }

        // Play Doctor Pup's neural voice response!
        await playNeuralVoice(reply, {
          onStart: () => setIsPupSpeaking(true),
          onEnd: () => setIsPupSpeaking(false),
          onError: () => setIsPupSpeaking(false),
        });
      } catch (err) {
        console.error("Voice input error:", err);
        toast.error("Could not process voice. Please try again.");
      } finally {
        setIsPupThinking(false);
      }
    },
    [senior, loadData]
  );

  const {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
  } = useAudioRecorder((text) => handleVoiceInput(text));

  const toggleMicrophone = async () => {
    if (isRecording) {
      const captured = await stopRecording();
      if (captured) {
        handleVoiceInput(captured);
      } else {
        toast.info("No speech detected. Click Talk to Doctor Pup to try again.");
      }
    } else {
      stopVoice();
      await startRecording();
    }
  };

  const markDoseAsTaken = async (medicationId: string, medicationName?: string) => {
    if (!senior || submittingId) return;
    setSubmittingId(medicationId);

    try {
      const res = await fetch("/api/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId,
          seniorId: senior.id,
          note: "Marked as taken on dashboard",
        }),
      });

      if (res.ok) {
        setIsCelebrating(true);
        setTimeout(() => setIsCelebrating(false), 1400);
        toast.success(
          medicationName
            ? `${medicationName} marked as taken. Good job!`
            : "Medicine marked as taken. Good job!"
        );
        await loadData();
      } else {
        toast.error("Could not record dose. Please try again.");
      }
    } catch (err) {
      console.error("Failed to mark dose:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  const completedMedIds = useMemo(() => {
    const set = new Set<string>();
    senior?.doseLogs?.forEach((log) => {
      if (log.status === "TAKEN") {
        set.add(log.medicationId);
      }
    });
    return set;
  }, [senior?.doseLogs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <p className="text-base font-medium text-slate-500">Loading your medicines...</p>
      </div>
    );
  }

  if (!senior) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <p className="text-base font-medium text-slate-600">No profile found. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Top Header: Simple and Uncluttered */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <VectorPuppy className="w-10 h-10" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 block leading-tight">
                GrandPal
              </span>
              <span className="text-xs text-slate-500 block">
                Your Daily Health Companion
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600 hidden sm:block">
              {dateString}
            </span>

            <button
              type="button"
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>Caregiver</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Senior Screen */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">

        {/* Mascot Banner with Greeting, Daily Quote, and Two Action Options */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <div className="shrink-0">
            <PuppyMascot
              state={
                submittingId || isPupThinking || isTranscribing
                  ? "thinking"
                  : isCelebrating
                  ? "celebrating"
                  : isRecording || isPupSpeaking
                  ? "listening"
                  : "idle"
              }
              isCelebrating={isCelebrating}
              isSpeaking={isPupSpeaking}
              className="w-36 h-36 sm:w-44 sm:h-44"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-3 w-full">
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              {greeting}, {senior.name}
            </h1>

            {/* Daily Inspiring Quote */}
            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed italic">
              &ldquo;{todayQuote}&rdquo;
            </p>

            {/* The Two Action Options: Call Button & Microphone Button */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3">
              {/* Option 1: Call Button */}
              <button
                type="button"
                onClick={() => {
                  stopVoice();
                  setShowPhoneCall(true);
                }}
                className="flex items-center gap-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-5 py-3 rounded-2xl shadow-xs transition-all cursor-pointer"
                title="Call Doctor Pup on the phone"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-700/60 flex items-center justify-center">
                  <Phone className="w-4 h-4 fill-white text-emerald-600" />
                </div>
                <span>Call Doctor Pup</span>
              </button>

              {/* Option 2: Microphone Button */}
              <button
                type="button"
                onClick={toggleMicrophone}
                disabled={isTranscribing || isPupThinking}
                className={`flex items-center gap-2.5 text-sm font-bold px-5 py-3 rounded-2xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                  isRecording
                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
                    : isTranscribing
                    ? "bg-amber-600 text-white animate-pulse"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
                title={
                  isRecording
                    ? "Recording... Click to send to Doctor Pup"
                    : "Click to speak to Doctor Pup"
                }
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    isRecording
                      ? "bg-rose-700/60"
                      : isTranscribing
                      ? "bg-amber-700/60"
                      : "bg-blue-700/60"
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-3.5 h-3.5 fill-white" />
                  ) : (
                    <Mic className="w-4 h-4 text-white" />
                  )}
                </div>
                <span>
                  {isRecording
                    ? "Stop & Send"
                    : isTranscribing
                    ? "Understanding..."
                    : "Talk to Doctor Pup"}
                </span>
              </button>
            </div>

            {/* Live listening caption or text fallback */}
            {isRecording ? (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-rose-600 pt-1">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <span>Recording your voice... Speak now, then tap Stop & Send</span>
              </div>
            ) : isTranscribing ? (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-amber-600 pt-1">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                <span>Doctor Pup is listening to your words...</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!textInput.trim()) return;
                  const msg = textInput.trim();
                  setTextInput("");
                  handleVoiceInput(msg);
                }}
                className="pt-1 flex items-center justify-center sm:justify-start gap-2 max-w-sm"
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Or type a question for Doctor Pup..."
                  className="bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 flex-1 shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isPupThinking}
                  className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  Send
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Medicines Section */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl font-bold text-slate-900">
              Today&apos;s Medicines
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Tap the button once you have taken your medicine.
            </p>
          </div>

          <div className="space-y-4">
            {senior.medications.map((med) => {
              const isTaken = completedMedIds.has(med.id);
              const isSubmitting = submittingId === med.id;

              return (
                <div
                  key={med.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    isTaken
                      ? "bg-emerald-50/40 border-emerald-200"
                      : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isTaken
                            ? "bg-emerald-600 text-white"
                            : "bg-blue-50 text-blue-600 border border-blue-200"
                        }`}
                      >
                        {isTaken ? (
                          <Check className="w-6 h-6 stroke-[3]" />
                        ) : (
                          <Pill className="w-6 h-6" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2.5">
                          <h3
                            className={`text-xl font-bold ${
                              isTaken ? "line-through text-slate-400" : "text-slate-900"
                            }`}
                          >
                            {med.name}
                          </h3>
                          <span className="text-sm font-semibold text-slate-500">
                            {med.dosage}
                          </span>
                        </div>

                        <p className="text-sm text-slate-600 leading-relaxed">
                          {med.instructions}
                        </p>

                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 pt-0.5">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>Scheduled for {med.timeOfDay}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end shrink-0 sm:self-center">
                      {isTaken ? (
                        <span className="text-sm font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-5 py-2.5 rounded-xl flex items-center gap-2">
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Taken</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => markDoseAsTaken(med.id, med.name)}
                          className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 px-6 py-3 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          {isSubmitting ? "Saving..." : "Take Medicine"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Clean, Peaceful Footer */}
      <footer className="border-t border-slate-200 mt-16 py-8 bg-white text-center text-xs text-slate-400">
        <p>GrandPal • Made with care for your health and peace of mind.</p>
      </footer>

      {/* Caregiver PIN Gate */}
      <CaregiverPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
      />

      {/* Doctor Pup Phone Call Modal */}
      <DoctorPupPhoneCall
        isOpen={showPhoneCall}
        onClose={() => setShowPhoneCall(false)}
        seniorName={senior.name}
        seniorId={senior.id}
        onDoseLogged={loadData}
      />
    </div>
  );
}
