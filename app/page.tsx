"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import { PuppyMascot } from "@/components/PuppyMascot";
import {
  Calendar,
  Check,
  Clock,
  Heart,
  Mail,
  MapPin,
  Pill,
  User,
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

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  location: string;
  notes?: string;
}

interface Memory {
  id: string;
  category: string;
  keyFact: string;
}

interface SeniorProfile {
  id: string;
  name: string;
  age: number;
  caregiverEmail: string;
  medications: Medication[];
  doseLogs: DoseLog[];
  appointments: Appointment[];
  memories: Memory[];
}

export default function Home() {
  const [senior, setSenior] = useState<SeniorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [dateString, setDateString] = useState("");

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
  }, [loadData]);

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

  const completedMedIds = new Set<string>();
  senior?.doseLogs?.forEach((log) => {
    if (log.status === "TAKEN") {
      completedMedIds.add(log.medicationId);
    }
  });

  const totalCount = senior?.medications?.length ?? 0;
  const takenCount = completedMedIds.size;
  const allDone = totalCount > 0 && takenCount === totalCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <p className="text-sm text-slate-500">Loading your profile...</p>
      </div>
    );
  }

  if (!senior) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <p className="text-sm text-slate-600">No profile found. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 relative">
              <Image
                src="/mascot/dog-logo.png"
                alt="GrandPal Mascot Logo"
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 block leading-tight">
                GrandPal
              </span>
              <span className="text-xs text-slate-500 block">
                Daily Care Companion
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-medium text-slate-500 block">
              {dateString}
            </span>
            <span className="text-xs font-semibold text-slate-700 block">
              {senior.name}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Welcome Mascot Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          <div className="shrink-0">
            <PuppyMascot className="w-32 h-32 sm:w-40 sm:h-40" />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Hello, {senior.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
              {allDone ? (
                "Great job! All your medicines for today are taken. You can relax and have a wonderful day."
              ) : (
                <span>
                  You have taken <NumberFlow value={takenCount} /> of {totalCount} medicines today. Here is your daily schedule below.
                </span>
              )}
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>
                  <NumberFlow value={takenCount} /> Taken
                </span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>
                  <NumberFlow value={totalCount - takenCount} /> Remaining
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Responsive Grid: Two Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Medicine Routine */}
          <section className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold text-slate-900">
                Today&apos;s Medicine Schedule
              </h2>
              <span className="text-xs font-medium text-slate-500">
                <NumberFlow value={takenCount} /> of {totalCount} completed
              </span>
            </div>

            <div className="space-y-3">
              {senior.medications.map((med) => {
                const isTaken = completedMedIds.has(med.id);
                const isSubmitting = submittingId === med.id;

                return (
                  <div
                    key={med.id}
                    className={`p-5 rounded-xl border transition-colors ${
                      isTaken
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isTaken
                              ? "bg-emerald-600 text-white"
                              : "bg-blue-50 text-blue-600 border border-blue-200"
                          }`}
                        >
                          {isTaken ? (
                            <Check className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <Pill className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-baseline gap-2">
                            <h3
                              className={`text-base font-semibold ${
                                isTaken ? "line-through text-slate-400" : "text-slate-900"
                              }`}
                            >
                              {med.name}
                            </h3>
                            <span className="text-xs font-medium text-slate-500">
                              {med.dosage}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            {med.instructions}
                          </p>
                          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{med.timeOfDay}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end shrink-0">
                        {isTaken ? (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-md flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>Taken</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => markDoseAsTaken(med.id, med.name)}
                            className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
                          >
                            {isSubmitting ? "Saving..." : "Mark as taken"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Right Column: Appointments & Caregiver */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Caregiver Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm border-b border-slate-200 pb-2">
                <User className="w-4 h-4 text-blue-600" />
                <span>Caregiver Contact</span>
              </div>

              <div className="text-xs space-y-1.5 text-slate-600">
                <p className="font-medium text-slate-800">
                  Primary Family Contact
                </p>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{senior.caregiverEmail}</span>
                </div>
                <p className="text-slate-500 text-[11px] pt-1">
                  Daily updates and taken medicine logs are shared with your caregiver automatically.
                </p>
              </div>
            </div>

            {/* Upcoming Appointments */}
            {senior.appointments && senior.appointments.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm border-b border-slate-200 pb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Next Doctor Visit</span>
                </div>

                <div className="space-y-3">
                  {senior.appointments.slice(0, 2).map((appt) => {
                    const apptDate = new Date(appt.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <div key={appt.id} className="text-xs space-y-1 text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{appt.doctorName}</span>
                          <span className="text-slate-500 font-medium">{apptDate}</span>
                        </div>
                        <p className="text-slate-600">{appt.specialty}</p>
                        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <MapPin className="w-3 h-3" />
                          <span>{appt.location}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Helpful Notes */}
            {senior.memories && senior.memories.length > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm border-b border-slate-200 pb-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>Care Notes</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-600">
                  {senior.memories.slice(0, 3).map((mem) => (
                    <li key={mem.id} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span>{mem.keyFact}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </aside>
        </div>
      </main>

      {/* Professional Footer */}
      <footer className="border-t border-slate-200 mt-16 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} GrandPal Health Systems. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-700 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-700 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-700 cursor-pointer">Help and Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
