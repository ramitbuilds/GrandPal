"use client";

import { useState } from "react";
import SeniorView from "@/components/SeniorView";
import { Shield, KeyRound, ArrowLeft } from "lucide-react";

export default function Home() {
  const [view, setView] = useState<"senior" | "caregiver">("senior");
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const handleOpenCaregiver = () => {
    setEnteredPin("");
    setPinError(false);
    setPinModalOpen(true);
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    // Default PIN: 1234
    if (enteredPin === "1234") {
      setPinModalOpen(false);
      setView("caregiver");
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {view === "senior" ? (
        <SeniorView onSwitchRole={handleOpenCaregiver} />
      ) : (
        <div className="min-h-screen p-6 max-w-5xl mx-auto">
          <header className="flex items-center justify-between mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800">Caregiver Clubhouse</h1>
              <p className="text-slate-500 font-medium">Monitoring Grandma Mary • Passcode Verified</p>
            </div>
            <button
              onClick={() => setView("senior")}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-2xl font-bold transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Senior Mode</span>
            </button>
          </header>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center py-16">
            <Shield className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800">Caregiver Dashboard Access Granted</h2>
            <p className="text-slate-600 max-w-md mx-auto mt-2">
              Passcode `1234` confirmed. Full schedule CRUD, Recharts analytics, and email dispatcher are being connected in Phase 3!
            </p>
          </div>
        </div>
      )}

      {/* PIN Security Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border-2 border-amber-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-amber-600" />
            </div>

            <h3 className="text-2xl font-black text-slate-800">Caregiver Access</h3>
            <p className="text-slate-500 text-sm mt-1">Enter your 4-digit PIN code (Default: 1234)</p>

            <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError(false);
                }}
                placeholder="••••"
                className="w-full text-center text-3xl tracking-widest font-mono font-bold py-3 border-2 border-slate-300 rounded-2xl focus:border-amber-500 focus:outline-none"
              />

              {pinError && (
                <p className="text-rose-500 text-sm font-semibold">Incorrect PIN code. Try 1234.</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="w-1/2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition shadow-md"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
