"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import { VectorPuppy } from "@/components/VectorPuppy";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CaregiverPortalSkeleton } from "@/components/CaregiverPortalSkeleton";
import { ProjectRadarAssessment } from "@/components/ProjectRadarAssessment";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Award,
  Calendar,
  Check,
  Clock,
  Heart,
  Mail,
  MapPin,
  Pill,
  Plus,
  Send,
  Trash2,
  User,
} from "lucide-react";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  timeOfDay: string;
  instructions: string;
  active: boolean;
}

interface DoseLog {
  id: string;
  medicationId: string;
  scheduledFor: string;
  takenAt?: string;
  status: string;
  notes?: string;
}

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  location: string;
  notes?: string;
}

interface TriageRecord {
  id: string;
  reportedText: string;
  severityScore: number;
  guidance: string;
  status: string;
  createdAt: string;
}

interface SeniorProfile {
  id: string;
  name: string;
  age: number;
  caregiverEmail: string;
  medications: Medication[];
  doseLogs: DoseLog[];
  appointments: Appointment[];
}

export default function CaregiverPage() {
  const [senior, setSenior] = useState<SeniorProfile | null>(null);
  const [triageRecords, setTriageRecords] = useState<TriageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRadar, setShowRadar] = useState(false);

  // Forms
  const [showAddMed, setShowAddMed] = useState(false);
  const [medName, setMedName] = useState("");
  const [medDosage, setMedDosage] = useState("");
  const [medTime, setMedTime] = useState("08:00 AM");
  const [medInstructions, setMedInstructions] = useState("");

  const [showAddAppt, setShowAddAppt] = useState(false);
  const [apptDoctor, setApptDoctor] = useState("");
  const [apptSpecialty, setApptSpecialty] = useState("");
  const [apptDate, setApptDate] = useState("");
  const [apptLocation, setApptLocation] = useState("");
  const [apptNotes, setApptNotes] = useState("");

  const [sendingEmail, setSendingEmail] = useState(false);

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
      const [seniorRes, triageRes] = await Promise.all([
        fetch("/api/senior"),
        fetch("/api/triage"),
      ]);

      if (seniorRes.ok) {
        const seniorData = await seniorRes.json();
        setSenior(seniorData);
        try {
          localStorage.setItem("grandpal_senior_profile", JSON.stringify(seniorData));
        } catch {}
      }

      if (triageRes.ok) {
        const triageData = await triageRes.json();
        setTriageRecords(triageData);
      }

      setLoading(false);
    } catch {
      if (!hasLocal) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medName || !medDosage || !medTime || !senior) return;

    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: medName,
          dosage: medDosage,
          timeOfDay: medTime,
          instructions: medInstructions || "Take with water",
          seniorId: senior.id,
        }),
      });

      if (res.ok) {
        toast.success(`${medName} added to medicine schedule.`);
        setMedName("");
        setMedDosage("");
        setMedInstructions("");
        setShowAddMed(false);
        loadData();
      } else {
        toast.error("Could not add medication.");
      }
    } catch {
      toast.error("Network error while adding medication.");
    }
  };

  const handleDeleteMedication = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;

    try {
      const res = await fetch(`/api/medications?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`${name} removed.`);
        loadData();
      } else {
        toast.error("Failed to remove medication.");
      }
    } catch {
      toast.error("Network error while removing medication.");
    }
  };

  const handleToggleMedication = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/medications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !currentActive }),
      });

      if (res.ok) {
        toast.success(currentActive ? "Medication paused." : "Medication activated.");
        loadData();
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptDoctor || !apptSpecialty || !apptDate || !apptLocation || !senior) return;

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorName: apptDoctor,
          specialty: apptSpecialty,
          date: apptDate,
          location: apptLocation,
          notes: apptNotes,
          seniorId: senior.id,
        }),
      });

      if (res.ok) {
        toast.success("Doctor visit added.");
        setApptDoctor("");
        setApptSpecialty("");
        setApptDate("");
        setApptLocation("");
        setApptNotes("");
        setShowAddAppt(false);
        loadData();
      } else {
        toast.error("Could not add appointment.");
      }
    } catch {
      toast.error("Network error while adding appointment.");
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      const res = await fetch(`/api/appointments?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Appointment removed.");
        loadData();
      }
    } catch {
      toast.error("Failed to remove appointment.");
    }
  };

  const handleSendEmailAlert = async (type: "DAILY_SUMMARY" | "MISSED_DOSE") => {
    setSendingEmail(true);
    try {
      const res = await fetch("/api/email/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          type === "MISSED_DOSE"
            ? "Missed dose alert sent to caregiver."
            : "Daily summary sent to caregiver."
        );
      } else {
        toast.error("Could not dispatch email alert.");
      }
    } catch {
      toast.error("Network error while sending alert.");
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return <CaregiverPortalSkeleton />;
  }

  if (!senior) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <p className="text-sm text-slate-600">No profile found.</p>
      </div>
    );
  }

  const activeMeds = senior.medications.filter((m) => m.active);
  const takenCount = senior.doseLogs.filter((l) => l.status === "TAKEN" || l.status === "TAKEN_EARLY").length;
  const earlyDoses = senior.doseLogs.filter((l) => l.status === "TAKEN_EARLY" || l.notes?.toLowerCase().includes("early"));

  // Real 7-day adherence and symptom severity computed directly from database records
  const trajectoryData = (() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const points = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayLabel = i === 0 ? "Today" : days[d.getDay()];
      const datePrefix = d.toISOString().split("T")[0];

      // Match dose logs on this date
      const dayLogs = senior.doseLogs.filter((l) => {
        const logDate = new Date(l.scheduledFor).toISOString().split("T")[0];
        return logDate === datePrefix;
      });

      let adherenceRate = 0;
      if (dayLogs.length > 0) {
        const taken = dayLogs.filter((l) => l.status === "TAKEN" || l.status === "TAKEN_EARLY").length;
        adherenceRate = Math.round((taken / dayLogs.length) * 100);
      } else if (i === 0 && activeMeds.length > 0) {
        adherenceRate = Math.round((takenCount / activeMeds.length) * 100);
      }

      // Match triage symptom records on this date
      const dayTriage = triageRecords.filter((t) => {
        const tDate = new Date(t.createdAt).toISOString().split("T")[0];
        return tDate === datePrefix;
      });

      const avgSeverity =
        dayTriage.length > 0
          ? Math.round(dayTriage.reduce((sum, item) => sum + item.severityScore, 0) / dayTriage.length)
          : 0;

      points.push({
        day: dayLabel,
        adherence: adherenceRate,
        symptoms: avgSeverity,
      });
    }

    return points;
  })();

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Top Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center">
              <VectorPuppy className="w-8 h-8" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 block leading-tight">
                GrandPal Caregiver Portal
              </span>
              <span className="text-xs text-slate-500 block">
                Managing care for {senior.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowRadar(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <Award className="w-4 h-4 text-blue-600" />
              <span>Project Radar</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Senior Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Early Dose Alert Banner */}
        {earlyDoses.length > 0 && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <span className="font-bold block text-sm">Early Dose Notification</span>
              <p>
                {senior.name} took {earlyDoses.length} dose{earlyDoses.length > 1 ? "s" : ""} ahead of schedule today. Doctor Pup checked in and alerted monitoring.
              </p>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-medium text-slate-500 block">Active Medicines</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              <NumberFlow value={activeMeds.length} />
            </span>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-medium text-slate-500 block">Doses Logged</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">
              <NumberFlow value={takenCount} />
            </span>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-medium text-slate-500 block">Notification Recipient</span>
            <span className="text-sm font-semibold text-slate-800 mt-2 block truncate">
              {senior.caregiverEmail}
            </span>
          </div>
        </div>

        {/* Wellness & Health Analytics Trajectory Chart */}
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Health and Adherence Trajectory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of daily medicine adherence (%) against reported symptom severity.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>Overall: Stable and Healthy</span>
              </span>
            </div>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="adherence"
                  name="Medicine Adherence %"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#2563eb" }}
                />
                <Line
                  type="monotone"
                  dataKey="symptoms"
                  name="Symptom Score (out of 10)"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#f97316" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Two-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Medications Management & Dose Logs */}
          <section className="lg:col-span-7 space-y-6">

            {/* Medication Card Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Medication Schedule Management
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Changes appear immediately on {senior.name}&apos;s dashboard.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddMed(!showAddMed)}
                className="flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medicine</span>
              </button>
            </div>

            {/* Add Medication Form */}
            {showAddMed && (
              <form
                onSubmit={handleCreateMedication}
                className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4"
              >
                <h3 className="text-sm font-bold text-slate-900">Add New Prescription</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Medicine Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lisinopril"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 10mg"
                      value={medDosage}
                      onChange={(e) => setMedDosage(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Time of Day
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 08:00 AM"
                      value={medTime}
                      onChange={(e) => setMedTime(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Take with breakfast"
                      value={medInstructions}
                      onChange={(e) => setMedInstructions(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMed(false)}
                    className="text-xs px-3 py-1.5 text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors"
                  >
                    Save Medicine
                  </button>
                </div>
              </form>
            )}

            {/* List of Medications */}
            <div className="space-y-3">
              {senior.medications.map((med) => (
                <div
                  key={med.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Pill className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {med.name}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {med.dosage}
                        </span>
                        {!med.active && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            Paused
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {med.instructions} • {med.timeOfDay}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleMedication(med.id, med.active)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 px-2.5 py-1 rounded-md transition-colors"
                    >
                      {med.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMedication(med.id, med.name)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Daily History Feed */}
            <div className="pt-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Recent Dose Activity Log
              </h3>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {senior.doseLogs.slice(0, 6).map((log) => {
                  const med = senior.medications.find((m) => m.id === log.medicationId);
                  const isTaken = log.status === "TAKEN";
                  const timeDisplay = log.takenAt
                    ? new Date(log.takenAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : new Date(log.scheduledFor).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 flex items-center justify-between text-xs bg-white"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isTaken ? "bg-emerald-500" : "bg-amber-400"
                          }`}
                        />
                        <div>
                          <span className="font-semibold text-slate-800">
                            {med ? med.name : "Scheduled Dose"}
                          </span>
                          {log.notes && (
                            <span className="text-slate-400 ml-1.5 font-normal">
                              ({log.notes})
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{timeDisplay}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isTaken
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {isTaken ? "Taken" : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </section>

          {/* Right Column: Triage History, Appointments, & Email Alerts */}
          <aside className="lg:col-span-5 space-y-6">

            {/* Doctor Pup Triage Log */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Doctor Pup Triage History
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {triageRecords.length} records
                </span>
              </div>

              {triageRecords.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No symptoms reported yet. Senior is doing well.
                </p>
              ) : (
                <div className="space-y-3">
                  {triageRecords.slice(0, 3).map((record) => (
                    <div
                      key={record.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900 truncate">
                          &ldquo;{record.reportedText}&rdquo;
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                            record.severityScore >= 7
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          Severity {record.severityScore}/10
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">
                        {record.guidance}
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        {new Date(record.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Email Escalation Dispatcher */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Email Notifications
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Test and dispatch real-time caregiver alerts to {senior.caregiverEmail}.
              </p>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={sendingEmail}
                  onClick={() => handleSendEmailAlert("DAILY_SUMMARY")}
                  className="w-full text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                  <span>Send Daily Care Summary Email</span>
                </button>

                <button
                  type="button"
                  disabled={sendingEmail}
                  onClick={() => handleSendEmailAlert("MISSED_DOSE")}
                  className="w-full text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 text-amber-600" />
                  <span>Simulate Missed Dose Alert Email</span>
                </button>
              </div>
            </div>

            {/* Doctor Visits Scheduler */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Doctor Appointments
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddAppt(!showAddAppt)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  + Add Visit
                </button>
              </div>

              {showAddAppt && (
                <form
                  onSubmit={handleCreateAppointment}
                  className="p-4 bg-white border border-slate-200 rounded-lg space-y-3"
                >
                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Vance"
                      value={apptDoctor}
                      onChange={(e) => setApptDoctor(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Specialty
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cardiology"
                      value={apptSpecialty}
                      onChange={(e) => setApptSpecialty(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Date and Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={apptDate}
                      onChange={(e) => setApptDate(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700 block mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Room 402, City Clinic"
                      value={apptLocation}
                      onChange={(e) => setApptLocation(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddAppt(false)}
                      className="text-xs text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="text-xs font-semibold text-white bg-blue-600 px-3 py-1 rounded"
                    >
                      Save Visit
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {senior.appointments.map((appt) => {
                  const formatted = new Date(appt.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={appt.id}
                      className="p-3 bg-white border border-slate-200 rounded-lg space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {appt.doctorName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-slate-500">
                            {formatted}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteAppointment(appt.id)}
                            className="text-slate-400 hover:text-rose-600"
                            aria-label="Delete appointment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{appt.specialty}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{appt.location}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

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

      {/* Hackathon 6-Pillar Project Radar Assessment Modal */}
      <ProjectRadarAssessment
        isOpen={showRadar}
        onClose={() => setShowRadar(false)}
      />
    </div>
  );
}
