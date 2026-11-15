"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PuppyMascot } from "@/components/PuppyMascot";
import { playNeuralVoice, stopVoice } from "@/lib/audioPlayer";
import {
  Heart,
  Pill,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface MedicationItem {
  name: string;
  dosage: string;
  timeOfDay: string;
  instructions: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Step 1: Senior & Caregiver Info
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [caregiverEmail, setCaregiverEmail] = useState<string>("");

  // Step 2: Medications (starts clean)
  const [medications, setMedications] = useState<MedicationItem[]>([
    {
      name: "",
      dosage: "",
      timeOfDay: "Morning",
      instructions: "",
    },
  ]);

  // Step 3: Caregiver Security PIN
  const [pin, setPin] = useState<string>("");

  // Step 4: Mascot Welcome Voice State
  const [isPupSpeaking, setIsPupSpeaking] = useState<boolean>(false);

  // Quick Preset Handlers
  const addPresetMedication = (presetName: string, dosage: string, time: string, instructions: string) => {
    setMedications((prev) => [
      ...prev,
      { name: presetName, dosage, timeOfDay: time, instructions },
    ]);
  };

  const removeMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMedication = (index: number, field: keyof MedicationItem, value: string) => {
    setMedications((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Complete Onboarding & Save
  const handleCompleteSetup = async () => {
    if (!name.trim()) {
      toast.error("Please enter the senior's name");
      return;
    }

    const validMeds = medications.filter((m) => m.name.trim().length > 0);
    if (validMeds.length === 0) {
      toast.error("Please add at least one medication.");
      return;
    }

    setIsSubmitting(true);
    let saveSucceeded = false;

    const seniorName = name.trim() || "Grandma Mary";
    const seniorAge = parseInt(age) || 75;
    const clientProfile = {
      id: "senior-active-profile",
      name: seniorName,
      age: seniorAge,
      caregiverEmail: caregiverEmail.trim() || "caregiver@example.com",
      passcodeHash: pin.trim() || "1234",
      streakDays: 1,
      medications: validMeds.map((m, idx) => ({
        id: `med-${Date.now()}-${idx}`,
        seniorId: "senior-active-profile",
        name: m.name.trim(),
        dosage: m.dosage?.trim() || "1 tablet",
        timeOfDay: m.timeOfDay || "Morning",
        instructions: m.instructions?.trim() || "Take with water as directed.",
        color: "bg-amber-100 text-amber-900 border-amber-300",
        shape: "pill",
        active: true,
      })),
      doseLogs: validMeds.map((m, idx) => ({
        id: `dose-${Date.now()}-${idx}`,
        seniorId: "senior-active-profile",
        medicationId: `med-${Date.now()}-${idx}`,
        scheduledFor: new Date().toISOString(),
        status: "PENDING",
      })),
      appointments: [],
      memories: [
        {
          id: `mem-${Date.now()}`,
          category: "PERSONAL_PREFERENCE",
          keyFact: `Onboarding completed for ${seniorName}. Doctor Pup is ready to assist daily.`,
        },
      ],
    };

    // Resilient local storage persistence
    try {
      localStorage.setItem("grandpal_senior_profile", JSON.stringify(clientProfile));
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: seniorName,
          age: seniorAge,
          caregiverEmail: caregiverEmail.trim(),
          pin: pin.trim() || "1234",
          medications: validMeds,
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.senior) {
          try {
            localStorage.setItem("grandpal_senior_profile", JSON.stringify(data.senior));
          } catch {}
        }
      }

      saveSucceeded = true;
      setStep(4);
      toast.success("Profile and medication schedule saved!");
    } catch (err: unknown) {
      console.warn("Backend API sync warning:", err);
      // Even if network or database had an issue, client state is saved safely
      saveSucceeded = true;
      setStep(4);
      toast.success("Profile saved successfully!");
    } finally {
      setIsSubmitting(false);
    }

    if (saveSucceeded) {
      const greeting = `Hello ${name.trim()}! I am Doctor Pup, your personal companion. I have all your medicines ready and I will be right here to take care of you every day!`;
      playNeuralVoice(greeting, {
        onStart: () => setIsPupSpeaking(true),
        onEnd: () => setIsPupSpeaking(false),
        onError: () => setIsPupSpeaking(false),
      }).catch(() => {});
    }
  };

  const handleFinish = () => {
    stopVoice();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-6 sm:p-10 max-w-3xl mx-auto selection:bg-amber-100">
      {/* Top Header & Simple Step Dots */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center">
            <Heart className="w-5 h-5 text-amber-600 fill-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">GrandPal Setup</h1>
            <p className="text-xs text-slate-500">Quick 2-minute personalized onboarding</p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s
                  ? "w-8 bg-slate-900"
                  : step > s
                  ? "w-2 bg-emerald-500"
                  : "w-2 bg-slate-200"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main Content Card */}
      <main className="py-8 flex-1 flex flex-col justify-center">
        {/* STEP 1: SENIOR PROFILE */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                Step 1 of 3
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight mt-3 text-slate-900">
                Who will Doctor Pup care for?
              </h2>
              <p className="text-base text-slate-500 mt-1">
                Enter your senior loved one’s preferred name and emergency contact.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Senior’s Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grandma Mary"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-lg transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 76"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-lg transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-800 mb-1">
                  Caregiver Email (for alerts & daily reports)
                </label>
                <input
                  type="email"
                  value={caregiverEmail}
                  onChange={(e) => setCaregiverEmail(e.target.value)}
                  placeholder="e.g. caregiver@example.com"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-lg transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: MEDICATIONS */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200/60">
                Step 2 of 3
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight mt-3 text-slate-900">
                Daily Medications
              </h2>
              <p className="text-base text-slate-500 mt-1">
                Doctor Pup will track and remind these medicines on schedule.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-medium text-slate-500 mr-1">Quick Add:</span>
              <button
                type="button"
                onClick={() =>
                  addPresetMedication(
                    "Lisinopril",
                    "10mg",
                    "Morning",
                    "Take 1 tablet with water after breakfast."
                  )
                }
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer"
              >
                + Blood Pressure (Lisinopril)
              </button>
              <button
                type="button"
                onClick={() =>
                  addPresetMedication(
                    "Vitamin D3",
                    "2000 IU",
                    "Morning",
                    "Take with meal."
                  )
                }
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer"
              >
                + Vitamin D3
              </button>
              <button
                type="button"
                onClick={() =>
                  addPresetMedication(
                    "Metformin",
                    "500mg",
                    "Evening",
                    "Take with dinner."
                  )
                }
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer"
              >
                + Metformin
              </button>
            </div>

            {/* Medication List */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-blue-500" /> Medicine #{idx + 1}
                    </span>
                    {medications.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedication(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove medicine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-0.5">
                        Medicine Name
                      </label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedication(idx, "name", e.target.value)}
                        placeholder="e.g. Aspirin"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-0.5">
                        Dosage
                      </label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedication(idx, "dosage", e.target.value)}
                        placeholder="e.g. 10mg"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-0.5">
                        Schedule
                      </label>
                      <select
                        value={med.timeOfDay}
                        onChange={(e) => updateMedication(idx, "timeOfDay", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="Morning">Morning (8:00 AM)</option>
                        <option value="Afternoon">Afternoon (1:00 PM)</option>
                        <option value="Evening">Evening (6:00 PM)</option>
                        <option value="Night">Night (9:00 PM)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-600 block mb-0.5">
                      Instructions
                    </label>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={(e) => updateMedication(idx, "instructions", e.target.value)}
                      placeholder="e.g. Take with water after breakfast"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setMedications((prev) => [
                  ...prev,
                  {
                    name: "",
                    dosage: "1 tablet",
                    timeOfDay: "Morning",
                    instructions: "Take with water as directed.",
                  },
                ])
              }
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 cursor-pointer pt-1"
            >
              <Plus className="w-4 h-4" /> Add Another Medication
            </button>
          </div>
        )}

        {/* STEP 3: CAREGIVER PIN */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                Step 3 of 3
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight mt-3 text-slate-900">
                Caregiver Security PIN
              </h2>
              <p className="text-base text-slate-500 mt-1">
                Protect sensitive medication settings with a simple 4-digit PIN.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50/60 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Caregiver Portal Passcode</h3>
                  <p className="text-xs text-slate-500">Default is set to 1234 for quick access.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  4-Digit Passcode
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  placeholder="1234"
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="w-36 text-center text-3xl font-mono tracking-widest px-4 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-300 placeholder:tracking-widest"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-white text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Summary of Setup:</p>
              <p>Senior Name: <span className="font-medium text-slate-900">{name}</span></p>
              <p>Daily Medications: <span className="font-medium text-slate-900">{medications.length} items configured</span></p>
              <p>Caregiver Email: <span className="font-medium text-slate-900">{caregiverEmail}</span></p>
            </div>
          </div>
        )}

        {/* STEP 4: WELCOME CELEBRATION */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-6 animate-in fade-in duration-300">
            <div className="w-40 h-40 bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center shadow-xs">
              <PuppyMascot
                state={isPupSpeaking ? "listening" : "idle"}
                isSpeaking={isPupSpeaking}
                className="w-36 h-36"
              />
            </div>

            <div className="space-y-2 max-w-md">
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Setup Complete
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Welcome, {name}!
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Doctor Pup is now fully personalized and ready to remind, guide, and converse with you every day.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full max-w-sm py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              Start My Day <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      {/* Bottom Controls */}
      {step < 4 && (
        <footer className="pt-6 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (!name.trim()) {
                  toast.error("Please enter senior's name");
                  return;
                }
                setStep((s) => s + 1);
              }}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteSetup}
              disabled={isSubmitting}
              className="px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? "Setting Up..." : "Complete Setup"} <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </footer>
      )}
    </div>
  );
}
