"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { PuppyMascot } from "@/components/PuppyMascot";
import { Activity, AlertCircle, Check, Heart, Send, X } from "lucide-react";

interface HealthCheckupModalProps {
  isOpen: boolean;
  onClose: () => void;
  seniorName: string;
  onFactAdded?: () => void;
}

export function HealthCheckupModal({
  isOpen,
  onClose,
  seniorName,
  onFactAdded,
}: HealthCheckupModalProps) {
  const [symptom, setSymptom] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    advice: string;
    severityScore: number;
    clinicalSummary: string;
    escalated: boolean;
  } | null>(null);

  if (!isOpen) return null;

  const quickSymptoms = [
    "Feeling a little dizzy",
    "Stomach feels upset",
    "Knee feels stiff",
    "Mild headache",
  ];

  const handleSubmit = async (textToSubmit?: string) => {
    const query = textToSubmit ?? symptom;
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptom: query }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult({
          advice: data.advice,
          severityScore: data.severityScore,
          clinicalSummary: data.clinicalSummary,
          escalated: data.escalated,
        });

        if (data.escalated) {
          toast.warning("Notice sent to your caregiver to check in.");
        } else {
          toast.success("Health check completed.");
        }

        onFactAdded?.();
      } else {
        toast.error("Could not complete checkup. Please try again.");
      }
    } catch {
      toast.error("Network error during checkup.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSymptom("");
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 relative">
        <button
          type="button"
          onClick={() => {
            handleReset();
            onClose();
          }}
          aria-label="Close"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Doctor Pup Header */}
        <div className="flex items-center gap-4 mb-5 border-b border-slate-100 pb-4">
          <div className="w-16 h-16 shrink-0 flex items-center justify-center">
            <PuppyMascot
              state={loading ? "thinking" : result ? "listening" : "idle"}
              className="w-16 h-16"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-blue-600 font-semibold text-xs mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Doctor Pup Checkup</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              How are you feeling, {seniorName}?
            </h2>
            <p className="text-xs text-slate-500">
              Tell me if anything feels uncomfortable or different today.
            </p>
          </div>
        </div>

        {/* Result Card if available */}
        {result ? (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border ${
                result.escalated
                  ? "bg-amber-50/60 border-amber-200"
                  : "bg-blue-50/50 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {result.escalated ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <Heart className="w-4 h-4 text-blue-600 shrink-0" />
                )}
                <span className="text-xs font-bold text-slate-800">
                  {result.escalated
                    ? "Caregiver Alert Sent"
                    : "Doctor Pup Advice"}
                </span>
              </div>
              <p className="text-sm text-slate-800 font-medium leading-relaxed">
                {result.advice}
              </p>
              {result.escalated && (
                <p className="text-xs text-amber-700 mt-2 font-medium">
                  We sent an email update to your caregiver to make sure you have help nearby.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
              >
                Ask something else
              </button>
              <button
                type="button"
                onClick={() => {
                  handleReset();
                  onClose();
                }}
                className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Input and Quick Selection Form */
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-2">
                Quick options:
              </label>
              <div className="flex flex-wrap gap-2">
                {quickSymptoms.map((text, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSymptom(text);
                      handleSubmit(text);
                    }}
                    className="text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">
                Or describe how you feel in your own words:
              </label>
              <textarea
                rows={3}
                value={symptom}
                onChange={(e) => setSymptom(e.target.value)}
                placeholder="e.g. My stomach feels a little upset after eating lunch..."
                className="w-full text-xs p-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Safe and private. Shared with your family.
              </span>
              <button
                type="button"
                disabled={loading || !symptom.trim()}
                onClick={() => handleSubmit()}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 px-4 py-2 rounded-lg transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? "Checking..." : "Ask Doctor Pup"}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
