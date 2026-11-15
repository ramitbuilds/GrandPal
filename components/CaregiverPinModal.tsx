"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, X } from "lucide-react";

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CaregiverPinModal({ isOpen, onClose }: PinModalProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setError("");
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleVerify = async (pinToVerify?: string) => {
    const finalPin = pinToVerify ?? pin;
    if (finalPin.length !== 4) {
      setError("Please enter the 4-digit PIN");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: finalPin }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Store verified session token in sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.setItem("caregiver_auth", "true");
        }
        onClose();
        router.push("/caregiver");
      } else {
        setError("Incorrect PIN. Please try again.");
        setPin("");
      }
    } catch {
      setError("Unable to verify PIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Caregiver Access</h2>
          <p className="text-xs text-slate-500">
            Enter your 4-digit caregiver PIN to manage schedules and alerts.
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border transition-all ${
                pin.length > idx
                  ? "bg-blue-600 border-blue-600 scale-110"
                  : "bg-slate-100 border-slate-300"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-rose-600 text-center font-medium mb-4">
            {error}
          </p>
        )}

        {/* Number Keypad */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                const next = pin + num;
                handleDigit(num);
                if (next.length === 4) handleVerify(next);
              }}
              className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold text-base transition-colors flex items-center justify-center border border-slate-200"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin("")}
            className="h-12 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              const next = pin + "0";
              handleDigit("0");
              if (next.length === 4) handleVerify(next);
            }}
            className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold text-base transition-colors flex items-center justify-center border border-slate-200"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center"
          >
            Delete
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center pt-2">
          Demo PIN: 1234
        </p>
      </div>
    </div>
  );
}
