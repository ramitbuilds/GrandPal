"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { PuppyMascot } from "@/components/PuppyMascot";
import { VectorPuppy } from "@/components/VectorPuppy";
import { CaregiverPinModal } from "@/components/CaregiverPinModal";
import { DoctorPupPhoneCall } from "@/components/DoctorPupPhoneCall";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { playNeuralVoice, stopVoice } from "@/lib/audioPlayer";
import { SeniorDashboardSkeleton } from "@/components/SeniorDashboardSkeleton";
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from "@/lib/translations";
import {
  AlertCircle,
  Check,
  Clock,
  Globe,
  Lock,
  Mic,
  Phone,
  Pill,
  Settings,
  Square,
  Volume2,
  X,
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
  scheduledFor: string;
  status: string;
  notes?: string;
}

interface SeniorProfile {
  id: string;
  name: string;
  age: number;
  streakDays: number;
  medications: Medication[];
  doseLogs: DoseLog[];
}

const DAILY_QUOTES = [
  "Today is full of small moments waiting to bring you joy.",
  "Taking care of yourself is the greatest kindness you can give.",
  "Every morning is a new beginning, take a deep breath and smile.",
  "Your health and happiness brighten the days of everyone around you.",
  "One step, one sip of water, one quiet moment at a time.",
];

export default function SeniorDashboard() {
  const [senior, setSenior] = useState<SeniorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [dateString, setDateString] = useState("");
  const [timeString, setTimeString] = useState("");
  const [greeting, setGreeting] = useState("Good morning");
  const [todayQuote, setTodayQuote] = useState(DAILY_QUOTES[0]);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showPhoneCall, setShowPhoneCall] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isPupThinking, setIsPupThinking] = useState(false);
  const [isPupSpeaking, setIsPupSpeaking] = useState(false);
  const [textInput, setTextInput] = useState("");

  // Multilingual State
  const [language, setLanguage] = useState<LanguageCode>("en");
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const currentVoice = SUPPORTED_LANGUAGES.find((l) => l.code === language)?.voice || "en-US-AnaNeural";

  // Early Dose Protection Modal State
  const [pendingEarlyMed, setPendingEarlyMed] = useState<Medication | null>(null);

  const loadData = useCallback(async () => {
    // Check local storage for instantaneous display
    let hasLocal = false;
    try {
      const cached = localStorage.getItem("grandpal_senior_profile");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.name) {
          setSenior(parsed);
          setLoading(false);
          hasLocal = true;
        }
      }
    } catch {}

    try {
      const res = await fetch("/api/senior");
      if (res.ok) {
        const data = await res.json();
        setSenior(data);
        try {
          localStorage.setItem("grandpal_senior_profile", JSON.stringify(data));
        } catch {}
      }
      setLoading(false);
    } catch {
      if (!hasLocal) {
        setLoading(false);
      }
    }
  }, []);

  // Live Clock and Greeting Timer
  useEffect(() => {
    loadData();

    const updateClock = () => {
      const now = new Date();
      setDateString(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
      setTimeString(
        now.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        })
      );

      const hour = now.getHours();
      if (hour < 12) setGreeting(t.goodMorning);
      else if (hour < 17) setGreeting(t.goodAfternoon);
      else setGreeting(t.goodEvening);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    const now = new Date();
    const day = now.getDate();
    setTodayQuote(DAILY_QUOTES[day % DAILY_QUOTES.length]);

    return () => clearInterval(interval);
  }, [loadData, t]);

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
            language,
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
          voice: currentVoice,
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
    [senior, language, currentVoice, loadData]
  );

  const {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
  } = useAudioRecorder();

  const toggleMicrophone = async () => {
    if (isRecording) {
      const captured = await stopRecording();
      if (captured && captured.trim()) {
        handleVoiceInput(captured.trim());
      } else {
        toast.info("No speech detected. Please speak clearly into your microphone.");
      }
    } else {
      stopVoice();
      await startRecording();
    }
  };

  // Time Period Determination for Early Dose Checking
  const getCurrentPeriodOrder = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 1; // Morning
    if (hour < 17) return 2; // Afternoon
    if (hour < 21) return 3; // Evening
    return 4; // Night
  };

  const getMedPeriodOrder = (timeOfDay: string) => {
    const lower = timeOfDay.toLowerCase();
    if (lower.includes("morning")) return 1;
    if (lower.includes("afternoon")) return 2;
    if (lower.includes("evening")) return 3;
    if (lower.includes("night") || lower.includes("bedtime")) return 4;
    return 1;
  };

  const getCurrentPeriodName = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.morning;
    if (hour < 17) return t.afternoon;
    if (hour < 21) return t.evening;
    return t.night;
  };

  const handleMedicationClick = (med: Medication) => {
    const currentOrder = getCurrentPeriodOrder();
    const medOrder = getMedPeriodOrder(med.timeOfDay);

    // If medicine is scheduled for a future period today, trigger early dose confirmation
    if (medOrder > currentOrder) {
      setPendingEarlyMed(med);
      playNeuralVoice(
        `Careful, ${senior?.name}! Your ${med.name} is scheduled for ${med.timeOfDay}. Are you taking it now?`,
        { voice: currentVoice }
      ).catch(() => {});
    } else {
      markDoseAsTaken(med.id, med.name, false);
    }
  };

  const markDoseAsTaken = async (medicationId: string, medicationName?: string, isEarly: boolean = false) => {
    if (!senior || submittingId) return;
    setSubmittingId(medicationId);

    try {
      const noteText = isEarly
        ? `Taken early at ${timeString} (Scheduled for later in the day)`
        : "Marked as taken on dashboard";

      const res = await fetch("/api/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicationId,
          seniorId: senior.id,
          note: noteText,
          status: isEarly ? "TAKEN_EARLY" : "TAKEN",
        }),
      });

      if (res.ok) {
        setIsCelebrating(true);
        setTimeout(() => setIsCelebrating(false), 1400);
        setPendingEarlyMed(null);

        const successMsg = isEarly
          ? `${medicationName || "Medicine"} recorded early at ${timeString}. Caregiver notified.`
          : medicationName
          ? `${medicationName} marked as taken. Good job!`
          : "Medicine marked as taken. Good job!";

        toast.success(successMsg);
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

  const completedMedLogs = useMemo(() => {
    const map = new Map<string, DoseLog>();
    senior?.doseLogs?.forEach((log) => {
      if (log.status === "TAKEN" || log.status === "TAKEN_EARLY") {
        map.set(log.medicationId, log);
      }
    });
    return map;
  }, [senior?.doseLogs]);

  if (loading) {
    return <SeniorDashboardSkeleton />;
  }

  if (!senior) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <VectorPuppy className="w-16 h-16" />
        <h2 className="text-2xl font-bold text-slate-900">Welcome to GrandPal</h2>
        <p className="text-sm text-slate-600 max-w-sm">
          Please complete the quick profile setup to get started with Doctor Pup.
        </p>
        <Link
          href="/onboarding"
          className="px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm shadow-xs hover:bg-slate-800 transition-all"
        >
          Begin Setup
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Top Header: Uncluttered with Live Clock & Language Picker */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
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
                {t.appSubtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Clock & Date */}
            <div className="text-right hidden sm:block pr-2 border-r border-slate-200">
              <div className="text-sm font-bold text-slate-900 font-mono tracking-tight">
                {timeString}
              </div>
              <div className="text-xs text-slate-500">
                {dateString}
              </div>
            </div>

            {/* Language Selector Dropdown / Buttons */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    language === l.code
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title={l.label}
                >
                  {l.flag}
                </button>
              ))}
            </div>

            <Link
              href="/onboarding"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-xl transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{t.setup}</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowPinModal(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{t.caregiver}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Senior Screen */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">

        {/* Mascot Banner with Greeting, Live Time, Daily Quote, and Actions */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <div className="shrink-0 relative flex flex-col items-center">
            {(isPupThinking || isTranscribing) && (
              <div className="absolute -inset-2 rounded-full bg-indigo-100/70 animate-pulse pointer-events-none" />
            )}
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
              className="w-36 h-36 sm:w-44 sm:h-44 relative z-10"
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-3 w-full">
            <div>
              <div className="text-xs font-bold tracking-wider uppercase text-slate-500 sm:hidden pb-1">
                {timeString}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
                {greeting}, {senior.name}
              </h1>
            </div>

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
                <span>{t.callPup}</span>
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
                    ? t.stopAndSend
                    : isTranscribing
                    ? t.hearingWords
                    : t.talkPup}
                </span>
              </button>
            </div>

            {/* Live listening caption, thinking indicator, or text fallback */}
            {isRecording ? (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-rose-600 pt-1">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
                <span>{t.recordingVoice}</span>
              </div>
            ) : isTranscribing ? (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3.5 py-2 rounded-xl max-w-sm shadow-2xs animate-pulse">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>{t.hearingWords}</span>
              </div>
            ) : isPupThinking ? (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-3.5 py-2 rounded-xl max-w-sm shadow-2xs animate-pulse">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <span>{t.thinkingResponse}</span>
              </div>
            ) : isPupSpeaking ? (
              <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3.5 py-1.5 rounded-xl max-w-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>{t.pupSpeaking}</span>
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
                  placeholder={t.typePlaceholder}
                  className="bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 flex-1 shadow-2xs"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim() || isPupThinking}
                  className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                >
                  {t.send}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Medicines Section */}
        <section className="space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {t.todaysMedicines}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {t.medicinesSubtitle}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {senior.medications.length} total
            </span>
          </div>

          <div className="space-y-4">
            {senior.medications.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
                <p className="text-sm text-slate-500">No medicines scheduled yet.</p>
                <Link
                  href="/onboarding"
                  className="inline-flex text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  + Add medications in Setup
                </Link>
              </div>
            ) : (
              senior.medications.map((med) => {
                const doseLog = completedMedLogs.get(med.id);
                const isTaken = !!doseLog;
                const isEarly = doseLog?.status === "TAKEN_EARLY";
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
                            <span>{t.scheduledFor} {med.timeOfDay}</span>
                            {isEarly && (
                              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-[10px]">
                                {t.takenEarly}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end shrink-0 sm:self-center">
                        {isTaken ? (
                          <span className="text-sm font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-5 py-2.5 rounded-xl flex items-center gap-2">
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>{isEarly ? t.takenEarly : t.taken}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleMedicationClick(med)}
                            disabled={isSubmitting}
                            className="text-sm font-bold bg-slate-900 hover:bg-slate-800 active:scale-95 text-white px-6 py-3 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                          >
                            {isSubmitting ? "Saving..." : t.markAsTaken}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Early Dose Safety Alert Modal */}
      {pendingEarlyMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900">
                {t.earlyCheckTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-900">{pendingEarlyMed.name}</span> {t.earlyCheckMessage} (scheduled for <span className="font-semibold text-slate-900">{pendingEarlyMed.timeOfDay}</span>).
              </p>
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200/70 font-medium">
                Current time: {timeString} ({getCurrentPeriodName()}). Taking medicines too early can cause unexpected drowsiness or blood pressure drops.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => markDoseAsTaken(pendingEarlyMed.id, pendingEarlyMed.name, true)}
                className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-xs transition-all cursor-pointer"
              >
                {t.yesTakeNow}
              </button>

              <button
                type="button"
                onClick={() => setPendingEarlyMed(null)}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition-colors cursor-pointer"
              >
                {t.waitLater}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Caregiver PIN Modal */}
      <CaregiverPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
      />

      {/* Doctor Pup iPhone Phone Call Modal */}
      <DoctorPupPhoneCall
        isOpen={showPhoneCall}
        onClose={() => setShowPhoneCall(false)}
        seniorName={senior.name}
        seniorId={senior.id}
        language={language}
        onDoseLogged={loadData}
      />
    </div>
  );
}
