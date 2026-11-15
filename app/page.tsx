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
    if (enteredPin === "1234") {
      setPinModalOpen(false);
      setView("caregiver");
    } else {
      setPinError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#E0E2DB]">
      {view === "senior" ? (
        <SeniorView onSwitchRole={handleOpenCaregiver} />
      ) : (
        <div className="min-h-screen p-6 max-w-4xl mx-auto font-sans">
          <header className="flex items-center justify-between mb-8 bg-[#E0E2DB] p-4 rounded-xl border border-[#D2D4C8] shadow-xs">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#2E3532]">Caregiver Clubhouse</h1>
              <p className="text-xs text-[#2E3532]/70">Authorized Access • Grandma Mary</p>
            </div>
            <button
              onClick={() => setView("senior")}
              className="flex items-center space-x-1.5 bg-[#8B2635] hover:bg-[#8B2635]/90 text-[#E0E2DB] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Senior Mode</span>
            </button>
          </header>

          <div className="bg-[#E0E2DB] p-8 rounded-xl border border-[#D2D4C8] text-center py-16">
            <Shield className="w-12 h-12 text-[#8B2635] mx-auto mb-3" />
            <h2 className="text-base font-bold text-[#2E3532]">Caregiver Access Authenticated</h2>
            <p className="text-xs text-[#2E3532]/70 max-w-sm mx-auto mt-1">
              Passcode 1234 verified. Medication management, doctor appointments, and proactive email alerts are ready for configuration.
            </p>
          </div>
        </div>
      )}

      {/* PIN Security Modal */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2E3532]/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#E0E2DB] rounded-2xl p-6 max-w-xs w-full shadow-lg border border-[#D2D4C8] text-center">
            <div className="w-10 h-10 bg-[#D3EFBD] rounded-xl flex items-center justify-center mx-auto mb-3 text-[#2E3532]">
              <KeyRound className="w-5 h-5 text-[#8B2635]" />
            </div>

            <h3 className="text-sm font-bold text-[#2E3532]">Caregiver Authorization</h3>
            <p className="text-[11px] text-[#2E3532]/70 mt-0.5">Enter 4-digit PIN (Default: 1234)</p>

            <form onSubmit={handlePinSubmit} className="mt-4 space-y-3">
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
                className="w-full text-center text-xl tracking-widest font-mono font-bold py-2 bg-[#E0E2DB] border border-[#2E3532]/30 rounded-lg focus:border-[#8B2635] focus:outline-hidden text-[#2E3532]"
              />

              {pinError && (
                <p className="text-[#8B2635] text-[11px] font-semibold">Incorrect PIN code. Try 1234.</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="w-1/2 py-2 bg-[#D2D4C8] hover:bg-[#D2D4C8]/80 text-[#2E3532] text-xs font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#8B2635] hover:bg-[#8B2635]/90 text-[#E0E2DB] text-xs font-semibold rounded-lg transition"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
